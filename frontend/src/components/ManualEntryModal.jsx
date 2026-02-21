import React from "react";

const ManualEntryModal = ({
  showEntryModal,
  closeEntryModal,
  entryErrors,
  entrySuccess,
  handleManualSubmit,
  entryForm,
  setEntryForm,
  categoryOptions,
  paymentOptions,
  entrySubmitting
}) => {
  if (!showEntryModal) return null;

  return (
    <div className="entry-modal" onClick={closeEntryModal}>
      <div className="entry-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="entry-header">Add Expense / Spending</h2>
        <div className="entry-subtitle">Log a manual entry and update your insights instantly.</div>

        {entryErrors.form && <div className="form-alert error">{entryErrors.form}</div>}
        {entrySuccess && <div className="form-alert success">{entrySuccess}</div>}

        <form onSubmit={handleManualSubmit}>
          <div className="form-grid">
            <div className="form-field full">
              <label className="form-label">Entry type</label>
              <div className="pill-group">
                <button
                  type="button"
                  className={`pill ${entryForm.type === "expense" ? "active" : ""}`}
                  onClick={() =>
                    setEntryForm({
                      ...entryForm,
                      type: "expense",
                      category:
                        entryForm.category === "Income" ? "Food & Dining" : entryForm.category
                    })
                  }
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`pill ${entryForm.type === "income" ? "active" : ""}`}
                  onClick={() => setEntryForm({ ...entryForm, type: "income", category: "Income" })}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Amount</label>
              <div className="input-with-prefix">
                <span className="input-prefix">₹</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              {entryErrors.amount && <div className="form-error">{entryErrors.amount}</div>}
            </div>

            <div className="form-field">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={entryForm.date}
                onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                required
              />
              {entryErrors.date && <div className="form-error">{entryErrors.date}</div>}
            </div>

            <div className="form-field">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={entryForm.category}
                onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                required
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {entryErrors.category && <div className="form-error">{entryErrors.category}</div>}
            </div>

            <div className="form-field">
              <label className="form-label">Payment method</label>
              <select
                className="form-select"
                value={entryForm.paymentMethod}
                onChange={(e) => setEntryForm({ ...entryForm, paymentMethod: e.target.value })}
                required
              >
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {entryErrors.paymentMethod && <div className="form-error">{entryErrors.paymentMethod}</div>}
            </div>

            <div className="form-field full">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                placeholder="Add a quick description or reference"
              />
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" type="button" onClick={closeEntryModal}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={entrySubmitting}>
              {entrySubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
