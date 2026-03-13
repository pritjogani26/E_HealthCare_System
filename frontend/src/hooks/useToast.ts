// frontend/src/hooks/useToast.ts

import React from "react";
import toast, { ToastOptions } from "react-hot-toast";

const BASE: ToastOptions = {
    duration: 4000,
    style: {
        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
        fontSize: "0.875rem",
        fontWeight: 500,
        borderRadius: "12px",
        boxShadow:
            "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)",
        padding: "12px 16px",
        maxWidth: "380px",
    },
};

const SUCCESS: ToastOptions = {
    ...BASE,
    style: {
        ...BASE.style,
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
    },
    iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
};

const ERROR: ToastOptions = {
    ...BASE,
    duration: 5000,
    style: {
        ...BASE.style,
        background: "#fff1f2",
        color: "#9f1239",
        border: "1px solid #fecdd3",
    },
    iconTheme: { primary: "#e11d48", secondary: "#fff1f2" },
};

const LOADING: ToastOptions = {
    ...BASE,
    duration: Infinity,
    style: {
        ...BASE.style,
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #e2e8f0",
    },
};

const INFO: ToastOptions = {
    ...BASE,
    icon: "ℹ️",
    style: {
        ...BASE.style,
        background: "#f0f9ff",
        color: "#0c4a6e",
        border: "1px solid #bae6fd",
    },
};

const WARNING: ToastOptions = {
    ...BASE,
    icon: "⚠️",
    style: {
        ...BASE.style,
        background: "#fffbeb",
        color: "#92400e",
        border: "1px solid #fde68a",
    },
};

export function useToast() {
    return React.useMemo(() => ({
        success: (message: string, opts?: ToastOptions) =>
            toast.success(message, { ...SUCCESS, ...opts }),

        error: (message: string, opts?: ToastOptions) =>
            toast.error(message, { ...ERROR, ...opts }),

        loading: (message: string, opts?: ToastOptions) =>
            toast.loading(message, { ...LOADING, ...opts }),

        info: (message: string, opts?: ToastOptions) =>
            toast(message, { ...INFO, ...opts }),

        warning: (message: string, opts?: ToastOptions) =>
            toast(message, { ...WARNING, ...opts }),

        dismiss: (id?: string) => toast.dismiss(id),

        /** Promise helper: shows loading → success / error automatically */
        promise: <T>(
            promise: Promise<T>,
            messages: { loading: string; success: string; error: string }
        ) =>
            toast.promise(promise, messages, {
                loading: LOADING,
                success: SUCCESS,
                error: ERROR,
            }),
    }), []);
}
