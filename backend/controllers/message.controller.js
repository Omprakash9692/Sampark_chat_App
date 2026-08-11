import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import {
  toStr,
  isMe,
  hasUser,
  ok,
  created,
  err,
  formatMessage,
  sanitizeEmojiReactions
} from "../utils/chat.helpers.js";

// 1. Get Chat Messages
export const getChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({ _id: chatId, participants: userId });
  if (!conversation) return err(res, 403, "Access denied to this conversation");

  try {
    const now = new Date();
    await Message.updateMany(
      { conversation: chatId, sender: { $ne: userId }, blockedFor: { $ne: userId }, "readBy.user": { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: now } }, $pull: { deliveredTo: { user: userId } } }
    );

    if (conversation.type === "direct") {
      await Message.updateMany({ conversation: chatId, sender: { $ne: userId } }, { $set: { status: "seen" } });
    } else if (conversation.type === "group") {
      const needed = Math.max(1, (conversation.participants?.length || 1) - 1);
      await Message.updateMany(
        { conversation: chatId, sender: { $ne: userId }, $expr: { $gte: [{ $size: { $ifNull: ["$readBy", []] } }, needed] } },
        { $set: { status: "seen" } }
      );
    }

    await Conversation.findByIdAndUpdate(chatId, { $pull: { unreadFor: userId } });
    req.app.get("io")?.emit("messages-seen", { chatId, userId });
  } catch (err) {
    console.error("Failed to update message status to seen in getChatMessages:", err);
  }

  const filter = { conversation: chatId, blockedFor: { $ne: userId }, deletedFor: { $ne: userId } };
  if (conversation.type === "group" && conversation.memberJoinedAt) {
    const joinedAt = conversation.memberJoinedAt.get ? conversation.memberJoinedAt.get(userId.toString()) : conversation.memberJoinedAt[userId.toString()];
    if (joinedAt) filter.createdAt = { $gte: joinedAt };
  }

  const messages = await Message.find(filter).sort({ createdAt: 1 });
  return ok(res, "Messages fetched successfully", { messages: messages.map((m) => formatMessage(m, userId)) });
};

