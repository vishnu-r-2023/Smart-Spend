import React from "react";

const BulkDeleteModal = ({
  showBulkDeleteModal,
  closeBulkDeleteModal,
  bulkDeleteInput,
  setBulkDeleteInput,
  bulkDeleteProcessing,
  bulkDeleteError,
  handleBulkDelete
}) => {
  if (!showBulkDeleteModal) return null;

  return (
    <div className="confirm-modal" onClick={closeBulkDeleteModal}>
      <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">Delete all transactions?</div>
        <div className="confirm-text">
          This will permanently remove all transactions for your account. This cannot be undone.
        </div>

        <div className="confirm-details">
          <div><strong>Type DELETE to confirm</strong></div>
          <div>All summaries and charts will reset.</div>
        </div>

        <input
          className="confirm-input"
          placeholder="Type DELETE"
          value={bulkDeleteInput}
          onChange={(e) => setBulkDeleteInput(e.target.value)}
          disabled={bulkDeleteProcessing}
        />

        {bulkDeleteError && <div className="form-alert error">{bulkDeleteError}</div>}

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={closeBulkDeleteModal} disabled={bulkDeleteProcessing}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-danger"
            onClick={handleBulkDelete}
            disabled={bulkDeleteProcessing || bulkDeleteInput.trim() !== "DELETE"}
          >
            {bulkDeleteProcessing ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;
