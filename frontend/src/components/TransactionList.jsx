import React from "react";
import TransactionCard from "./TransactionCard";

const TransactionList = ({
  sortedTransactions,
  selectedCategory,
  resolveCategory,
  openDeleteModal,
  deleteProcessing
}) => {
  return (
    <div className="transaction-list">
      {sortedTransactions
        .filter((t) => selectedCategory === "All" || resolveCategory(t) === selectedCategory)
        .map((tx) => {
          const category = resolveCategory(tx);
          return (
            <TransactionCard
              key={tx._id || tx.id}
              tx={tx}
              category={category}
              openDeleteModal={openDeleteModal}
              deleteProcessing={deleteProcessing}
            />
          );
        })}
    </div>
  );
};

export default TransactionList;
