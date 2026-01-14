import bcrypt from "bcryptjs";
import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";
import jwt from "jsonwebtoken";
import { API_CONFIG } from "../config/constants.js";
import { sendVerificationEmail } from "../services/emailService.js";

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Save verification code
    await EmailVerification.findOneAndUpdate(
      { email },
      { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000), isUsed: false },
      { upsert: true, new: true }
    );

    // Send email
    try {
      await sendVerificationEmail(email, code);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const signUp = async (req, res) => {
  try {
    const { email, verificationCode, ...userData } = req.body;

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    // Verify the code
    const verification = await EmailVerification.findOne({
      email,
      code: verificationCode,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      ...userData,
      email,
      password: hashedPassword,
      createdAt: Date.now(),
      availableRolls: API_CONFIG.ROLL_ALLOCATION[userData.role.toUpperCase()] || 0,
      totalShares: 0,
    });

    const savedUser = await newUser.save();

    // Mark verification code as used
    verification.isUsed = true;
    await verification.save();

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      user: savedUser,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found");

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );
    if (!isPasswordValid) return res.status(401).json("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const { password, ...others } = user._doc;
    return res.status(200).json({ token, user: others });
  } catch (error) {
    console.error(error);
    return res.status(500).json("server error");
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error(error);
    return res.status(500).json("server error");
  }
};

// REFRESH TOKEN - validate incoming token and issue a new one
export const refreshToken = async (req, res) => {
  try {
    const incomingToken =
      req.body.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!incomingToken) return res.status(401).json("No token provided");

    let decoded;
    try {
      decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json("Invalid token");
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json("User not found");

    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const { password, ...others } = user._doc;
    return res.status(200).json({ token: newToken, user: others });
  } catch (error) {
    console.error(error);
    return res.status(500).json("server error");
  }
};
