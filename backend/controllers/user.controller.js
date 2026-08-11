import User from "../models/User.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const formatUser = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User",
  isVerified: u.isVerified,
  avatar: u.avatar?.url || "",
  bio: u.bio || "",
  phone: u.phone || "",
  ...(u.blockedUsers ? { blockedUsers: u.blockedUsers.map(id => id.toString()) } : {})
});

// 1. Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, "weChat/avatars");
        user.avatar = { public_id: result.public_id, url: result.secure_url };
      } catch (err) {
        return res.status(500).json({ success: false,
 message: `Failed to upload avatar: ${err.message}` });
      }
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: formatUser(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to update profile" });
  }
};

// 2. Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const me = await User.findById(req.user._id);
    const isAdmin = me?.role === "admin";
    const myBlocked = me?.blockedUsers?.map(id => id.toString()) || [];

    const users = await User.find({}, "name email avatar isOnline lastSeen role isBlocked phone bio blockedUsers");

    const formattedUsers = users.map(u => {
      const uId = u._id.toString();
      const hasBlockedMe = !isAdmin && (u.blockedUsers?.map(id => id.toString()).includes(myId) || false);
      const haveIBlocked = !isAdmin && myBlocked.includes(uId);
      const isHidden = hasBlockedMe || haveIBlocked;

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        avatar: hasBlockedMe ? "" : (u.avatar?.url || ""),
        avatarColor: "from-indigo-500 to-purple-600",
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User",
        isOnline: isHidden ? false : (u.isOnline || false),
        lastSeen: isHidden ? null : u.lastSeen,
        phone: u.phone || "",
        bio: u.bio || "",
        isBlocked: u.isBlocked || false,
        statusText: u.isBlocked ? "Blocked" : (haveIBlocked ? "Blocked" : (hasBlockedMe ? "Offline" : (u.isOnline ? "Active" : "Offline")))
      };
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: { users: formattedUsers }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to fetch users" });
  }
};

// 3. Toggle Block User For Me
export const toggleBlockUserForMe = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id.toString();
    if (userId === myId) {
      return res.status(400).json({ success: false,
 message: "You cannot block yourself" });
    }

    const me = await User.findById(req.user._id);
    if (!me) {
      return res.status(404).json({ success: false,
 message: "User not found" });
    }

    if (!me.blockedUsers) me.blockedUsers = [];
    const idx = me.blockedUsers.findIndex(id => id.toString() === userId.toString());
    const isBlockedNow = idx === -1;

    if (isBlockedNow) me.blockedUsers.push(userId);
    else me.blockedUsers.splice(idx, 1);

    await me.save();
    return res.status(200).json({
      success: true,
      message: `User ${isBlockedNow ? "blocked" : "unblocked"} successfully`,
      data: { blockedUsers: me.blockedUsers.map(id => id.toString()) }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to toggle block status" });
  }
};
