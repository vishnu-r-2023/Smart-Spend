import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

/**
 * GET all transactions (latest first)
 */
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

/**
 * DELETE transactions for a given month & year
 * Example: DELETE /transactions/month?month=2&year=2026
 */
// DELETE transactions by month & year
router.delete("/transactions", async (req, res) => {
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
      date: { $regex: regex }
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
