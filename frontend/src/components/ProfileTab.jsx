import React from "react";
import {
  LogOut,
  User,
  Settings,
  Shield,
  Bell,
  Key,
  Tags,
  Camera,
  CreditCard,
  Plus
} from "lucide-react";

const ProfileTab = ({
  displayProfile,
  avatarInitial,
  formatDateDisplay,
  profileSections,
  profileSection,
  setProfileSection,
  setProfileNotice,
  setAccountNotice,
  setSecurityNotice,
  setPrefsNotice,
  handleLogout,
  profileLoading,
  profileNotice,
  profileForm,
  setProfileForm,
  fetchProfile,
  authToken,
  handleProfileSave,
  profileSaving,
  accountNotice,
  emailForm,
  setEmailForm,
  handleEmailSave,
  emailSaving,
  passwordForm,
  setPasswordForm,
  handlePasswordSave,
  passwordSaving,
  notificationForm,
  setNotificationForm,
  handleNotificationsSave,
  notificationsSaving,
  securityNotice,
  handleLogoutAll,
  logoutAllLoading,
  openAccountModal,
  linkNotice,
  linkedAccounts,
  getBankInitials,
  handleUnlinkAccount,
  unlinkingId,
  prefsNotice,
  preferenceForm,
  setPreferenceForm,
  currencyOptions,
  categoryOptions,
  handlePreferencesSave,
  prefsSaving
}) => {
  return (
    <>
      <div className="section-title">Account Dashboard</div>
      <div className="profile-shell">
        <aside className="profile-sidebar">
          <div className="profile-card profile-summary">
            <div className="profile-avatar">
              {displayProfile.avatarUrl ? (
                <img src={displayProfile.avatarUrl} alt={displayProfile.name || "Profile"} />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="profile-meta">
              <h3>{displayProfile.name || "User"}</h3>
              <p>{displayProfile.email || "user@smartspend.ai"}</p>
              <p>Joined {formatDateDisplay(displayProfile.createdAt)}</p>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-nav">
              {profileSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className={`profile-tab ${profileSection === section.id ? "active" : ""}`}
                    onClick={() => {
                      setProfileSection(section.id);
                      setProfileNotice(null);
                      setAccountNotice(null);
                      setSecurityNotice(null);
                      setPrefsNotice(null);
                    }}
                  >
                    <Icon size={16} />
                    {section.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="profile-card">
            <button className="btn btn-secondary" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <section className="profile-content">
          {profileSection === "overview" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="profile-section-title">
                  <User size={16} />
                  Profile Summary
                </div>
                {profileLoading && <div className="form-alert">Loading profile...</div>}
                <div className="profile-grid">
                  <div className="profile-field">
                    <span>Name</span>
                    <strong>{displayProfile.name || "--"}</strong>
                  </div>
                  <div className="profile-field">
                    <span>Email</span>
                    <strong>{displayProfile.email || "--"}</strong>
                  </div>
                  <div className="profile-field">
                    <span>Default Currency</span>
                    <strong>{displayProfile.currency || "INR"}</strong>
                  </div>
                  <div className="profile-field">
                    <span>Joined</span>
                    <strong>{formatDateDisplay(displayProfile.createdAt)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profileSection === "edit" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="profile-section-title">
                  <Camera size={16} />
                  Edit Profile
                </div>
                {profileNotice && (
                  <div className={`status-banner ${profileNotice.type}`}>{profileNotice.text}</div>
                )}
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Full name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Profile image URL</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="https://"
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => fetchProfile(authToken)}>
                    Reset
                  </button>
                  <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {profileSection === "account" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="profile-section-title">
                  <Settings size={16} />
                  Account Settings
                </div>
                {accountNotice && (
                  <div className={`status-banner ${accountNotice.type}`}>{accountNotice.text}</div>
                )}
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Update email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Current password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="action-buttons action-buttons-spaced">
                  <button className="btn btn-primary" onClick={handleEmailSave} disabled={emailSaving}>
                    {emailSaving ? "Updating..." : "Update Email"}
                  </button>
                </div>

                <div className="profile-section-title">
                  <Key size={16} />
                  Change password
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Current password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">New password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Confirm new password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="action-buttons action-buttons-spaced">
                  <button className="btn btn-primary" onClick={handlePasswordSave} disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>

                <div className="profile-section-title">
                  <Bell size={16} />
                  Notifications
                </div>
                <div className="toggle-grid">
                  <div className="toggle-row">
                    <span>Weekly summary emails</span>
                    <div
                      className={`toggle ${notificationForm.weeklySummary ? "active" : ""}`}
                      onClick={() =>
                        setNotificationForm({
                          ...notificationForm,
                          weeklySummary: !notificationForm.weeklySummary
                        })
                      }
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Budget alerts</span>
                    <div
                      className={`toggle ${notificationForm.budgetAlerts ? "active" : ""}`}
                      onClick={() =>
                        setNotificationForm({
                          ...notificationForm,
                          budgetAlerts: !notificationForm.budgetAlerts
                        })
                      }
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Product updates</span>
                    <div
                      className={`toggle ${notificationForm.productUpdates ? "active" : ""}`}
                      onClick={() =>
                        setNotificationForm({
                          ...notificationForm,
                          productUpdates: !notificationForm.productUpdates
                        })
                      }
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleNotificationsSave}
                    disabled={notificationsSaving}
                  >
                    {notificationsSaving ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {profileSection === "security" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="profile-section-title">
                  <Shield size={16} />
                  Security Settings
                </div>
                {securityNotice && (
                  <div className={`status-banner ${securityNotice.type}`}>{securityNotice.text}</div>
                )}
                <div className="profile-grid profile-grid-spaced">
                  <div className="profile-field">
                    <span>Last login</span>
                    <strong>{formatDateDisplay(displayProfile.lastLoginAt)}</strong>
                  </div>
                  <div className="profile-field">
                    <span>Last login IP</span>
                    <strong>{displayProfile.lastLoginIp || "--"}</strong>
                  </div>
                  <div className="profile-field">
                    <span>Active session</span>
                    <strong>Token-based</strong>
                  </div>
                  <div className="profile-field">
                    <span>Security status</span>
                    <strong>Protected</strong>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary btn-danger-text"
                    onClick={handleLogoutAll}
                    disabled={logoutAllLoading}
                  >
                    {logoutAllLoading ? "Logging out..." : "Logout from all devices"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {profileSection === "aggregation" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="accounts-header">
                  <div className="profile-section-title">
                    <CreditCard size={16} />
                    Linked Accounts
                  </div>
                  <button className="btn btn-primary btn-compact" onClick={openAccountModal}>
                    <Plus size={14} />
                    Link Account
                  </button>
                </div>
                <div className="demo-note">
                  Demo only — no real bank credentials required.
                </div>

                {linkNotice && (
                  <div className={`status-banner ${linkNotice.type}`}>{linkNotice.text}</div>
                )}

                {linkedAccounts.length === 0 ? (
                  <div className="form-alert">
                    No linked accounts yet. Add a demo account to showcase aggregation.
                  </div>
                ) : (
                  <div className="accounts-grid">
                    {linkedAccounts.map((account) => (
                      <div key={account.id} className="account-card">
                        <div className="account-left">
                          <div className={`bank-badge bank-tone-${account.tone}`}>
                            {getBankInitials(account.bankName)}
                          </div>
                          <div className="account-meta">
                            <h4>{account.bankName}</h4>
                            <p>
                              {account.accountType} • {account.maskedNumber}
                            </p>
                          </div>
                        </div>
                        <div className="account-actions">
                          {account.demo && <span className="demo-pill">Demo Account</span>}
                          <button
                            className="unlink-btn"
                            onClick={() => handleUnlinkAccount(account.id)}
                            disabled={unlinkingId === account.id}
                            title="Unlink demo account"
                          >
                            {unlinkingId === account.id ? "Removing..." : "Unlink"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {profileSection === "preferences" && (
            <div className="profile-panel">
              <div className="profile-card">
                <div className="profile-section-title">
                  <Tags size={16} />
                  Data & Preferences
                </div>
                {prefsNotice && (
                  <div className={`status-banner ${prefsNotice.type}`}>{prefsNotice.text}</div>
                )}
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Default currency</label>
                    <select
                      className="form-select"
                      value={preferenceForm.currency}
                      onChange={(e) =>
                        setPreferenceForm({ ...preferenceForm, currency: e.target.value })
                      }
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Preferred categories</label>
                    <div className="pref-chips">
                      {categoryOptions.map((cat) => {
                        const active = preferenceForm.categoryPrefs.includes(cat);
                        return (
                          <div
                            key={cat}
                            className={`pref-chip ${active ? "active" : ""}`}
                            onClick={() => {
                              const next = active
                                ? preferenceForm.categoryPrefs.filter((item) => item !== cat)
                                : [...preferenceForm.categoryPrefs, cat];
                              setPreferenceForm({ ...preferenceForm, categoryPrefs: next });
                            }}
                          >
                            {cat}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={handlePreferencesSave} disabled={prefsSaving}>
                    {prefsSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ProfileTab;
