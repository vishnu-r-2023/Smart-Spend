import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";
import { createSessionToken, hashPassword, verifyPassword } from "../utils/auth.js";

const router = express.Router();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const assignLegacyTransactions = async (userId) => {
  const userCount = await Transaction.countDocuments({ userId });
  if (userCount > 0) {
    return;
  }

  const legacyCount = await Transaction.countDocuments({ userId: { $exists: false } });
  if (legacyCount > 0) {
    await Transaction.updateMany(
      { userId: { $exists: false } },
      { $set: { userId } }
    );
  }
};

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const { salt, hash } = hashPassword(password);
    const sessionToken = createSessionToken();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      sessionToken
    });

    await assignLegacyTransactions(user._id);

    return res.json({
      token: sessionToken,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sessionToken = createSessionToken();
    user.sessionToken = sessionToken;
    await user.save();

    await assignLegacyTransactions(user._id);

    return res.json({
      token: sessionToken,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/auth/me", authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({
    user: { id: user._id, name: user.name, email: user.email }
  });
});

router.post("/auth/logout", authMiddleware, async (req, res) => {
  try {
    req.user.sessionToken = null;
    await req.user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
});

export default router;
