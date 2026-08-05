import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { chatUpload } from "../middleware/upload.middleware.js";
import {
  getUserChats,
  getChatMessages,
  createDirectChat,
  createGroupChat,
  sendMessage,
  togglePinChat,
  toggleArchiveChat,
  toggleFavoriteChat,
  toggleUnreadChat,
  clearChatMessages,
  deleteChat,
  togglePinMessage,
  toggleReaction,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  getMessageInfo,
  makeGroupAdmin,
  dismissGroupAdmin,
  removeFromGroup,
  addMembersToGroup,
  updateGroupProfile,
  leaveGroup,
  deleteGroup as deleteGroupController,
  updateGroupPermissions,
  handleJoinRequest
} from "../controllers/chat.controller.js";
import { uploadAttachment } from "../controllers/chat.controller.js";


const router = express.Router();

// Protect all messaging routes
router.use(protect);

// File upload route for chat attachments — handler moved to controller
router.post("/upload", chatUpload.single("file"), uploadAttachment);

router.get("/", getUserChats);
router.get("/:chatId/messages", getChatMessages);
router.post("/direct", createDirectChat);
router.post("/group", createGroupChat);
router.post("/:chatId/messages", sendMessage);
router.put("/:chatId/pin", togglePinChat);
router.put("/:chatId/archive", toggleArchiveChat);
router.put("/:chatId/favorite", toggleFavoriteChat);
router.put("/:chatId/unread", toggleUnreadChat);
router.delete("/:chatId/clear-messages", clearChatMessages);
router.delete("/:chatId/delete-chat", deleteChat);
router.put("/:chatId/pin-message", togglePinMessage);
router.put("/messages/:messageId/reaction", toggleReaction);
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId/me", deleteMessageForMe);
router.delete("/messages/:messageId/everyone", deleteMessageForEveryone);
router.get("/messages/:messageId/info", getMessageInfo);
router.put("/:chatId/make-admin", makeGroupAdmin);
router.put("/:chatId/dismiss-admin", dismissGroupAdmin);
router.put("/:chatId/remove-member", removeFromGroup);
router.put("/:chatId/add-members", addMembersToGroup);
router.put("/:chatId/group-profile", updateGroupProfile);
router.put("/:chatId/permissions", updateGroupPermissions);
router.put("/:chatId/join-request", handleJoinRequest);
router.put("/:chatId/leave", leaveGroup);
router.delete("/:chatId", deleteGroupController);

export default router;


