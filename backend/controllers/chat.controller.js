import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";
import { uploadToCloudinary } from "../config/cloudinary.js";

const formatConversation = (conv, currentUserId, unreadCount = 0) => {
  const isDirect = conv.type === "direct";

  // Map participants: currentUserId is serialized as "user_me"
  const participants = (conv.participants || []).map(p => {
    const id = p._id ? p._id.toString() : p.toString();
    return id === currentUserId.toString() ? "user_me" : id;
  });

  // Check if member joined after last message was sent in group chats
  let joinedAt = null;
  if (conv.type === "group" && conv.memberJoinedAt && currentUserId) {
    const userKey = currentUserId.toString();
    if (typeof conv.memberJoinedAt.get === 'function') {
      joinedAt = conv.memberJoinedAt.get(userKey);
    } else if (typeof conv.memberJoinedAt === 'object') {
      joinedAt = conv.memberJoinedAt[userKey];
    }
  }

  const lastMsgObj = conv.lastMessage;
  let lastMsgFormatted = null;
  let lastMsgIdStr = null;
  let conversationTime = conv.createdAt;

  if (lastMsgObj && typeof lastMsgObj === 'object' && lastMsgObj._id) {
    const isDeletedForMe = Array.isArray(lastMsgObj.deletedFor) &&
      lastMsgObj.deletedFor.some(id => (id._id ? id._id.toString() : id.toString()) === currentUserId.toString());

    if (!isDeletedForMe) {
      const msgCreatedAt = lastMsgObj.createdAt ? new Date(lastMsgObj.createdAt).getTime() : 0;
      const joinedAtTime = joinedAt ? new Date(joinedAt).getTime() : 0;

      // Only format last message for this user if it was sent AFTER or AT the time the user joined
      if (!joinedAtTime || msgCreatedAt >= joinedAtTime) {
        const senderIdStr = lastMsgObj.sender ? (lastMsgObj.sender._id ? lastMsgObj.sender._id.toString() : lastMsgObj.sender.toString()) : "";
        
        let computedLastStatus = lastMsgObj.status || "sent";
        if (senderIdStr === currentUserId.toString()) {
          const hasBeenRead = (lastMsgObj.readBy || []).length > 0;
          const hasBeenDelivered = (lastMsgObj.deliveredTo || []).length > 0;
          if (computedLastStatus === "seen" || hasBeenRead) {
            computedLastStatus = "seen";
          } else if (computedLastStatus === "delivered" || hasBeenDelivered) {
            computedLastStatus = "delivered";
          } else {
            computedLastStatus = "sent";
          }
        }

        lastMsgFormatted = {
          id: lastMsgObj._id.toString(),
          chatId: conv._id.toString(),
          senderId: senderIdStr === currentUserId.toString() ? "user_me" : senderIdStr,
          text: lastMsgObj.text || "",
          type: lastMsgObj.type || "text",
          timestamp: lastMsgObj.createdAt || conv.createdAt,
          status: computedLastStatus
        };
        lastMsgIdStr = lastMsgObj._id.toString();
        conversationTime = lastMsgObj.createdAt;
      }
    }
  }

  const adminIds = (conv.adminIds || []).map(id => {
    const idStr = id._id ? id._id.toString() : id.toString();
    return idStr === currentUserId.toString() ? "user_me" : idStr;
  });

  const permissions = {
    sendMessages: conv.permissions?.sendMessages !== false,
    addMembers: conv.permissions?.addMembers !== false,
    approveMembers: conv.permissions?.approveMembers === true,
  };

  const joinRequests = (conv.joinRequests || []).map(req => {
    const userIdStr = req.user?._id ? req.user._id.toString() : (req.user ? req.user.toString() : "");
    const reqByStr = req.requestedBy?._id ? req.requestedBy._id.toString() : (req.requestedBy ? req.requestedBy.toString() : "");
    return {
      id: req._id ? req._id.toString() : userIdStr,
      user: typeof req.user === 'object' && req.user._id ? {
        id: req.user._id.toString(),
        name: req.user.name || "Unknown User",
        email: req.user.email || "",
        avatar: req.user.avatar || ""
      } : userIdStr,
      requestedBy: reqByStr === currentUserId.toString() ? "user_me" : reqByStr,
      requestedAt: req.requestedAt || new Date()
    };
  });

  const isMarkedUnread = (conv.unreadFor || []).some(id => (id._id ? id._id.toString() : id.toString()) === currentUserId.toString());
  const effectiveUnreadCount = isMarkedUnread ? Math.max(unreadCount, 1) : unreadCount;

  // Build array of active pinned message ids (filter expired ones)
  const now = new Date();
  const pinnedMessageIds = (conv.pinnedMessages || []).filter(p => {
    const msgId = p.message?._id ? p.message._id.toString() : (p.message ? p.message.toString() : null);
    return msgId && (!p.pinnedUntil || new Date(p.pinnedUntil) > now);
  }).map(p => ({
    id: p.message?._id ? p.message._id.toString() : p.message.toString(),
    pinnedUntil: p.pinnedUntil ? p.pinnedUntil.toISOString() : null
  }));

  return {
    id: conv._id.toString(),
    type: conv.type,
    name: conv.name || "",
    avatar: conv.avatar || "",
    description: conv.description || "",
    pinned: (conv.pinnedBy || []).some(id => (id._id ? id._id.toString() : id.toString()) === currentUserId.toString()),
    archived: (conv.archivedBy || []).some(id => (id._id ? id._id.toString() : id.toString()) === currentUserId.toString()),
    favorite: (conv.favoriteBy || []).some(id => (id._id ? id._id.toString() : id.toString()) === currentUserId.toString()),
    isUnread: isMarkedUnread,
    unreadCount: effectiveUnreadCount,
    groupId: conv.type === "group" ? conv._id.toString() : undefined,
    participants,
    adminIds,
    permissions,
    joinRequests,
    createdTime: conversationTime,
    lastMessageId: lastMsgIdStr,
    lastMessage: lastMsgFormatted,
    pinnedMessageIds,
    isBlocked: conv.isBlocked || false
  };
};


