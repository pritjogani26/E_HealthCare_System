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

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e8f0f7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      {/* Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d0dff0",
          borderRadius: "12px",
          padding: "2.5rem 2rem",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 4px 20px rgba(26,60,110,0.10)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "4rem",
            height: "4rem",
            backgroundColor: notFound ? "#e8f0f7" : "#fef2f2",
            border: `1px solid ${notFound ? "#d0dff0" : "#fecaca"}`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          {notFound ? (
            <Home style={{ width: "2rem", height: "2rem", color: "#1a3c6e" }} />
          ) : (
            <ShieldOff style={{ width: "2rem", height: "2rem", color: "#dc2626" }} />
          )}
        </div>

        {/* Error code */}
        <div
          style={{
            fontSize: "4rem",
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: "0.5rem",
            color: notFound ? "#1a3c6e" : "#dc2626",
          }}
        >
          {code}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#1a3c6e",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "0.9rem",
            color: "#555555",
            marginBottom: "0.5rem",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>


        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.1rem",
              backgroundColor: "#ffffff",
              border: "1px solid #d0dff0",
              borderRadius: "8px",
              color: "#555555",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e8f0f7";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2e5fa3";
              (e.currentTarget as HTMLButtonElement).style.color = "#1a3c6e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#d0dff0";
              (e.currentTarget as HTMLButtonElement).style.color = "#555555";
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
              padding: "0.625rem 1.1rem",
              backgroundColor: "#1a3c6e",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: "0 4px 12px rgba(26,60,110,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2e5fa3";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a3c6e";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <Home style={{ width: "1rem", height: "1rem" }} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;