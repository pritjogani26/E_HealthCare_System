// src/pages/MyAppointmentsPage.tsx

import React, { useEffect, useState } from "react";
import {
    Calendar,
    Clock,
    RefreshCw,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService, handleApiError } from "../services/api";
import { DoctorAppointment } from "../types";
import toast from "react-hot-toast";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    confirmed: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.35)" },
    pending: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "rgba(251,191,36,0.35)" },
    cancelled: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.35)" },
    completed: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.35)" },
    no_show: { bg: "rgba(156,163,175,0.12)", text: "#9ca3af", border: "rgba(156,163,175,0.35)" },
};

function formatTime(t: string | null): string {
    if (!t) return "--";
    const [h, m] = t.split(":");
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

const MyAppointmentsPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const load = async () => {
        setLoading(true);
        try {
            setAppointments(await apiService.getMyAppointments());
        } catch (e) {
            toast.error(handleApiError(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCancel = async (id: number) => {
        if (!window.confirm("Cancel this appointment?")) return;
        setCancellingId(id);
        try {
            await apiService.cancelAppointment(id);
            toast.success("Appointment cancelled.");
            load();
        } catch (e) {
            toast.error(handleApiError(e));
        } finally {
            setCancellingId(null);
        }
    };

    const filtered = filter === "all"
        ? appointments
        : appointments.filter((a) => a.status === filter);

    const pageStyle: React.CSSProperties = {
        display: "flex", flexDirection: "column", minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)",
        color: "#e0e0e0",
    };
    const cardStyle: React.CSSProperties = {
        background: "rgba(255,255,255,0.06)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "20px",
        transition: "all 0.2s",
    };

    return (
        <div style={pageStyle}>
            <Header setIsSidebarOpen={setSidebarOpen} />
            <div style={{ flex: 1, display: "flex" }}>
                {/* <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} /> */}
                <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>My Appointments</h1>
                            <p style={{ color: "#9ca3af", margin: "4px 0 0" }}>
                                {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            onClick={load}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "10px 18px", borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#c4b5fd", cursor: "pointer", fontWeight: 500,
                            }}
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                        {["all", "confirmed", "pending", "cancelled", "completed"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    border: filter === f ? "2px solid #8b5cf6" : "1px solid rgba(255,255,255,0.12)",
                                    background: filter === f ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                                    color: filter === f ? "#c4b5fd" : "#9ca3af",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    textTransform: "capitalize",
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p style={{ color: "#9ca3af" }}>Loading appointments...</p>
                    ) : filtered.length === 0 ? (
                        <div style={{ ...cardStyle, textAlign: "center", padding: "50px", color: "#6b7280" }}>
                            <Calendar size={44} style={{ marginBottom: "12px", opacity: 0.4 }} />
                            <p style={{ fontSize: "16px" }}>No appointments found.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {filtered.map((apt) => {
                                const sc = statusColors[apt.status] || statusColors.pending;
                                return (
                                    <div key={apt.appointment_id} style={cardStyle}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                                            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                                <div style={{
                                                    width: "48px", height: "48px", borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "18px", fontWeight: 700, color: "#fff", flexShrink: 0,
                                                }}>
                                                    {apt.doctor_name?.charAt(0) || "D"}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "16px", color: "#f3f4f6" }}>
                                                        {apt.doctor_name}
                                                    </div>
                                                    <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "2px" }}>
                                                        <Calendar size={13} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                                        {apt.slot_date || "—"}
                                                        <Clock size={13} style={{ marginLeft: "12px", marginRight: "4px", verticalAlign: "middle" }} />
                                                        {formatTime(apt.start_time)} – {formatTime(apt.end_time)}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                                        {apt.appointment_type === "in_person" ? "In-Person" : "Online"}
                                                        {apt.reason && ` • ${apt.reason}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{
                                                    padding: "4px 12px", borderRadius: "20px",
                                                    fontSize: "12px", fontWeight: 600,
                                                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                                }}>
                                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace("_", " ")}
                                                </span>
                                                {(apt.status === "confirmed" || apt.status === "pending") && (
                                                    <button
                                                        onClick={() => handleCancel(apt.appointment_id)}
                                                        disabled={cancellingId === apt.appointment_id}
                                                        style={{
                                                            padding: "6px 14px", borderRadius: "8px",
                                                            border: "1px solid rgba(239,68,68,0.4)",
                                                            background: "rgba(239,68,68,0.1)",
                                                            color: "#f87171", cursor: "pointer",
                                                            fontWeight: 600, fontSize: "12px",
                                                        }}
                                                    >
                                                        {cancellingId === apt.appointment_id ? "..." : "Cancel"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyAppointmentsPage;