// Helper: Ensure 1 reaction per user ID across all emojis on a message
const sanitizeEmojiReactions = (rawReactions, currentUserId) => {
  if (!Array.isArray(rawReactions)) return [];

  const seenUserIds = new Set();
  const result = [];
  const currentUserIdStr = currentUserId ? currentUserId.toString() : "";

  for (let i = rawReactions.length - 1; i >= 0; i--) {
    const r = rawReactions[i];
    if (!r || !r.emoji) continue;

    const filteredUserIds = [];
    const rawUserIds = r.userIds || [];

    for (let j = rawUserIds.length - 1; j >= 0; j--) {
      const id = rawUserIds[j];
      const idStr = id._id ? id._id.toString() : id.toString();
      if (!seenUserIds.has(idStr)) {
        seenUserIds.add(idStr);
        filteredUserIds.unshift(idStr === currentUserIdStr ? "user_me" : idStr);
      }
    }

    if (filteredUserIds.length > 0) {
      result.unshift({
        emoji: r.emoji,
        count: filteredUserIds.length,
        userIds: filteredUserIds
      });
    }
  }

  return result;
};

// Helper: Format Mongoose Message to matches frontend context properties
const formatMessage = (msg, currentUserId) => {
  const currentUserIdStr = currentUserId ? currentUserId.toString() : "";
  const senderIdStr = msg.sender ? (msg.sender._id ? msg.sender._id.toString() : msg.sender.toString()) : "";

  let computedStatus = msg.status || "sent";
  if (senderIdStr === currentUserIdStr) {
    const hasBeenRead = (msg.readBy || []).length > 0;
    const hasBeenDelivered = (msg.deliveredTo || []).length > 0;

    if (computedStatus === "seen" || hasBeenRead) {
      computedStatus = "seen";
    } else if (computedStatus === "delivered" || hasBeenDelivered) {
      computedStatus = "delivered";
    } else {
      computedStatus = "sent";
    }
  }

  return {
    id: msg._id.toString(),
    chatId: msg.conversation.toString(),
    senderId: senderIdStr === currentUserIdStr ? "user_me" : senderIdStr,
    text: msg.text,
    type: msg.type,
    timestamp: msg.createdAt,
    status: computedStatus,
    isForwarded: msg.isForwarded || false,
    replyToId: msg.replyToId ? msg.replyToId.toString() : null,
    edited: msg.edited || false,
    isDeleted: msg.isDeleted || false,
    attachmentUrl: msg.attachmentUrl,
    attachmentName: msg.attachmentName,
    attachmentSize: msg.attachmentSize,
    attachmentDuration: msg.attachmentDuration,
    emojiReactions: sanitizeEmojiReactions(msg.emojiReactions, currentUserId)
  };
};

// 1. Get User Chats (DMs and Groups involved)
export const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({
    participants: userId,
    deletedBy: { $ne: userId }
  })
    .populate("participants", "name email avatar isOnline lastSeen")
    .populate("joinRequests.user", "name email avatar")
    .populate("joinRequests.requestedBy", "name email avatar")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  const conversationIds = conversations.map(c => c._id);

  // Compute per-conversation unread count and delivered status respecting memberJoinedAt for groups
  const now = new Date();
  const unreadMap = {};

  for (const c of conversations) {
    const cId = c._id;
    const filter = {
      conversation: cId,
      sender: { $ne: userId },
      "readBy.user": { $ne: userId },
      deletedFor: { $ne: userId }
    };

    if (c.type === "group" && c.memberJoinedAt) {
      const userKey = userId.toString();
      const joinedAt = typeof c.memberJoinedAt.get === 'function'
        ? c.memberJoinedAt.get(userKey)
        : c.memberJoinedAt[userKey];

      if (joinedAt) {
        filter.createdAt = { $gte: new Date(joinedAt) };
      }
    }

    // Automatically mark eligible incoming messages as delivered
    await Message.updateMany(
      {
        ...filter,
        "deliveredTo.user": { $ne: userId }
      },
      {
        $push: { deliveredTo: { user: userId, deliveredAt: now } }
      }
    );

    const count = await Message.countDocuments(filter);
    unreadMap[cId.toString()] = count;
  }

  const formatted = [];
  for (const c of conversations) {
    if (c.type === "direct") {
      const validParticipants = (c.participants || []).filter(p => p && (p._id || p.id));
      if (validParticipants.length < 2) {
        // Clean up orphan conversation with deleted user
        await Message.deleteMany({ conversation: c._id });
        await Conversation.findByIdAndDelete(c._id);
        continue;
      }
    }
    formatted.push(formatConversation(c, userId, unreadMap[c._id.toString()] || 0));
  }

  return res.status(200).json(
    new ApiResponse(200, "Chats fetched successfully", { chats: formatted })
  );
});