// 2. Send Message
export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { text, type, attachmentUrl, attachmentName, attachmentSize, attachmentDuration, isForwarded, replyToId } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({ _id: chatId, participants: myId });
  if (!conversation) return err(res, 403, "Access denied to send message in this conversation");

  if (conversation.deletedBy?.length > 0) {
    conversation.deletedBy = [];
    await conversation.save();
  }

  if (conversation.isBlocked) {
    return err(res, 403, "This group has been suspended by the administrator. Sending messages is disabled.");
  }

  if (conversation.type === "group") {
    if (!hasUser(conversation.adminIds, myId) && conversation.permissions?.sendMessages === false) {
      return err(res, 403, "Only admins are allowed to send messages to this group.");
    }
  }

  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const userActiveChats = req.app.get("userActiveChats");

  let finalStatus = "sent";
  const blockedFor = [];
  let initialReadBy, initialDeliveredTo;

  if (conversation.type === "direct") {
    const recipientId = conversation.participants.find((p) => !isMe(p, myId));
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      const me = await User.findById(myId);
      if (recipient?.blockedUsers?.includes(myId) || me?.blockedUsers?.includes(recipientId)) {
        blockedFor.push(recipientId);
      }
    }
    if (blockedFor.length === 0 && recipientId && userSockets?.get(toStr(recipientId))?.size > 0) {
      finalStatus = userActiveChats?.get(toStr(recipientId)) === toStr(chatId) ? "seen" : "delivered";
    }
  } else {
    const now = new Date();
    initialReadBy = [];
    initialDeliveredTo = [];
    conversation.participants.forEach((p) => {
      if (!isMe(p, myId)) {
        const pIdStr = toStr(p);
        if (userSockets?.get(pIdStr)?.size > 0) {
          if (userActiveChats?.get(pIdStr) === toStr(chatId)) initialReadBy.push({ user: p, readAt: now });
          else initialDeliveredTo.push({ user: p, deliveredAt: now });
        }
      }
    });
    finalStatus = initialReadBy.length > 0 ? "seen" : initialDeliveredTo.length > 0 ? "delivered" : "sent";
  }

  const message = await Message.create({
    conversation: chatId,
    sender: myId,
    text: text || "",
    type: type || "text",
    status: finalStatus,
    readBy: initialReadBy || [],
    deliveredTo: initialDeliveredTo || [],
    blockedFor,
    isForwarded: !!isForwarded,
    replyToId: replyToId || null,
    attachmentUrl: attachmentUrl || "",
    attachmentName: attachmentName || "",
    attachmentSize: attachmentSize || "",
    attachmentDuration: attachmentDuration || ""
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  if (io && userSockets) {
    conversation.participants.forEach((pId) => {
      if (!isMe(pId, myId) && !blockedFor.some((id) => isMe(id, pId))) {
        userSockets.get(toStr(pId))?.forEach((socketId) => {
          io.to(socketId).emit("receive-message", formatMessage(message, pId));
        });
      }
    });
    io.emit("messages-delivered", { chatId, userId: myId });
  }

  return created(res, "Message sent successfully", { message: formatMessage(message, myId) });
};

// 3. Edit Message
export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const myId = req.user._id;

  if (!text) return err(res, 400, "Text is required to edit message");

  const message = await Message.findById(messageId);
  if (!message) return err(res, 404, "Message not found");
  if (!isMe(message.sender, myId)) return err(res, 403, "You can only edit your own messages");
  if (message.isDeleted) return err(res, 400, "Cannot edit a deleted message");

  if (Date.now() - new Date(message.createdAt).getTime() > 24 * 3600000) {
    return err(res, 400, "Message can only be edited within 24 hours of being sent.");
  }

  const cleanNewText = text.trim();
  if (cleanNewText === (message.text || "").trim()) {
    return ok(res, "Message unchanged", { message: formatMessage(message, myId) });
  }

  message.text = cleanNewText;
  message.edited = true;
  await message.save();

  req.app.get("io")?.emit("message-updated", { messageId, text, edited: true });

  return ok(res, "Message edited successfully", { message: formatMessage(message, myId) });
};

// 4. Delete Message For Me
export const deleteMessageForMe = async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) return err(res, 404, "Message not found");

  if (!hasUser(message.deletedFor, myId)) {
    message.deletedFor.push(myId);
    await message.save();
  }

  return ok(res, "Message deleted for you", { messageId });
};

// 5. Delete Message For Everyone
export const deleteMessageForEveryone = async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) return err(res, 404, "Message not found");
  if (!isMe(message.sender, myId)) return err(res, 403, "You can only delete your own messages for everyone");

  message.text = "This message was deleted.";
  message.isDeleted = true;
  message.type = "text";
  message.attachmentUrl = "";
  message.attachmentName = "";
  message.attachmentSize = "";
  message.attachmentDuration = "";
  await message.save();

  req.app.get("io")?.emit("message-deleted", { messageId });

  return ok(res, "Message deleted for everyone", { message: formatMessage(message, myId) });
};

// 6. Toggle Pin Message inside Chat
export const togglePinMessage = async (req, res) => {
  const { chatId } = req.params;
  const { messageId, durationHours } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({ _id: chatId, participants: myId });
  if (!conversation) return err(res, 404, "Conversation not found");

  if (!conversation.pinnedMessages) conversation.pinnedMessages = [];

  const now = new Date();
  conversation.pinnedMessages = conversation.pinnedMessages.filter((p) => !p.pinnedUntil || new Date(p.pinnedUntil) > now);

  const existingIdx = conversation.pinnedMessages.findIndex((p) => p.message && isMe(p.message, messageId));
  let isPinned = false;

  if (existingIdx > -1) {
    conversation.pinnedMessages.splice(existingIdx, 1);
  } else {
    const message = await Message.findOne({ _id: messageId, conversation: chatId });
    if (!message) return err(res, 404, "Message not found in this conversation");
    const hours = durationHours ? parseInt(durationHours, 10) : 168;
    conversation.pinnedMessages.unshift({ message: messageId, pinnedUntil: new Date(Date.now() + hours * 3600000) });
    isPinned = true;
  }

  await conversation.save();

  const now2 = new Date();
  const pinnedMessageIds = conversation.pinnedMessages
    .filter((p) => p.message && (!p.pinnedUntil || new Date(p.pinnedUntil) > now2))
    .map((p) => ({ id: toStr(p.message), pinnedUntil: p.pinnedUntil ? p.pinnedUntil.toISOString() : null }));

  return ok(res, isPinned ? "Message pinned" : "Message unpinned", { pinnedMessageIds });
};

