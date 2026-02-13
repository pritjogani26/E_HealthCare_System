import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import GoogleLoginButton from '../GoogleLoginButton';

interface LoginFormProps {
    onLogin: (e: React.FormEvent, data: { email: string; password: string }) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isSubmitting, error }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        onLogin(e, { email, password });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 lg:p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Welcome Back
                </h2>
                <p className="text-sm text-slate-600">
                    Sign in to access your dashboard
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
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
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 animate-fadeIn">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        onClick={() => { }}
                    >
                        Forgot Password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <span>{isSubmitting ? "Logging in..." : "Login"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
            </div>

            <GoogleLoginButton />

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
    );
};
