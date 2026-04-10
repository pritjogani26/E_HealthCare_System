// src/pages/MyLabBookingsPage.tsx
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FlaskConical,
  Building2,
  Calendar,
  Clock,
  IndianRupee,
  Home,
  ChevronDown,
  ChevronUp,
  XCircle,
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";

import { handleApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  fetchMyLabBookings,
  cancelLabBooking,
  fetchBookingReports,
  LabBooking,
  BookingStatus,
  LabReport,
} from "../services/labService";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt12(t?: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<BookingStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  BOOKED: {
    bg: "#fffbeb", text: "#d97706", border: "#fde68a",
    icon: <Clock size={12} />,
  },
  COMPLETED: {
    bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0",
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    bg: "#fef2f2", text: "#dc2626", border: "#fecaca",
    icon: <XCircle size={12} />,
  },
};

// ── main component ────────────────────────────────────────────────────────────

const MyLabBookingsPage: React.FC = () => {
  const toast  = useToast();
  const qc     = useQueryClient();

  const [filter, setFilter]           = useState<"ALL" | BookingStatus>("ALL");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LabBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // ── fetch bookings ────────────────────────────────────────────────────────

  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LabBooking[], Error>({
    queryKey: ["myLabBookings"],
    queryFn: fetchMyLabBookings,
    staleTime: 30 * 1000,
  });

  // ── cancel mutation ───────────────────────────────────────────────────────

  const { mutate: doCancel, isPending: cancelling } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelLabBooking(id, reason),
    onSuccess: () => {
      toast.success("Booking cancelled successfully.");
      qc.invalidateQueries({ queryKey: ["myLabBookings"] });
      setCancelTarget(null);
      setCancelReason("");
    },
    onError: (err) => toast.error(handleApiError(err)),
  });

  // ── derived ───────────────────────────────────────────────────────────────

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.booking_status === filter);
  const counts = {
    ALL:       bookings.length,
    BOOKED:    bookings.filter((b) => b.booking_status === "BOOKED").length,
    COMPLETED: bookings.filter((b) => b.booking_status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.booking_status === "CANCELLED").length,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#e8f0f7" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "#1a3c6e", letterSpacing: "-0.3px" }}>
              My Lab Bookings
            </h1>
            <p style={{ color: "#6b87a8", margin: "4px 0 0", fontSize: 14 }}>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8,
              border: "1px solid #d0dff0", background: "#ffffff",
              color: "#1a3c6e", cursor: "pointer", fontWeight: 600, fontSize: 14,
              boxShadow: "0 1px 3px rgba(26,60,110,0.07)",
            }}
          >
            <RefreshCw size={14} color="#36454F" />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {(["ALL", "BOOKED", "COMPLETED", "CANCELLED"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 18px", borderRadius: 20,
                  border: active ? "2px solid #1a3c6e" : "1px solid #d0dff0",
                  background: active ? "#1a3c6e" : "#ffffff",
                  color: active ? "#ffffff" : "#555555",
                  cursor: "pointer", fontWeight: 600, fontSize: 13,
                  transition: "all 0.15s",
                  boxShadow: active ? "0 2px 6px rgba(26,60,110,0.18)" : "none",
                }}
              >
                {f} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={32} className="animate-spin" color="#1a3c6e" />
          </div>
        ) : isError ? (
          <EmptyState icon={<AlertCircle size={44} color="#fca5a5" />} title="Failed to load bookings" subtitle="Please refresh to try again." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={44} color="#d0dff0" />}
            title="No bookings found"
            subtitle={filter === "ALL" ? "You haven't booked any lab tests yet." : `No ${filter.toLowerCase()} bookings.`}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((b) => (
              <BookingCard
                key={b.booking_id}
                booking={b}
                expanded={expandedId === b.booking_id}
                onToggle={() => setExpandedId(expandedId === b.booking_id ? null : b.booking_id)}
                onCancelClick={() => { setCancelTarget(b); setCancelReason(""); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={() => setCancelTarget(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle size={20} color="#dc2626" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>Cancel Booking</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>{cancelTarget.test_name}</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              style={{
                width: "100%", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "10px 14px", fontSize: 13, outline: "none", resize: "none",
                fontFamily: "inherit", color: "#334155", boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCancelTarget(null)}
                style={{
                  padding: "9px 20px", borderRadius: 9, border: "1px solid #e2e8f0",
                  background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                Keep Booking
              </button>
              <button
                onClick={() => doCancel({ id: cancelTarget.booking_id, reason: cancelReason })}
                disabled={cancelling}
                style={{
                  padding: "9px 20px", borderRadius: 9, border: "none",
                  background: "#dc2626", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  opacity: cancelling ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {cancelling ? <><Loader2 size={13} className="animate-spin" /> Cancelling…</> : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BookingCard
// ─────────────────────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  expanded,
  onToggle,
  onCancelClick,
}: {
  booking: LabBooking;
  expanded: boolean;
  onToggle: () => void;
  onCancelClick: () => void;
}) {
  const sc = STATUS_STYLES[booking.booking_status] ?? STATUS_STYLES.BOOKED;
  const { data: reports = [], isLoading: reportsLoading } = useQuery<LabReport[], Error>({
    queryKey: ["bookingReports", booking.booking_id],
    queryFn: () => fetchBookingReports(booking.booking_id),
    enabled: expanded && booking.booking_status === "COMPLETED",
    staleTime: 30 * 1000,
  });

  const latestPdfReport = reports.find((r) => (r.report_type || "").toLowerCase() === "pdf") || reports[0];

  const getDownloadUrl = (raw?: string | null): string | null => {
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/media/")) {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
      const root = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
      return `${root}${raw}`;
    }
    return raw;
  };

  const openReport = (report?: LabReport) => {
    const url = getDownloadUrl(report?.report_file_url);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: 14,
      border: "1px solid #d0dff0",
      boxShadow: "0 1px 4px rgba(26,60,110,0.06)",
      overflow: "hidden",
      transition: "box-shadow 0.15s",
    }}>
      {/* ── Row ── */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", cursor: "pointer", gap: 12, flexWrap: "wrap",
        }}
        onClick={onToggle}
      >
        {/* Left */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #065f46, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <FlaskConical size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#1a3c6e", margin: 0 }}>
              {booking.test_name}
            </p>
            <p style={{ fontSize: 12, color: "#6b87a8", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <Building2 size={11} /> {booking.lab_name}
              <span style={{ margin: "0 4px", color: "#d0dff0" }}>|</span>
              <Calendar size={11} /> {booking.slot_date}
              <span style={{ margin: "0 4px", color: "#d0dff0" }}>|</span>
              <Clock size={11} /> {fmt12(booking.start_time)}
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 1,
            fontWeight: 700, fontSize: 15, color: "#1a3c6e",
          }}>
            <IndianRupee size={13} />
            {Number(booking.total_amount).toFixed(0)}
          </div>

          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            whiteSpace: "nowrap",
          }}>
            {sc.icon} {booking.booking_status}
          </span>

          {booking.booking_status === "BOOKED" && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancelClick(); }}
              style={{
                padding: "5px 12px", borderRadius: 7,
                border: "1px solid #fecaca", background: "#fef2f2",
                color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Cancel
            </button>
          )}

          {booking.booking_status === "COMPLETED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReport(latestPdfReport);
              }}
              disabled={!latestPdfReport}
              style={{
                padding: "5px 12px", borderRadius: 7,
                border: "1px solid #bfdbfe", background: "#eff6ff",
                color: "#1d4ed8", fontWeight: 600, fontSize: 12, cursor: "pointer",
                whiteSpace: "nowrap", opacity: latestPdfReport ? 1 : 0.65,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Download size={12} />
              {latestPdfReport ? "Download PDF" : "No report"}
            </button>
          )}

          {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{
          borderTop: "1px solid #e8f0f7",
          background: "#f8fafc",
          padding: "16px 20px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16,
        }}>
          <DetailItem label="Test Code"       value={booking.test_code} />
          <DetailItem label="Sample Type"     value={booking.sample_type} />
          <DetailItem label="Fasting"         value={booking.fasting_required ? "Required" : "Not required"} />
          <DetailItem label="Slot"            value={`${fmt12(booking.start_time)} – ${fmt12(booking.end_time)}`} />
          <DetailItem
            label="Collection"
            value={booking.collection_type === "home" ? "Home Collection" : "Lab Visit"}
            icon={booking.collection_type === "home" ? <Home size={13} color="#d97706" /> : <Building2 size={13} color="#6b87a8" />}
          />
          <DetailItem label="Sub-total"       value={`₹${Number(booking.subtotal).toFixed(2)}`} />
          {Number(booking.home_collection_charge) > 0 && (
            <DetailItem label="Home Charge"   value={`₹${Number(booking.home_collection_charge).toFixed(2)}`} />
          )}
          <DetailItem label="Total Paid"      value={`₹${Number(booking.total_amount).toFixed(2)}`} />
          <DetailItem label="Booked On"       value={fmtDate(booking.created_at)} />

          {booking.booking_status === "CANCELLED" && (
            <>
              <DetailItem label="Cancelled At" value={fmtDate(booking.cancelled_at)} />
              {booking.cancellation_reason && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Cancellation Reason</p>
                  <p style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>{booking.cancellation_reason}</p>
                </div>
              )}
            </>
          )}

          {booking.notes && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={11} /> Notes
              </p>
              <p style={{ fontSize: 13, color: "#475569" }}>{booking.notes}</p>
            </div>
          )}

          {booking.collection_address && booking.collection_type === "home" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <Home size={11} /> Collection Address
              </p>
              <p style={{ fontSize: 13, color: "#475569" }}>
                {typeof booking.collection_address === "object"
                  ? [
                      (booking.collection_address as any).address_line1,
                      (booking.collection_address as any).city,
                      (booking.collection_address as any).state,
                      (booking.collection_address as any).pincode,
                    ].filter(Boolean).join(", ")
                  : String(booking.collection_address)}
              </p>
            </div>
          )}

          {booking.booking_status === "COMPLETED" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                Lab Report
              </p>
              {reportsLoading ? (
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Loading report...</p>
              ) : latestPdfReport ? (
                <button
                  type="button"
                  onClick={() => openReport(latestPdfReport)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Download size={14} />
                  Download completed test report
                </button>
              ) : (
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Report not available yet.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────────────────────

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
        {icon} {value}
      </p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: 14, border: "1px solid #d0dff0",
      padding: "60px 32px", textAlign: "center", color: "#6b87a8",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "#334155" }}>{title}</p>
      <p style={{ fontSize: 13, margin: 0 }}>{subtitle}</p>
    </div>
  );
}

export default MyLabBookingsPage;
