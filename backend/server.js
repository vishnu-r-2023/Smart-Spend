import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import transactionRoutes from "./routes/transactions.js";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);
app.use("/api", uploadRoutes);
app.use("/api", authRoutes);
app.use("/api", transactionRoutes);
app.use("/api", analyticsRoutes);

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`Backend running on port ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed. Check MONGODB_URI, network access, and the Atlas IP access list.");
    console.error(error.message);
    process.exitCode = 1;
  });
