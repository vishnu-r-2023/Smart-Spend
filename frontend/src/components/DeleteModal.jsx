import React from "react";

const DeleteModal = ({
  showDeleteModal,
  closeDeleteModal,
  deleteTarget,
  deleteError,
  deleteProcessing,
  handleDeleteTransaction
}) => {
  if (!showDeleteModal) return null;

  return (
    <div className="confirm-modal" onClick={closeDeleteModal}>
      <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">Delete this transaction?</div>
        <div className="confirm-text">This action will remove it from your history and analytics.</div>

        <div className="confirm-details">
          <div><strong>{deleteTarget?.description || "Manual entry"}</strong></div>
          <div>
            {deleteTarget?.amount > 0 ? "+" : ""}₹{Math.abs(deleteTarget?.amount || 0).toLocaleString()} • {deleteTarget?.date || "--"}
          </div>
        </div>

        {deleteError && <div className="form-alert error">{deleteError}</div>}

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={closeDeleteModal} disabled={deleteProcessing}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleDeleteTransaction} disabled={deleteProcessing}>
            {deleteProcessing ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
