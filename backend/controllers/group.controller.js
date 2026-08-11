import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  toStr,
  isMe,
  meOrId,
  hasUser,
  ok,
  created,
  err,
  populateConv,
  emitGroupUpdate,
  findGroup,
  formatConversation
} from "../utils/chat.helpers.js";

// 1. Create Group Chat
export const createGroupChat = async (req, res) => {
  const { name, description, participantIds, avatar } = req.body;
  const myId = req.user._id;

  if (!name?.trim()) return err(res, 400, "Group name is required");

  const cleanParticipants = Array.from(new Set(
    [toStr(myId), ...(Array.isArray(participantIds) ? participantIds : [])].filter((id) => id && id !== "user_me")
  ));

  const now = new Date();
  const memberJoinedAt = {};
  cleanParticipants.forEach((id) => { memberJoinedAt[id] = now; });

  const conversation = await Conversation.create({
    type: "group",
    name: name.trim(),
    description: description || "",
    avatar: avatar || "",
    participants: cleanParticipants,
    adminIds: [myId],
    memberJoinedAt
  });

  await populateConv(Conversation.findById(conversation._id));
  emitGroupUpdate(req, conversation);

  return created(res, "Group chat created successfully", { chat: formatConversation(conversation, myId) });
};

// 2. Make Group Admin
export const makeGroupAdmin = async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) return err(res, 400, "Target user id is required");

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can assign new admins");

  if (!hasUser(conversation.adminIds, targetUserId)) {
    conversation.adminIds.push(targetUserId);
    await conversation.save();
  }

  return ok(res, "User promoted to admin successfully", {
    adminIds: conversation.adminIds.map((id) => meOrId(id, myId))
  });
};

// 3. Dismiss Group Admin
export const dismissGroupAdmin = async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) return err(res, 400, "Target user ID is required");

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can revoke admin privileges");

  conversation.adminIds = conversation.adminIds.filter((id) => !isMe(id, targetUserId));
  if (conversation.adminIds.length === 0 && conversation.participants.length > 0) {
    conversation.adminIds.push(conversation.participants[0]);
  }

  await conversation.save();
  return ok(res, "Admin privileges revoked successfully", {
    adminIds: conversation.adminIds.map((id) => meOrId(id, myId))
  });
};

// 4. Remove Member from Group
export const removeFromGroup = async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId } = req.body;
  const myId = req.user._id;

  if (!targetUserId) return err(res, 400, "Target user ID is required");

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group Chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can remove members");

  conversation.participants = conversation.participants.filter((id) => !isMe(id, targetUserId));
  conversation.adminIds = conversation.adminIds.filter((id) => !isMe(id, targetUserId));

  if (conversation.adminIds.length === 0 && conversation.participants.length > 0) {
    conversation.adminIds.push(conversation.participants[0]);
  }

  await conversation.save();
  emitGroupUpdate(req, conversation);

  return ok(res, "User removed from group successfully", {
    participants: conversation.participants.map((id) => meOrId(id, myId)),
    adminIds: conversation.adminIds.map((id) => meOrId(id, myId))
  });
};

// 5. Add Members to Group
export const addMembersToGroup = async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body;
  const myId = req.user._id;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return err(res, 400, "Please provide an array of member IDs to add");
  }

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");

  const isCurrentAdmin = hasUser(conversation.adminIds, myId);
  const existingIds = conversation.participants.map(toStr);
  const pendingIds = (conversation.joinRequests || []).map((r) => toStr(r.user));

  const newMemberIds = memberIds.filter((id) => !existingIds.includes(toStr(id)) && !pendingIds.includes(toStr(id)));
  if (newMemberIds.length === 0) {
    return err(res, 400, "All selected users are already members or have pending join requests");
  }

  if (!isCurrentAdmin) {
    if (!conversation.joinRequests) conversation.joinRequests = [];
    const now = new Date();
    newMemberIds.forEach((id) => conversation.joinRequests.push({ user: id, requestedBy: myId, requestedAt: now }));

    await conversation.save();
    await populateConv(Conversation.findById(conversation._id));
    emitGroupUpdate(req, conversation);

    return ok(res, "Join request sent to group admin for approval", {
      isPending: true,
      chat: formatConversation(conversation, myId)
    });
  }

  const joinNow = new Date();
  if (!conversation.memberJoinedAt) conversation.memberJoinedAt = new Map();
  newMemberIds.forEach((id) => {
    conversation.participants.push(id);
    conversation.memberJoinedAt.set(toStr(id), joinNow);
  });
  conversation.markModified("memberJoinedAt");
  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));
  emitGroupUpdate(req, conversation);

  return ok(res, "Members added to group successfully", { chat: formatConversation(conversation, myId) });
};

