// frontend\src\components\home\FeatureSection.tsx
import React from "react";
import { Heart, CheckCircle } from "lucide-react";

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
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: "#1a3c6e",
            boxShadow: "0 4px 14px rgba(26, 60, 110, 0.25)",
          }}
        >
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#1a3c6e" }}
          >
            E-Health Care
          </h1>
          <p className="text-base" style={{ color: "#555555" }}>
            Hospital Management Platform
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold" style={{ color: "#1a3c6e" }}>
          Comprehensive Healthcare Management Solution
        </h2>
        <p className="leading-relaxed text-sm" style={{ color: "#555555" }}>
          A modern third-party platform connecting patients, doctors, and
          laboratories. Our system streamlines healthcare delivery through
          secure registration, verification, and appointment management.
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold" style={{ color: "#1a3c6e" }}>
          Key Features:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "#36454F" }}
              />
              <span className="text-xs" style={{ color: "#555555" }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Healthcare Image Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="relative h-32 rounded-xl overflow-hidden group"
          style={{
            backgroundColor: "#e8f0f7",
            border: "1px solid #d0dff0",
            boxShadow: "0 2px 8px rgba(26, 60, 110, 0.08)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <div className="text-center p-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 6px rgba(26, 60, 110, 0.1)",
                }}
              >
                <span className="text-2xl">🏥</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#1a3c6e" }}>
                Hospital Network
              </p>
            </div>
          </div>
        </div>
        <div
          className="relative h-32 rounded-xl overflow-hidden group"
          style={{
            backgroundColor: "#e8f0f7",
            border: "1px solid #d0dff0",
            boxShadow: "0 2px 8px rgba(26, 60, 110, 0.08)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <div className="text-center p-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 6px rgba(26, 60, 110, 0.1)",
                }}
              >
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#1a3c6e" }}>
                Verified Doctors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
