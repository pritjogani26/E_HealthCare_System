// frontend/src/components/PermissionGuard.tsx
/**
 * PermissionGuard
 * ===============
 * Conditionally renders children only when the user has the required permission(s).
 *
 * Usage:
 *   <PermissionGuard permission="appointment : book">
 *     <BookButton />
 *   </PermissionGuard>
 *
 *   // Multiple permissions (user must have ALL)
 *   <PermissionGuard permissions={["doctor : verify", "doctor : view"]}>
 *     <VerifyButton />
 *   </PermissionGuard>
 *
 *   // Fallback content when not permitted
 *   <PermissionGuard permission="settings : edit" fallback={<span>No access</span>}>
 *     <EditForm />
 *   </PermissionGuard>
 */
import React from "react";
import { useAuth } from "../context/AuthContext";

interface PermissionGuardProps {
  /** Single permission string */
  permission?: string;
  /** Array of permissions — user must have ALL of them */
  permissions?: string[];
  /** Rendered when user lacks permission. Defaults to null (nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();

  let granted = true;

  if (permission) {
    granted = hasPermission(permission);
  }

  if (permissions && permissions.length > 0) {
    granted = granted && permissions.every((p) => hasPermission(p));
  }

  return <>{granted ? children : fallback}</>;
};

export default PermissionGuard;
