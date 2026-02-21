import React from "react";
import { Calendar, Plus } from "lucide-react";
import CategoryFilters from "./CategoryFilters";
import TransactionList from "./TransactionList";

const TransactionsTab = ({
  openBulkDeleteModal,
  transactions,
  openEntryModal,
  categoryFilters,
  selectedCategory,
  setSelectedCategory,
  deleteNotice,
  bulkDeleteNotice,
  sortedTransactions,
  resolveCategory,
  openDeleteModal,
  deleteProcessing
}) => {
  return (
    <>
      <div className="section-header">
        <div className="section-title">
          <Calendar size={26} />
          Transaction History
        </div>
        <div className="section-actions">
          <button
            className="btn btn-secondary btn-compact btn-danger"
            onClick={openBulkDeleteModal}
            disabled={transactions.length === 0}
            title="Delete all transactions"
          >
            Delete All
          </button>
          <button className="btn btn-primary btn-compact" onClick={openEntryModal}>
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      </div>

      <CategoryFilters
        categoryFilters={categoryFilters}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {(deleteNotice || bulkDeleteNotice) && (
        <div className={`status-banner ${(bulkDeleteNotice || deleteNotice)?.type || "success"}`}>
          {(bulkDeleteNotice || deleteNotice)?.text}
        </div>
      )}

      <div className="chart-card">
        <TransactionList
          sortedTransactions={sortedTransactions}
          selectedCategory={selectedCategory}
          resolveCategory={resolveCategory}
          openDeleteModal={openDeleteModal}
          deleteProcessing={deleteProcessing}
        />
      </div>
    </>
  );
};

export default TransactionsTab;