// 2. Get Chat Messages
export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // Confirm authorization
  const conversation = await Conversation.findOne({
    _id: chatId,
    participants: userId
  });

  if (!conversation) {
    throw new ApiError(403, "Access denied to this conversation");
  }

  // Mark all unread incoming messages as read for THIS user specifically
  try {
    const now = new Date();
    await Message.updateMany(
      {
        conversation: chatId,
        sender: { $ne: userId },
        blockedFor: { $ne: userId },
        "readBy.user": { $ne: userId }   // avoid duplicate readBy entries
      },
      {
        $push: { readBy: { user: userId, readAt: now } },
        $pull: { deliveredTo: { user: userId } }
      }
    );

    // Update message overall status to "seen" when appropriate (DM or when all other participants have read)
    if (conversation.type === "direct") {
      await Message.updateMany(
        {
          conversation: chatId,
          sender: { $ne: userId }
        },
        {
          $set: { status: "seen" }
        }
      );
    } else if (conversation.type === "group") {
      const participantCount = conversation.participants ? conversation.participants.length : 1;
      const neededReadCount = Math.max(1, participantCount - 1);
      await Message.updateMany(
        {
          conversation: chatId,
          sender: { $ne: userId },
          $expr: { $gte: [{ $size: { $ifNull: ["$readBy", []] } }, neededReadCount] }
        },
        {
          $set: { status: "seen" }
        }
      );
    }

    await Conversation.findByIdAndUpdate(chatId, {
      $pull: { unreadFor: userId }
    });
    const io = req.app.get("io");
    if (io) {
      io.emit("messages-seen", { chatId, userId });
    }
  } catch (err) {
    console.error("Failed to update message status to seen in getChatMessages:", err);
  }

  // For group chats, only show messages sent after the user joined
  const messageFilter = {
    conversation: chatId,
    blockedFor: { $ne: userId },
    deletedFor: { $ne: userId }
  };

  if (conversation.type === "group" && conversation.memberJoinedAt) {
    const joinedAt = conversation.memberJoinedAt.get(userId.toString());
    if (joinedAt) {
      messageFilter.createdAt = { $gte: joinedAt };
    }
  }

  const messages = await Message.find(messageFilter).sort({ createdAt: 1 });

  const formatted = messages.map(m => formatMessage(m, userId));

  return res.status(200).json(
    new ApiResponse(200, "Messages fetched successfully", { messages: formatted })
  );
});

// 3. Create or Fetch Direct Chat
export const createDirectChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const myId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Recipient user ID is required");
  }

  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [myId, userId] }
  });

  if (conversation) {
    if (conversation.deletedBy && conversation.deletedBy.length > 0) {
      conversation.deletedBy = conversation.deletedBy.filter(id => id.toString() !== myId.toString());
      await conversation.save();
    }
  } else {
    conversation = await Conversation.create({
      type: "direct",
      participants: [myId, userId]
    });
  }

  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  return res.status(200).json(
    new ApiResponse(200, "Direct chat ready", {
      chat: formatConversation(conversation, myId)
    })
  );
});

// 4. Create Group Chat
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, description, participantIds, avatar } = req.body;
  const myId = req.user._id;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Group name is required");
  }

  const safeParticipantIds = Array.isArray(participantIds) ? participantIds : [];

  // Sanitize participants array, casting to ObjectIds on save
  const cleanParticipants = Array.from(new Set(
    [myId.toString(), ...safeParticipantIds]
      .filter(id => id && id !== "user_me")
  ));

  const now = new Date();
  const memberJoinedAt = {};
  cleanParticipants.forEach(id => {
    memberJoinedAt[id.toString()] = now;
  });

  const conversation = await Conversation.create({
    type: "group",
    name: name.trim(),
    description: description || "",
    avatar: avatar || "",
    participants: cleanParticipants,
    adminIds: [myId],
    memberJoinedAt
  });

  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(201).json(
    new ApiResponse(201, "Group chat created successfully", {
      chat: formatConversation(conversation, myId)
    })
  );
});


