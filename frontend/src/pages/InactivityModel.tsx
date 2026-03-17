// frontend/src/pages/InactivityModel.tsx
// NOTE: filename is "InactivityModel" to match existing project convention.
// The exported component name is InactivityModal (named export).

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  KeyboardEvent,
} from "react";

// ReAuthError is imported from ../types (NOT from ../services/api).
// This breaks the chain:  App → InactivityModel → api.ts
// which caused AuthProvider to resolve as undefined at runtime.
import { verifyPasswordForReauth } from "../services/api";
import { ModalStep, ReAuthError } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;

// ─── Props ────────────────────────────────────────────────────────────────────

interface InactivityModalProps {
  /** Called after successful re-authentication — AuthContext restores forms. */
  onContinue: () => void;
  /** Called on logout click or after Session Timeout Warning many failed attempts. */
  onLogout: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const InactivityModal: React.FC<InactivityModalProps> = ({
  onContinue,
  onLogout,
}) => {
  const [step, setStep] = useState<ModalStep>("prompt");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS);

  const modalRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus password field when step changes to 'password'
  useEffect(() => {
    if (step === "password") {
      const id = setTimeout(() => passwordInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [step]);

  // Focus first button on mount
  useEffect(() => {
    const id = setTimeout(() => firstFocusableRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  // Focus trap — Tab cycles only inside the modal
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogoutClick = useCallback(async () => {
    setStep("loading");
    await onLogout();
  }, [onLogout]);

  const handleContinueClick = useCallback(() => {
    setStep("password");
  }, []);

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) return;

      setStep("loading");
      setErrorMessage("");

      try {
        await verifyPasswordForReauth(password);
        // Success — do NOT call setPassword here; component is about to unmount
        onContinue();
      } catch (err) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPassword("");

        if (err instanceof ReAuthError) {
          if (newAttempts >= MAX_ATTEMPTS) {
            setStep("locked");
            setTimeout(() => onLogout(), 2_500);
            return;
          }
          if (err.statusCode === 429) {
            setRemainingAttempts(MAX_ATTEMPTS - newAttempts);
            setErrorMessage("Too many attempts. Please wait 60 seconds and try again.");
            setStep("error");
            return;
          }
          if (err.statusCode === 403 || err.code === "account_locked") {
            setStep("locked");
            setTimeout(() => onLogout(), 2_500);
            return;
          }
          if (err.code === "token_expired") {
            setStep("locked");
            setTimeout(() => onLogout(), 1_500);
            return;
          }
          const remaining = MAX_ATTEMPTS - newAttempts;
          setRemainingAttempts(remaining);
          setErrorMessage(
            `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          );
          setStep("error");
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
          setStep("error");
        }
      }
    },
    [password, attempts, onContinue, onLogout]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={styles.backdrop}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-modal-title"
        aria-describedby="inactivity-modal-desc"
        style={styles.modal}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div style={styles.header}>
          {/* <span style={styles.icon} aria-hidden="true">⏱</span> */}
          <h2 id="inactivity-modal-title" style={styles.title}>
            Session Expried
          </h2>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {step === "prompt" && (
            <>
              <p id="inactivity-modal-desc" style={styles.description}>
                Your session has been inactive for <strong>15 minutes</strong>.
                Please confirm you are still here or log out.
              </p>
              <div style={styles.buttonRow}>
                <button
                  ref={firstFocusableRef}
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleContinueClick}
                >
                  Continue Session
                </button>
                <button
                  style={{ ...styles.button, ...styles.dangerButton }}
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {(step === "password" || step === "error") && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <p id="inactivity-modal-desc" style={styles.description}>
                Enter your password to resume your session.
              </p>
              {step === "error" && (
                <div role="alert" aria-live="assertive" style={styles.errorBanner}>
                  <span aria-hidden="true">⚠ </span>
                  {errorMessage}
                </div>
              )}
              <label htmlFor="reauth-password" style={styles.label}>
                Password
              </label>
              <input
                ref={passwordInputRef}
                id="reauth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={styles.input}
                aria-invalid={step === "error"}
              />
              {step === "error" && (
                <p style={styles.attemptsNote}>
                  {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining
                  before automatic logout.
                </p>
              )}
              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  disabled={!password}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Verify &amp; Resume
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.dangerButton }}
                  onClick={handleLogoutClick}
                >
                  Logout Instead
                </button>
              </div>
            </form>
          )}

          {step === "loading" && (
            <div style={styles.centered} aria-live="polite">
              <div style={styles.spinner} aria-hidden="true" />
              <p>Verifying…</p>
            </div>
          )}

          {step === "locked" && (
            <div role="alert" aria-live="assertive" style={styles.centered}>
              <p style={{ color: "#b91c1c", fontWeight: 600 }}>
                Too many failed attempts. You will be logged out now.
              </p>
            </div>
          )}
        </div>

        {/* Footer
        <div style={styles.footer}>
          <p style={styles.footerText}>
            🔒 Your session data is protected. Do not share your credentials.
          </p>
        </div> */}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    backgroundColor: "#fff", borderRadius: "12px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
    width: "100%", maxWidth: "440px", margin: "1rem", overflow: "hidden",
  },
  header: {
    backgroundColor: "#00008B", color: "#fff",
    padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem",
  },
  icon: { fontSize: "1.5rem" },
  title: { margin: 0, fontSize: "1.125rem", fontWeight: 700 },
  body: { padding: "1.5rem" },
  description: { color: "#374151", lineHeight: 1.6, marginBottom: "1.25rem" },
  label: {
    display: "block", fontWeight: 600, color: "#374151",
    marginBottom: "0.375rem", fontSize: "0.875rem",
  },
  input: {
    width: "100%", padding: "0.625rem 0.75rem",
    border: "1px solid #d1d5db", borderRadius: "6px",
    fontSize: "1rem", outline: "none",
    boxSizing: "border-box" as const, marginBottom: "0.75rem",
  },
  errorBanner: {
    backgroundColor: "#fef2f2", border: "1px solid #fca5a5",
    color: "#b91c1c", borderRadius: "6px",
    padding: "0.625rem 0.875rem", marginBottom: "1rem", fontSize: "0.875rem",
  },
  attemptsNote: {
    color: "#6b7280", fontSize: "0.75rem",
    marginTop: "-0.5rem", marginBottom: "0.75rem",
  },
  buttonRow: { display: "flex", gap: "0.75rem", marginTop: "0.5rem" },
  button: {
    flex: 1, padding: "0.625rem 1rem", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
  },
  primaryButton: { backgroundColor: "#00008B", color: "#fff" },
  dangerButton: {
    backgroundColor: "#f3f4f6", color: "#374151",
    border: "1px solid #d1d5db",
  },
  centered: { textAlign: "center" as const, padding: "1rem 0", color: "#374151" },
  spinner: {
    width: "36px", height: "36px",
    border: "3px solid #e5e7eb", borderTop: "3px solid #00008B",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
    margin: "0 auto 0.75rem",
  },
  footer: {
    borderTop: "1px solid #e5e7eb",
    padding: "0.875rem 1.5rem", backgroundColor: "#f9fafb",
  },
  footerText: { margin: 0, fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 },
};