// frontend/src/hooks/usePermission.ts
/**
 * Convenience hook for checking permissions anywhere in the component tree.
 *
 * Usage:
 *   const can = usePermission();
 *   if (can("appointment : book")) { ... }
 *
 * Or with a specific permission:
 *   const canBook = usePermission("appointment : book");
 */
import { useAuth } from "../context/AuthContext";

// Overload: called with no args → returns hasPermission function
function usePermission(): (permission: string) => boolean;
// Overload: called with a permission string → returns boolean
function usePermission(permission: string): boolean;

function usePermission(permission?: string): ((p: string) => boolean) | boolean {
  const { hasPermission } = useAuth();

  if (permission !== undefined) {
    return hasPermission(permission);
  }

  return hasPermission;
}

export default usePermission;

/**
 * Gate an action button / UI element based on a permission.
 *
 * Example:
 *   const { allowed, tooltip } = usePermissionGate("appointment : book");
 *   <button disabled={!allowed} title={tooltip}>Book</button>
 */
export function usePermissionGate(permission: string): {
  allowed: boolean;
  tooltip: string;
} {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(permission);
  return {
    allowed,
    tooltip: allowed ? "" : `You don't have the "${permission}" permission.`,
  };
}
