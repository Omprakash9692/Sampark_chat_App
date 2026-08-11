import express from "express";
import {updateProfile,getAllUsers,toggleBlockUserForMe} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const userRouter = express.Router();

// User profile & user directory routes
userRouter.put("/update-profile", protect, upload.single("avatar"), updateProfile);
userRouter.put("/profile", protect, upload.single("avatar"), updateProfile);

userRouter.get("/users", protect, getAllUsers);
userRouter.get("/", protect, getAllUsers);

userRouter.put("/block/:userId", protect, toggleBlockUserForMe);

export default userRouter;
