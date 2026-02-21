import React from "react";
import { Upload, Plus, Sun, Moon } from "lucide-react";

const AppHeader = ({
  displayProfile,
  user,
  setActiveTab,
  openEntryModal,
  setShowUploadModal,
  darkMode,
  setDarkMode
}) => {
  return (
    <div className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">SmartSpend</div>
          <div className="tagline">AI-Powered Finance Tracker</div>

          <div className="greeting">
            <div className="greeting-avatar">
              {displayProfile?.avatarUrl ? (
                <img src={displayProfile.avatarUrl} alt={displayProfile?.name || "Profile"} />
              ) : (
                displayProfile?.name ? displayProfile.name.trim().charAt(0).toUpperCase() : "U"
              )}
            </div>
            <div className="greeting-copy">
              <span className="greeting-text">Welcome back</span>
              <span className="greeting-name">
                <span className="greeting-username">{user?.name || "there"}</span>
                <button
                  type="button"
                  className="greeting-status"
                  title="Account active • Open profile"
                  onClick={() => setActiveTab("profile")}
                >
                  <span className="status-dot" />
                  <span className="badge-text">Active</span>
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="primary-action"
            onClick={openEntryModal}
            title="Add expense or income"
          >
            <Plus size={18} />
            <span>Add Entry</span>
          </button>

          <button
            className="icon-btn"
            onClick={() => setShowUploadModal(true)}
            title="Upload statement"
          >
            <Upload size={20} />
          </button>

          <button
            className="icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
