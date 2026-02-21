import React from "react";

const AccountModal = ({
  showAccountModal,
  closeAccountModal,
  linkNotice,
  bankOptions,
  selectedBank,
  setSelectedBank,
  getBankInitials,
  accountType,
  setAccountType,
  accountTypes,
  linkingAccount,
  handleLinkAccount
}) => {
  if (!showAccountModal) return null;

  return (
    <div className="entry-modal" onClick={closeAccountModal}>
      <div className="entry-content account-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="entry-header">Link Bank Account</h2>
        <div className="entry-subtitle">
          Demo account aggregation — no real credentials required.
        </div>

        {linkNotice?.type === "error" && (
          <div className="form-alert error">{linkNotice.text}</div>
        )}

        <div className="bank-grid">
          {bankOptions.map((bank) => (
            <div
              key={bank.id}
              className={`bank-option ${selectedBank?.id === bank.id ? "active" : ""}`}
              onClick={() => setSelectedBank(bank)}
            >
              <div className={`bank-badge bank-tone-${bank.tone}`}>
                {getBankInitials(bank.name)}
              </div>
              <div className="bank-name">{bank.name}</div>
            </div>
          ))}
        </div>

        <div className="form-field">
          <label className="form-label">Account type</label>
          <select
            className="form-select"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="action-buttons account-modal-actions">
          <button className="btn btn-secondary" onClick={closeAccountModal} disabled={linkingAccount}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleLinkAccount}
            disabled={linkingAccount || !selectedBank}
          >
            {linkingAccount ? "Linking..." : "Link Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