// 6. Update Group Profile
export const updateGroupProfile = async (req, res) => {
  const { chatId } = req.params;
  const { name, description, avatar } = req.body;
  const myId = req.user._id;

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can update group profile settings");

  if (name !== undefined && name !== null) {
    if (!name.trim()) return err(res, 400, "Group name cannot be empty");
    conversation.name = name.trim();
  }
  if (description !== undefined && description !== null) conversation.description = description.trim();
  if (avatar !== undefined && avatar !== null) conversation.avatar = avatar;

  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));
  emitGroupUpdate(req, conversation);

  return ok(res, "Group profile updated successfully", { chat: formatConversation(conversation, myId) });
};

// 7. Leave Group
export const leaveGroup = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");

  const isCurrentAdmin = hasUser(conversation.adminIds, myId);
  const remainingAdmins = conversation.adminIds.filter((id) => !isMe(id, myId));
  const remainingParticipants = conversation.participants.filter((id) => !isMe(id, myId));

  if (isCurrentAdmin && remainingAdmins.length === 0 && remainingParticipants.length > 0) {
    return err(res, 400, "You are the only admin of this group. Please assign another member as an admin before leaving.");
  }

  conversation.participants = remainingParticipants;
  conversation.adminIds = remainingAdmins;

  if (conversation.participants.length === 0) {
    await Message.deleteMany({ conversation: chatId });
    await Conversation.deleteOne({ _id: chatId });
  } else {
    await conversation.save();
  }

  emitGroupUpdate(req, conversation);
  return ok(res, "Left group space successfully", { chatId });
};

// 8. Dissolve / Delete Group
export const deleteGroup = async (req, res) => {
  const { chatId } = req.params;
  const myId = req.user._id;

  const conversation = await Conversation.findOne({ _id: chatId, type: "group" });
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can dissolve this space");

  await Message.deleteMany({ conversation: chatId });
  await Conversation.deleteOne({ _id: chatId });

  emitGroupUpdate(req, chatId, { isDeleted: true });
  return ok(res, "Group space dissolved successfully", { chatId });
};

// 9. Update Group Permissions
export const updateGroupPermissions = async (req, res) => {
  const { chatId } = req.params;
  const { permissions } = req.body;
  const myId = req.user._id;

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can update group permissions");

  if (permissions) {
    if (!conversation.permissions) {
      conversation.permissions = { sendMessages: true, addMembers: true, approveMembers: false };
    }
    if (permissions.sendMessages !== undefined) conversation.permissions.sendMessages = permissions.sendMessages;
    if (permissions.addMembers !== undefined) conversation.permissions.addMembers = permissions.addMembers;
    if (permissions.approveMembers !== undefined) conversation.permissions.approveMembers = permissions.approveMembers;
  }

  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));
  emitGroupUpdate(req, conversation);

  return ok(res, "Group permissions updated successfully", { chat: formatConversation(conversation, myId) });
};

// 10. Handle Join Request
export const handleJoinRequest = async (req, res) => {
  const { chatId } = req.params;
  const { targetUserId, action } = req.body;
  const myId = req.user._id;

  if (!targetUserId || !action) return err(res, 400, "Target user ID and action are required");

  const conversation = await findGroup(chatId, myId);
  if (!conversation) return err(res, 404, "Group chat not found");
  if (!hasUser(conversation.adminIds, myId)) return err(res, 403, "Only group admins can handle join requests");

  conversation.joinRequests = (conversation.joinRequests || []).filter((r) => !isMe(r.user, targetUserId));

  if (action === "approve") {
    if (!hasUser(conversation.participants, targetUserId)) {
      conversation.participants.push(targetUserId);
      if (!conversation.memberJoinedAt) conversation.memberJoinedAt = new Map();
      conversation.memberJoinedAt.set(toStr(targetUserId), new Date());
      conversation.markModified("memberJoinedAt");
    }
  }

  await conversation.save();
  await populateConv(Conversation.findById(conversation._id));
  emitGroupUpdate(req, conversation);

  return ok(res, `Join request ${action === "approve" ? "approved" : "rejected"} successfully`, {
    chat: formatConversation(conversation, myId)
  });
};
