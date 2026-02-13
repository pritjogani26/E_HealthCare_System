import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../services/api";
import { FeatureSection } from "../components/home/FeatureSection";
import { LoginForm } from "../components/home/LoginForm";

const HomePage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent, data: { email: string; password: string }) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate("/dashboard");
    } catch (err: any) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <Header setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Project Info & Images */}
          <FeatureSection />

          {/* Right Side - Login Form */}
          <LoginForm
            onLogin={handleLogin}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
