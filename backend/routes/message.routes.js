import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { chatUpload } from "../middleware/upload.middleware.js";
import {getChatMessages,sendMessage,editMessage,deleteMessageForMe,deleteMessageForEveryone,togglePinMessage,toggleReaction,getMessageInfo,uploadAttachment} from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.use(protect);

messageRouter.post("/upload", chatUpload.single("file"), uploadAttachment);
messageRouter.get("/:chatId/messages", getChatMessages);
messageRouter.post("/:chatId/messages", sendMessage);
messageRouter.put("/:chatId/pin-message", togglePinMessage);
messageRouter.put("/messages/:messageId/reaction", toggleReaction);
messageRouter.put("/messages/:messageId", editMessage);
messageRouter.delete("/messages/:messageId/me", deleteMessageForMe);
messageRouter.delete("/messages/:messageId/everyone", deleteMessageForEveryone);
messageRouter.get("/messages/:messageId/info", getMessageInfo);

export default messageRouter;
