// frontend/src/pages/RolePermissionsPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Save,
} from "lucide-react";
import { Layout } from "../components/common/Layout";
import { useToast } from "../hooks/useToast";
import { handleApiError } from "../services/api";
import {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  syncPermissions,
  Role,
  Permission,
} from "../services/rbac_api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModuleGroup {
  module: string;
  permissions: Permission[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByModule(permissions: Permission[]): ModuleGroup[] {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    if (!map.has(p.module)) map.set(p.module, []);
    map.get(p.module)!.push(p);
  }
  return Array.from(map.entries()).map(([module, perms]) => ({
    module,
    permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
  }));
}

const MODULE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  patient: { bg: "#e8f0f7", text: "#1a3c6e", border: "#b0ccee" },
  doctor: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  lab: { bg: "#f3e8ff", text: "#7e22ce", border: "#d8b4fe" },
  appointment: { bg: "#fefce8", text: "#92400e", border: "#fde68a" },
  settings: { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
};

const DEFAULT_MODULE = {
  bg: "#e8f0f7",
  text: "#555555",
  border: "#d0dff0",
  icon: "🔑",
};

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: "#36454F",
  ADMIN: "#1a3c6e",
  STAFF: "#2e5fa3",
  DOCTOR: "#0e7490",
  PATIENT: "#0369a1",
  LAB_TECHNICIAN: "#7e22ce",
};

// ── Component ─────────────────────────────────────────────────────────────────

