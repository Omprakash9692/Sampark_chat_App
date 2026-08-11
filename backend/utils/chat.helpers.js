import Conversation from "../models/Conversation.js";

// --- ID & User Utilities ---
export const toStr = (id) => (id?._id ? id._id.toString() : id ? id.toString() : "");
export const isMe = (id1, id2) => toStr(id1) === toStr(id2);
export const meOrId = (id, currentUserId) => (isMe(id, currentUserId) ? "user_me" : toStr(id));
export const hasUser = (list, userId) => (list || []).some((id) => isMe(id, userId));

// --- Response & Mongoose Helpers ---
export const ok = (res, message, data = {}) => res.status(200).json({ success: true, message, data });
export const created = (res, message, data = {}) => res.status(201).json({ success: true, message, data });
export const err = (res, status, message) => res.status(status).json({ success: false, message });

export const populateConv = (query) =>
  query
    .populate("participants", "name email avatar isOnline lastSeen")
    .populate("joinRequests.user", "name email avatar")
    .populate("joinRequests.requestedBy", "name email avatar")
    .populate("lastMessage");

export const emitGroupUpdate = (req, conv, extra = {}) => {
  const io = req.app.get("io");
  if (!io) return;
  const chatId = typeof conv === "string" ? conv : toStr(conv._id);
  const payload = typeof conv === "string" ? { chatId, ...extra } : { chatId, name: conv.name, description: conv.description, avatar: conv.avatar, ...extra };
  io.emit("group-updated", payload);
};

export const findGroup = (chatId, myId) => Conversation.findOne({ _id: chatId, type: "group", participants: myId });

// --- Formatters ---
export const formatConversation = (conv, currentUserId, unreadCount = 0) => {
  let joinedAt = null;
  if (conv.type === "group" && conv.memberJoinedAt && currentUserId) {
    const key = currentUserId.toString();
    joinedAt = typeof conv.memberJoinedAt.get === "function" ? conv.memberJoinedAt.get(key) : conv.memberJoinedAt[key];
  }

  const lastMsgObj = conv.lastMessage;
  let lastMsgFormatted = null;
  let lastMsgIdStr = null;
  let conversationTime = conv.createdAt;

  if (lastMsgObj && typeof lastMsgObj === "object" && lastMsgObj._id) {
    if (!hasUser(lastMsgObj.deletedFor, currentUserId)) {
      const msgCreatedAt = lastMsgObj.createdAt ? new Date(lastMsgObj.createdAt).getTime() : 0;
      const joinedAtTime = joinedAt ? new Date(joinedAt).getTime() : 0;

      if (!joinedAtTime || msgCreatedAt >= joinedAtTime) {
        const senderIdStr = toStr(lastMsgObj.sender);
        let computedStatus = lastMsgObj.status || "sent";
        if (isMe(senderIdStr, currentUserId)) {
          if (computedStatus === "seen" || (lastMsgObj.readBy || []).length > 0) computedStatus = "seen";
          else if (computedStatus === "delivered" || (lastMsgObj.deliveredTo || []).length > 0) computedStatus = "delivered";
          else computedStatus = "sent";
        }

        lastMsgFormatted = {
          id: toStr(lastMsgObj._id),
          chatId: toStr(conv._id),
          senderId: meOrId(senderIdStr, currentUserId),
          text: lastMsgObj.text || "",
          type: lastMsgObj.type || "text",
          timestamp: lastMsgObj.createdAt || conv.createdAt,
          status: computedStatus
        };
        lastMsgIdStr = toStr(lastMsgObj._id);
        conversationTime = lastMsgObj.createdAt;
      }
    }
  }

  const now = new Date();
  const pinnedMessageIds = (conv.pinnedMessages || [])
    .filter((p) => toStr(p.message) && (!p.pinnedUntil || new Date(p.pinnedUntil) > now))
    .map((p) => ({ id: toStr(p.message), pinnedUntil: p.pinnedUntil ? p.pinnedUntil.toISOString() : null }));

  const isMarkedUnread = hasUser(conv.unreadFor, currentUserId);

  return {
    id: toStr(conv._id),
    type: conv.type,
    name: conv.name || "",
    avatar: conv.avatar || "",
    description: conv.description || "",
    pinned: hasUser(conv.pinnedBy, currentUserId),
    archived: hasUser(conv.archivedBy, currentUserId),
    favorite: hasUser(conv.favoriteBy, currentUserId),
    isUnread: isMarkedUnread,
    unreadCount: isMarkedUnread ? Math.max(unreadCount, 1) : unreadCount,
    groupId: conv.type === "group" ? toStr(conv._id) : undefined,
    participants: (conv.participants || []).map((p) => meOrId(p, currentUserId)),
    adminIds: (conv.adminIds || []).map((id) => meOrId(id, currentUserId)),
    permissions: {
      sendMessages: conv.permissions?.sendMessages !== false,
      addMembers: conv.permissions?.addMembers !== false,
      approveMembers: conv.permissions?.approveMembers === true
    },
    joinRequests: (conv.joinRequests || []).map((req) => ({
      id: toStr(req._id || req.user),
      user: typeof req.user === "object" && req.user._id ? {
        id: toStr(req.user._id),
        name: req.user.name || "Unknown User",
        email: req.user.email || "",
        avatar: req.user.avatar || ""
      } : toStr(req.user),
      requestedBy: meOrId(req.requestedBy, currentUserId),
      requestedAt: req.requestedAt || new Date()
    })),
    createdTime: conversationTime,
    lastMessageId: lastMsgIdStr,
    lastMessage: lastMsgFormatted,
    pinnedMessageIds,
    isBlocked: conv.isBlocked || false
  };
};

