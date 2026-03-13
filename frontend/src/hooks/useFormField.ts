// src/hooks/useFormField.ts
import { FormikErrors, FormikTouched } from "formik";

export function useFormField<T>(
  errors: FormikErrors<T>,
  touched: FormikTouched<T>
) {
  /** Resolves a dot-path error only when the field has been touched. */
  const getError = (path: string): string | undefined => {
    const parts = path.split(".");
    let err: any = errors;
    let tch: any = touched;
    for (const part of parts) {
      err = err?.[part];
      tch = tch?.[part];
    }
    return tch && err ? String(err) : undefined;
  };

  /** Returns a className string with red border when the field has an error. */
  const inputCls = (path: string, extra = ""): string => {
    const hasErr = !!getError(path);
    return [
      "w-full px-3 py-2 text-sm border rounded-lg",
      "focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white",
      hasErr ? "border-red-400 focus:ring-red-400" : "border-slate-300",
      extra,
    ]
      .filter(Boolean)
      .join(" ");
  };

  return { getError, inputCls };
}