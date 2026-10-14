import express from "express";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";
import { buildFinancialSummary, getRecommendationPayload } from "../services/financialAnalytics.js";

const router = express.Router();
const PERIODS = new Set(["month", "quarter", "year"]);
const loadSummary = async (req, res) => {
  const period = String(req.query.period || "month").toLowerCase();
  if (!PERIODS.has(period)) return res.status(400).json({ message: "Period must be month, quarter, or year" });
  const transactions = await Transaction.find({ userId: req.user._id }).select("date description amount category _id").lean();
  const summary = buildFinancialSummary({ transactions, period });
  summary.currency = req.user.currency || "INR";
  return summary;
};
router.get("/analytics/summary", authMiddleware, async (req, res) => {
  try {
    const summary = await loadSummary(req, res);
    if (!summary || res.headersSent) return;
    return res.json(summary);
  } catch (error) {
    console.error("ANALYTICS SUMMARY ERROR:", error);
    return res.status(500).json({ message: "Failed to calculate analytics" });
  }
});
router.get("/analytics/recommendations", authMiddleware, async (req, res) => {
  try {
    const summary = await loadSummary(req, res);
    if (!summary || res.headersSent) return;
    return res.json(getRecommendationPayload(summary));
  } catch (error) {
    console.error("ANALYTICS RECOMMENDATIONS ERROR:", error);
    return res.status(500).json({ message: "Failed to calculate recommendations" });
  }
});
export default router;
