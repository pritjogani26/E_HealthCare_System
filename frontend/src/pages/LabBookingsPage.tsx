// Lab-facing list of incoming test bookings (GET /labs/my-bookings/)

import React, { useMemo, useState } from "react";
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
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Droplet,
} from "lucide-react";

import { handleApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  fetchLabOwnBookings,
  completeLabBookingWithReport,
  LabBooking,
  BookingStatus,
  CollectionAddress,
  fetchTestParameters,
  TestParameter,
  LabTestParameterResult,
} from "../services/labService";
import { jsPDF } from "jspdf";

function fmt12(t?: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  if (Number.isNaN(hr)) return t;
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseCollectionAddress(
  raw: LabBooking["collection_address"],
): CollectionAddress | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as CollectionAddress;
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as CollectionAddress;
      if (o && typeof o === "object") return o;
    } catch {
      return null;
    }
  }
  return null;
}

function formatCollectionAddress(addr: CollectionAddress | null): string {
  if (!addr) return "—";
  return [
    addr.address_line1,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

const STATUS_STYLES: Record<
  BookingStatus,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  BOOKED: {
    bg: "#fffbeb",
    text: "#d97706",
    border: "#fde68a",
    icon: <Clock size={12} />,
  },
  COMPLETED: {
    bg: "#f0fdf4",
    text: "#16a34a",
    border: "#bbf7d0",
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    bg: "#fef2f2",
    text: "#dc2626",
    border: "#fecaca",
    icon: <XCircle size={12} />,
  },
};

const LabBookingsPage: React.FC = () => {
  const toast = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completingBooking, setCompletingBooking] = useState<LabBooking | null>(
    null,
  );

  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LabBooking[], Error>({
    queryKey: ["labOwnBookings"],
    queryFn: fetchLabOwnBookings,
    staleTime: 30 * 1000,
  });

  const { mutate: markComplete, isPending: completePending } = useMutation({
    mutationFn: ({
      bookingId,
      reportFile,
      resultNotes,
      parameterResults,
    }: {
      bookingId: string;
      reportFile: File;
      resultNotes?: string;
      parameterResults: LabTestParameterResult[];
    }) =>
      completeLabBookingWithReport(bookingId, {
        report_file: reportFile,
        report_type: "pdf",
        result_notes: resultNotes,
        parameter_results: parameterResults,
      }),
    onSuccess: () => {
      toast.success("Booking marked as completed and report saved.");
      qc.invalidateQueries({ queryKey: ["labOwnBookings"] });
      setCompletingBooking(null);
    },
    onError: (err) => toast.error(handleApiError(err)),
  });

  const filtered = useMemo(() => {
    const list =
      filter === "ALL"
        ? bookings
        : bookings.filter((b) => b.booking_status === filter);
    return [...list].sort((a, b) => {
      const da = (a.slot_date || "").localeCompare(b.slot_date || "");
      if (da !== 0) return da;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });
  }, [bookings, filter]);

  const counts = {
    ALL: bookings.length,
    BOOKED: bookings.filter((b) => b.booking_status === "BOOKED").length,
    COMPLETED: bookings.filter((b) => b.booking_status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.booking_status === "CANCELLED").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#e8f0f7" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                margin: 0,
                color: "#1a3c6e",
                letterSpacing: "-0.3px",
              }}
            >
              Test bookings
            </h1>
            <p style={{ color: "#6b87a8", margin: "4px 0 0", fontSize: 14 }}>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} for
              your lab
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 8,
              border: "1px solid #d0dff0",
              background: "#ffffff",
              color: "#1a3c6e",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 1px 3px rgba(26,60,110,0.07)",
            }}
          >
            <RefreshCw size={14} color="#36454F" />
            Refresh
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {(["ALL", "BOOKED", "COMPLETED", "CANCELLED"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: active ? "2px solid #1a3c6e" : "1px solid #d0dff0",
                  background: active ? "#1a3c6e" : "#ffffff",
                  color: active ? "#ffffff" : "#555555",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "all 0.15s",
                  boxShadow: active ? "0 2px 6px rgba(26,60,110,0.18)" : "none",
                }}
              >
                {f}{" "}
                {counts[f] > 0 && (
                  <span style={{ opacity: 0.7 }}>({counts[f]})</span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#1a3c6e" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<AlertCircle size={44} color="#fca5a5" />}
            title="Failed to load bookings"
            subtitle="Please refresh to try again."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={44} color="#d0dff0" />}
            title="No bookings found"
            subtitle={
              filter === "ALL"
                ? "You have no test bookings yet."
                : `No ${filter.toLowerCase()} bookings.`
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((b) => (
              <LabBookingCard
                key={b.booking_id}
                booking={b}
                expanded={expandedId === b.booking_id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === b.booking_id ? null : b.booking_id,
                  )
                }
                onComplete={
                  b.booking_status === "BOOKED"
                    ? () => setCompletingBooking(b)
                    : undefined
                }
                completing={
                  completePending &&
                  completingBooking?.booking_id === b.booking_id
                }
              />
            ))}
          </div>
        )}
      </div>
      {completingBooking && (
        <CompleteBookingModal
          booking={completingBooking}
          onClose={() => setCompletingBooking(null)}
          onSubmit={(payload) =>
            markComplete({
              bookingId: completingBooking.booking_id,
              reportFile: payload.reportFile,
              resultNotes: payload.resultNotes,
              parameterResults: payload.parameterResults,
            })
          }
          isSubmitting={completePending}
        />
      )}
    </div>
  );
};

