import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  toStr,
  isMe,
  hasUser,
  ok,
  err,
  populateConv,
  formatConversation
} from "../utils/chat.helpers.js";

// Helper for toggling user-specific conversation status
const toggleUserStatus = async (req, res, fieldName, successMsg) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) return err(res, 404, "Chat space not found");

  if (!conversation[fieldName]) conversation[fieldName] = [];
  const idx = conversation[fieldName].findIndex((id) => isMe(id, myId));
  if (idx > -1) conversation[fieldName].splice(idx, 1);
  else conversation[fieldName].push(myId);

  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));

  return ok(res, successMsg, { chat: formatConversation(conversation, myId) });
};

// 1. Get User Chats
export const getUserChats = async (req, res) => {
  const userId = req.user._id;
  const conversations = await populateConv(
    Conversation.find({ participants: userId, deletedBy: { $ne: userId } }).sort({ updatedAt: -1 })
  );

  const now = new Date();
  const unreadMap = {};

  for (const c of conversations) {
    const filter = { conversation: c._id, sender: { $ne: userId }, "readBy.user": { $ne: userId }, deletedFor: { $ne: userId } };
    if (c.type === "group" && c.memberJoinedAt) {
      const joinedAt = typeof c.memberJoinedAt.get === "function" ? c.memberJoinedAt.get(userId.toString()) : c.memberJoinedAt[userId.toString()];
      if (joinedAt) filter.createdAt = { $gte: new Date(joinedAt) };
    }

    await Message.updateMany({ ...filter, "deliveredTo.user": { $ne: userId } }, { $push: { deliveredTo: { user: userId, deliveredAt: now } } });
    unreadMap[c._id.toString()] = await Message.countDocuments(filter);
  }

  const formatted = [];
  for (const c of conversations) {
    if (c.type === "direct") {
      const valid = (c.participants || []).filter((p) => p && (p._id || p.id));
      if (valid.length < 2) {
        await Message.deleteMany({ conversation: c._id });
        await Conversation.findByIdAndDelete(c._id);
        continue;
      }
    }
    formatted.push(formatConversation(c, userId, unreadMap[c._id.toString()] || 0));
  }

  return ok(res, "Chats fetched successfully", { chats: formatted });
};

// 2. Create or Fetch Direct Chat
export const createDirectChat = async (req, res) => {
  const { userId } = req.body;
  const myId = req.user._id;

  if (!userId) return err(res, 400, "Recipient user ID is required");

  let conversation = await Conversation.findOne({ type: "direct", participants: { $all: [myId, userId] } });

  if (conversation) {
    if (conversation.deletedBy?.length > 0) {
      conversation.deletedBy = conversation.deletedBy.filter((id) => !isMe(id, myId));
      await conversation.save();
    }
  } else {
    conversation = await Conversation.create({ type: "direct", participants: [myId, userId] });
  }

  await populateConv(Conversation.findById(conversation._id));
  return ok(res, "Direct chat ready", { chat: formatConversation(conversation, myId) });
};

// 3. Toggle Pin Chat
export const togglePinChat = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;
  const conversation = await Conversation.findOne({ _id: chatId, participants: myId });
  if (!conversation) return err(res, 404, "Conversation not found");

  if (!conversation.pinnedBy) conversation.pinnedBy = [];
  const idx = conversation.pinnedBy.findIndex((id) => isMe(id, myId));
  const pinned = idx === -1;
  if (pinned) conversation.pinnedBy.push(myId);
  else conversation.pinnedBy.splice(idx, 1);

  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));

  return ok(res, pinned ? "Conversation pinned" : "Conversation unpinned", {
    pinned,
    chat: formatConversation(conversation, myId)
  });
};

// 4. Toggle Archive Chat
export const toggleArchiveChat = (req, res) => toggleUserStatus(req, res, "archivedBy", "Chat archive status updated");

// 5. Toggle Favorite Chat
export const toggleFavoriteChat = (req, res) => toggleUserStatus(req, res, "favoriteBy", "Chat favorite status updated");

// 6. Toggle Unread Chat
export const toggleUnreadChat = (req, res) => toggleUserStatus(req, res, "unreadFor", "Chat unread status updated");

// 7. Clear Chat Messages
export const clearChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({ _id: chatId, participants: myId });
  if (!conversation) return err(res, 404, "Chat space not found");

  await Message.updateMany(
    { conversation: chatId, deletedFor: { $ne: myId } },
    { $push: { deletedFor: myId } }
  );

  return ok(res, "Chat messages cleared for you successfully", { chatId });
};

// 8. Delete Chat Conversation
export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findById(chatId);
  if (!conversation) return err(res, 404, "Chat space not found");

  if (!conversation.deletedBy) conversation.deletedBy = [];
  if (!hasUser(conversation.deletedBy, myId)) conversation.deletedBy.push(myId);

  await Message.updateMany(
    { conversation: chatId, deletedFor: { $ne: myId } },
    { $push: { deletedFor: myId } }
  );

  const participantStrs = (conversation.participants || []).map(toStr);
  const deletedByStrs = conversation.deletedBy.map(toStr);
  const allDeleted = participantStrs.length > 0 && participantStrs.every((pId) => deletedByStrs.includes(pId));

  if (allDeleted) {
    await Message.deleteMany({ conversation: chatId });
    await Conversation.findByIdAndDelete(chatId);
  } else {
    await conversation.save();
  }

  return ok(res, "Chat deleted successfully", { chatId });
};
