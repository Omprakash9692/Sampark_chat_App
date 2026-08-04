import express from "express";
import {
  register,
  registerAdmin,
  login,
  googleLogin,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  updateProfile,
  getAllUsers,
  toggleBlockUserForMe,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";
import {
  getAdminStats,
  toggleBlockUser,
  deleteUser,
  createReport,
  getReports,
  updateReportStatus,
  getAllGroups,
  toggleBlockGroup,
  deleteGroup
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.post("/verify-email", protect, verifyEmail);
router.put("/update-profile", protect, upload.single("avatar"), updateProfile);
router.get("/users", protect, getAllUsers);
router.put("/block/:userId", protect, toggleBlockUserForMe);

// Public resend — 
router.post("/resend-verification", resendVerification);

// Admin compliance & moderation routes
router.get("/admin/stats", protect, adminOnly, getAdminStats);
router.put("/admin/users/:userId/block", protect, adminOnly, toggleBlockUser);
router.delete("/admin/users/:userId", protect, adminOnly, deleteUser);
router.get("/admin/reports", protect, adminOnly, getReports);
router.put("/admin/reports/:reportId/status", protect, adminOnly, updateReportStatus);
router.get("/admin/groups", protect, adminOnly, getAllGroups);
router.put("/admin/groups/:groupId/block", protect, adminOnly, toggleBlockGroup);
router.delete("/admin/groups/:groupId", protect, adminOnly, deleteGroup);

// Incident reporting routes
router.post("/reports", protect, createReport);

export default router;