// 5. Send Message in Conversation
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { text, type, attachmentUrl, attachmentName, attachmentSize, attachmentDuration, isForwarded, replyToId } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(403, "Access denied to send message in this conversation");
  }

  // Restore active conversation state for all participants if previously deleted
  if (conversation.deletedBy && conversation.deletedBy.length > 0) {
    conversation.deletedBy = [];
    await conversation.save();
  }

  if (conversation.isBlocked) {
    throw new ApiError(403, "This group has been suspended by the administrator. Sending messages is disabled.");
  }

  if (conversation.type === "group") {
    const isCurrentAdmin = (conversation.adminIds || []).some(
      id => id.toString() === myId.toString()
    );
    if (!isCurrentAdmin && conversation.permissions?.sendMessages === false) {
      throw new ApiError(403, "Only admins are allowed to send messages to this group.");
    }
  }

  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const userActiveChats = req.app.get("userActiveChats");

  let finalStatus = "sent";
  let blockedFor = [];
  if (conversation.type === "direct") {
    const recipientId = conversation.participants.find(p => p.toString() !== myId.toString());

    let isBlockedRelation = false;
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      const me = await User.findById(myId);

      const hasRecipientBlockedMe = recipient && recipient.blockedUsers && recipient.blockedUsers.includes(myId);
      const haveIBlockedRecipient = me && me.blockedUsers && me.blockedUsers.includes(recipientId);

      if (hasRecipientBlockedMe || haveIBlockedRecipient) {
        isBlockedRelation = true;
        blockedFor.push(recipientId);
      }
    }

    if (isBlockedRelation) {
      finalStatus = "sent";
    } else {
      if (recipientId && userSockets && userSockets.get(recipientId.toString())?.size > 0) {
        if (userActiveChats && userActiveChats.get(recipientId.toString()) === chatId.toString()) {
          finalStatus = "seen";
        } else {
          finalStatus = "delivered";
        }
      }
    }
  } else {
    // Group chat: check each participant's active state
    const now = new Date();
    const deliveredEntries = [];
    const readEntries = [];

    const myIdStr = myId._id ? myId._id.toString() : myId.toString();
    conversation.participants.forEach(p => {
      const pIdStr = p._id ? p._id.toString() : p.toString();
      if (pIdStr !== myIdStr) {
        const userSocketSet = userSockets ? userSockets.get(pIdStr) : null;
        const isOnline = userSocketSet && userSocketSet.size > 0;
        if (isOnline) {
          if (userActiveChats && userActiveChats.get(pIdStr) === chatId.toString()) {
            readEntries.push({ user: p, readAt: now });
          } else {
            deliveredEntries.push({ user: p, deliveredAt: now });
          }
        }
      }
    });

    let groupStatus = "sent";
    if (readEntries.length > 0) {
      groupStatus = "seen";
    } else if (deliveredEntries.length > 0) {
      groupStatus = "delivered";
    }

    finalStatus = groupStatus;
    var initialReadBy = readEntries;
    var initialDeliveredTo = deliveredEntries;
  }

  const message = await Message.create({
    conversation: chatId,
    sender: myId,
    text: text || "",
    type: type || "text",
    status: finalStatus,
    readBy: initialReadBy || [],
    deliveredTo: initialDeliveredTo || [],
    blockedFor: blockedFor,
    isForwarded: !!isForwarded,
    replyToId: replyToId || null,
    attachmentUrl: attachmentUrl || "",
    attachmentName: attachmentName || "",
    attachmentSize: attachmentSize || "",
    attachmentDuration: attachmentDuration || ""
  });

  // Track last message metadata
  conversation.lastMessage = message._id;
  await conversation.save();


  // Relay message in real-time via Socket.io
  if (io && userSockets) {
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== myId.toString()) {
        if (blockedFor.some(id => id.toString() === participantId.toString())) {
          return;
        }
        const socketIds = userSockets.get(participantId.toString());
        if (socketIds) {
          socketIds.forEach(socketId => {
            io.to(socketId).emit("receive-message", formatMessage(message, participantId));
          });
        }
      }
    });
    io.emit("messages-delivered", { chatId, userId: myId });
  }

  return res.status(201).json(
    new ApiResponse(201, "Message sent successfully", {
      message: formatMessage(message, myId)
    })
  );
});

// 6. Toggle Pin Chat
export const togglePinChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (!conversation.pinnedBy) conversation.pinnedBy = [];
  const pinnedIndex = conversation.pinnedBy.findIndex(id => id.toString() === myId.toString());
  let pinned = false;

  if (pinnedIndex > -1) {
    conversation.pinnedBy.splice(pinnedIndex, 1);
  } else {
    conversation.pinnedBy.push(myId);
    pinned = true;
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  return res.status(200).json(
    new ApiResponse(200, pinned ? "Conversation pinned" : "Conversation unpinned", {
      pinned,
      chat: formatConversation(conversation, myId)
    })
  );
});

// 7. Toggle Pin Message inside Chat
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { messageId, durationHours } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (!conversation.pinnedMessages) conversation.pinnedMessages = [];

  // Remove expired pins first
  const now = new Date();
  conversation.pinnedMessages = conversation.pinnedMessages.filter(
    p => !p.pinnedUntil || new Date(p.pinnedUntil) > now
  );

  // Check if already pinned
  const existingIdx = conversation.pinnedMessages.findIndex(
    p => p.message && p.message.toString() === messageId
  );

  let isPinned = false;
  if (existingIdx > -1) {
    // Unpin: remove from array
    conversation.pinnedMessages.splice(existingIdx, 1);
    isPinned = false;
  } else {
    // Pin: verify message belongs to this conversation
    const message = await Message.findOne({ _id: messageId, conversation: chatId });
    if (!message) {
      throw new ApiError(404, "Message not found in this conversation");
    }
    const hours = durationHours ? parseInt(durationHours, 10) : 168; // Default 7 days
    // Add to front of array
    conversation.pinnedMessages.unshift({
      message: messageId,
      pinnedUntil: new Date(Date.now() + hours * 60 * 60 * 1000)
    });
    isPinned = true;
  }

  await conversation.save();

  const now2 = new Date();
  const pinnedMessageIds = conversation.pinnedMessages.filter(p => {
    return p.message && (!p.pinnedUntil || new Date(p.pinnedUntil) > now2);
  }).map(p => ({
    id: p.message.toString(),
    pinnedUntil: p.pinnedUntil ? p.pinnedUntil.toISOString() : null
  }));

  return res.status(200).json(
    new ApiResponse(200, isPinned ? "Message pinned" : "Message unpinned", {
      pinnedMessageIds
    })
  );
});

