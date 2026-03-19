// frontend/src/pages/AccessDeniedPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AccessDeniedPageProps {
  /** If true, means the route doesn't exist at all (404). Otherwise it's a permissions issue (403). */
  notFound?: boolean;
}

const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ notFound = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const code = notFound ? "404" : "403";
  const title = notFound ? "Page Not Found" : "Access Denied";
  const subtitle = notFound
    ? "The page you're looking for doesn't exist or has been moved."
    : "You don't have permission to access this page.";
  const hint = notFound
    ? "Check the URL or return to where you came from."
    : `Your current role (${user?.role ?? "unknown"}) does not have the required permissions.`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-10rem",
          left: "-10rem",
          width: "40rem",
          height: "40rem",
          background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse 4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10rem",
          right: "-10rem",
          width: "35rem",
          height: "35rem",
          background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse 5s ease-in-out infinite reverse",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "rgba(30,41,59,0.7)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "3rem 2.5rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "5rem",
            height: "5rem",
            background: notFound
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #ef4444, #dc2626)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: notFound
              ? "0 8px 32px rgba(99,102,241,0.4)"
              : "0 8px 32px rgba(239,68,68,0.4)",
          }}
        >
          {notFound ? (
            <Home style={{ width: "2.5rem", height: "2.5rem", color: "white" }} />
          ) : (
            <ShieldOff style={{ width: "2.5rem", height: "2.5rem", color: "white" }} />
          )}
        </div>

        {/* Error code */}
        <div
          style={{
            fontSize: "5rem",
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: "0.5rem",
            background: notFound
              ? "linear-gradient(135deg, #818cf8, #a78bfa)"
              : "linear-gradient(135deg, #f87171, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {code}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: "0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "1rem",
            color: "#94a3b8",
            marginBottom: "0.5rem",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>

        {/* Hint */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "0.875rem 1rem",
            marginBottom: "2rem",
            marginTop: "1rem",
            textAlign: "left",
          }}
        >
          <Lock
            style={{
              width: "1rem",
              height: "1rem",
              color: "#64748b",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            {hint}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "#cbd5e1",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
          >
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Go Back
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              background: notFound
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: notFound
                ? "0 4px 16px rgba(99,102,241,0.35)"
                : "0 4px 16px rgba(16,185,129,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = notFound
                ? "0 8px 24px rgba(99,102,241,0.5)"
                : "0 8px 24px rgba(16,185,129,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = notFound
                ? "0 4px 16px rgba(99,102,241,0.35)"
                : "0 4px 16px rgba(16,185,129,0.35)";
            }}
          >
            <Home style={{ width: "1rem", height: "1rem" }} />
            Dashboard
          </button>
        </div>
      </div>

      {/* Bottom label */}
      <p
        style={{
          position: "relative",
          marginTop: "2rem",
          fontSize: "0.8rem",
          color: "rgba(100,116,139,0.6)",
        }}
      >
        E-Health Care · Hospital Management System
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default AccessDeniedPage;
