import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Heart, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../services/api";

const HomePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    "Patient Registration & Management",
    "Doctor & Lab Verification System",
    "Online Appointment Booking",
    "Medical Records Management",
    "Secure User Authentication",
    "Real-time Notifications",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <Header setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Project Info & Images */}
          <div className="space-y-6">
            {/* Brand Section */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  E-Health Care
                </h1>
                <p className="text-base text-slate-600">
                  Hospital Management Platform
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">
                Comprehensive Healthcare Management Solution
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                A modern third-party platform connecting patients, doctors, and
                laboratories. Our system streamlines healthcare delivery through
                secure registration, verification, and appointment management.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-slate-800">
                Key Features:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Healthcare Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden shadow-md">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Hospital Network
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl overflow-hidden shadow-md">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">👨‍⚕️</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Verified Doctors
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-600">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <a
                  href="#"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? "Logging in..." : "Login"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Don't have an account?{" "}
                <a
                  href="/registration"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Register Now
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
