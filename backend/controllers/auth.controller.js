import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail } from "../services/email.service.js";

// Token Helper
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );
};


// User Formatter
const formatUser = u => ({
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

const genCode = () => ({
  verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
  verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000)
});

const checkPhoneExists = async (phone, res) => {
  if (!phone?.trim()) return false;
  const clean = phone.trim();
  const norm = clean.replace(/[\s\-\(\)]/g, "");
  const users = await User.find({ phone: { $exists: true, $ne: "" } });
  if (users.some(u => u.phone && (u.phone.trim().replace(/[\s\-\(\)]/g, "") === norm || u.phone.trim() === clean))) {
    res.status(400).json({ success: false,
 message: "Phone number already exists. Please try a different number." });
    return true;
  }
  return false;
};

const sendCodeAndSave = async (user, label = "Verification") => {
  const { verificationCode, verificationCodeExpires } = genCode();
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();
  await sendVerificationEmail(user.email, user.name, verificationCode);
};

// 1. Register User / Admin Helper
const registerUserWithRole = async (req, res, role, isVerified) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false,
 message: "All fields (name, email, password) are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (await User.exists({ email: cleanEmail })) {
      return res.status(400).json({ success: false,
 message: "User with this email already exists" });
    }

    const phoneExists = await checkPhoneExists(phone, res);
    if (phoneExists) return;

    const hashedPassword = await bcrypt.hash(password, 10);
    const { verificationCode, verificationCodeExpires } = genCode();

    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      role,
      isVerified,
      ...(isVerified ? {} : { verificationCode, verificationCodeExpires })
    });

    if (!isVerified) {
      await sendVerificationEmail(cleanEmail, name, verificationCode);
    }

    const token = generateAccessToken(user._id);
    return res.status(201).json({
      success: true,
      message: `${role === "admin" ? "Admin" : "User"} registered successfully`,
      data: { user: formatUser(user), token }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Registration failed" });
  }
};

export const register = (req, res) => registerUserWithRole(req, res, "user", false);
export const registerAdmin = (req, res) => registerUserWithRole(req, res, "admin", true);

// 3. Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false,
 message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toString().toLowerCase().trim() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false,
 message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false,
 message: "Your account has been suspended by the administrator" });
    }

    if (!user.isVerified && (!user.verificationCode || !user.verificationCodeExpires || new Date() > user.verificationCodeExpires)) {
      await sendCodeAndSave(user, "Verification");
    }

    const token = generateAccessToken(user._id);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { user: formatUser(user), token }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Login failed" });
  }
};

// 4. Get Current User
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: { user: formatUser(req.user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to fetch user details" });
  }
};

// 5. Logout
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        await User.findByIdAndUpdate(decoded.userId, { isOnline: false, lastSeen: new Date() });
      } catch (err) {
        console.log("Token verification during logout:", err.message);
      }
    }
    return res.status(200).json({ success: true,
 message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Logout failed" });
  }
};

// 6. Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.body;
    const user = req.user || (email && await User.findOne({ email: email.toLowerCase().trim() }));
    if (!user) return res.status(404).json({ success: false,
 message: "User not found" });
    if (!code) return res.status(400).json({ success: false,
 message: "Verification code is required" });
    if (user.verificationCode !== code) return res.status(400).json({ success: false,
 message: "Invalid verification code" });
    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ success: false,
 message: "Verification code has expired" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully",
      data: { user: formatUser(user) }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Verification failed" });
  }
};

// 7. Resend Verification Code
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false,
 message: "Email is required to resend verification code" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(200).json({ success: true,
 message: "If your email is registered, a new code has been sent" });
    if (user.isVerified) return res.status(400).json({ success: false,
 message: "Account is already verified" });

    await sendCodeAndSave(user, "Resent Verification");
    return res.status(200).json({ success: true,
 message: "Verification code resent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to resend verification code" });
  }
};

// 8. Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false,
 message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) await sendCodeAndSave(user, "Forgot Password");

    return res.status(200).json({ success: true,
 message: "If your email is registered, a password reset link has been sent" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Forgot password request failed" });
  }
};

// 9. Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ success: false,
 message: "Email, code, and new password are required" });
    }

    const user = await User.findOne({ email: email.toString().toLowerCase().trim() });
    if (!user || user.verificationCode?.toString().trim() !== code.toString().trim()) {
      return res.status(400).json({ success: false,
 message: "Invalid email or verification code" });
    }
    if (!user.verificationCodeExpires || new Date() > new Date(user.verificationCodeExpires)) {
      return res.status(400).json({ success: false,
 message: "Verification code has expired. Please request a new code." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();
    return res.status(200).json({ success: true,
 message: "Password has been reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Reset password failed" });
  }
};
