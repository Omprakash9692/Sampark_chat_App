import express from "express";
import {register,registerAdmin,login,getMe,logout,verifyEmail,resendVerification,forgotPassword,resetPassword} from "../controllers/auth.controller.js";
import {getAdminStats,toggleBlockUser,deleteUser,createReport,getReports,updateReportStatus,getAllGroups,toggleBlockGroup,deleteGroup} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import userRoutes from "./user.routes.js";

const authRouter = express.Router();

// User management routes
authRouter.use("/", userRoutes);

// Public auth routes
authRouter.post("/register", register);
authRouter.post("/register-admin", registerAdmin);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/resend-verification", resendVerification);

// Protected auth routes
authRouter.get("/me", protect, getMe);
authRouter.post("/verify-email", protect, verifyEmail);

// Admin compliance & moderation routes
authRouter.get("/admin/stats", protect, adminOnly, getAdminStats);
authRouter.put("/admin/users/:userId/block", protect, adminOnly, toggleBlockUser);
authRouter.delete("/admin/users/:userId", protect, adminOnly, deleteUser);
authRouter.get("/admin/reports", protect, adminOnly, getReports);
authRouter.put("/admin/reports/:reportId/status", protect, adminOnly, updateReportStatus);
authRouter.get("/admin/groups", protect, adminOnly, getAllGroups);
authRouter.put("/admin/groups/:groupId/block", protect, adminOnly, toggleBlockGroup);
authRouter.delete("/admin/groups/:groupId", protect, adminOnly, deleteGroup);

// Incident reporting routes
authRouter.post("/reports", protect, createReport);

export default authRouter;

