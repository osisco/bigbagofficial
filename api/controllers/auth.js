import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { API_CONFIG } from "../config/constants.js";

export const signUp = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      name: req.body.name,
      role: req.body.role,
      password: hashedPassword,
      age: req.body.age,
      gender: req.body.gender,
      city: req.body.city,
      country: req.body.country,
      language: req.body.language,
      email: req.body.email,
      createdAt: Date.now(),
      availableRolls:
        API_CONFIG.ROLL_ALLOCATION[req.body.role.toUpperCase()] || 0,
      totalShares: 0,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({ token, user: savedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json("server error");
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
