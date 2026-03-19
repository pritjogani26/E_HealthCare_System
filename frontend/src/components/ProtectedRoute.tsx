// frontend/src/components/ProtectedRoute.tsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";
import AccessDeniedPage from "../pages/AccessDeniedPage";

interface ProtectedRouteProps {
  children: React.ReactElement;
  /** If provided, user's role must be in this list */
  allowedRoles?: User["role"][];
  /** If provided, user must have ALL of these permissions */
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
}) => {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              border: "3px solid rgba(16,185,129,0.2)",
              borderTopColor: "#10b981",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user as any)?.user?.role ?? (user as any)?.role ?? null;
    if (!role || !allowedRoles.includes(role)) {
      return <AccessDeniedPage />;
    }
  }

  // Fine-grained permission check
  if (requiredPermissions && requiredPermissions.length > 0) {
    const allGranted = requiredPermissions.every((p) => hasPermission(p));
    if (!allGranted) {
      return <AccessDeniedPage />;
    }
  }

  return children;
};

export default ProtectedRoute;
