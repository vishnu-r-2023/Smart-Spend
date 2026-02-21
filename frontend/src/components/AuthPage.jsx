import React from "react";
import { Moon, Sun } from "lucide-react";

const AuthPage = ({
  darkMode,
  setDarkMode,
  authStatus,
  authHighlights,
  authView,
  setAuthView,
  authError,
  handleAuthSubmit,
  authForm,
  setAuthForm,
  authProcessing,
  setAuthError
}) => {
  return (
    <div className="auth-page">
      <button
        className="icon-btn auth-toggle"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {authStatus === "checking" ? (
        <div className="auth-loading">
          <div className="auth-spinner" />
          Securing your session...
        </div>
      ) : (
        <div className="auth-shell">
          <div className="auth-hero">
            <div className="auth-orb orb-1" />
            <div className="auth-orb orb-2" />
            <div className="auth-orb orb-3" />
            <h2>SmartSpend, simplified.</h2>
            <p>
              Track expenses, visualize trends, and keep every manual entry in sync with
              your charts. Your dashboard stays clean, fast, and personalized.
            </p>
            <div className="auth-highlights">
              {authHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="auth-highlight">
                    <div className="auth-highlight-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="auth-highlight-title">{item.title}</div>
                      <div className="auth-highlight-desc">{item.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-brand">
              <div className="logo">SmartSpend</div>
            </div>
            <div className="auth-title">
              {authView === "login" ? "Welcome back" : "Create your account"}
            </div>
            <div className="auth-subtitle">
              {authView === "login"
                ? "Sign in to access your dashboard"
                : "Start tracking smarter today"}
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authView === "register" && (
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  autoComplete="name"
                  required
                />
              )}
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                autoComplete="email"
                required
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                autoComplete={authView === "login" ? "current-password" : "new-password"}
                required
              />

              <div className="auth-actions">
                <button className="btn btn-primary" type="submit" disabled={authProcessing}>
                  {authProcessing
                    ? "Please wait..."
                    : authView === "login"
                      ? "Sign In"
                      : "Create Account"}
                </button>
              </div>
            </form>

            <div className="auth-switch">
              {authView === "login" ? "New here?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setAuthView(authView === "login" ? "register" : "login");
                  setAuthError("");
                }}
              >
                {authView === "login" ? "Create one" : "Back to login"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
