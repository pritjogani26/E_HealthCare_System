// src/pages/DoctorAppointmentsPage.tsx

import React, { useEffect, useState } from "react";
import { Calendar, Clock, RefreshCw, User } from "lucide-react";
import { useNavigate } from "react-router-dom";          // ← add
import { handleApiError } from "../services/api";
import {
  cancelAppointment,
  getDoctorAppointments,
} from "../services/doctor_api";
import { DoctorAppointment } from "../types";
import toast from "react-hot-toast";
import { PageHeader } from "../components/common/PageHeader";
import { FilterTabs } from "../components/common/FilterTabs";
import PaymentButton from "../components/PaymentButton";
import { useAuth } from "../context/AuthContext";         // ← add

const statusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  confirmed: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  cancelled: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  completed: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  no_show: { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
};

function formatTime(t: string | null): string {
  if (!t) return "--";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
  { id: "completed", label: "Completed" },
];

const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const navigate = useNavigate();          // ← add
  const { user } = useAuth();              // ← add

  const load = async () => {
    setLoading(true);
    try {
      setAppointments(await getDoctorAppointments());
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled.");
      load();
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setCancellingId(null);
    }
  };

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  // Group by date for a calendar-like view
  const grouped: Record<string, DoctorAppointment[]> = {};
  filtered.forEach((a) => {
    const key = a.slot_date || "Unscheduled";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  return (
    <>
      {/* Page header — matches AdminDoctorsPage / MyAppointmentsPage pattern */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <PageHeader
          title="Patient Appointments"
          description={`${appointments.length} total appointment${appointments.length !== 1 ? "s" : ""}`}
        />
        <button
          onClick={load}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 18px",
            borderRadius: "8px",
            border: "1px solid #d0dff0",
            background: "#ffffff",
            color: "#1a3c6e",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 1px 3px rgba(26,60,110,0.07)",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f0f7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <RefreshCw size={15} color="#36454F" />
          Refresh
        </button>
      </div>

      {/* Filter tabs — reuses shared FilterTabs component */}
      <FilterTabs
        tabs={FILTER_TABS}
        activeTab={filter}
        onTabChange={setFilter}
      />

      {/* Content */}
      {loading ? (
        <p style={{ color: "#6b87a8", padding: "12px 0" }}>
          Loading appointments…
        </p>
      ) : Object.keys(grouped).length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #d0dff0",
            padding: "60px 32px",
            textAlign: "center",
            color: "#6b87a8",
            boxShadow: "0 1px 4px rgba(26,60,110,0.06)",
          }}
        >
          <Calendar
            size={44}
            color="#d0dff0"
            style={{ marginBottom: "12px" }}
          />
          <p style={{ fontSize: "15px", margin: 0 }}>No appointments found.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, apts]) => (
            <div key={date} style={{ marginBottom: "28px" }}>
              {/* Date group heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Calendar size={15} color="#1a3c6e" />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1a3c6e",
                  }}
                >
                  {date}
                </span>
                <span style={{ fontSize: "12px", color: "#9bb3cc" }}>
                  ({apts.length} appointment{apts.length !== 1 ? "s" : ""})
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {apts.map((apt) => {
                  const sc = statusColors[apt.status] || statusColors.pending;

                  // ── Payment helpers ───────────────────────────────────────
                  const fee = apt.consultation_fee
                    ? parseFloat(String(apt.consultation_fee))
                    : 0;
                  const feeLabel = fee > 0 ? `Pay ₹${fee}` : "Pay";
                  // ─────────────────────────────────────────────────────────

                  return (
                    <div
                      key={apt.appointment_id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #d0dff0",
                        padding: "18px 20px",
                        boxShadow: "0 1px 4px rgba(26,60,110,0.06)",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 4px 14px rgba(26,60,110,0.10)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 1px 4px rgba(26,60,110,0.06)")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        {/* Left: avatar + patient info */}
                        <div
                          style={{
                            display: "flex",
                            gap: "14px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "46px",
                              height: "46px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #1a3c6e, #2e5fa3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <User size={20} color="#ffffff" />
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "15px",
                                color: "#1a3c6e",
                                marginBottom: "3px",
                              }}
                            >
                              {apt.patient_email}
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                color: "#6b87a8",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              <Clock size={12} color="#36454F" />
                              <span>
                                {formatTime(apt.start_time)} –{" "}
                                {formatTime(apt.end_time)}
                              </span>
                              <span
                                style={{ margin: "0 4px", color: "#d0dff0" }}
                              >
                                |
                              </span>
                              <span>
                                {apt.appointment_type === "in_person"
                                  ? "In-Person"
                                  : "Online"}
                              </span>
                            </div>

                            {apt.reason && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#9bb3cc",
                                  marginTop: "3px",
                                }}
                              >
                                Reason: {apt.reason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: status badge + actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: sc.bg,
                              color: sc.text,
                              border: `1px solid ${sc.border}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {apt.status.charAt(0).toUpperCase() +
                              apt.status.slice(1).replace("_", " ")}
                          </span>

                          {(apt.status === "confirmed" ||
                            apt.status === "pending") && (
                            <>
                              {/* ── PaymentButton: all props now resolved ── */}
                              <PaymentButton
                                paymentFor="APPOINTMENT"
                                referenceId={apt.appointment_id}
                                label={feeLabel}
                                patientName={user?.email ?? ""}
                                patientEmail={user?.email ?? ""}
                                patientPhone=""
                                onSuccess={() => {
                                  toast.success("Payment successful!");
                                  navigate(
                                    `/appointments/${apt.appointment_id}/confirmed`
                                  );
                                  load();
                                }}
                                onError={(msg) => toast.error(msg)}
                              />
                              {/* ────────────────────────────────────────── */}

                              <button
                                onClick={() => handleCancel(apt.appointment_id)}
                                disabled={cancellingId === apt.appointment_id}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "7px",
                                  border: "1px solid #fecaca",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  cursor:
                                    cancellingId === apt.appointment_id
                                      ? "not-allowed"
                                      : "pointer",
                                  fontWeight: 600,
                                  fontSize: "12px",
                                  opacity:
                                    cancellingId === apt.appointment_id
                                      ? 0.6
                                      : 1,
                                  transition: "background 0.15s",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  if (cancellingId !== apt.appointment_id)
                                    e.currentTarget.style.background =
                                      "#fee2e2";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#fef2f2";
                                }}
                              >
                                {cancellingId === apt.appointment_id
                                  ? "Cancelling…"
                                  : "Cancel"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </>
  );
};

export default DoctorAppointmentsPage;