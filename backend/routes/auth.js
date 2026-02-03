import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";
import { createSessionToken, hashPassword, verifyPassword } from "../utils/auth.js";

const router = express.Router();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  currency: user.currency || "INR",
  categoryPrefs: Array.isArray(user.categoryPrefs) ? user.categoryPrefs : [],
  notifications: user.notifications || {
    weeklySummary: true,
    budgetAlerts: true,
    productUpdates: true
  },
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  lastLoginIp: user.lastLoginIp
});

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
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      sessionToken,
      sessionTokens: [
        {
          token: sessionToken,
          userAgent,
          ip
        }
      ],
      lastLoginAt: new Date(),
      lastLoginIp: ip
    });

    await assignLegacyTransactions(user._id);

    return res.json({
      token: sessionToken,
      user: sanitizeUser(user)
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
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip;

    const existingSessions = Array.isArray(user.sessionTokens) ? user.sessionTokens : [];
    const nextSessions = [
      { token: sessionToken, userAgent, ip, createdAt: new Date() },
      ...existingSessions
    ].slice(0, 10);

    user.sessionToken = sessionToken;
    user.sessionTokens = nextSessions;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    await assignLegacyTransactions(user._id);

    return res.json({
      token: sessionToken,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/auth/me", authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({
    user: sanitizeUser(user)
  });
});

router.get("/auth/profile", authMiddleware, (req, res) => {
  return res.json({
    user: sanitizeUser(req.user)
  });
});

router.post("/auth/logout", authMiddleware, async (req, res) => {
  try {
    const token = req.token;
    const user = req.user;
    user.sessionToken = user.sessionToken === token ? null : user.sessionToken;
    if (Array.isArray(user.sessionTokens)) {
      user.sessionTokens = user.sessionTokens.filter((session) => session.token !== token);
    }
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
});

router.post("/auth/logout-all", authMiddleware, async (req, res) => {
  try {
    req.user.sessionToken = null;
    req.user.sessionTokens = [];
    await req.user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("LOGOUT ALL ERROR:", err);
    return res.status(500).json({ message: "Logout all failed" });
  }
});

router.patch("/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body || {};
    if (name) {
      req.user.name = name.trim();
    }
    if (avatarUrl !== undefined) {
      req.user.avatarUrl = avatarUrl.trim();
    }
    await req.user.save();
    return res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/auth/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (!verifyPassword(currentPassword, req.user.passwordSalt, req.user.passwordHash)) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const { salt, hash } = hashPassword(newPassword);
    req.user.passwordSalt = salt;
    req.user.passwordHash = hash;

    const currentToken = req.token;
    req.user.sessionTokens = (req.user.sessionTokens || []).filter(
      (session) => session.token === currentToken
    );
    req.user.sessionToken = currentToken;

    await req.user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("PASSWORD UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update password" });
  }
});

router.post("/auth/email", authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!verifyPassword(password, req.user.passwordSalt, req.user.passwordHash)) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res.status(409).json({ message: "Email already in use" });
    }

    req.user.email = normalizedEmail;
    await req.user.save();
    return res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("EMAIL UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update email" });
  }
});

router.patch("/auth/notifications", authMiddleware, async (req, res) => {
  try {
    const { weeklySummary, budgetAlerts, productUpdates } = req.body || {};
    req.user.notifications = {
      weeklySummary: weeklySummary ?? req.user.notifications?.weeklySummary ?? true,
      budgetAlerts: budgetAlerts ?? req.user.notifications?.budgetAlerts ?? true,
      productUpdates: productUpdates ?? req.user.notifications?.productUpdates ?? true
    };
    await req.user.save();
    return res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("NOTIFICATIONS UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
});

router.patch("/auth/preferences", authMiddleware, async (req, res) => {
  try {
    const { currency, categoryPrefs } = req.body || {};
    if (currency) {
      req.user.currency = currency;
    }
    if (Array.isArray(categoryPrefs)) {
      req.user.categoryPrefs = categoryPrefs;
    }
    await req.user.save();
    return res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("PREFERENCES UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update preferences" });
  }
});

export default router;