// 7. Toggle Emoji Reaction
export const toggleReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const myId = req.user._id;

  if (!emoji) return err(res, 400, "Emoji is required");

  const message = await Message.findById(messageId);
  if (!message) return err(res, 404, "Message not found");

  const myIdStr = toStr(myId);
  const exactMatchIndex = (message.emojiReactions || []).findIndex(
    (r) => r.emoji === emoji && (r.userIds || []).some((id) => isMe(id, myIdStr))
  );

  (message.emojiReactions || []).forEach((r) => {
    r.userIds = (r.userIds || []).filter((id) => !isMe(id, myIdStr));
  });

  message.emojiReactions = (message.emojiReactions || []).filter((r) => r.userIds?.length > 0);

  if (exactMatchIndex === -1) {
    const existingIdx = message.emojiReactions.findIndex((r) => r.emoji === emoji);
    if (existingIdx > -1) message.emojiReactions[existingIdx].userIds.push(myId);
    else message.emojiReactions.push({ emoji, userIds: [myId] });
  }

  await message.save();
  const formattedReactions = sanitizeEmojiReactions(message.emojiReactions, myId);

  req.app.get("io")?.emit("message-reaction-updated", { messageId: toStr(message._id), emojiReactions: formattedReactions });

  return ok(res, "Reaction toggled successfully", { emojiReactions: formattedReactions });
};

// 8. Get Message Info
export const getMessageInfo = async (req, res) => {
  const { messageId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const myId = req.user._id;

  const message = await Message.findById(messageId)
    .populate("readBy.user", "name email avatar phone")
    .populate("deliveredTo.user", "name email avatar phone");

  if (!message) return err(res, 404, "Message not found");
  if (!isMe(message.sender, myId)) return err(res, 403, "Only the sender can view message info");

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const readUserIds = new Set((message.readBy || []).map((r) => toStr(r.user)));
  const unreadDeliveredTo = (message.deliveredTo || []).filter((d) => {
    const dUserId = toStr(d.user);
    return dUserId && !readUserIds.has(dUserId);
  });

  const mapUser = (u) => ({
    id: toStr(u),
    name: u?.name || "Unknown Member",
    email: u?.email || "",
    avatar: typeof u?.avatar === "string" ? u.avatar : u?.avatar?.url || "",
    phone: u?.phone || ""
  });

  return ok(res, "Message info fetched successfully", {
    readBy: message.readBy.slice(skip, skip + limitNum).map((r) => ({ user: mapUser(r.user), time: r.readAt })),
    deliveredTo: unreadDeliveredTo.slice(skip, skip + limitNum).map((d) => ({ user: mapUser(d.user), time: d.deliveredAt })),
    totalRead: message.readBy.length,
    totalDelivered: unreadDeliveredTo.length,
    page: pageNum,
    limit: limitNum
  });
};

// 9. Upload Attachment
export const uploadAttachment = async (req, res) => {
  if (!req.file) return err(res, 400, "No file uploaded");

  try {
    const folder = req.file.mimetype?.startsWith("image/") ? "weChat/chat_images" : "weChat/chat_files";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    return ok(res, "File uploaded successfully", {
      url: result.secure_url,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Upload error:", error);
    return err(res, 500, `Failed to upload file: ${error.message}`);
  }
};
