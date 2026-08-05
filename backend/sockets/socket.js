import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// maps to keep track of sockets and active chats
export const userSockets = new Map();
export const userActiveChats = new Map();

export const initSocket = (server) => {
    // Reset all users' online status on startup
    User.updateMany({}, { $set: { isOnline: false } })
        .catch(err => console.error("Failed to reset user online statuses:", err.message));

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        // register socket and set user online
        socket.on("register", async (userId) => {
            if (userId) {
                try {
                    const dbUser = await User.findById(userId);
                    if (!dbUser || dbUser.isBlocked) {
                        socket.emit("blocked-disconnect", { message: "Your account has been suspended by the administrator." });
                        socket.disconnect(true);
                        return;
                    }

                    const uIdStr = userId.toString();
                    if (!userSockets.has(uIdStr)) {
                        userSockets.set(uIdStr, new Set());
                    }
                    userSockets.get(uIdStr).add(socket.id);

                    // update user online status
                    dbUser.isOnline = true;
                    dbUser.lastSeen = new Date();
                    await dbUser.save();

                    // Update all messages in any conversation for this user to "delivered" if not already delivered/read
                    const userObjectId = new mongoose.Types.ObjectId(userId);
                    const conversations = await Conversation.find({ participants: userObjectId });
                    const conversationIds = conversations.map(c => c._id);
                    
                    await Message.updateMany(
                        { 
                            conversation: { $in: conversationIds }, 
                            sender: { $ne: userObjectId }, 
                            "deliveredTo.user": { $ne: userObjectId },
                            "readBy.user": { $ne: userObjectId }
                        },
                        { 
                            $push: { deliveredTo: { user: userObjectId, deliveredAt: new Date() } }
                        }
                    );

                    await Message.updateMany(
                        { 
                            conversation: { $in: conversationIds }, 
                            sender: { $ne: userObjectId }, 
                            status: "sent"
                        },
                        { 
                            $set: { status: "delivered" }
                        }
                    );

                    // Notify other sockets that messages are now delivered
                    socket.broadcast.emit("messages-delivered", { userId, conversationIds });
                } catch (err) {
                    console.error("Error registering user socket:", err);
                }
            }
        });

        // Join chat and mark messages as read
        socket.on("join-chat", async ({ userId, chatId }) => {
            if (userId && chatId) {
                userActiveChats.set(userId.toString(), chatId.toString());

                // Update all messages in this conversation where sender is not this user to "read"
                try {
                    const conversationObjectId = new mongoose.Types.ObjectId(chatId);
                    const userObjectId = new mongoose.Types.ObjectId(userId);

                    const now = new Date();

                    // Record per-user read receipt for all unread messages by this user in this chat
                    await Message.updateMany(
                        { 
                            conversation: conversationObjectId, 
                            sender: { $ne: userObjectId }, 
                            "readBy.user": { $ne: userObjectId }
                        },
                        { 
                            $set: { status: "seen" },
                            $push: { readBy: { user: userObjectId, readAt: now } },
                            $pull: { deliveredTo: { user: userObjectId } }
                        }
                    );

                    // Broadcast to other sockets that messages in this chat are read by this user
                    socket.broadcast.emit("messages-seen", { chatId, userId });
                } catch (err) {
                    console.error("Error updating message statuses to seen:", err);
                }
            }
        });

        // Leave chat
        socket.on("leave-chat", ({ userId }) => {
            if (userId) {
                userActiveChats.delete(userId.toString());
            }
        });

        // Typing indicators
        socket.on("typing", ({ toUserId, participantIds, fromUserId, chatId }) => {
            if (toUserId) {
                const socketIds = userSockets.get(toUserId.toString());
                if (socketIds) {
                    socketIds.forEach(sId => {
                        io.to(sId).emit("user-typing", { fromUserId, chatId });
                    });
                }
            } else if (participantIds) {
                participantIds.forEach(pId => {
                    if (pId.toString() !== fromUserId.toString()) {
                        const socketIds = userSockets.get(pId.toString());
                        if (socketIds) {
                            socketIds.forEach(sId => {
                                io.to(sId).emit("user-typing", { fromUserId, chatId });
                            });
                        }
                    }
                });
            }
        });

        // Stop typing indicators
        socket.on("stop-typing", ({ toUserId, participantIds, fromUserId, chatId }) => {
            if (toUserId) {
                const socketIds = userSockets.get(toUserId.toString());
                if (socketIds) {
                    socketIds.forEach(sId => {
                        io.to(sId).emit("user-stop-typing", { fromUserId, chatId });
                    });
                }
            } else if (participantIds) {
                participantIds.forEach(pId => {
                    if (pId.toString() !== fromUserId.toString()) {
                        const socketIds = userSockets.get(pId.toString());
                        if (socketIds) {
                            socketIds.forEach(sId => {
                                io.to(sId).emit("user-stop-typing", { fromUserId, chatId });
                            });
                        }
                    }
                });
            }
        });

        // Handle disconnection
        socket.on("disconnect", async () => {
            let disconnectedUserId = null;
            for (const [userId, socketIds] of userSockets.entries()) {
                if (socketIds.has(socket.id)) {
                    socketIds.delete(socket.id);
                    if (socketIds.size === 0) {
                        userSockets.delete(userId);
                        userActiveChats.delete(userId);
                        disconnectedUserId = userId;
                    }
                    break;
                }
            }
            if (disconnectedUserId) {
                try {
                    await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastSeen: new Date() });
                } catch (err) {
                    console.error("Error setting user online on disconnect:", err);
                }
            }
        });
    });

    return io;
};