import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { verifyEmail } from "../services/api";
import { useToast } from "../hooks/useToast";

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");
    const toast = useToast();

    useEffect(() => {
        const handleVerify = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link. Token is missing.");
                toast.error("Invalid verification link. Token is missing.");
                return;
            }

            try {
                await verifyEmail(token);
                setStatus("success");
                toast.success("Email verified successfully! 🎉");
            } catch (error: any) {
                setStatus("error");
                const errMsg = error.response?.data?.message || "Email verification failed. The link may be invalid or expired.";
                setMessage(errMsg);
                toast.error(errMsg);
            }
        };

        handleVerify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Toaster
                position="top-right"
                containerStyle={{ top: 20, right: 20 }}
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)",
                        padding: "12px 16px",
                        maxWidth: "380px",
                    },
                    success: {
                        style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
                        iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
                    },
                    error: {
                        duration: 5000,
                        style: { background: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3" },
                        iconTheme: { primary: "#e11d48", secondary: "#fff1f2" },
                    },
                }}
            />
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Verifying Email...</h2>
                        <p className="text-slate-600">Please wait while we verify your email address.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Email Verified!</h2>
                        <p className="text-slate-600">
                            Your email has been successfully verified. You can now access all features of your account.
                        </p>
                        <div className="pt-4">
                            <Link
                                to="/"
                                className="inline-block px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Go to Homepage
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Verification Failed</h2>
                        <p className="text-slate-600">{message}</p>
                        <div className="pt-4">
                            <Link
                                to="/"
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Return to Homepage
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
