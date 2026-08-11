import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, token missing" });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been suspended by the administrator" });
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
    return res.status(401).json({ success: false, message: "Not authorized, invalid or expired token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access denied, admin authorization required" });
  }
};