export const sanitizeEmojiReactions = (rawReactions, currentUserId) => {
  if (!Array.isArray(rawReactions)) return [];
  const seenUserIds = new Set();
  const result = [];
  const currentUserIdStr = toStr(currentUserId);

  for (let i = rawReactions.length - 1; i >= 0; i--) {
    const r = rawReactions[i];
    if (!r?.emoji) continue;

    const filteredUserIds = [];
    const rawUserIds = r.userIds || [];

    for (let j = rawUserIds.length - 1; j >= 0; j--) {
      const idStr = toStr(rawUserIds[j]);
      if (!seenUserIds.has(idStr)) {
        seenUserIds.add(idStr);
        filteredUserIds.unshift(idStr === currentUserIdStr ? "user_me" : idStr);
      }
    }

    if (filteredUserIds.length > 0) {
      result.unshift({ emoji: r.emoji, count: filteredUserIds.length, userIds: filteredUserIds });
    }
  }
  return result;
};

export const formatMessage = (msg, currentUserId) => {
  const currentUserIdStr = toStr(currentUserId);
  const senderIdStr = toStr(msg.sender);

  let computedStatus = msg.status || "sent";
  if (senderIdStr === currentUserIdStr) {
    if (computedStatus === "seen" || (msg.readBy || []).length > 0) computedStatus = "seen";
    else if (computedStatus === "delivered" || (msg.deliveredTo || []).length > 0) computedStatus = "delivered";
    else computedStatus = "sent";
  }

  return {
    id: toStr(msg._id),
    chatId: toStr(msg.conversation),
    senderId: senderIdStr === currentUserIdStr ? "user_me" : senderIdStr,
    text: msg.text,
    type: msg.type,
    timestamp: msg.createdAt,
    status: computedStatus,
    isForwarded: msg.isForwarded || false,
    replyToId: msg.replyToId ? toStr(msg.replyToId) : null,
    edited: msg.edited || false,
    isDeleted: msg.isDeleted || false,
    attachmentUrl: msg.attachmentUrl,
    attachmentName: msg.attachmentName,
    attachmentSize: msg.attachmentSize,
    attachmentDuration: msg.attachmentDuration,
    emojiReactions: sanitizeEmojiReactions(msg.emojiReactions, currentUserId)
  };
};