// 8. Toggle Emoji Reaction on Message
export const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const myId = req.user._id;

  if (!emoji) {
    throw new ApiError(400, "Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const myIdStr = myId.toString();

  // Check if user already reacted with this EXACT emoji
  const exactMatchIndex = (message.emojiReactions || []).findIndex(
    r => r.emoji === emoji && (r.userIds || []).some(id => (id._id ? id._id.toString() : id.toString()) === myIdStr)
  );

  // Remove current user ID from ALL existing emoji reactions on this message
  (message.emojiReactions || []).forEach(r => {
    r.userIds = (r.userIds || []).filter(id => (id._id ? id._id.toString() : id.toString()) !== myIdStr);
  });

  // Filter out any emoji reactions that now have 0 users
  message.emojiReactions = (message.emojiReactions || []).filter(r => r.userIds && r.userIds.length > 0);

  // If user did NOT already have this exact emoji, add user to this emoji
  if (exactMatchIndex === -1) {
    const existingEmojiIndex = message.emojiReactions.findIndex(r => r.emoji === emoji);
    if (existingEmojiIndex > -1) {
      message.emojiReactions[existingEmojiIndex].userIds.push(myId);
    } else {
      message.emojiReactions.push({
        emoji,
        userIds: [myId]
      });
    }
  }

  await message.save();

  // Format updated reactions with sanitization
  const formattedReactions = sanitizeEmojiReactions(message.emojiReactions, myId);

  // Real-time broadcast to connected participants
  const io = req.app.get("io");
  if (io) {
    io.emit("message-reaction-updated", {
      messageId: message._id.toString(),
      emojiReactions: formattedReactions
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Reaction toggled successfully", {
      emojiReactions: formattedReactions
    })
  );
});

// 9. Edit Message
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const myId = req.user._id;

  if (!text) {
    throw new ApiError(400, "Text is required to edit message");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== myId.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Cannot edit a deleted message");
  }

  // ⏱️ Check if message was sent within 24 hours (24 * 60 * 60 * 1000 ms)
  const messageAgeMs = Date.now() - new Date(message.createdAt).getTime();
  const maxEditTimeMs = 24 * 60 * 60 * 1000;
  if (messageAgeMs > maxEditTimeMs) {
    throw new ApiError(400, "Message can only be edited within 24 hours of being sent.");
  }

  const cleanNewText = text.trim();
  const cleanOldText = (message.text || "").trim();

  if (cleanNewText === cleanOldText) {
    return res.status(200).json(
      new ApiResponse(200, "Message unchanged", {
        message: formatMessage(message, myId)
      })
    );
  }

  message.text = cleanNewText;
  message.edited = true;
  await message.save();

  // Send real-time socket event for message update
  const io = req.app.get("io");
  if (io) {
    io.emit("message-updated", { messageId, text, edited: true });
  }

  return res.status(200).json(
    new ApiResponse(200, "Message edited successfully", {
      message: formatMessage(message, myId)
    })
  );
});

// 10a. Delete Message For Me (Hide for current user only)
export const deleteMessageForMe = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (!message.deletedFor.includes(myId)) {
    message.deletedFor.push(myId);
    await message.save();
  }

  return res.status(200).json(
    new ApiResponse(200, "Message deleted for you", { messageId })
  );
});

// 10b. Delete Message For Everyone (Global Soft Delete)
export const deleteMessageForEveryone = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== myId.toString()) {
    throw new ApiError(403, "You can only delete your own messages for everyone");
  }

  message.text = "This message was deleted.";
  message.isDeleted = true;
  message.type = "text";
  message.attachmentUrl = "";
  message.attachmentName = "";
  message.attachmentSize = "";
  message.attachmentDuration = "";
  await message.save();

  // Send real-time socket event for message deletion
  const io = req.app.get("io");
  if (io) {
    io.emit("message-deleted", { messageId });
  }

  return res.status(200).json(
    new ApiResponse(200, "Message deleted for everyone", {
      message: formatMessage(message, myId)
    })
  );
});