function LabBookingCard({
  booking,
  expanded,
  onToggle,
  onComplete,
  completing,
}: {
  booking: LabBooking;
  expanded: boolean;
  onToggle: () => void;
  onComplete?: () => void;
  completing: boolean;
}) {
  const sc = STATUS_STYLES[booking.booking_status] ?? STATUS_STYLES.BOOKED;
  const patientLine = booking.patient?.full_name ?? "Patient";
  const homeAddr = parseCollectionAddress(booking.collection_address);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid #d0dff0",
        boxShadow: "0 1px 4px rgba(26,60,110,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          cursor: "pointer",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1a3c6e, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={20} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1a3c6e",
                margin: 0,
              }}
            >
              {patientLine}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#6b87a8",
                margin: "3px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <FlaskConical size={11} />
              <span style={{ fontWeight: 600, color: "#475569" }}>
                {booking.test_name}
              </span>
              <span style={{ margin: "0 4px", color: "#d0dff0" }}>|</span>
              <Calendar size={11} /> {fmtDate(booking.slot_date)}
              <span style={{ margin: "0 4px", color: "#d0dff0" }}>|</span>
              <Clock size={11} /> {fmt12(booking.start_time)}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 700,
              fontSize: 15,
              color: "#1a3c6e",
            }}
          >
            <IndianRupee size={13} />
            {Number(booking.total_amount).toFixed(0)}
          </div>

          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {sc.icon} {booking.booking_status}
          </span>

          {onComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={completing}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#15803d",
                fontWeight: 600,
                fontSize: 12,
                cursor: completing ? "wait" : "pointer",
                whiteSpace: "nowrap",
                opacity: completing ? 0.7 : 1,
              }}
            >
              {completing ? "Saving…" : "Mark complete"}
            </button>
          )}

          {expanded ? (
            <ChevronUp size={16} color="#94a3b8" />
          ) : (
            <ChevronDown size={16} color="#94a3b8" />
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: "1px solid #e8f0f7",
            background: "#f8fafc",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {booking.patient && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                }}
              >
                Patient
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 14,
                }}
              >
                <PatientField
                  icon={<User size={14} />}
                  label="Name"
                  value={booking.patient.full_name}
                />
                <PatientField
                  icon={<Mail size={14} />}
                  label="Email"
                  value={booking.patient.email}
                />
                <PatientField
                  icon={<Phone size={14} />}
                  label="Mobile"
                  value={booking.patient.mobile}
                />
                <PatientField
                  icon={<Calendar size={14} />}
                  label="Date of birth"
                  value={fmtDate(booking.patient.date_of_birth)}
                />
                <PatientField
                  icon={<User size={14} />}
                  label="Gender"
                  value={booking.patient.gender}
                />
                <PatientField
                  icon={<Droplet size={14} />}
                  label="Blood group"
                  value={booking.patient.blood_group}
                />
                <div style={{ gridColumn: "1 / -1" }}>
                  <PatientField
                    icon={<MapPin size={14} />}
                    label="Address"
                    value={[
                      booking.patient.address_line,
                      booking.patient.city,
                      booking.patient.state,
                      booking.patient.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                </div>
                {(booking.patient.emergency_contact_name ||
                  booking.patient.emergency_contact_number) && (
                  <PatientField
                    icon={<Phone size={14} />}
                    label="Emergency contact"
                    value={[
                      booking.patient.emergency_contact_name,
                      booking.patient.emergency_contact_number,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                )}
              </div>
            </div>
          )}

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 10,
              }}
            >
              Test & slot
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              <DetailItem label="Test" value={booking.test_name} />
              <DetailItem label="Test code" value={booking.test_code} />
              <DetailItem label="Sample" value={booking.sample_type} />
              <DetailItem
                label="Fasting"
                value={booking.fasting_required ? "Required" : "Not required"}
              />
              <DetailItem label="Lab" value={booking.lab_name} />
              <DetailItem
                label="Slot date"
                value={fmtDate(booking.slot_date)}
              />
              <DetailItem
                label="Time"
                value={`${fmt12(booking.start_time)} – ${fmt12(booking.end_time)}`}
              />
              <DetailItem
                label="Collection"
                value={
                  booking.collection_type === "home"
                    ? "Home collection"
                    : "Lab visit"
                }
                icon={
                  booking.collection_type === "home" ? (
                    <Home size={13} color="#d97706" />
                  ) : (
                    <Building2 size={13} color="#6b87a8" />
                  )
                }
              />
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 10,
              }}
            >
              Payment
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              <DetailItem
                label="Subtotal"
                value={`₹${Number(booking.subtotal).toFixed(2)}`}
              />
              <DetailItem
                label="Home collection"
                value={`₹${Number(booking.home_collection_charge).toFixed(2)}`}
              />
              <DetailItem
                label="Discount"
                value={`₹${Number(booking.discount_amount).toFixed(2)}`}
              />
              <DetailItem
                label="Total"
                value={`₹${Number(booking.total_amount).toFixed(2)}`}
              />
              <DetailItem
                label="Booked on"
                value={fmtDate(booking.created_at)}
              />
              <DetailItem label="Booking ID" value={booking.booking_id} />
            </div>
          </div>

          {booking.collection_type === "home" && homeAddr && (
            <DetailItem
              label="Collection address"
              value={formatCollectionAddress(homeAddr)}
              icon={<Home size={13} />}
            />
          )}

          {booking.booking_status === "CANCELLED" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              <DetailItem
                label="Cancelled at"
                value={fmtDate(booking.cancelled_at)}
              />
              {booking.cancellation_reason && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}
                  >
                    Reason
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      fontStyle: "italic",
                    }}
                  >
                    {booking.cancellation_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {booking.notes && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginBottom: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FileText size={11} /> Notes
              </p>
              <p style={{ fontSize: 13, color: "#475569" }}>{booking.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PatientField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  const v = value?.trim();
  if (!v) return null;
  return (
    <div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#334155",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          margin: 0,
        }}
      >
        <span style={{ color: "#64748b", flexShrink: 0, marginTop: 2 }}>
          {icon}
        </span>
        <span>{v}</span>
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#334155",
          display: "flex",
          alignItems: "center",
          gap: 4,
          wordBreak: "break-word",
        }}
      >
        {icon}
        {value || "—"}
      </p>
    </div>
  );
}

