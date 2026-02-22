import React from "react";

const SmsImportButton = ({ onClick, loading = false, disabled = false }) => {
  return (
    <button
      type="button"
      className="btn btn-secondary sms-import-btn"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? "Importing SMS..." : "Import from SMS"}
    </button>
  );
};

export default SmsImportButton;
