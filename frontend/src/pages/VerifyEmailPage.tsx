import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { apiService } from "../services/api";

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link. Token is missing.");
                return;
            }

            try {
                await apiService.verifyEmail(token);
                setStatus("success");
            } catch (error: any) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Email verification failed. The link may be invalid or expired.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