type ParsedRange =
  | { kind: "between"; min: number; max: number }
  | { kind: "lt"; value: number }
  | { kind: "lte"; value: number }
  | { kind: "gt"; value: number }
  | { kind: "gte"; value: number };

function parseRange(normalRange?: string | null): ParsedRange | null {
  if (!normalRange) return null;
  const raw = normalRange.trim().toLowerCase();

  const comparator = raw.match(/^(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
  if (comparator) {
    const op = comparator[1];
    const value = Number(comparator[2]);
    if (Number.isNaN(value)) return null;
    if (op === "<") return { kind: "lt", value };
    if (op === "<=") return { kind: "lte", value };
    if (op === ">") return { kind: "gt", value };
    return { kind: "gte", value };
  }

  const between = raw.match(
    /(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)/i,
  );
  if (between) {
    const min = Number(between[1]);
    const max = Number(between[2]);
    if (Number.isNaN(min) || Number.isNaN(max)) return null;
    return { kind: "between", min, max };
  }

  return null;
}

function isAbnormalValue(
  normalRange: string | undefined,
  value: string,
): boolean {
  const numeric = Number(value);
  if (value.trim() === "" || Number.isNaN(numeric)) return false;
  const range = parseRange(normalRange);
  if (!range) return false;
  if (range.kind === "between") {
    return numeric < range.min || numeric > range.max;
  }
  if (range.kind === "lt") {
    return !(numeric < range.value);
  }
  if (range.kind === "lte") {
    return !(numeric <= range.value);
  }
  if (range.kind === "gt") {
    return !(numeric > range.value);
  }
  return !(numeric >= range.value);
}

// function generateResultPdf(booking: LabBooking, rows: LabTestParameterResult[]): Blob {
//   const doc = new jsPDF();
//   let y = 16;
//   const add = (line: string, step = 7) => {
//     doc.text(line, 14, y);
//     y += step;
//   };
//   doc.setFontSize(16);
//   add(booking.lab_name || "Lab Report", 8);
//   doc.setFontSize(12);
//   add(booking.test_name || "Test Report", 8);
//   doc.setFontSize(10);
//   add(`Booking ID: ${booking.booking_id}`);
//   add(`Date: ${new Date().toLocaleString("en-IN")}`);
//   add(`Patient: ${booking.patient?.full_name || "—"}`);
//   add(`Mobile: ${booking.patient?.mobile || "—"}  Email: ${booking.patient?.email || "—"}`);
//   add(`DOB: ${fmtDate(booking.patient?.date_of_birth)}  Gender: ${booking.patient?.gender || "—"}`, 10);
//   add("Parameters:", 8);
//   rows.forEach((r, idx) => {
//     const marker = r.is_abnormal ? " (ABNORMAL)" : "";
//     add(
//       `${idx + 1}. ${r.parameter_name}: ${r.patient_value} ${r.unit || ""}  Ref: ${r.normal_range || "—"}${marker}`,
//       6,
//     );
//     if (y > 275) {
//       doc.addPage();
//       y = 16;
//     }
//   });
//   return doc.output("blob");
// }

function generateResultPdf(
  booking: LabBooking,
  rows: LabTestParameterResult[],
): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  const colW = W - margin * 2;

  // ── helpers ────────────────────────────────────────────────────
  const rgb = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const fill = (hex: string) => {
    const c = rgb(hex);
    doc.setFillColor(c.r, c.g, c.b);
  };
  const stroke = (hex: string) => {
    const c = rgb(hex);
    doc.setDrawColor(c.r, c.g, c.b);
  };
  const textColor = (hex: string) => {
    const c = rgb(hex);
    doc.setTextColor(c.r, c.g, c.b);
  };
  const bold = (size: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
  };
  const normal = (size: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
  };
  const light = (size: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
  };

  let y = 0;

  // ── HEADER BAR ─────────────────────────────────────────────────
  fill("#1a3c6e");
  doc.rect(0, 0, W, 26, "F");

  bold(15);
  textColor("#ffffff");
  doc.text(booking.lab_name || "Diagnostic Laboratory", margin, 11);

  normal(8);
  textColor("#a8c4e8");
  doc.text("Lab Report  •  Confidential", margin, 18);

  // report date top-right
  normal(8);
  textColor("#a8c4e8");
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Printed: ${nowStr}`, W - margin, 18, { align: "right" });

  y = 34;

  // ── REPORT TITLE STRIP ─────────────────────────────────────────
  fill("#e8f0f7");
  stroke("#d0dff0");
  doc.setLineWidth(0.3);
  doc.rect(margin, y, colW, 12, "FD");

  bold(11);
  textColor("#1a3c6e");
  doc.text(booking.test_name || "Lab Test Report", margin + 4, y + 8);

  normal(8);
  textColor("#6b87a8");
  doc.text(`Booking ID: ${booking.booking_id}`, W - margin - 4, y + 8, {
    align: "right",
  });

  y += 18;

  // ── PATIENT + TEST INFO (2-column) ─────────────────────────────
  const halfW = (colW - 6) / 2;

  // Left card – Patient info
  fill("#f8fafc");
  stroke("#d0dff0");
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, halfW, 46, 2, 2, "FD");

  // Left card accent bar
  // fill("#1a3c6e");
  doc.rect(margin, y, 3, 46, "F");

  bold(8);
  textColor("#1a3c6e");
  doc.text("PATIENT DETAILS", margin + 7, y + 7);

  const pt = booking.patient;
  const pRows: [string, string][] = [
    ["Name", pt?.full_name || "—"],
    ["Mobile", pt?.mobile || "—"],
    ["Email", pt?.email || "—"],
    ["Date of Birth", fmtDate(pt?.date_of_birth)],
    ["Gender", pt?.gender || "—"],
    ["Blood Group", pt?.blood_group || "—"],
  ];
  let py = y + 13;
  pRows.forEach(([lbl, val]) => {
    light(7.5);
    textColor("#94a3b8");
    doc.text(lbl, margin + 7, py);
    normal(8);
    textColor("#334155");
    doc.text(val, margin + 32, py);
    py += 5.5;
  });

  // Right card – Test info
  const rx = margin + halfW + 6;
  fill("#f8fafc");
  stroke("#d0dff0");
  doc.roundedRect(rx, y, halfW, 46, 2, 2, "FD");

  // fill("#2563eb");
  doc.rect(rx, y, 3, 46, "F");

  bold(8);
  textColor("#1a3c6e");
  doc.text("TEST DETAILS", rx + 7, y + 7);

  const tRows: [string, string][] = [
    ["Test Name", booking.test_name || "—"],
    ["Test Code", booking.test_code || "—"],
    ["Sample Type", booking.sample_type || "—"],
    ["Fasting", booking.fasting_required ? "Required" : "Not required"],
    ["Slot Date", fmtDate(booking.slot_date)],
    ["Time", `${fmt12(booking.start_time)} – ${fmt12(booking.end_time)}`],
  ];
  let ty = y + 13;
  tRows.forEach(([lbl, val]) => {
    light(7.5);
    textColor("#94a3b8");
    doc.text(lbl, rx + 7, ty);
    normal(8);
    textColor("#334155");
    doc.text(val, rx + 32, ty);
    ty += 5.5;
  });

  y += 52;

  // ── RESULTS TABLE HEADER ───────────────────────────────────────
  fill("#1a3c6e");
  doc.rect(margin, y, colW, 8, "F");

  const cols = {
    param: margin + 3,
    value: margin + 80,
    unit: margin + 105,
    ref: margin + 125,
    status: margin + 158,
  };

  bold(7.5);
  textColor("#ffffff");
  doc.text("PARAMETER", cols.param, y + 5.2);
  doc.text("RESULT", cols.value, y + 5.2);
  doc.text("UNIT", cols.unit, y + 5.2);
  doc.text("REFERENCE RANGE", cols.ref, y + 5.2);
  doc.text("STATUS", cols.status, y + 5.2);

  y += 8;

  // ── RESULTS ROWS ───────────────────────────────────────────────
  rows.forEach((r, i) => {
    // Page-break guard
    if (y > 265) {
      doc.addPage();
      y = 16;
      // Repeat header on new page
      fill("#1a3c6e");
      doc.rect(margin, y, colW, 8, "F");
      bold(7.5);
      textColor("#ffffff");
      doc.text("PARAMETER", cols.param, y + 5.2);
      doc.text("RESULT", cols.value, y + 5.2);
      doc.text("UNIT", cols.unit, y + 5.2);
      doc.text("REFERENCE RANGE", cols.ref, y + 5.2);
      doc.text("STATUS", cols.status, y + 5.2);
      y += 8;
    }

    const rowH = 8;
    const isAbn = r.is_abnormal;

    // Row background (alternating + abnormal highlight)
    fill(isAbn ? "#fff5f5" : i % 2 === 0 ? "#ffffff" : "#e64646");
    stroke("#e2e8f0");
    doc.setLineWidth(0.2);
    doc.rect(margin, y, colW, rowH, "FD");

    // Left accent for abnormal rows
    // if (isAbn) {
    //   fill("#ef4444");
    //   doc.rect(margin, y, 2.5, rowH, "F");
    // }

    // Parameter name
    normal(8);
    textColor("#1e293b");
    doc.text(r.parameter_name || "—", cols.param, y + 5.2);

    // Value
    bold(8.5);
    textColor(isAbn ? "#b91c1c" : "#0f172a");
    doc.text(r.patient_value || "—", cols.value, y + 5.2);

    // Unit
    light(7.5);
    textColor("#64748b");
    doc.text(r.unit || "—", cols.unit, y + 5.2);

    // Reference range
    normal(7.5);
    textColor("#64748b");
    doc.text(r.normal_range || "—", cols.ref, y + 5.2);

    // Status badge
    const statusLabel = isAbn ? "ABNORMAL" : "NORMAL";
    const badgeFill = isAbn ? "#fee2e2" : "#dcfce7";
    const badgeText = isAbn ? "#991b1b" : "#166534";
    const badgeX = cols.status;
    const badgeW = 22;
    const badgeH = 5;
    fill(badgeFill);
    stroke(isAbn ? "#fca5a5" : "#86efac");
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, y + 1.5, badgeW, badgeH, 1, 1, "FD");
    bold(6.5);
    textColor(badgeText);
    doc.text(statusLabel, badgeX + badgeW / 2, y + 5.1, { align: "center" });

    y += rowH;
  });

  // ── RESULT NOTES ───────────────────────────────────────────────
  // (only if the caller passes notes through — we embed via closure trick below)
  y += 6;

  // ── SUMMARY STRIP ─────────────────────────────────────────────
  const abnCount = rows.filter((r) => r.is_abnormal).length;
  fill(abnCount > 0 ? "#fff5f5" : "#f0fdf4");
  stroke(abnCount > 0 ? "#fca5a5" : "#86efac");
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, colW, 9, 2, 2, "FD");

  bold(8);
  textColor(abnCount > 0 ? "#b91c1c" : "#166534");
  const summaryText =
    abnCount > 0
      ? `${abnCount} parameter${abnCount > 1 ? "s" : ""} outside reference range — clinical review recommended`
      : "All parameters within reference range";
  doc.text(summaryText, margin + colW / 2, y + 5.8, { align: "center" });

  y += 15;

  // ── FOOTER ────────────────────────────────────────────────────
  // Separator
  stroke("#d0dff0");
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Signature / authority block
  const sigCols = [margin, margin + 60, margin + 120];
  sigCols.forEach((sx, idx) => {
    stroke("#94a3b8");
    doc.setLineWidth(0.4);
    doc.line(sx, y + 10, sx + 45, y + 10);
    normal(7);
    textColor("#94a3b8");
    const sigLabels = ["Lab Technician", "Pathologist", "Authorized By"];
    doc.text(sigLabels[idx], sx + 22.5, y + 14, { align: "center" });
  });

  y += 20;

  // Disclaimer
  fill("#f1f5f9");
  doc.rect(margin, y, colW, 14, "F");
  light(6.5);
  textColor("#94a3b8");
  const disclaimer =
    "This report is generated electronically and is valid without a physical signature. Results should be " +
    "interpreted by a qualified medical professional in conjunction with clinical findings. For queries, " +
    `contact ${booking.lab_name || "the laboratory"}.`;
  const lines = doc.splitTextToSize(disclaimer, colW - 8);
  doc.text(lines, margin + 4, y + 5);

  // Page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    normal(7);
    textColor("#94a3b8");
    doc.text(`Page ${p} of ${pageCount}`, W - margin, 291, { align: "right" });
  }

  return doc.output("blob");
}

function CompleteBookingModal({
  booking,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  booking: LabBooking;
  onClose: () => void;
  onSubmit: (payload: {
    reportFile: File;
    resultNotes?: string;
    parameterResults: LabTestParameterResult[];
  }) => void;
  isSubmitting: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [resultNotes, setResultNotes] = useState("");
  const { data: parameters = [], isLoading } = useQuery<TestParameter[], Error>(
    {
      queryKey: ["testParameters", booking.test_id],
      queryFn: () =>
        fetchTestParameters({ test_id: booking.test_id, limit: 100 }),
      staleTime: 60 * 1000,
    },
  );

  const submit = async () => {
    const parameterResults: LabTestParameterResult[] = parameters.map((p) => {
      const val = values[String(p.parameter_id)] || "";
      return {
        parameter_id: p.parameter_id,
        parameter_name: p.parameter_name,
        unit: p.unit,
        normal_range: p.normal_range,
        patient_value: val,
        is_abnormal: isAbnormalValue(p.normal_range, val),
      };
    });
    const missing = parameterResults.find((r) => !r.patient_value.trim());
    if (missing) return;
    const blob = generateResultPdf(booking, parameterResults);
    const reportFile = new File(
      [blob],
      `lab-report-${booking.booking_id}.pdf`,
      {
        type: "application/pdf",
      },
    );
    onSubmit({ reportFile, resultNotes, parameterResults });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          maxHeight: "92vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ margin: 0, color: "#1a3c6e" }}>
          Complete booking and generate report
        </h3>
        <p style={{ margin: "6px 0 14px", color: "#64748b", fontSize: 13 }}>
          {booking.test_name} - {booking.patient?.full_name || "Patient"}
        </p>
        {isLoading ? (
          <p style={{ color: "#64748b" }}>Loading parameters...</p>
        ) : parameters.length === 0 ? (
          <p style={{ color: "#dc2626" }}>
            No test parameters configured for this test.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {parameters.map((p) => {
              const k = String(p.parameter_id);
              const v = values[k] || "";
              const abnormal = isAbnormalValue(p.normal_range, v);
              return (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 0.8fr 1fr 0.9fr",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#334155" }}>
                    {p.parameter_name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {p.unit || "—"}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {p.normal_range || "—"}
                  </div>
                  <input
                    value={v}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [k]: e.target.value }))
                    }
                    placeholder="Value"
                    style={{
                      border: `1px solid ${abnormal ? "#ef4444" : "#cbd5e1"}`,
                      color: abnormal ? "#b91c1c" : "#0f172a",
                      borderRadius: 6,
                      padding: "7px 9px",
                      fontWeight: abnormal ? 700 : 500,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <textarea
          value={resultNotes}
          onChange={(e) => setResultNotes(e.target.value)}
          placeholder="Optional remarks"
          rows={3}
          style={{
            marginTop: 14,
            width: "100%",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: 10,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting || isLoading || parameters.length === 0}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #1d4ed8",
              background: "#1d4ed8",
              color: "#fff",
              cursor: "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Submitting..." : "Generate PDF and Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid #d0dff0",
        padding: "60px 32px",
        textAlign: "center",
        color: "#6b87a8",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          margin: "0 0 6px",
          color: "#334155",
        }}
      >
        {title}
      </p>
      <p style={{ fontSize: 13, margin: 0 }}>{subtitle}</p>
    </div>
  );
}

export default LabBookingsPage;
