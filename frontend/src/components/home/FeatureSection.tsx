import React from 'react';
import { Heart, CheckCircle } from 'lucide-react';

export const FeatureSection: React.FC = () => {
    const features = [
        "Patient Registration & Management",
        "Doctor & Lab Verification System",
        "Online Appointment Booking",
        "Medical Records Management",
        "Secure User Authentication",
        "Real-time Notifications",
    ];

    return (
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
                <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden shadow-md group border border-blue-200/50">
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <div className="text-center p-4">
                            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                <span className="text-2xl">🏥</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">
                                Hospital Network
                            </p>
                        </div>
                    </div>
                </div>
                <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl overflow-hidden shadow-md group border border-emerald-200/50">
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <div className="text-center p-4">
                            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
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
    );
};
