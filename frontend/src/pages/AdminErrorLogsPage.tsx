// frontend/src/pages/AdminErrorLogsPage.tsx

import React, { useCallback, useEffect, useState } from "react";
import { Eye, RefreshCw, AlertCircle } from "lucide-react";
import { ErrorLog } from "../types";
import { getErrorLogs } from "../services/admin_api";
import { useToast } from "../hooks/useToast";

import { PageHeader } from "../components/common/PageHeader";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { Modal } from "../components/common/Modal";
import { Pagination } from "../components/common/Pagination";

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── Detail Modal ─────────────────────────────────────────────────────────────

interface ErrorDetailModalProps {
  errorLog: ErrorLog;
  onClose: () => void;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ errorLog, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Error Details" size="lg">
    <div className="space-y-4">
      {/* Meta info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "#f0f5fb", border: "1px solid #d0dff0" }}
        >
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#1a3c6e" }}>
            Error ID
          </p>
          <p className="text-sm font-mono" style={{ color: "#333" }}>
            {errorLog.error_id}
          </p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "#f0f5fb", border: "1px solid #d0dff0" }}
        >
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#1a3c6e" }}>
            Timestamp
          </p>
          <p className="text-sm" style={{ color: "#333" }}>
            {formatTimestamp(errorLog.created_at)}
          </p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "#f0f5fb", border: "1px solid #d0dff0" }}
        >
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#1a3c6e" }}>
            Endpoint
          </p>
          <p className="text-sm font-mono truncate" style={{ color: "#333" }}>
            {errorLog.ref_from || "—"}
          </p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "#f0f5fb", border: "1px solid #d0dff0" }}
        >
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#1a3c6e" }}>
            User ID
          </p>
          <p className="text-sm font-mono truncate" style={{ color: "#333" }}>
            {errorLog.created_by || "System / Anonymous"}
          </p>
        </div>
      </div>

      {/* Traceback */}
      <div>
        <p
          className="text-xs font-semibold uppercase mb-2"
          style={{ color: "#1a3c6e" }}
        >
          Full Traceback
        </p>
        <pre
          className="rounded-lg p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap"
          style={{
            backgroundColor: "#1e293b",
            color: "#e2e8f0",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            border: "1px solid #334155",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {errorLog.description}
        </pre>
      </div>
    </div>
  </Modal>
);

// ── Main Component ────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 15;

const AdminErrorLogsPage: React.FC = () => {
  const toast = useToast();

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getErrorLogs(500);
      setLogs(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Failed to load error logs.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentLogs = logs.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="System Error Logs"
          description="Review all unhandled exceptions and server-side failures."
        />
        <button
          onClick={loadLogs}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all shadow-sm ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d0dff0",
            color: "#1a3c6e",
          }}
          onMouseEnter={(e) => {
            if (!loading)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e8f0f7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && <LoadingState message="Loading error logs…" />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d0dff0",
            boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                style={{
                  backgroundColor: "#e8f0f7",
                  borderBottom: "1px solid #d0dff0",
                }}
              >
                <tr>
                  {["#", "Endpoint", "Error Summary", "User ID", "Timestamp", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide"
                        style={{ color: "#1a3c6e" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, idx) => {
                  const firstLine = log.description
                    .split("\n")
                    .reverse()
                    .find((l) => l.trim().length > 0) ?? log.description;

                  return (
                    <tr
                      key={log.error_id}
                      className="border-b"
                      style={{ borderColor: "#e8f0f7" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f8fc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        className="py-3 px-4 font-mono text-xs"
                        style={{ color: "#888" }}
                      >
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs max-w-[160px]">
                        <span
                          className="truncate block"
                          title={log.ref_from || "—"}
                          style={{ color: "#1a3c6e" }}
                        >
                          {log.ref_from || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span
                          className="block truncate text-xs"
                          title={firstLine}
                          style={{ color: "#c0392b" }}
                        >
                          {firstLine}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs font-mono truncate block max-w-[140px]"
                          title={log.created_by || "—"}
                          style={{ color: "#555" }}
                        >
                          {log.created_by
                            ? log.created_by.slice(0, 8) + "…"
                            : "—"}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-xs whitespace-nowrap"
                        style={{ color: "#555" }}
                      >
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: "#e8f0f7", color: "#1a3c6e" }}
                          title="View Details"
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              "#d0dff0")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              "#e8f0f7")
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {currentLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#e8f0f7" }}
                        >
                          <AlertCircle
                            className="w-6 h-6"
                            style={{ color: "#1a3c6e" }}
                          />
                        </div>
                        <p className="text-sm font-medium" style={{ color: "#1a3c6e" }}>
                          No error logs recorded
                        </p>
                        <p className="text-xs" style={{ color: "#888" }}>
                          Everything is running smoothly.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            indexOfFirstItem={indexOfFirst}
            indexOfLastItem={indexOfLast}
          />
        </div>
      )}

      {/* Detail modal */}
      {selectedLog && (
        <ErrorDetailModal
          errorLog={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
};

export default AdminErrorLogsPage;
