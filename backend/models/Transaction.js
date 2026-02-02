import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: String,
  description: String,
  amount: Number,
  category: String,
  balance: Number
}, { timestamps: true });


const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
