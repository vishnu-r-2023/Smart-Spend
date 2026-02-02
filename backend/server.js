import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";
import transactionRoutes from "./routes/transactions.js";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/smartspend")
  .then(() => console.log("MongoDB connected"));

app.use("/api", uploadRoutes);
app.use("/api", transactionRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
