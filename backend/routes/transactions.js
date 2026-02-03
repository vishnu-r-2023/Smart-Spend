import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

/**
 * GET all transactions (latest first)
 */
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

/**
 * POST manual transaction
 */
router.post("/transactions", authMiddleware, async (req, res) => {
  try {
    const { amount, category, date, paymentMethod, notes, description } = req.body || {};

    if (!amount || !category || !date || !paymentMethod) {
      return res.status(400).json({ message: "Amount, category, date, and payment method are required" });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }

    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({ message: "Date must be in DD/MM/YYYY format" });
    }

    const transaction = await Transaction.create({
      date,
      description: (description || notes || `${category} entry`).trim(),
      amount: parsedAmount,
      category,
      paymentMethod,
      notes: notes || "",
      source: "manual",
      userId: req.user._id
    });

    return res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

/**
 * DELETE all transactions for current user
 */
router.delete("/transactions/all", authMiddleware, async (req, res) => {
  try {
    const result = await Transaction.deleteMany({ userId: req.user._id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete transactions" });
  }
});

/**
 * DELETE a single transaction (user scoped)
 */
router.delete("/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.json({ success: true, id: deleted._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

/**
 * DELETE transactions for a given month & year
 * Example: DELETE /transactions/month?month=2&year=2026
 */
// DELETE transactions by month & year
router.delete("/transactions", authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required"
      });
    }

    // Ensure month is 2-digit (02 instead of 2)
    const monthStr = month.toString().padStart(2, "0");

    // Regex: matches DD/MM/YYYY
    const regex = new RegExp(`^\\d{2}/${monthStr}/${year}$`);

    const result = await Transaction.deleteMany({
      date: { $regex: regex },
      userId: req.user._id
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete transactions"
    });
  }
});


export default router;
