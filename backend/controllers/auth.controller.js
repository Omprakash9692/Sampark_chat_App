import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const isProduction = process.env.NODE_ENV === "production";

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
};

// 1. Register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "All fields (name, email, password) are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  // Generate 6-digit confirmation code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expir
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user", // Strict User registration
    isVerified: false,
    verificationCode,
    verificationCodeExpires
  });
  // Log verification code for development 
  console.log(`[DEBUG] Verification Code for ${email}: ${verificationCode}`);
  await sendVerificationEmail(email, name, verificationCode);
  const accessToken = generateAccessToken(user._id);
  res.cookie("accessToken", accessToken, cookieOptions);
  return res.status(201).json(
    new ApiResponse(201, "User registered successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "User", 
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || ""
      },
      token: accessToken
    })
  );
});

// 2. Register Admin (used for Postman - sets role: 'admin')
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "All fields (name, email, password) are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin", // Admin registration
    isVerified: true
  });
  const accessToken = generateAccessToken(user._id);
  res.cookie("accessToken", accessToken, cookieOptions);
  return res.status(201).json(
    new ApiResponse(201, "Admin registered successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "Admin", 
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || ""
      },
      token: accessToken
    })
  );
});

// 3. Login User/Admin (both can log in)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been suspended by the administrator");
  }
  const accessToken = generateAccessToken(user._id);
  res.cookie("accessToken", accessToken, cookieOptions);
  // Capitalize role for frontend compatibility
  const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  return res.status(200).json(
    new ApiResponse(200, "Logged in successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: capitalizedRole,
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || "",
        blockedUsers: user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : []
      },
      token: accessToken
    })
  );
});


// 5. Get Current User Info 
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return res.status(200).json(
    new ApiResponse(200, "User details fetched successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: capitalizedRole,
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || "",
        blockedUsers: user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : []
      }
    })
  );
});

// 6. Logout (Clear cookies)
export const logout = asyncHandler(async (req, res) => {
  let token = req.cookies?.accessToken;
  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { isOnline: false, lastSeen: new Date() });
    } catch (err) {
      console.log("Token verification during logout:", err.message);
    }
  }

  res.clearCookie("accessToken", cookieOptions);

  return res.status(200).json(
    new ApiResponse(200, "Logged out successfully")
  );
});

// 7. Verify Email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = req.user;

  if (!code) {
    throw new ApiError(400, "Verification code is required");
  }

  if (user.verificationCode !== code) {
    throw new ApiError(400, "Invalid verification code");
  }

  if (new Date() > user.verificationCodeExpires) {
    throw new ApiError(400, "Verification code has expired");
  }

  user.isVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  await user.save();

  const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return res.status(200).json(
    new ApiResponse(200, "Account verified successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: capitalizedRole,
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || ""
      }
    })
  );
});

// 8. Resend Verification Code 
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required to resend verification code");
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, "If your email is registered, a new code has been sent")
    );
  }

  if (user.isVerified) {
    throw new ApiError(400, "Account is already verified");
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  console.log(`[DEBUG] Resent Verification Code for ${user.email}: ${verificationCode}`);
  await sendVerificationEmail(user.email, user.name, verificationCode);

  return res.status(200).json(
    new ApiResponse(200, "Verification code resent successfully")
  );
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Return generic success to prevent email enumeration
    return res.status(200).json(
      new ApiResponse(200, "If your email is registered, a password reset link has been sent")
    );
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  console.log(`[DEBUG] Forgot Password Code for ${user.email}: ${verificationCode}`);
  await sendVerificationEmail(user.email, user.name, verificationCode);

  return res.status(200).json(
    new ApiResponse(200, "If your email is registered, a password reset link has been sent")
  );
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    throw new ApiError(400, "Email, code, and new password are required");
  }

  const cleanEmail = email.toString().toLowerCase().trim();
  const cleanCode = code.toString().trim();

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new ApiError(400, "Invalid email or verification code");
  }

  if (!user.verificationCode || user.verificationCode.toString().trim() !== cleanCode) {
    throw new ApiError(400, "Invalid verification code");
  }

  if (!user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires)) {
    throw new ApiError(400, "Verification code has expired. Please request a new code.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  user.password = hashedPassword;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Password has been reset successfully")
  );
});

// 9. Update Profile (Protected)
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone } = req.body;
  const user = req.user;

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;

  if (req.file) {
    try{
      const cloudinaryResult = await uploadToCloudinary(req.file.path,"weChat/avatars");
      user.avatar = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url
      };
    } catch(error){
      throw new ApiError(500,`Failed to upload avatar:${error.message}`);
    }
  }

  await user.save();

  const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return res.status(200).json(
    new ApiResponse(200, "Profile updated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: capitalizedRole,
        isVerified: user.isVerified,
        avatar: user.avatar?.url || "",
        bio: user.bio || "",
        phone: user.phone || ""
      }
    })
  );
});

// 10. Get All Users (Protected)
export const getAllUsers = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const me = await User.findById(myId);
  const isAdmin = me?.role === "admin";
  const myBlockedUsers = me?.blockedUsers?.map(id => id.toString()) || [];

  const users = await User.find({}, "name email avatar isOnline lastSeen role isBlocked phone bio blockedUsers");

  const formattedUsers = users.map(u => {
    const uIdStr = u._id.toString();

    // Admins always see full profile data — block relationships don't hide avatars for them
    const hasBlockedMe = !isAdmin && (u.blockedUsers?.map(id => id.toString()).includes(myId.toString()) || false);
    const haveIBlockedHim = !isAdmin && myBlockedUsers.includes(uIdStr);
    const isBlockedRelation = hasBlockedMe || haveIBlockedHim;

    return {
      id: u._id,
      name: u.name,
      email: u.email,
      avatar: isBlockedRelation ? "" : (u.avatar?.url || ""),
      avatarColor: "from-indigo-650 to-indigo-650",
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      isOnline: isBlockedRelation ? false : (u.isOnline || false),
      lastSeen: isBlockedRelation ? null : u.lastSeen,
      phone: u.phone || "",
      bio: u.bio || "",
      isBlocked: u.isBlocked || false,
      statusText: u.isBlocked ? "Blocked" : ((isBlockedRelation ? false : u.isOnline) ? "Active" : "Offline")
    };
  });

  return res.status(200).json(
    new ApiResponse(200, "Users fetched successfully", { users: formattedUsers })
  );
});

// 11. Toggle User Block Status for Logged In User (Protected)
export const toggleBlockUserForMe = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;

  if (userId === myId.toString()) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const me = await User.findById(myId);
  if (!me) {
    throw new ApiError(404, "User not found");
  }

  if (!me.blockedUsers) {
    me.blockedUsers = [];
  }

  const index = me.blockedUsers.indexOf(userId);
  let isBlockedNow = false;

  if (index > -1) {
    me.blockedUsers.splice(index, 1);
  } else {
    me.blockedUsers.push(userId);
    isBlockedNow = true;
  }

  await me.save();

  return res.status(200).json(
    new ApiResponse(200, `User ${isBlockedNow ? "blocked" : "unblocked"} successfully`, {
      blockedUsers: me.blockedUsers.map(id => id.toString())
    })
  );
});
