import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, ChevronLeft, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { handleApiError } from "../services/api";
import {
  bookAppointment,
  getDoctorSlots,
  getDoctorsList,
} from "../services/doctor_api";
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
      getDoctorSlots(selectedDoctor!.doctor_id, toISODate(selectedDate)),
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

  // ── Doctor-list view ───────────────────────────────────────────────────────

  if (!selectedDoctor) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#e8f0f7",
        }}
      >
        <Header setIsSidebarOpen={setSidebarOpen} />
        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "4px",
              color: "#1a3c6e",
            }}
          >
            Book an Appointment
          </h1>
          <p
            style={{ color: "#555555", marginBottom: "24px", fontSize: "14px" }}
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
              size={17}
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#555555",
              }}
            />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: "8px",
                border: "1px solid #d0dff0",
                backgroundColor: "#ffffff",
                color: "#1a3c6e",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid #36454F";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(244,121,32,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid #d0dff0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {doctorsLoading ? (
            <p style={{ color: "#555555" }}>Loading doctors...</p>
          ) : doctorsError ? (
            <p style={{ color: "#dc2626" }}>
              Failed to load doctors. Please refresh.
            </p>
          ) : filteredDoctors.length === 0 ? (
            <p style={{ color: "#555555" }}>No verified doctors found.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.doctor_id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setSelectedDate(new Date());
                  }}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #d0dff0",
                    padding: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#2e5fa3";
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 4px 16px rgba(26,60,110,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "#d0dff0";
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 2px 8px rgba(26,60,110,0.07)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#1a3c6e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {doc.full_name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "15px",
                          color: "#1a3c6e",
                        }}
                      >
                        {doc.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#555555",
                          marginTop: "2px",
                        }}
                      >
                        {doc.experience_years} yrs experience
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    {(doc.specializations ?? []).map((s) => (
                      <span
                        key={s.specialization}
                        style={{
                          display: "inline-block",
                          padding: "2px 9px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: "#e8f0f7",
                          color: "#2e5fa3",
                          marginRight: "5px",
                          marginBottom: "4px",
                          border: "1px solid #d0dff0",
                        }}
                      >
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
                    }}
                  >
                    <span style={{ color: "#555555" }}>
                      ₹{doc.consultation_fee || "N/A"}
                    </span>
                    <span style={{ color: "#36454F", fontWeight: 600 }}>
                      View Slots →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // ── Slot-selection view ────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#e8f0f7",
      }}
    >
      <Header setIsSidebarOpen={setSidebarOpen} />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Back */}
        <button
          onClick={() => setSelectedDoctor(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            color: "#36454F",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#d4651a")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#36454F")}
        >
          <ChevronLeft size={17} /> Back to Doctors
        </button>

        {/* Doctor info card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #d0dff0",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#1a3c6e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
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
                fontSize: "18px",
                fontWeight: 700,
                color: "#1a3c6e",
              }}
            >
              {selectedDoctor.full_name}
            </h2>
            <div
              style={{ fontSize: "13px", color: "#555555", marginTop: "3px" }}
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
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "#1a3c6e",
          }}
        >
          <Calendar size={16} style={{ color: "#36454F" }} /> Select Date
        </h3>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
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
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: active ? "2px solid #1a3c6e" : "1px solid #d0dff0",
                  backgroundColor: active ? "#1a3c6e" : "#ffffff",
                  color: active ? "#ffffff" : "#555555",
                  cursor: "pointer",
                  textAlign: "center",
                  minWidth: "64px",
                  transition: "all 0.18s",
                  boxShadow: active ? "0 2px 8px rgba(26,60,110,0.18)" : "none",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 500 }}>
                  {DAYS[d.getDay()]}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: "10px" }}>
                  {d.toLocaleString("default", { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Slots */}
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "#1a3c6e",
          }}
        >
          <Clock size={16} style={{ color: "#36454F" }} /> Available Slots
        </h3>

        {slotsLoading ? (
          <p style={{ color: "#555555", fontSize: "14px" }}>Loading slots...</p>
        ) : slotsError ? (
          <p style={{ color: "#dc2626", fontSize: "14px" }}>
            Failed to load slots. Please try again.
          </p>
        ) : slots.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d0dff0",
              borderRadius: "10px",
              padding: "40px",
              textAlign: "center",
              color: "#555555",
            }}
          >
            <Calendar
              size={36}
              style={{ marginBottom: "10px", color: "#d0dff0" }}
            />
            <p style={{ margin: 0, fontWeight: 500, color: "#1a3c6e" }}>
              No available slots for this date.
            </p>
            <p style={{ fontSize: "13px", marginTop: "4px", color: "#555555" }}>
              Try selecting a different date.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "10px",
            }}
          >
            {slots.map((slot) => (
              <button
                key={slot.slot_id}
                onClick={() => setBookingSlot(slot)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #d0dff0",
                  backgroundColor: "#ffffff",
                  color: "#1a3c6e",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  transition: "all 0.18s",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(26,60,110,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#e8f0f7";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#2e5fa3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#ffffff";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#d0dff0";
                }}
              >
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {bookingSlot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,60,110,0.35)",
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
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #d0dff0",
              padding: "28px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 8px 32px rgba(26,60,110,0.14)",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a3c6e",
                }}
              >
                Confirm Booking
              </h3>
              <button
                onClick={() => setBookingSlot(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555555",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1a3c6e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary card */}
            <div
              style={{
                backgroundColor: "#e8f0f7",
                border: "1px solid #d0dff0",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#555555",
                  marginBottom: "2px",
                }}
              >
                Doctor
              </div>
              <div
                style={{ fontWeight: 600, color: "#1a3c6e", fontSize: "14px" }}
              >
                {selectedDoctor.full_name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#555555",
                  marginTop: "10px",
                  marginBottom: "2px",
                }}
              >
                Date &amp; Time
              </div>
              <div
                style={{ fontWeight: 600, color: "#36454F", fontSize: "14px" }}
              >
                {bookingSlot.slot_date} • {formatTime(bookingSlot.start_time)} –{" "}
                {formatTime(bookingSlot.end_time)}
              </div>
            </div>

            {/* Appointment type */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  fontSize: "13px",
                  color: "#555555",
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 500,
                }}
              >
                Appointment Type
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["in_person", "online"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAppointmentType(t)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: "8px",
                      border:
                        appointmentType === t
                          ? "2px solid #1a3c6e"
                          : "1px solid #d0dff0",
                      backgroundColor:
                        appointmentType === t ? "#1a3c6e" : "#ffffff",
                      color: appointmentType === t ? "#ffffff" : "#555555",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                      transition: "all 0.18s",
                    }}
                  >
                    {t === "in_person" ? "🏥 In-Person" : "💻 Online"}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  fontSize: "13px",
                  color: "#555555",
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 500,
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
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d0dff0",
                  backgroundColor: "#f9fbfd",
                  color: "#1a3c6e",
                  resize: "vertical",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid #36454F";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(244,121,32,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid #d0dff0";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </div>

            <button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: bookMutation.isPending ? "#a0aec0" : "#1a3c6e",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: bookMutation.isPending ? "not-allowed" : "pointer",
                transition: "background 0.18s",
                boxShadow: "0 4px 12px rgba(26,60,110,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!bookMutation.isPending)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#2e5fa3";
              }}
              onMouseLeave={(e) => {
                if (!bookMutation.isPending)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#1a3c6e";
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
