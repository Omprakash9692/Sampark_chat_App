import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserChats,
  createDirectChat,
  togglePinChat,
  toggleArchiveChat,
  toggleFavoriteChat,
  toggleUnreadChat,
  clearChatMessages,
  deleteChat
} from "../controllers/conversation.controller.js";

const conversationRouter = express.Router();

conversationRouter.use(protect);

conversationRouter.get("/", getUserChats);
conversationRouter.post("/direct", createDirectChat);
conversationRouter.put("/:chatId/pin", togglePinChat);
conversationRouter.put("/:chatId/archive", toggleArchiveChat);
conversationRouter.put("/:chatId/favorite", toggleFavoriteChat);
conversationRouter.put("/:chatId/unread", toggleUnreadChat);
conversationRouter.delete("/:chatId/clear-messages", clearChatMessages);
conversationRouter.delete("/:chatId/delete-chat", deleteChat);

export default conversationRouter;
