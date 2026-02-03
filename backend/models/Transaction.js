import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: String,
  description: String,
  amount: Number,
  category: String,
  paymentMethod: String,
  notes: String,
  source: { type: String, default: "upload" },
  balance: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
}, { timestamps: true });


const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
