import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.accessToken;

  // Fallback to Authorization Header
  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, token missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, "Not authorized, user not found");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been suspended by the administrator");
    }

    // Heartbeat: update isOnline and lastSeen if changed or every 30 seconds
    const now = new Date();
    const lastSeenTime = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    if (!user.isOnline || (now.getTime() - lastSeenTime > 30000)) {
      user.isOnline = true;
      user.lastSeen = now;
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 403) {
      throw error;
    }
    throw new ApiError(401, "Not authorized, invalid or expired token");
  }
});

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    throw new ApiError(403, "Access denied, admin authorization required");
  }
};
