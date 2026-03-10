// frontend/src/components/registration/AccountFields.tsx
import React from "react";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface AccountFieldsProps {
  // Values
  email: string;
  password: string;
  passwordConfirm: string;
  // Formik handlers — passed directly so onChange/onBlur wire to formik
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  // Error / touched state from formik (each value may be undefined if untouched)
  errors: {
    email?: string;
    password?: string;
    password_confirm?: string;
  };
  touched: {
    email?: boolean;
    password?: boolean;
    password_confirm?: boolean;
  };
  // Extra
  readOnlyEmail?: boolean;
}

/** Returns border colour based on touched+error state */
function fieldCls(
  name: "email" | "password" | "password_confirm",
  errors: AccountFieldsProps["errors"],
  touched: AccountFieldsProps["touched"]
) {
  if (!touched[name]) return "border-slate-200";
  return errors[name] ? "border-red-400" : "border-emerald-400";
}

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  ) : null;

const FieldSuccess: React.FC<{
  name: "email" | "password" | "password_confirm";
  errors: AccountFieldsProps["errors"];
  touched: AccountFieldsProps["touched"];
  label: string;
}> = ({ name, errors, touched, label }) =>
    touched[name] && !errors[name] ? (
      <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> {label}
      </p>
    ) : null;

export const AccountFields: React.FC<AccountFieldsProps> = ({
  email,
  password,
  passwordConfirm,
  onChange,
  onBlur,
  errors,
  touched,
  readOnlyEmail = false,
}) => {
  return (
    <>
      {/* ── Email ─────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="reg-email"
            name="email"
            type="email"
            value={email}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnlyEmail}
            autoComplete="email"
            placeholder="email@example.com"
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${fieldCls(
              "email",
              errors,
              touched
            )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${readOnlyEmail ? "cursor-not-allowed opacity-70" : ""
              }`}
          />
        </div>
        <FieldError msg={touched.email ? errors.email : undefined} />
        <FieldSuccess
          name="email"
          errors={errors}
          touched={touched}
          label="Looks good!"
        />
      </div>

      {/* ── Password ──────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="reg-password"
            name="password"
            type="password"
            value={password}
            onChange={onChange}
            onBlur={onBlur}
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${fieldCls(
              "password",
              errors,
              touched
            )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
        </div>
        <FieldError msg={touched.password ? errors.password : undefined} />
        <FieldSuccess
          name="password"
          errors={errors}
          touched={touched}
          label="Strong password!"
        />
      </div>

      {/* ── Confirm Password ──────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="reg-password-confirm"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="reg-password-confirm"
            name="password_confirm"
            type="password"
            value={passwordConfirm}
            onChange={onChange}
            onBlur={onBlur}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${fieldCls(
              "password_confirm",
              errors,
              touched
            )} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all`}
          />
        </div>
        <FieldError
          msg={touched.password_confirm ? errors.password_confirm : undefined}
        />
        <FieldSuccess
          name="password_confirm"
          errors={errors}
          touched={touched}
          label="Passwords match!"
        />
      </div>
    </>
  );
};
