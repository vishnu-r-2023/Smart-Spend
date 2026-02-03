import express from "express";
import multer from "multer";
import fs from "fs";
import Transaction from "../models/Transaction.js";
import authMiddleware from "../middleware/auth.js";
import { parseBankPDF } from "../utils/parseBankPDF.js";

const router = express.Router();

// Store files temporarily
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload-statement",
  authMiddleware,
  upload.single("statement"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      const ext = file.originalname.split(".").pop().toLowerCase();

      let parsedTransactions = [];

      if (ext === "pdf") {
        parsedTransactions = await parseBankPDF(file.path);
      } else {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "Only PDF supported" });
      }

      if (!parsedTransactions || parsedTransactions.length === 0) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "No transactions parsed" });
      }

      const userId = req.user._id;
      const withOwner = parsedTransactions.map((tx) => ({
        ...tx,
        userId,
        source: "upload"
      }));

      const inserted = await Transaction.insertMany(withOwner, {
        ordered: false, // continues even if duplicates exist
      });

      // Clean temp file
      fs.unlinkSync(file.path);

      return res.json({
        success: true,
        insertedCount: inserted.length,
        totalUploaded: parsedTransactions.length,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      // Always clean temp file
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: "Upload failed",
        error: err.message,
      });
    }
  }
);

export default router;
