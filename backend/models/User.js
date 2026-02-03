import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: Date,
    userAgent: String,
    ip: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    sessionToken: { type: String, index: true },
    sessionTokens: { type: [sessionSchema], default: [] },
    avatarUrl: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    categoryPrefs: { type: [String], default: [] },
    notifications: {
      weeklySummary: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true }
    },
    lastLoginAt: Date,
    lastLoginIp: String
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
