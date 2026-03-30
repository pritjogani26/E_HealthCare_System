import React, { useState, useEffect } from "react";
import { requestPasswordReset, verifyPasswordResetToken, resetPassword, handleApiError } from "../services/api";



interface IconProps extends React.SVGProps<SVGSVGElement> {
  d: string;
  size?: number;
}

type IconFC = React.FC<{ size?: number; style?: React.CSSProperties }>;

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
}

interface ToastProps {
  toasts: ToastItem[];
}

interface FieldErrorProps {
  msg: string;
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: IconFC;
  rightEl?: React.ReactNode;
  error?: string;
}

interface BtnProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  loading?: boolean;
  children: React.ReactNode;
}

interface CardProps {
  children: React.ReactNode;
}

interface CardHeaderProps {
  icon: IconFC;
  title: string;
  sub: string;
  color?: string;
}

interface StepDotsProps {
  step: number;
}

interface ToastHook {
  toasts: ToastItem[];
  success: (m: string) => void;
  error: (m: string) => void;
  warning: (m: string) => void;
}

interface Step1Props {
  onSent: (email: string) => void;
  toast: ToastHook;
}

interface Step2Props {
  email: string;
  onSimulateClick: () => void;
  toast: ToastHook;
}

interface Step3Props {
  token: string;
  onDone: () => void;
  toast: ToastHook;
}

// ─── SVG icon helpers ─────────────────────────────────────────────────────────

const Icon: React.FC<IconProps> = ({ d, size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d={d} />
  </svg>
);

const MailIcon: IconFC      = (p) => <Icon {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />;
const LockIcon: IconFC      = (p) => <Icon {...p} d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />;
const EyeIcon: IconFC       = (p) => <Icon {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm10 0a2 2 0 104 0 2 2 0 00-4 0" />;
const EyeOffIcon: IconFC    = (p) => <Icon {...p} d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />;
const AlertIcon: IconFC     = (p) => <Icon {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />;
const CheckCircle: IconFC   = (p) => <Icon {...p} d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />;
const ArrowLeft: IconFC     = (p) => <Icon {...p} d="M19 12H5M12 5l-7 7 7 7" />;
const InboxIcon: IconFC     = (p) => <Icon {...p} d="M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />;
const ShieldIcon: IconFC    = (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<ToastProps> = ({ toasts }) => (
  <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          borderRadius: 12, fontSize: 14, fontWeight: 500, maxWidth: 360,
          boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)",
          animation: "slideIn .25s ease",
          background:  t.type === "error" ? "#fff1f2" : t.type === "success" ? "#f0fdf4" : "#fffbeb",
          color:       t.type === "error" ? "#9f1239" : t.type === "success" ? "#166534" : "#92400e",
          border: `1px solid ${t.type === "error" ? "#fecdd3" : t.type === "success" ? "#bbf7d0" : "#fde68a"}`,
        }}
      >
        {t.type === "success"
          ? <CheckCircle size={15} style={{ flexShrink: 0 }} />
          : <AlertIcon   size={15} style={{ flexShrink: 0 }} />}
        {t.message}
      </div>
    ))}
    <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
  </div>
);

function useToast(): ToastHook {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = (message: string, type: ToastItem["type"] = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  return {
    toasts,
    success: (m: string) => add(m, "success"),
    error:   (m: string) => add(m, "error"),
    warning: (m: string) => add(m, "warning"),
  };
}

const FieldError: React.FC<FieldErrorProps> = ({ msg }) =>
  !msg ? null : (
    <p style={{ marginTop: 4, fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
      <AlertIcon size={12} style={{ flexShrink: 0 }} /> {msg}
    </p>
  );

// ─── Input ────────────────────────────────────────────────────────────────────

const Input: React.FC<InputProps> = ({ icon: IconComp, rightEl, error, onFocus, onBlur, style, ...props }) => (
  <div style={{ position: "relative" }}>
    {IconComp && (
      <IconComp
        size={16}
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}
      />
    )}
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        paddingLeft:  IconComp ? 38 : 12,
        paddingRight: rightEl  ? 42 : 12,
        paddingTop: 10,
        paddingBottom: 10,
        background: "#f8fafc",
        border: `1px solid ${error ? "#f87171" : "#e2e8f0"}`,
        borderRadius: 8,
        fontSize: 14,
        outline: "none",
        transition: "border-color .15s, box-shadow .15s",
        fontFamily: "inherit",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#10b981";
        e.currentTarget.style.boxShadow  = "0 0 0 3px rgba(16,185,129,.12)";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? "#f87171" : "#e2e8f0";
        e.currentTarget.style.boxShadow  = "none";
        onBlur?.(e);
      }}
    />
    {rightEl && (
      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8" }}>
        {rightEl}
      </div>
    )}
  </div>
);

// ─── Primary button ───────────────────────────────────────────────────────────

