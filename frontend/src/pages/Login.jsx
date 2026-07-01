import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { login, signup } from "../services/api";
import Footer from "../components/Footer";
import "./AuthPage.css";

const bgImg =
  "https://res.cloudinary.com/dgovvdud9/image/upload/v1781717956/bg-img-RSP_bk4k2x.jpg";

/* ── SVG Icons ─────────────────────────────────────────── */
const UserIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOpen = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

/* ── Floating-label input field ────────────────────────── */
const FloatingField = ({ type = "text", value, onChange, label, icon, eyeToggle, ...rest }) => {
  const hasValue = value && value.length > 0;

  return (
    <div className="auth-field-wrapper auth-slide-element">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={hasValue ? "auth-has-value" : ""}
        {...rest}
      />
      <label>{label}</label>
      {eyeToggle ? eyeToggle : (
        <span className="auth-field-icon">{icon}</span>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   AUTH PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */
const AuthPage = ({ defaultMode = "login" }) => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showError, showSuccess } = useToast();

  // "toggled" = showing Register panel; not toggled = showing Login panel
  const [isToggled, setIsToggled] = useState(defaultMode === "register");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Refs for forms
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);

  // Clear form state on panel switch
  const switchPanel = (toRegister) => {
    setIsToggled(toRegister);
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  /* ── Validation ──────────────────────────────────────── */
  const validateAuth = (isLogin) => {
    if (password.length < 6 || password.length > 12) {
      setError("Password must be between 6 and 12 characters");
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  /* ── Login Submit ────────────────────────────────────── */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (!validateAuth(true)) {
      setLoading(false);
      return;
    }

    try {
      const response = await login(email, password);
      authLogin(response.user, response.token);
      setSuccessMessage("Login successful! Redirecting...");
      setEmail("");
      setPassword("");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("FULL ERROR:", err);
      if (err.response) {
        setError(err.response.data?.message || "Authentication failed");
      } else if (err.request) {
        setError("Backend not reachable (check server)");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Register Submit ─────────────────────────────────── */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (!validateAuth(false)) {
      setLoading(false);
      return;
    }

    try {
      const response = await signup(name, email, password);
      authLogin(response.user, response.token);
      setSuccessMessage("Account created! Redirecting...");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("FULL ERROR:", err);
      if (err.response) {
        setError(err.response.data?.message || "Authentication failed");
      } else if (err.request) {
        setError("Backend not reachable (check server)");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
    <div
      className="auth-page"
      style={{
        backgroundImage: `url(${bgImg})`,
        padding: 0,
        justifyContent: "space-between",
      }}
    >
      {/* Dark overlay */}
      <div className="auth-overlay" />

      {/* Top spacer to balance the flex layout */}
      <div style={{ width: "100%", height: "60px" }}></div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", padding: "20px", zIndex: 1, flex: 1 }}>

      {/* Floating alerts */}
      <div className="auth-alerts">
        {successMessage && (
          <div className="auth-alert-success">✓ {successMessage}</div>
        )}
        {error && (
          <div className="auth-alert-error">⚠ {error}</div>
        )}
      </div>

      {/* ── Main Auth Card ─────────────────────────────── */}
      <div className={`auth-wrapper${isToggled ? " auth-toggled" : ""}`}>
        {/* Animated shapes */}
        <div className="auth-background-shape" />
        <div className="auth-secondary-shape" />

        {/* ── LOGIN PANEL (left) ───────────────────────── */}
        <div className="auth-credentials-panel auth-signin">
          <h2 className="auth-slide-element">Login</h2>
          <form onSubmit={handleLoginSubmit}>
            <FloatingField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              icon={<MailIcon />}
              required
              autoComplete="email"
              id="login-email"
            />

            <FloatingField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              minLength="6"
              maxLength="12"
              required
              autoComplete="current-password"
              id="login-password"
              eyeToggle={
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              }
            />

            <div className="auth-field-wrapper auth-slide-element" style={{ height: "auto", marginTop: 25 }}>
              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading && !isToggled ? "Loading..." : "Login"}
              </button>
            </div>

            <div className="auth-switch-link auth-slide-element">
              <p>
                Don't have an account?
                <br />
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPanel(true);
                  }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ── WELCOME SECTION (login side — right) ─────── */}
        <div className="auth-welcome-section auth-signin">
          <h2 className="auth-slide-element">WELCOME BACK!</h2>
        </div>

        {/* ── REGISTER PANEL (right) ───────────────────── */}
        <div className="auth-credentials-panel auth-signup">
          <h2 className="auth-slide-element">Register</h2>
          <form onSubmit={handleRegisterSubmit}>
            <FloatingField
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Full Name"
              icon={<UserIcon />}
              required
              autoComplete="name"
              id="register-name"
            />

            <FloatingField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              icon={<MailIcon />}
              required
              autoComplete="email"
              id="register-email"
            />

            <FloatingField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              minLength="6"
              maxLength="12"
              required
              autoComplete="new-password"
              id="register-password"
              eyeToggle={
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              }
            />

            <FloatingField
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm Password"
              minLength="6"
              maxLength="12"
              required
              autoComplete="new-password"
              id="register-confirm-password"
              eyeToggle={
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              }
            />

            <div className="auth-field-wrapper auth-slide-element" style={{ height: "auto", marginTop: 25 }}>
              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading && isToggled ? "Loading..." : "Register"}
              </button>
            </div>

            <div className="auth-switch-link auth-slide-element">
              <p>
                Already have an account?
                <br />
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchPanel(false);
                  }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ── WELCOME SECTION (register side — left) ───── */}
        <div className="auth-welcome-section auth-signup">
          <h2 className="auth-slide-element">Create Account</h2>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        <p>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
            RECIPE.IO
          </a>
        </p>
      </div>
      </div>

      <div style={{ width: "100%", zIndex: 2 }}>
        <Footer />
      </div>
    </div>
  );
};

export default AuthPage;
