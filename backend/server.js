import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import transactionRoutes from "./routes/transactions.js";
import authRoutes from "./routes/auth.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"));

app.use("/api", uploadRoutes);
app.use("/api", authRoutes);
app.use("/api", transactionRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
