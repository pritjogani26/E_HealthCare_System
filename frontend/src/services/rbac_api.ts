// frontend/src/services/rbac_api.ts
import { api } from "./api";

export interface Role {
  role_id: number;
  role: string;
  role_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  permission_id: number;
  module: string;
  action: string;
  description: string | null;
}

export interface RolePermission extends Permission {
  grant_at: string;
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export const getAllRoles = async (): Promise<Role[]> => {
  const res = await api.get("/users/rbac/roles/");
  return res.data.data;
};

// ── Permissions ───────────────────────────────────────────────────────────────
export const getAllPermissions = async (module?: string): Promise<Permission[]> => {
  const params = module ? `?module=${encodeURIComponent(module)}` : "";
  const res = await api.get(`/users/rbac/permissions/${params}`);
  return res.data.data;
};

// ── Per-role permissions ──────────────────────────────────────────────────────
export const getRolePermissions = async (roleId: number): Promise<RolePermission[]> => {
  const res = await api.get(`/users/rbac/roles/${roleId}/permissions/`);
  return res.data.data;
};

// ── Grant ─────────────────────────────────────────────────────────────────────
export const grantPermission = async (
  roleId: number,
  permissionId: number
): Promise<string> => {
  const res = await api.post(`/users/rbac/roles/${roleId}/permissions/grant/`, {
    permission_id: permissionId,
  });
  return res.data.message;
};

// ── Revoke ────────────────────────────────────────────────────────────────────
export const revokePermission = async (
  roleId: number,
  permissionId: number
): Promise<string> => {
  const res = await api.post(`/users/rbac/roles/${roleId}/permissions/revoke/`, {
    permission_id: permissionId,
  });
  return res.data.message;
};

// ── Sync (replace everything at once) ────────────────────────────────────────
export const syncPermissions = async (
  roleId: number,
  permissionIds: number[]
): Promise<string> => {
  const res = await api.post(`/users/rbac/roles/${roleId}/permissions/sync/`, {
    permission_ids: permissionIds,
  });
  return res.data.message;
};
