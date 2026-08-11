import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createGroupChat,
  makeGroupAdmin,
  dismissGroupAdmin,
  removeFromGroup,
  addMembersToGroup,
  updateGroupProfile,
  leaveGroup,
  deleteGroup as deleteGroupController,
  updateGroupPermissions,
  handleJoinRequest
} from "../controllers/group.controller.js";

const groupRouter = express.Router();

groupRouter.use(protect);

groupRouter.post("/group", createGroupChat);
groupRouter.put("/:chatId/make-admin", makeGroupAdmin);
groupRouter.put("/:chatId/dismiss-admin", dismissGroupAdmin);
groupRouter.put("/:chatId/remove-member", removeFromGroup);
groupRouter.put("/:chatId/add-members", addMembersToGroup);
groupRouter.put("/:chatId/group-profile", updateGroupProfile);
groupRouter.put("/:chatId/permissions", updateGroupPermissions);
groupRouter.put("/:chatId/join-request", handleJoinRequest);
groupRouter.put("/:chatId/leave", leaveGroup);
groupRouter.delete("/:chatId", deleteGroupController);

export default groupRouter;