// 11. Upload attachment 
export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  try {
    const folder = req.file.mimetype && req.file.mimetype.startsWith("image/")
      ? "weChat/chat_images"
      : "weChat/chat_files";

    let fileUrl = '';
    let uploadedToCloudinary = false;

    try {
      const cloudinaryResult = await uploadToCloudinary(req.file.path, folder);
      if (cloudinaryResult && cloudinaryResult.secure_url) {
        fileUrl = cloudinaryResult.secure_url;
        uploadedToCloudinary = true;
      }
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, falling back to local server storage:", cloudErr.message || cloudErr);
      fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    if (!fileUrl) {
      fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // Clean up temp file if uploaded to Cloudinary
    if (uploadedToCloudinary && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (err) { }
    }

    return res.status(200).json(
      new ApiResponse(200, "File uploaded successfully", {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size
      })
    );
  } catch (error) {
    console.error("Upload error:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }
    throw new ApiError(500, `Failed to upload file: ${error.message}`);
  }
});

// 12. Get Message Info (Read By + Delivered To) for group chat messages
export const getMessageInfo = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const myId = req.user._id;

  const message = await Message.findById(messageId)
    .populate("readBy.user", "name email avatar phone")
    .populate("deliveredTo.user", "name email avatar phone");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Only the sender can view message info
  if (message.sender.toString() !== myId.toString()) {
    throw new ApiError(403, "Only the sender can view message info");
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const readUserIds = new Set(
    (message.readBy || []).map(r => r.user?._id ? r.user._id.toString() : (r.user?.id || r.user?.toString()))
  );

  const unreadDeliveredTo = (message.deliveredTo || []).filter(d => {
    const dUserId = d.user?._id ? d.user._id.toString() : (d.user?.id || d.user?.toString());
    return dUserId && !readUserIds.has(dUserId);
  });

  const totalRead = message.readBy.length;
  const totalDelivered = unreadDeliveredTo.length;

  const mapUser = (u) => {
    if (!u) return { id: "", name: "Unknown Member", email: "", avatar: "", phone: "" };
    let avatarUrl = "";
    if (typeof u.avatar === "string") {
      avatarUrl = u.avatar;
    } else if (u.avatar && typeof u.avatar === "object") {
      avatarUrl = u.avatar.url || "";
    }
    return {
      id: u._id?.toString() || "",
      name: u.name || "Unknown Member",
      email: u.email || "",
      avatar: avatarUrl,
      phone: u.phone || ""
    };
  };

  const readByPage = message.readBy.slice(skip, skip + limitNum).map(r => ({
    user: mapUser(r.user),
    time: r.readAt
  }));

  const deliveredToPage = unreadDeliveredTo.slice(skip, skip + limitNum).map(d => ({
    user: mapUser(d.user),
    time: d.deliveredAt
  }));

  return res.status(200).json(
    new ApiResponse(200, "Message info fetched successfully", {
      readBy: readByPage,
      deliveredTo: deliveredToPage,
      totalRead,
      totalDelivered,
      page: pageNum,
      limit: limitNum
    })
  );
});

export const makeGroupAdmin = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) {
    throw new ApiError(400, "Target user id is required");
  }

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }
  const isCurrentAdmin = conversation.adminIds.some(id => id.toString() === myId.toString());
  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can assign new admins");
  }
  const alreadyAdmin = conversation.adminIds.some(
    id => id.toString() === targetUserId.toString()
  );
  if (!alreadyAdmin) {
    conversation.adminIds.push(targetUserId);
    await conversation.save();
  }
  const formattedAdminIds = conversation.adminIds.map(id => {
    const idStr = id.toString();
    return idStr === myId.toString() ? "user_me" : idStr;
  });

  return res.status(200).json(
    new ApiResponse(200, "User promoted to admin successfully", {
      adminIds: formattedAdminIds
    })
  );
});

export const dismissGroupAdmin = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) {
    throw new ApiError(400, "Target user ID is required");
  }

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(id => id.toString() === myId.toString());
  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can revoke admin privileges");
  }

  conversation.adminIds = conversation.adminIds.filter(
    id => id.toString() !== targetUserId.toString()
  );

  if (conversation.adminIds.length === 0 && conversation.participants.length > 0) {
    conversation.adminIds.push(conversation.participants[0]);
  }

  await conversation.save();

  const formattedAdminIds = conversation.adminIds.map(id => {
    const idStr = id.toString();
    return idStr === myId.toString() ? "user_me" : idStr;
  });

  return res.status(200).json(
    new ApiResponse(200, "Admin privileges revoked successfully", {
      adminIds: formattedAdminIds
    })
  );
});

export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) {
    throw new ApiError(400, "Target user ID is required");
  }

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group Chat not found");
  }
  // Verify current user is a group admin
  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can remove members");
  }
  // Remove target user from participants and adminIds
  conversation.participants = conversation.participants.filter(
    id => id.toString() !== targetUserId.toString()
  );

  conversation.adminIds = conversation.adminIds.filter(
    id => id.toString() !== targetUserId.toString()
  );

  // Auto-promote: If no group admin remains, automatically promote the first remaining member (earliest added user) to admin
  if (conversation.adminIds.length === 0 && conversation.participants.length > 0) {
    const firstRemainingUser = conversation.participants[0];
    conversation.adminIds.push(firstRemainingUser);
  }

  await conversation.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  const formattedParticipants = conversation.participants.map(
    id => (id.toString() === myId.toString() ? "user_me" : id.toString())
  );
  const formattedAdminIds = conversation.adminIds.map(
    id => (id.toString() === myId.toString() ? "user_me" : id.toString())
  );
  return res.status(200).json(
    new ApiResponse(200, "User removed from group successfully", {
      participants: formattedParticipants,
      adminIds: formattedAdminIds
    })
  );
});

