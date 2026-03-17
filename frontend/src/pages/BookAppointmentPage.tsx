import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, ChevronLeft, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { handleApiError } from "../services/api";
import { bookAppointment, getDoctorSlots, getDoctorsList } from "../services/doctor_api";
import { DoctorListItem, AppointmentSlot } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr % 12 || 12}:${m} ${ampm}`;
}

function getNext7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toISODate(d: Date): string {
  // Use local date parts to avoid UTC-offset drift
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

// ── Query-key factory ─────────────────────────────────────────────────────────

const QK = {
  doctors: () => ["doctors"] as const,
  slots: (doctorId: string, date: string) => ["slots", doctorId, date] as const,
};

// ── Component ──────────────────────────────────────────────────────────────────

const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [_sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Slot-selection state
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Booking modal state
  const [bookingSlot, setBookingSlot] = useState<AppointmentSlot | null>(null);
  const [reason, setReason] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "in_person" | "online"
  >("in_person");

  const dates = useMemo(() => getNext7Days(), []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: doctors = [] as DoctorListItem[],
    isLoading: doctorsLoading,
    isError: doctorsError,
    error: doctorsQueryError,
  } = useQuery<DoctorListItem[], Error>({
    queryKey: QK.doctors(),
    queryFn: () => getDoctorsList(),
    staleTime: 5 * 60 * 1000,
  });

  // v5: onError removed from useQuery — use useEffect instead
  useEffect(() => {
    if (doctorsQueryError) toast.error(handleApiError(doctorsQueryError));
  }, [doctorsQueryError]);

  const {
    data: slots = [] as AppointmentSlot[],
    isLoading: slotsLoading,
    isError: slotsError,
    error: slotsQueryError,
  } = useQuery<AppointmentSlot[], Error>({
    queryKey: QK.slots(
      selectedDoctor?.doctor_id ?? "",
      toISODate(selectedDate),
    ),
    queryFn: () =>
      getDoctorSlots(
        selectedDoctor!.doctor_id,
        toISODate(selectedDate),
      ),
    enabled: !!selectedDoctor,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (slotsQueryError) toast.error(handleApiError(slotsQueryError));
  }, [slotsQueryError]);

  // ── Mutation ───────────────────────────────────────────────────────────────

  const bookMutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        slot_id: bookingSlot!.slot_id,
        reason,
        appointment_type: appointmentType,
      }),
    onSuccess: () => {
      toast.success("Appointment booked successfully!");
      // Invalidate slots so the booked slot disappears immediately
      queryClient.invalidateQueries({
        queryKey: QK.slots(selectedDoctor!.doctor_id, toISODate(selectedDate)),
      });
      setBookingSlot(null);
      setReason("");
      navigate("/my-appointments");
    },
    onError: (e: unknown) => toast.error(handleApiError(e)),
  });

  // ── Derived / filtered data ────────────────────────────────────────────────

  const filteredDoctors = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        (d.specializations ?? []).some((s) =>
          s.specialization_details?.specialization_name
            ?.toLowerCase()
            .includes(q),
        ),
    );
  }, [search, doctors]);

  // ── Styles ─────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)",
    color: "#e0e0e0",
  };
  const mainStyle: React.CSSProperties = { flex: 1, display: "flex" };
  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
  };
  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.25s ease",
  };
  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    background: "rgba(139,92,246,0.2)",
    color: "#a78bfa",
    marginRight: "6px",
  };

  // ── Doctor-list view ───────────────────────────────────────────────────────

  if (!selectedDoctor) {
    return (
      <div style={pageStyle}>
        <Header setIsSidebarOpen={setSidebarOpen} />
        <div style={mainStyle}>
          <div style={contentStyle}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Book an Appointment
            </h1>
            <p
              style={{
                color: "#9ca3af",
                marginBottom: "24px",
              }}
            >
              Select a doctor to view available time slots
            </p>

            {/* Search */}
            <div
              style={{
                position: "relative",
                maxWidth: "460px",
                marginBottom: "28px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                }}
              />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {doctorsLoading ? (
              <p style={{ color: "#9ca3af" }}>Loading doctors...</p>
            ) : doctorsError ? (
              <p style={{ color: "#f87171" }}>
                Failed to load doctors. Please refresh.
              </p>
            ) : filteredDoctors.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No verified doctors found.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc.doctor_id}
                    style={cardStyle}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setSelectedDate(new Date());
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "rgba(139,92,246,0.5)";
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "rgba(255,255,255,0.1)";
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #8b5cf6, #6366f1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {doc.full_name.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "16px",
                            color: "#f3f4f6",
                          }}
                        >
                          {doc.full_name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#9ca3af",
                          }}
                        >
                          {doc.experience_years} yrs experience
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      {(doc.specializations ?? []).map((s) => (
                        <span key={s.specialization} style={badgeStyle}>
                          {s.specialization_details?.specialization_name ||
                            `Spec #${s.specialization}`}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        color: "#9ca3af",
                      }}
                    >
                      <span>₹{doc.consultation_fee || "N/A"}</span>
                      <span
                        style={{
                          color: "#8b5cf6",
                          fontWeight: 600,
                        }}
                      >
                        View Slots →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Slot-selection view ────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <Header setIsSidebarOpen={setSidebarOpen} />
      <div style={mainStyle}>
        <div style={contentStyle}>
          {/* Back */}
          <button
            onClick={() => setSelectedDoctor(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "#8b5cf6",
              cursor: "pointer",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <ChevronLeft size={18} /> Back to Doctors
          </button>

          {/* Doctor info */}
          <div
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              gap: "18px",
              cursor: "default",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {selectedDoctor.full_name.charAt(0)}
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#f3f4f6",
                }}
              >
                {selectedDoctor.full_name}
              </h2>
              <div
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  marginTop: "4px",
                }}
              >
                {(selectedDoctor.specializations ?? [])
                  .map((s) => s.specialization_details?.specialization_name)
                  .filter(Boolean)
                  .join(", ") || "General"}
                {" • "}₹{selectedDoctor.consultation_fee || "N/A"}
                {" • "}
                {selectedDoctor.experience_years} yrs exp.
              </div>
            </div>
          </div>

          {/* Date picker */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Calendar size={18} /> Select Date
          </h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "28px",
              flexWrap: "wrap",
            }}
          >
            {dates.map((d) => {
              const active = toISODate(d) === toISODate(selectedDate);
              return (
                <button
                  key={toISODate(d)}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "12px",
                    border: active
                      ? "2px solid #8b5cf6"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: active
                      ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))"
                      : "rgba(255,255,255,0.04)",
                    color: active ? "#c4b5fd" : "#9ca3af",
                    cursor: "pointer",
                    textAlign: "center",
                    minWidth: "70px",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {DAYS[d.getDay()]}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                    }}
                  >
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: "11px" }}>
                    {d.toLocaleString("default", {
                      month: "short",
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Slots */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={18} /> Available Slots
          </h3>

          {slotsLoading ? (
            <p style={{ color: "#9ca3af" }}>Loading slots...</p>
          ) : slotsError ? (
            <p style={{ color: "#f87171" }}>
              Failed to load slots. Please try again.
            </p>
          ) : slots.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                cursor: "default",
                textAlign: "center",
                padding: "40px",
                color: "#6b7280",
              }}
            >
              <Calendar
                size={40}
                style={{ marginBottom: "10px", opacity: 0.4 }}
              />
              <p>No available slots for this date.</p>
              <p style={{ fontSize: "13px" }}>
                Try selecting a different date.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "12px",
              }}
            >
              {slots.map((slot) => (
                <button
                  key={slot.slot_id}
                  onClick={() => setBookingSlot(slot)}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(139,92,246,0.3)",
                    background: "rgba(139,92,246,0.08)",
                    color: "#c4b5fd",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(139,92,246,0.2)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(139,92,246,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(139,92,246,0.3)";
                  }}
                >
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking modal */}
      {bookingSlot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setBookingSlot(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1e3a",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "32px",
              width: "100%",
              maxWidth: "460px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  color: "#f3f4f6",
                }}
              >
                Confirm Booking
              </h3>
              <button
                onClick={() => setBookingSlot(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary card */}
            <div
              style={{
                ...cardStyle,
                cursor: "default",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Doctor
              </div>
              <div style={{ fontWeight: 600, color: "#f3f4f6" }}>
                {selectedDoctor.full_name}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginTop: "12px",
                  marginBottom: "4px",
                }}
              >
                Date &amp; Time
              </div>
              <div style={{ fontWeight: 600, color: "#c4b5fd" }}>
                {bookingSlot.slot_date} • {formatTime(bookingSlot.start_time)} –{" "}
                {formatTime(bookingSlot.end_time)}
              </div>
            </div>

            {/* Appointment type */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Appointment Type
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {(["in_person", "online"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAppointmentType(t)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border:
                        appointmentType === t
                          ? "2px solid #8b5cf6"
                          : "1px solid rgba(255,255,255,0.12)",
                      background:
                        appointmentType === t
                          ? "rgba(139,92,246,0.15)"
                          : "rgba(255,255,255,0.04)",
                      color: appointmentType === t ? "#c4b5fd" : "#9ca3af",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {t === "in_person" ? "🏥 In-Person" : "💻 Online"}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  resize: "vertical",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </div>

            <button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: bookMutation.isPending
                  ? "#4b5563"
                  : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: bookMutation.isPending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {bookMutation.isPending ? "Booking..." : "Confirm Appointment"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BookAppointmentPage;