const RolePermissionsPage: React.FC = () => {
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [grantedIds, setGrantedIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(
    new Map(),
  );
  const hasPending = pendingChanges.size > 0;

  // ── Load all roles and permissions on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [r, p] = await Promise.all([getAllRoles(), getAllPermissions()]);
        setRoles(r);
        setAllPermissions(p);
      } catch (e) {
        toast.error(handleApiError(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load permissions for the selected role ───────────────────────────────
  const loadRolePerms = useCallback(
    async (role: Role) => {
      try {
        setRoleLoading(true);
        setPendingChanges(new Map());
        const perms = await getRolePermissions(role.role_id);
        setGrantedIds(new Set(perms.map((p) => p.permission_id)));
      } catch (e) {
        toast.error(handleApiError(e));
      } finally {
        setRoleLoading(false);
      }
    },
    [toast],
  );

  const handleSelectRole = (role: Role) => {
    if (hasPending) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    setSelectedRole(role);
    loadRolePerms(role);
  };

  // ── Toggle a permission locally ──────────────────────────────────────────
  const togglePermission = (permId: number) => {
    const currentlyGranted = grantedIds.has(permId);
    setPendingChanges((prev) => {
      const next = new Map(prev);
      if (next.has(permId)) {
        next.delete(permId); // cancel pending change
      } else {
        next.set(permId, !currentlyGranted); // add pending change
      }
      return next;
    });
  };

  // Effective state = grantedIds + pending overrides
  const isEffectivelyGranted = (permId: number): boolean => {
    if (pendingChanges.has(permId)) return pendingChanges.get(permId)!;
    return grantedIds.has(permId);
  };

  // ── Save changes via SYNC ────────────────────────────────────────────────
  const saveChanges = async () => {
    if (!selectedRole || !hasPending) return;
    try {
      setSaving(true);
      const finalIds = new Set(grantedIds);
      Array.from(pendingChanges.entries()).forEach(([permId, shouldGrant]) => {
        if (shouldGrant) finalIds.add(permId);
        else finalIds.delete(permId);
      });
      await syncPermissions(selectedRole.role_id, Array.from(finalIds));
      setGrantedIds(finalIds);
      setPendingChanges(new Map());
      toast.success(
        `Permissions for ${selectedRole.role} updated successfully!`,
      );
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => setPendingChanges(new Map());

  const moduleGroups = groupByModule(allPermissions);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <style>{`
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .role-card {
          transition: all 0.18s ease;
          cursor: pointer;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          border: 1px solid #d0dff0;
          background: #ffffff;
          text-align: left;
          width: 100%;
        }
        .role-card:hover { border-color: #2e5fa3; background: #e8f0f7; transform: translateX(2px); }
        .role-card.active { border-color: #1a3c6e; background: #e8f0f7; box-shadow: 0 2px 8px rgba(26,60,110,0.10); }

        .shalby-card {
          background: #ffffff;
          border: 1px solid #d0dff0;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(26,60,110,0.07);
        }

        .perm-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.75rem;
          border-radius: 6px; border: 1px solid;
          cursor: pointer; transition: all 0.15s ease;
          font-size: 0.8rem; font-weight: 500; user-select: none;
        }
        .perm-chip.granted        { background: #e8f0f7; border-color: #2e5fa3; color: #1a3c6e; }
        .perm-chip.revoked        { background: #f8fafc; border-color: #d0dff0; color: #888888; }
        .perm-chip.pending-grant  { background: #fff7ed; border-color: #36454F; border-style: dashed; color: #c2410c; opacity: 0.85; }
        .perm-chip.pending-revoke { background: #fef2f2; border-color: #f87171; border-style: dashed; color: #991b1b; opacity: 0.85; }
        .perm-chip:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(26,60,110,0.08); }

        .save-bar {
          position: sticky; bottom: 1.5rem; z-index: 10;
          padding: 0.875rem 1.25rem; border-radius: 10px;
          background: #ffffff; border: 1px solid #36454F;
          display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;
          box-shadow: 0 4px 16px rgba(244,121,32,0.12);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.55rem 1.1rem; border-radius: 7px;
          background: #1a3c6e; color: #ffffff;
          font-weight: 600; font-size: 0.875rem;
          border: none; cursor: pointer; transition: background 0.18s;
        }
        .btn-primary:hover { background: #2e5fa3; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.55rem 1rem; border-radius: 7px;
          background: #ffffff; color: #555555;
          font-weight: 500; font-size: 0.875rem;
          border: 1px solid #d0dff0; cursor: pointer; transition: all 0.18s;
        }
        .btn-ghost:hover { background: #e8f0f7; color: #1a3c6e; border-color: #2e5fa3; }
      `}</style>

      <div style={{ color: "#1a3c6e" }}>
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "#1a3c6e",
              boxShadow: "0 4px 12px rgba(26,60,110,0.2)",
            }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1a3c6e" }}>
              Roles & Permissions
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw
                className="w-7 h-7 spinner mx-auto mb-3"
                style={{ color: "#36454F" }}
              />
              <p className="text-sm" style={{ color: "#555555" }}>
                Loading roles & permissions…
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-5 flex-col lg:flex-row">
            {/* ── Left: Role List ────────────────────────────────────────── */}
            <div className="lg:w-60 flex-shrink-0">
              <div className="shalby-card p-4 sticky top-24">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: "#555555" }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: "#36454F" }} />
                  Roles
                </p>
                <div className="space-y-1.5">
                  {roles.map((role) => {
                    const isSelected = selectedRole?.role_id === role.role_id;
                    return (
                      <button
                        key={role.role_id}
                        onClick={() => handleSelectRole(role)}
                        className={`role-card ${isSelected ? "active" : ""}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-sm truncate"
                              style={{ color: "#1a3c6e" }}
                            >
                              {role.role}
                            </p>
                          </div>
                          {isSelected && (
                            <ChevronRight
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: "#36454F" }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: Permission Matrix ──────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {!selectedRole ? (
                <div className="shalby-card flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#e8f0f7" }}
                  >
                    <Shield className="w-7 h-7" style={{ color: "#2e5fa3" }} />
                  </div>
                  <h3
                    className="text-base font-semibold mb-1"
                    style={{ color: "#1a3c6e" }}
                  >
                    Select a Role
                  </h3>
                </div>
              ) : (
                <>
                  <div className="shalby-card p-4 mb-4 flex items-center gap-3">
                    <div>
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#1a3c6e" }}
                      >
                        {selectedRole.role}
                      </p>
                    </div>
                  </div>

                  {/* Permission modules */}
                  {roleLoading ? (
                    <div className="shalby-card p-12 flex items-center justify-center">
                      <RefreshCw
                        className="w-5 h-5 spinner mr-3"
                        style={{ color: "#36454F" }}
                      />
                      <span className="text-sm" style={{ color: "#555555" }}>
                        Loading permissions…
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {moduleGroups.map(({ module, permissions }) => {
                        const style = MODULE_COLORS[module] ?? DEFAULT_MODULE;
                        return (
                          <div key={module} className="shalby-card p-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
                              style={{
                                backgroundColor: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              {module}
                            </span>

                            <div className="flex flex-wrap gap-2">
                              {permissions.map((perm) => {
                                const effective = isEffectivelyGranted(
                                  perm.permission_id,
                                );
                                const hasPendingChange = pendingChanges.has(
                                  perm.permission_id,
                                );
                                let chipClass = "perm-chip ";
                                if (hasPendingChange) {
                                  chipClass += effective
                                    ? "pending-grant"
                                    : "pending-revoke";
                                } else {
                                  chipClass += effective
                                    ? "granted"
                                    : "revoked";
                                }
                                return (
                                  <button
                                    key={perm.permission_id}
                                    onClick={() =>
                                      togglePermission(perm.permission_id)
                                    }
                                    className={chipClass}
                                    title={
                                      perm.description ??
                                      `${perm.module}:${perm.action}`
                                    }
                                  >
                                    {effective ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    )}
                                    <span>
                                      {perm.action.replace(/_/g, " ")}
                                    </span>
                                    {hasPendingChange && (
                                      <span className="text-xs opacity-60 ml-0.5">
                                        {effective ? "(+)" : "(-)"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Save bar */}
                  {hasPending && (
                    <div className="save-bar w-80 align-right">
                      <button onClick={discardChanges} className="btn-ghost">
                        <XCircle className="w-4 h-4" /> Discard
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="btn-primary"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 spinner" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RolePermissionsPage;