export const addMembersToGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body;
  const myId = req.user._id;

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new ApiError(400, "Please provide an array of member IDs to add");
  }

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  const existingIdStrs = conversation.participants.map(id => id.toString());
  const existingPendingIdStrs = (conversation.joinRequests || []).map(r => (r.user?._id ? r.user._id.toString() : r.user.toString()));

  const newMemberIds = memberIds.filter(
    id => !existingIdStrs.includes(id.toString()) && !existingPendingIdStrs.includes(id.toString())
  );

  if (newMemberIds.length === 0) {
    throw new ApiError(400, "All selected users are already members or have pending join requests");
  }

  // If current user is NOT an admin: create a join request for admin approval
  if (!isCurrentAdmin) {
    if (!conversation.joinRequests) conversation.joinRequests = [];
    newMemberIds.forEach(id => {
      conversation.joinRequests.push({
        user: id,
        requestedBy: myId,
        requestedAt: new Date()
      });
    });

    await conversation.save();
    await conversation.populate("participants", "name email avatar isOnline lastSeen");
    await conversation.populate("joinRequests.user", "name email avatar");
    await conversation.populate("joinRequests.requestedBy", "name email avatar");
    await conversation.populate("lastMessage");

    const io = req.app.get("io");
    if (io) {
      io.emit("group-updated", {
        chatId: conversation._id.toString(),
        name: conversation.name,
        description: conversation.description,
        avatar: conversation.avatar
      });
    }

    return res.status(200).json(
      new ApiResponse(200, "Join request sent to group admin for approval", {
        isPending: true,
        chat: formatConversation(conversation, myId)
      })
    );
  }

  // Direct addition — record joinedAt for each new member
  const joinNow = new Date();
  if (!conversation.memberJoinedAt) conversation.memberJoinedAt = new Map();
  newMemberIds.forEach(id => {
    conversation.participants.push(id);
    conversation.memberJoinedAt.set(id.toString(), joinNow);
  });
  conversation.markModified('memberJoinedAt');
  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("joinRequests.user", "name email avatar");
  await conversation.populate("joinRequests.requestedBy", "name email avatar");
  await conversation.populate("lastMessage");

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Members added to group successfully", {
      chat: formatConversation(conversation, myId)
    })
  );
});



export const updateGroupProfile = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name, description, avatar } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can update group profile settings");
  }

  if (name !== undefined && name !== null) {
    if (!name.trim()) {
      throw new ApiError(400, "Group name cannot be empty");
    }
    conversation.name = name.trim();
  }

  if (description !== undefined && description !== null) {
    conversation.description = description.trim();
  }

  if (avatar !== undefined && avatar !== null) {
    conversation.avatar = avatar;
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");


  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Group profile updated successfully", {
      chat: formatConversation(conversation, myId)
    })
  );
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(id => id.toString() === myId.toString());
  const remainingAdmins = conversation.adminIds.filter(id => id.toString() !== myId.toString());
  const remainingParticipants = conversation.participants.filter(id => id.toString() !== myId.toString());

  // Rule: If user is the ONLY admin and there are other remaining participants, require appointing an admin first
  if (isCurrentAdmin && remainingAdmins.length === 0 && remainingParticipants.length > 0) {
    throw new ApiError(400, "You are the only admin of this group. Please assign another member as an admin before leaving.");
  }

  // Remove current user from participants and adminIds
  conversation.participants = conversation.participants.filter(
    id => id.toString() !== myId.toString()
  );
  conversation.adminIds = conversation.adminIds.filter(
    id => id.toString() !== myId.toString()
  );

  // If no members remain, clean up the group and messages
  if (conversation.participants.length === 0) {
    await Message.deleteMany({ conversation: chatId });
    await Conversation.deleteOne({ _id: chatId });
  } else {
    await conversation.save();
  }

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Left group space successfully", { chatId })
  );
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group"
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can dissolve this space");
  }

  // Delete all messages associated with this conversation
  await Message.deleteMany({ conversation: chatId });
  // Delete the conversation document
  await Conversation.deleteOne({ _id: chatId });

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: chatId,
      isDeleted: true
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Group space dissolved successfully", { chatId })
  );
});

export const updateGroupPermissions = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { permissions } = req.body;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can update group permissions");
  }

  if (permissions) {
    if (!conversation.permissions) {
      conversation.permissions = { sendMessages: true, addMembers: true, approveMembers: false };
    }
    if (permissions.sendMessages !== undefined) {
      conversation.permissions.sendMessages = permissions.sendMessages;
    }
    if (permissions.addMembers !== undefined) {
      conversation.permissions.addMembers = permissions.addMembers;
    }
    if (permissions.approveMembers !== undefined) {
      conversation.permissions.approveMembers = permissions.approveMembers;
    }
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("joinRequests.user", "name email avatar");
  await conversation.populate("joinRequests.requestedBy", "name email avatar");
  await conversation.populate("lastMessage");

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Group permissions updated successfully", {
      chat: formatConversation(conversation, myId)
    })
  );
});

