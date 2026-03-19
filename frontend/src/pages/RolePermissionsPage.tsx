// frontend/src/pages/RolePermissionsPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Layers,
  Save,
  AlertTriangle,
  Info,
  Zap,
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
  return Array.from(map.entries()).map(([module, perms]) => ({ module, perms: perms.sort((a,b) => a.action.localeCompare(b.action)) })).map(({module, perms}) => ({module, permissions: perms}));
}

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  patient:     { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    icon: "💊" },
  doctor:      { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: "🩺" },
  lab:         { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/30",  icon: "🔬" },
  appointment: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   icon: "📅" },
  settings:    { bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-rose-500/30",    icon: "⚙️" },
};

const DEFAULT_MODULE = { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: "🔑" };

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN:    "from-yellow-500 to-amber-500",
  ADMIN:         "from-violet-500 to-purple-600",
  STAFF:         "from-blue-500 to-indigo-600",
  DOCTOR:        "from-emerald-500 to-teal-600",
  PATIENT:       "from-sky-500 to-cyan-600",
  LAB_TECHNICIAN:"from-rose-500 to-pink-600",
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

  // Track pending local changes (before save)
  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(new Map());
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
  const loadRolePerms = useCallback(async (role: Role) => {
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
  }, [toast]);

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
    // If we already have a pending change for this perm, cancel it (revert to original)
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
      // Compute final set
      const finalIds = new Set(grantedIds);
      Array.from(pendingChanges.entries()).forEach(([permId, shouldGrant]) => {
        if (shouldGrant) finalIds.add(permId);
        else finalIds.delete(permId);
      });
      await syncPermissions(selectedRole.role_id, Array.from(finalIds));
      setGrantedIds(finalIds);
      setPendingChanges(new Map());
      toast.success(`Permissions for ${selectedRole.role} updated successfully!`);
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
  };

  const moduleGroups = groupByModule(allPermissions);

  // Stats for selected role
  const effectiveGrantedCount = allPermissions.filter((p) => isEffectivelyGranted(p.permission_id)).length;
  const totalCount = allPermissions.length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .rbac-page { font-family: 'Inter', sans-serif; }

        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.25rem;
        }

        .role-card {
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.875rem;
          padding: 1rem 1.25rem;
          background: rgba(30, 41, 59, 0.5);
        }
        .role-card:hover { border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.05); transform: translateX(3px); }
        .role-card.active { border-color: rgba(52,211,153,0.6); background: rgba(52,211,153,0.1); box-shadow: 0 0 20px rgba(52,211,153,0.1); }

        .module-section { margin-bottom: 1.5rem; }

        .perm-chip {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 0.875rem;
          border-radius: 0.625rem;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.8125rem;
          font-weight: 500;
          user-select: none;
        }
        .perm-chip.granted {
          background: rgba(52,211,153,0.12);
          border-color: rgba(52,211,153,0.5);
          color: #34d399;
          box-shadow: 0 0 10px rgba(52,211,153,0.1);
        }
        .perm-chip.revoked {
          background: rgba(30,41,59,0.5);
          border-color: rgba(100,116,139,0.3);
          color: #64748b;
        }
        .perm-chip.pending-grant {
          background: rgba(52,211,153,0.05);
          border-color: rgba(52,211,153,0.35);
          border-style: dashed;
          color: #34d399;
          opacity: 0.75;
        }
        .perm-chip.pending-revoke {
          background: rgba(239,68,68,0.05);
          border-color: rgba(239,68,68,0.35);
          border-style: dashed;
          color: #f87171;
          opacity: 0.75;
        }
        .perm-chip:hover { transform: translateY(-1px); }

        .save-bar {
          position: sticky;
          bottom: 1.5rem;
          z-index: 10;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          background: rgba(15,23,42,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(52,211,153,0.2);
          display: flex; align-items: center; justify-content: space-between;
          animation: slideUp 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(52,211,153,0.1);
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .btn-primary {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; font-weight: 600; font-size: 0.875rem;
          border: none; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-ghost {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 0.625rem;
          background: rgba(100,116,139,0.15);
          color: #94a3b8; font-weight: 500; font-size: 0.875rem;
          border: 1px solid rgba(100,116,139,0.25); cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: rgba(100,116,139,0.25); color: #cbd5e1; }

        .progress-bar {
          height: 6px; border-radius: 3px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #10b981, #34d399);
          transition: width 0.4s ease;
        }

        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .superadmin-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.25rem 0.75rem; border-radius: 999px;
          background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(245,158,11,0.15));
          border: 1px solid rgba(234,179,8,0.3);
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05em;
          color: #fbbf24; text-transform: uppercase;
        }
      `}</style>

      <div className="rbac-page min-h-screen text-slate-100 p-4 lg:p-6">
        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Role Permissions Manager
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Control what each role can do across the system
                  </p>
                </div>
              </div>
            </div>
            <span className="superadmin-badge">
              <Zap className="w-3 h-3" /> Superadmin Only
            </span>
          </div>

          {/* Overview strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Roles", value: roles.length, icon: Users, color: "text-violet-400" },
              { label: "Total Permissions", value: allPermissions.length, icon: Lock, color: "text-emerald-400" },
              { label: "Modules", value: moduleGroups.length, icon: Layers, color: "text-blue-400" },
              { label: selectedRole ? "Granted" : "Select Role", value: selectedRole ? `${effectiveGrantedCount}/${totalCount}` : "—", icon: ShieldCheck, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/5`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-white">{loading ? "…" : s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 spinner mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading roles & permissions…</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* ── Left: Role List ──────────────────────────────────────────── */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="glass-card p-5 sticky top-24">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Roles
                </h2>
                <div className="space-y-2">
                  {roles.map((role) => {
                    const gradient = ROLE_BADGE[role.role] ?? "from-slate-500 to-slate-600";
                    const isSelected = selectedRole?.role_id === role.role_id;
                    return (
                      <button
                        key={role.role_id}
                        onClick={() => handleSelectRole(role)}
                        className={`role-card w-full text-left ${isSelected ? "active" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">
                              {role.role.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{role.role}</p>
                            {role.role_description && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">{role.role_description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: Permission Matrix ─────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {!selectedRole ? (
                <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                    <Shield className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">Select a Role</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Choose a role from the left panel to view and manage its permissions across all system modules.
                  </p>
                </div>
              ) : (
                <>
                  {/* Role header */}
                  <div className="glass-card p-5 mb-5">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ROLE_BADGE[selectedRole.role] ?? "from-slate-500 to-slate-600"} flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-lg font-bold">{selectedRole.role.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-white">{selectedRole.role}</h2>
                        <p className="text-sm text-slate-400">{selectedRole.role_description ?? "No description"}</p>
                      </div>
                      {/* Progress */}
                      <div className="w-40">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Permissions</span>
                          <span className="font-semibold text-emerald-400">{effectiveGrantedCount}/{totalCount}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${totalCount ? (effectiveGrantedCount / totalCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                      <button
                        onClick={() => {
                          const all = allPermissions.map((p) => p.permission_id);
                          const next = new Map<number, boolean>();
                          all.forEach((id) => { if (!grantedIds.has(id)) next.set(id, true); });
                          setPendingChanges(next);
                        }}
                        className="btn-ghost text-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Grant All
                      </button>
                      <button
                        onClick={() => {
                          const next = new Map<number, boolean>();
                          Array.from(grantedIds).forEach((id) => next.set(id, false));
                          setPendingChanges(next);
                        }}
                        className="btn-ghost text-xs"
                      >
                        <ShieldX className="w-3.5 h-3.5" /> Revoke All
                      </button>
                      {hasPending && (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 px-1 flex-wrap">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Granted</span>
                    <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-slate-500" />Not granted</span>
                    <span className="flex items-center gap-1.5 border border-emerald-500/40 border-dashed rounded px-2 py-0.5">Pending grant</span>
                    <span className="flex items-center gap-1.5 border border-red-500/40 border-dashed rounded px-2 py-0.5">Pending revoke</span>
                    <span className="ml-auto flex items-center gap-1 text-slate-600"><Info className="w-3 h-3" /> Click chips to toggle</span>
                  </div>

                  {/* Loading overlay */}
                  {roleLoading ? (
                    <div className="glass-card p-12 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-emerald-400 spinner mr-3" />
                      <span className="text-slate-400">Loading permissions…</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moduleGroups.map(({ module, permissions }) => {
                        const style = MODULE_COLORS[module] ?? DEFAULT_MODULE;
                        const grantedInModule = permissions.filter((p) => isEffectivelyGranted(p.permission_id)).length;
                        return (
                          <div key={module} className="glass-card p-5 module-section">
                            {/* Module header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} text-xs font-semibold uppercase tracking-wider`}
                                >
                                  <span>{style.icon}</span>
                                  {module}
                                </span>
                              </div>
                              <span className={`text-xs font-medium ${style.text}`}>
                                {grantedInModule}/{permissions.length} granted
                              </span>
                            </div>

                            {/* Permission chips */}
                            <div className="flex flex-wrap gap-2">
                              {permissions.map((perm) => {
                                const effective = isEffectivelyGranted(perm.permission_id);
                                const hasPendingChange = pendingChanges.has(perm.permission_id);

                                let chipClass = "perm-chip ";
                                if (hasPendingChange) {
                                  chipClass += effective ? "pending-grant" : "pending-revoke";
                                } else {
                                  chipClass += effective ? "granted" : "revoked";
                                }

                                return (
                                  <button
                                    key={perm.permission_id}
                                    onClick={() => togglePermission(perm.permission_id)}
                                    className={chipClass}
                                    title={perm.description ?? `${perm.module}:${perm.action}`}
                                  >
                                    {effective ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    )}
                                    <span>{perm.action.replace(/_/g, " ")}</span>
                                    {hasPendingChange && (
                                      <span className="text-xs opacity-60 ml-0.5">
                                        {effective ? "(+)" : "(-)"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Module description hints */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {permissions.map((p) =>
                                p.description ? (
                                  <span key={p.permission_id} className="text-xs text-slate-600">
                                    <span className="text-slate-500 font-medium">{p.action}:</span> {p.description}
                                  </span>
                                ) : null
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Save bar (sticky) ──────────────────────────────────── */}
                  {hasPending && (
                    <div className="save-bar mt-6">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white">Unsaved changes</p>
                          <p className="text-xs text-slate-400">
                            {pendingChanges.size} permission{pendingChanges.size !== 1 ? "s" : ""} modified for <span className="text-emerald-400 font-medium">{selectedRole.role}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={discardChanges} className="btn-ghost">
                          <XCircle className="w-4 h-4" /> Discard
                        </button>
                        <button onClick={saveChanges} disabled={saving} className="btn-primary">
                          {saving ? (
                            <RefreshCw className="w-4 h-4 spinner" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saving ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
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