const Btn: React.FC<BtnProps> = ({ loading, children, disabled, ...props }) => (
  <button
    {...props}
    disabled={disabled}
    style={{
      width: "100%", padding: "12px 0", background: "#0f172a", color: "#fff",
      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      transition: "background .15s",
      fontFamily: "inherit",
    }}
    onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#1e293b"; }}
    onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#0f172a"; }}
  >
    {loading ? (
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{
          width: 14, height: 14,
          border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff",
          borderRadius: "50%", display: "inline-block",
          animation: "spin .7s linear infinite",
        }} />
        {children}
      </span>
    ) : children}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </button>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card: React.FC<CardProps> = ({ children }) => (
  <div style={{
    width: "100%", maxWidth: 440, background: "#fff",
    borderRadius: 20,
    boxShadow: "0 20px 60px -12px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
    overflow: "hidden",
  }}>
    {children}
  </div>
);

// ─── Card header ─────────────────────────────────────────────────────────────

const CardHeader: React.FC<CardHeaderProps> = ({ icon: IconComp, title, sub, color = "emerald" }) => (
  <div style={{
    padding: "28px 28px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: color === "slate" ? "#f1f5f9" : "#ecfdf5",
      display: "flex", alignItems: "center", justifyContent: "center",
      color:   color === "slate" ? "#475569" : "#059669",
    }}>
      <IconComp size={22} />
    </div>
    <div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{title}</h2>
      <p  style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{sub}</p>
    </div>
  </div>
);

// ─── Step dots ────────────────────────────────────────────────────────────────