export const handleJoinRequest = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId, action } = req.body;
  const myId = req.user._id;

  if (!targetUserId || !action) {
    throw new ApiError(400, "Target user ID and action are required");
  }

  const conversation = await Conversation.findOne({
    _id: chatId,
    type: "group",
    participants: myId
  });

  if (!conversation) {
    throw new ApiError(404, "Group chat not found");
  }

  const isCurrentAdmin = conversation.adminIds.some(
    id => id.toString() === myId.toString()
  );

  if (!isCurrentAdmin) {
    throw new ApiError(403, "Only group admins can handle join requests");
  }

  conversation.joinRequests = (conversation.joinRequests || []).filter(
    r => (r.user?._id ? r.user._id.toString() : r.user.toString()) !== targetUserId.toString()
  );

  if (action === "approve") {
    const alreadyMember = conversation.participants.some(
      id => id.toString() === targetUserId.toString()
    );
    if (!alreadyMember) {
      conversation.participants.push(targetUserId);
      // Record the join time so the new member only sees messages from now onwards
      if (!conversation.memberJoinedAt) conversation.memberJoinedAt = new Map();
      conversation.memberJoinedAt.set(targetUserId.toString(), new Date());
      conversation.markModified('memberJoinedAt');
    }
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("joinRequests.user", "name email avatar");
  await conversation.populate("joinRequests.requestedBy", "name email avatar");
  await conversation.populate("lastMessage");

  const io = req.app.get("io");
  if (io) {
    io.emit("group-updated", {
      chatId: conversation._id.toString(),
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar
    });
  }

  return res.status(200).json(
    new ApiResponse(200, `Join request ${action === "approve" ? "approved" : "rejected"} successfully`, {
      chat: formatConversation(conversation, myId)
    })
  );
});

// Toggle Archive Chat Status
export const toggleArchiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) throw new ApiError(404, "Chat space not found");

  if (!conversation.archivedBy) conversation.archivedBy = [];
  const idx = conversation.archivedBy.findIndex(id => id.toString() === myId.toString());
  if (idx > -1) {
    conversation.archivedBy.splice(idx, 1);
  } else {
    conversation.archivedBy.push(myId);
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  return res.status(200).json(
    new ApiResponse(200, "Chat archive status updated", {
      chat: formatConversation(conversation, myId)
    })
  );
});

// Toggle Favorite Chat Status
export const toggleFavoriteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) throw new ApiError(404, "Chat space not found");

  if (!conversation.favoriteBy) conversation.favoriteBy = [];
  const idx = conversation.favoriteBy.findIndex(id => id.toString() === myId.toString());
  if (idx > -1) {
    conversation.favoriteBy.splice(idx, 1);
  } else {
    conversation.favoriteBy.push(myId);
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  return res.status(200).json(
    new ApiResponse(200, "Chat favorite status updated", {
      chat: formatConversation(conversation, myId)
    })
  );
});

// Toggle Unread Chat Status
export const toggleUnreadChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) throw new ApiError(404, "Chat space not found");

  if (!conversation.unreadFor) conversation.unreadFor = [];
  const idx = conversation.unreadFor.findIndex(id => id.toString() === myId.toString());
  if (idx > -1) {
    conversation.unreadFor.splice(idx, 1);
  } else {
    conversation.unreadFor.push(myId);
  }

  await conversation.save();
  await conversation.populate("participants", "name email avatar isOnline lastSeen");
  await conversation.populate("lastMessage");

  return res.status(200).json(
    new ApiResponse(200, "Chat unread status updated", {
      chat: formatConversation(conversation, myId)
    })
  );
});

// Clear Chat Messages (For Me Only)
export const clearChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: chatId,
    participants: myId
  });
  if (!conversation) throw new ApiError(404, "Chat space not found");

  // Mark all messages in this conversation as deleted for current user only
  await Message.updateMany(
    { conversation: chatId, deletedFor: { $ne: myId } },
    { $push: { deletedFor: myId } }
  );

  return res.status(200).json(
    new ApiResponse(200, "Chat messages cleared for you successfully", { chatId })
  );
});

// Delete Chat Conversation
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) throw new ApiError(404, "Chat space not found");

  if (!conversation.deletedBy) conversation.deletedBy = [];
  const myIdStr = myId.toString();
  if (!conversation.deletedBy.some(id => id.toString() === myIdStr)) {
    conversation.deletedBy.push(myId);
  }

  // Also clear messages for current user
  await Message.updateMany(
    { conversation: chatId, deletedFor: { $ne: myId } },
    { $push: { deletedFor: myId } }
  );

  // If all participants have deleted this conversation, hard delete
  const participantStrs = (conversation.participants || []).map(p => p.toString());
  const deletedByStrs = conversation.deletedBy.map(d => d.toString());
  const allDeleted = participantStrs.length > 0 && participantStrs.every(pId => deletedByStrs.includes(pId));

  if (allDeleted) {
    await Message.deleteMany({ conversation: chatId });
    await Conversation.findByIdAndDelete(chatId);
  } else {
    await conversation.save();
  }

  return res.status(200).json(
    new ApiResponse(200, "Chat deleted successfully", { chatId })
  );
});