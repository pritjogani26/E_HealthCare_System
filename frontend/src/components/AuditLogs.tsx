// frontend/src/components/AuditLogs.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { AuditLog, AuditAction } from "../types";
import { downloadAuditLogs, getRecentActivity } from "../services/admin_api";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../utils/roles";

// ── helpers ───────────────────────────────────────────────────────────────────

function actionLabel(action: AuditAction): string {
  const map: Partial<Record<AuditAction, string>> = {
    USER_LOGIN: "Logged in",
    USER_LOGOUT: "Logged out",
    USER_LOGIN_FAILED: "Login failed",
    ACCOUNT_LOCKED: "Account locked",
    EMAIL_VERIFIED: "Email verified",
    PASSWORD_RESET: "Password reset",
    PATIENT_REGISTERED: "Patient registered",
    DOCTOR_REGISTERED: "Doctor registered",
    LAB_REGISTERED: "Lab registered",
    PATIENT_PROFILE_UPDATED: "Patient profile updated",
    DOCTOR_PROFILE_UPDATED: "Doctor profile updated",
    LAB_PROFILE_UPDATED: "Lab profile updated",
    DOCTOR_VERIFIED: "Doctor verified",
    DOCTOR_REJECTED: "Doctor rejected",
    LAB_VERIFIED: "Lab verified",
    LAB_REJECTED: "Lab rejected",
    PATIENT_ACTIVATED: "Patient activated",
    PATIENT_DEACTIVATED: "Patient deactivated",
    DOCTOR_ACTIVATED: "Doctor activated",
    DOCTOR_DEACTIVATED: "Doctor deactivated",
    LAB_ACTIVATED: "Lab activated",
    LAB_DEACTIVATED: "Lab deactivated",
    TOGGLE_PATIENT_STATUS: "Patient status changed",
    TOGGLE_DOCTOR_STATUS: "Doctor status changed",
    TOGGLE_LAB_STATUS: "Lab status changed",
    ADMIN_ACTION: "Admin action",
    SYSTEM_ERROR: "System error",
    POST_AUTH_LOGOUT: "Logged out",
    POST_PAYMENT_VERIFY: "Payment verified",
    POST_PAYMENT_CREATE_ORDER: "Payment order created",
    POST_LAB_BOOKINGS: "Lab test booked",
  };
  return map[action] ?? action;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function buildDetails(log: AuditLog): string {
  if (log.failure_reason) return log.failure_reason;

  const oldData = log.old_data ?? {};
  const newData = log.new_data ?? {};
  const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

  if (keys.length === 0) return "";

  return keys
    .map((key) => `${key}: ${formatValue(oldData[key])} -> ${formatValue(newData[key])}`)
    .join(", ");
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const PAGE_SIZE = 15;


interface DownloadModalProps {
  onClose: () => void;
  onDownload: (
    status: "ALL" | "SUCCESS" | "FAILURE",
    format: "PDF" | "CSV",
  ) => Promise<void>;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  onClose,
  onDownload,
}) => {
  const [status, setStatus] = useState<"ALL" | "SUCCESS" | "FAILURE">("ALL");
  const [format, setFormat] = useState<"CSV" | "PDF">("CSV");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    await onDownload(status, format);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">
            Download Audit Logs
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Status
          </p>
          <div className="flex gap-2">
            {(["ALL", "SUCCESS", "FAILURE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                  status === s
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Format
          </p>
          <div className="flex gap-2">
            {(["CSV", "PDF"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                  format === f
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-2 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {loading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isAdminOrStaff = role === "ADMIN" || role === "STAFF" || role === "SUPERADMIN";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "SUCCESS" | "FAILURE"
  >("ALL");
  const [page, setPage] = useState(1);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentActivity();
      setLogs(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Failed to load audit logs. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleDownload = useCallback(
    async (status: "ALL" | "SUCCESS" | "FAILURE", format: "PDF" | "CSV") => {
      try {
        await downloadAuditLogs(status, format);
        toast.success("SuccessFul Downloaded PDF");
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ?? "Failed to download audit logs.";
        toast.error(msg);
      }
    },
    [toast],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
      if (q) {
        const actor = (log.user_email ?? log.targeted_user_email ?? "").toLowerCase();
        const label = actionLabel(log.action).toLowerCase();
        const details = buildDetails(log).toLowerCase();
        if (!actor.includes(q) && !label.includes(q) && !details.includes(q))
          return false;
      }
      return true;
    });
  }, [logs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = !!(search || statusFilter !== "ALL");

  return (
    <>
      {showDownloadModal && (
        <DownloadModal
          onClose={() => setShowDownloadModal(false)}
          onDownload={handleDownload}
        />
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1" style={{ color: "#1a3c6e" }}>
            Recent Activity
          </h2>
          <p className="text-sm" style={{ color: "#555555" }}>
            {isAdminOrStaff 
              ? "Monitor system activity and security events." 
              : "Monitor your account activity and security events."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadActivity}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ color: "#1a3c6e" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
            style={{ color: "#1a3c6e" }}
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3"
        style={{ backgroundColor: "#ffffff", border: "1px solid #d0dff0" }}
      >
        <div className="flex items-center gap-1.5">
          {(["ALL", "SUCCESS", "FAILURE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? s === "FAILURE"
                    ? "bg-red-600 text-white shadow-sm"
                    : s === "SUCCESS"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
              style={
                statusFilter === s && s === "ALL"
                  ? { backgroundColor: "#1a3c6e" }
                  : statusFilter !== s
                    ? { backgroundColor: "#e8f0f7" }
                    : {}
              }
            >
              {s === "ALL" ? "All" : s === "SUCCESS" ? "Success" : "Failure"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden flex-1"
        style={{ backgroundColor: "#ffffff", border: "1px solid #d0dff0", boxShadow: "0 2px 8px rgba(26,60,110,0.07)" }}
      >
        <div
          className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "#e8f0f7", borderColor: "#d0dff0", color: "#1a3c6e" }}
        >
          <span>Actor / Action</span>
          <span>Target / Record</span>
          <span>Details</span>
          <span>Context</span>
          <span>Timestamp</span>
          <span>Status</span>
        </div>

        {loading && (
          <div className="divide-y" style={{ borderColor: "#e8f0f7" }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: "#e8f0f7" }} />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2.5 rounded w-3/5" style={{ backgroundColor: "#e8f0f7" }} />
                    <div className="h-2 rounded w-2/5" style={{ backgroundColor: "#e8f0f7" }} />
                  </div>
                </div>
                <div className="space-y-1.5 my-auto">
                  <div className="h-2.5 rounded w-3/4" style={{ backgroundColor: "#e8f0f7" }} />
                  <div className="h-2 rounded w-1/2" style={{ backgroundColor: "#e8f0f7" }} />
                </div>
                <div className="h-2.5 rounded w-full my-auto" style={{ backgroundColor: "#e8f0f7" }} />
                <div className="space-y-1.5 my-auto">
                  <div className="h-2.5 rounded w-full" style={{ backgroundColor: "#e8f0f7" }} />
                  <div className="h-2 rounded w-4/5" style={{ backgroundColor: "#e8f0f7" }} />
                </div>
                <div className="space-y-1.5 my-auto">
                  <div className="h-2.5 rounded w-3/4" style={{ backgroundColor: "#e8f0f7" }} />
                  <div className="h-2 rounded w-1/2" style={{ backgroundColor: "#e8f0f7" }} />
                </div>
                <div className="h-5 w-14 rounded my-auto" style={{ backgroundColor: "#e8f0f7" }} />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <p className="text-sm font-medium" style={{ color: "#1a3c6e" }}>
              Failed to load audit logs
            </p>
            <p className="text-xs" style={{ color: "#555555" }}>{error}</p>
            <button
              onClick={loadActivity}
              className="text-sm font-medium mt-1 hover:underline"
              style={{ color: "#1a3c6e" }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e8f0f7" }}>
              <Activity size={22} style={{ color: "#1a3c6e" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#1a3c6e" }}>
              {hasActiveFilters
                ? "No logs match your filters"
                : "No audit logs recorded yet"}
            </p>
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <div className="divide-y" style={{ borderColor: "#e8f0f7" }}>
            {paginated.map((log) => {
              const actor = log.user_email ?? log.targeted_user_email ?? "System";
              const isFailure = log.status === "FAILURE";
              const details = buildDetails(log);
              return (
                <div
                  key={log.audit_id}
                  className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 transition-colors"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f5f8fc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a3c6e" }}>
                        {actor}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#555555" }}>
                        {actionLabel(log.action)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center min-w-0">
                    {log.table_name ? (
                      <>
                        <p className="text-xs font-medium truncate" style={{ color: "#1a3c6e" }}>
                          {log.table_name}
                        </p>
                        {log.row_id && (
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "#888" }}>
                            ID: {log.row_id}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-xs italic" style={{ color: "#aabbcc" }}>—</span>
                    )}
                  </div>

                  <div className="flex items-center min-w-0">
                    {details ? (
                      <p
                        className="text-xs line-clamp-2 leading-relaxed"
                        style={{ color: "#555555" }}
                        title={details}
                      >
                        {details}
                      </p>
                    ) : (
                      <span className="text-xs italic" style={{ color: "#aabbcc" }}>
                        —
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center min-w-0">
                    {log.ip_address ? (
                      <p className="text-[11px] truncate font-mono" style={{ color: "#555" }}>
                        IP: {log.ip_address}
                      </p>
                    ) : (
                      <span className="text-xs italic" style={{ color: "#aabbcc" }}>—</span>
                    )}
                    {log.user_agent && (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "#888" }} title={log.user_agent}>
                        {log.user_agent}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#1a3c6e" }}>
                      {timeAgo(log.created_at)}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "#888" }}>
                      {formatTimestamp(log.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${isFailure ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {isFailure ? "FAILURE" : "SUCCESS"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t"
            style={{ borderColor: "#d0dff0", backgroundColor: "#e8f0f7" }}
          >
            <p className="text-xs" style={{ color: "#555555" }}>
              Showing{" "}
              <span className="font-semibold" style={{ color: "#1a3c6e" }}>
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold" style={{ color: "#1a3c6e" }}>
                {filtered.length}
              </span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition border border-transparent"
                style={{ color: "#1a3c6e" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d0dff0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (
                    idx > 0 &&
                    (p as number) - (arr[idx - 1] as number) > 1
                  )
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="w-8 text-center text-xs"
                      style={{ color: "#888" }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className="w-8 h-8 rounded-lg text-xs font-medium transition"
                      style={
                        page === p
                          ? { backgroundColor: "#1a3c6e", color: "#ffffff" }
                          : { color: "#1a3c6e" }
                      }
                      onMouseEnter={(e) => {
                        if (page !== p)
                          e.currentTarget.style.backgroundColor = "#d0dff0";
                      }}
                      onMouseLeave={(e) => {
                        if (page !== p)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition border border-transparent"
                style={{ color: "#1a3c6e" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d0dff0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuditLogs;