const StepDots: React.FC<StepDotsProps> = ({ step }) => (
  <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "16px 0 0" }}>
    {[1, 2, 3].map((n) => (
      <div key={n} style={{
        height: 4, width: step === n ? 24 : 8, borderRadius: 4, transition: "all .3s",
        background: step >= n ? "#0f172a" : "#e2e8f0",
      }} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Request reset link
// ═══════════════════════════════════════════════════════════════════════════════

const Step1: React.FC<Step1Props> = ({ onSent, toast }) => {
  const [email, setEmail]     = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string>("");

  const validate = (): string => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    return "";
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      onSent(email);
    } catch (err: any) {
      toast.error(handleApiError(err) || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={LockIcon} title="Forgot your password?" sub="Enter your account email and we'll send you a reset link." />
      <div style={{ padding: "24px 28px 28px" }}>
        <StepDots step={1} />
        <form onSubmit={submit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }} noValidate>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Email address <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(""); }}
              error={error}
              autoFocus
            />
            <FieldError msg={error} />
          </div>

          <Btn type="submit" loading={loading} disabled={loading}>
            {loading ? "Sending link…" : "Send reset link"}
          </Btn>

          <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", margin: 0 }}>
            {" "}
            <a href="/login" style={{ color: "#059669", fontWeight: 600, textDecoration: "none" }}>Back to login</a>
          </p>
        </form>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Check email screen
// ═══════════════════════════════════════════════════════════════════════════════

const Step2: React.FC<Step2Props> = ({ email, onSimulateClick, toast }) => {
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown]   = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await requestPasswordReset(email);
      toast.success("Reset link resent!");
      setCooldown(60);
    } catch (err: any) {
      toast.error(handleApiError(err) || "Could not resend. Try again shortly.");
    } finally {
      setResending(false);
    }
  };

  // FIX: curly quotes inside a JSX string must use &ldquo; / &rdquo; or plain apostrophes
  const steps: [string, string][] = [
    ["1.", "Open the email from E-Healthcare"],
    ["2.", 'Click the "Reset Password" button'],
    ["3.", "You'll be directed to set a new password"],
  ];

  return (
    <Card>
      <CardHeader
        icon={InboxIcon}
        title="Check your inbox"
        sub={`We've sent a password reset link to ${email}`}
        color="slate"
      />
      <div style={{ padding: "24px 28px 28px" }}>
        <StepDots step={2} />
        <div style={{
          marginTop: 20, padding: 16, background: "#f8fafc",
          borderRadius: 10, border: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {steps.map(([n, text]) => (
            <div key={n} style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569" }}>
              <span style={{ fontWeight: 700, color: "#0f172a", minWidth: 18 }}>{n}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>

          <button
            onClick={resend}
            disabled={resending || cooldown > 0}
            style={{
              width: "100%", padding: "10px 0", background: "transparent",
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
              fontWeight: 500, color: "#475569",
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              opacity: cooldown > 0 ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {resending ? "Resending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
          Link expires in 24 hours · Check spam if not received
        </p>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Set new password (opened via ?token=… in the URL)
// ═══════════════════════════════════════════════════════════════════════════════

interface PasswordFormValues {
  password: string;
  confirm: string;
}

const Step3: React.FC<Step3Props> = ({ token, onDone, toast }) => {
  const [vals, setVals]         = useState<PasswordFormValues>({ password: "", confirm: "" });
  const [show, setShow]         = useState<{ password: boolean; confirm: boolean }>({ password: false, confirm: false });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      try {
        await verifyPasswordResetToken(token);
        setVerifying(false);
      } catch (err: any) {
        toast.error(handleApiError(err) || "Reset link is invalid or expired.");
        setVerifying(false); // So we can at least show an empty form or error message
      }
    };
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (key: keyof PasswordFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setVals((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const rules = [
    { label: "8+ characters",    ok: vals.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(vals.password) },
    { label: "Number",           ok: /\d/.test(vals.password) },
  ];
  const strength = rules.filter((r) => r.ok).length;
  const strengthLabel = (["", "Weak", "Fair", "Strong"] as const)[strength];
  const strengthColor = ["#e2e8f0", "#ef4444", "#f59e0b", "#10b981"][strength];

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!vals.password)              e.password = "Password is required.";
    else if (vals.password.length < 8) e.password = "Minimum 8 characters.";
    if (!vals.confirm)               e.confirm  = "Please confirm your password.";
    else if (vals.confirm !== vals.password) e.confirm = "Passwords do not match.";
    return e;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await resetPassword(token, vals.password);
      toast.success("Password reset successfully!");
      onDone();
    } catch (err: any) {
      toast.error(handleApiError(err) || "Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Card>
        <div style={{ padding: 48, textAlign: "center" }}>
          <div style={{
            width: 36, height: 36,
            border: "3px solid #e2e8f0", borderTopColor: "#0f172a",
            borderRadius: "50%", animation: "spin .7s linear infinite",
            margin: "0 auto 16px", display: "inline-block",
          }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Verifying your reset link…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader icon={ShieldIcon} title="Set new password" sub="Choose a strong password you haven't used before." />
      <div style={{ padding: "24px 28px 28px" }}>
        <StepDots step={3} />
        <form onSubmit={submit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }} noValidate>

          {/* New password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              New Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Input
              type={show.password ? "text" : "password"}
              icon={LockIcon}
              placeholder="Min. 8 characters"
              value={vals.password}
              onChange={handleChange("password")}
              error={errors.password}
              autoFocus
              rightEl={
                <span onClick={() => setShow((p) => ({ ...p, password: !p.password }))}>
                  {show.password ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </span>
              }
            />
            <FieldError msg={errors.password ?? ""} />

            {/* Strength meter */}
            {vals.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      flex: 1, height: 3, borderRadius: 4, transition: "background .3s",
                      background: n <= strength ? strengthColor : "#e2e8f0",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {rules.map((r) => (
                      <span key={r.label} style={{
                        fontSize: 11, color: r.ok ? "#059669" : "#94a3b8",
                        display: "flex", alignItems: "center", gap: 3,
                      }}>
                        <span>{r.ok ? "✓" : "○"}</span> {r.label}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Confirm Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Input
              type={show.confirm ? "text" : "password"}
              icon={LockIcon}
              placeholder="Repeat new password"
              value={vals.confirm}
              onChange={handleChange("confirm")}
              error={errors.confirm}
              rightEl={
                <span onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}>
                  {show.confirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </span>
              }
            />
            {vals.confirm && vals.confirm === vals.password && !errors.confirm && (
              <p style={{ marginTop: 4, fontSize: 12, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={12} /> Passwords match
              </p>
            )}
            <FieldError msg={errors.confirm ?? ""} />
          </div>

          <Btn type="submit" loading={loading} disabled={loading}>
            {loading ? "Updating password…" : "Update password"}
          </Btn>
        </form>
      </div>
    </Card>
  );
};


const StepSuccess: React.FC = () => (
  <Card>
    <div style={{ padding: "44px 28px", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "#ecfdf5",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", color: "#059669",
        boxShadow: "0 0 0 8px rgba(16,185,129,.08)",
      }}>
        <CheckCircle size={32} />
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
        Password updated!
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
        Your password has been changed successfully.<br />
        You can now sign in with your new password.
      </p>
      <a
        href="/login"
        style={{
          display: "block", padding: "12px 0", background: "#0f172a", color: "#fff",
          borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}
      >
        Go to login
      </a>
    </div>
  </Card>
);


const PasswordReset: React.FC = () => {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [step, setStep]   = useState<number>(token ? 3 : 1);
  const [email, setEmail] = useState<string>("");
  const toast = useToast();

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px 80px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <Toast toasts={toast.toasts} />

      {step === 1 && (
        <Step1
          toast={toast}
          onSent={(em: string) => { setEmail(em); setStep(2); }}
        />
      )}
      {step === 2 && (
        <Step2
          email={email || "user@example.com"}
          toast={toast}
          onSimulateClick={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          token={token}
          toast={toast}
          onDone={() => setStep(4)}
        />
      )}
      {step === 4 && <StepSuccess />}

      {step > 1 && step < 4 && (
        <button
          onClick={() => setStep(1)}
          style={{
            marginTop: 16, display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: "#64748b", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} /> Start over
        </button>
      )}
    </div>
  );
};

export default PasswordReset;