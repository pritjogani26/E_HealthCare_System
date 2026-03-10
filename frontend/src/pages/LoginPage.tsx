import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../services/api";
import { FeatureSection } from "../components/home/FeatureSection";
import { LoginForm } from "../components/home/LoginForm";
import { useToast } from "../hooks/useToast";

const LoginPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent, data: { email: string; password: string }) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(data.email, data.password);
            toast.success("Welcome back! Redirecting to dashboard…");
            navigate("/dashboard");
        } catch (err: any) {
            const message = handleApiError(err);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
            {/* Toaster here since LoginPage is outside the Layout wrapper */}
            <Toaster
                position="top-right"
                gutter={10}
                containerStyle={{ top: 72, right: 20 }}
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)",
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

            <Header setIsSidebarOpen={setIsSidebarOpen} />

            <main className="flex-1 flex items-center justify-center px-6 py-8">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <FeatureSection />
                    <LoginForm
                        onLogin={handleLogin}
                        isSubmitting={isSubmitting}
                        error={null}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LoginPage;
