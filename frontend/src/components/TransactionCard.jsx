import React from "react";
import { Trash2 } from "lucide-react";

const icons = {
  "Food & Dining": "🍔",
  Transportation: "🚗",
  Shopping: "🛍️",
  Subscriptions: "📺",
  Utilities: "💡",
  Savings: "💰",
  Health: "🏋️",
  Income: "💵",
  Others: "💳"
};

const TransactionCard = ({ tx, category, openDeleteModal, deleteProcessing }) => {
  return (
    <div key={tx._id || tx.id} className="transaction-item">
      <div className="transaction-left">
        <div
          className={`transaction-icon ${tx.amount > 0 ? "income" : "expense"}`}
        >
          {icons[category] || icons.Others}
        </div>
        <div className="transaction-details">
          <h4>{tx.description || "Manual entry"}</h4>
          <p>
            {tx.date}
            {tx.paymentMethod ? ` • ${tx.paymentMethod}` : ""}
          </p>
        </div>
      </div>
      <div className="transaction-right">
        <div className="transaction-amount">
          <div className={`amount ${tx.amount > 0 ? "positive" : "negative"}`}>
            {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
          </div>
          <div className="category">{category}</div>
        </div>
        <button
          className="delete-btn"
          title="Delete transaction"
          aria-label="Delete transaction"
          onClick={() => openDeleteModal(tx)}
          disabled={deleteProcessing}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
