// src/pages/MyAppointmentsPage.tsx

import React, { useEffect, useState } from "react";
import {
    Calendar,
    Clock,
    RefreshCw,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { handleApiError } from "../services/api";
import { cancelAppointment, getMyAppointments } from "../services/doctor_api";
import { DoctorAppointment } from "../types";
import toast from "react-hot-toast";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    confirmed: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
    pending:   { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    cancelled: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    completed: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
    no_show:   { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
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
            setAppointments(await getMyAppointments());
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
            await cancelAppointment(id);
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

    return (
        <div style={{
            display: "flex", flexDirection: "column", minHeight: "100vh",
            background: "#e8f0f7",
            color: "#555555",
        }}>
            <Header setIsSidebarOpen={setSidebarOpen} />

            <div style={{ flex: 1, display: "flex" }}>
                <div style={{ flex: 1, padding: "32px", overflowY: "auto", maxWidth: "960px", margin: "0 auto", width: "100%" }}>

                    {/* Page header */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: "28px", flexWrap: "wrap", gap: "12px",
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: "26px", fontWeight: 700, margin: 0,
                                color: "#1a3c6e", letterSpacing: "-0.3px",
                            }}>
                                My Appointments
                            </h1>
                            <p style={{ color: "#6b87a8", margin: "4px 0 0", fontSize: "14px" }}>
                                {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <button
                            onClick={load}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "9px 18px", borderRadius: "8px",
                                border: "1px solid #d0dff0",
                                background: "#ffffff",
                                color: "#1a3c6e",
                                cursor: "pointer", fontWeight: 600, fontSize: "14px",
                                boxShadow: "0 1px 3px rgba(26,60,110,0.07)",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#e8f0f7")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                        >
                            <RefreshCw size={15} color="#36454F" />
                            Refresh
                        </button>
                    </div>

                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                        {["all", "confirmed", "pending", "cancelled", "completed"].map((f) => {
                            const active = filter === f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: "7px 18px",
                                        borderRadius: "20px",
                                        border: active ? "2px solid #1a3c6e" : "1px solid #d0dff0",
                                        background: active ? "#1a3c6e" : "#ffffff",
                                        color: active ? "#ffffff" : "#555555",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        textTransform: "capitalize",
                                        transition: "all 0.15s",
                                        boxShadow: active ? "0 2px 6px rgba(26,60,110,0.18)" : "none",
                                    }}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <p style={{ color: "#6b87a8", padding: "12px 0" }}>Loading appointments…</p>
                    ) : filtered.length === 0 ? (
                        <div style={{
                            background: "#ffffff", borderRadius: "12px",
                            border: "1px solid #d0dff0",
                            padding: "60px 32px", textAlign: "center",
                            color: "#6b87a8",
                        }}>
                            <Calendar size={44} color="#d0dff0" style={{ marginBottom: "12px" }} />
                            <p style={{ fontSize: "15px", margin: 0 }}>No appointments found.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {filtered.map((apt) => {
                                const sc = statusColors[apt.status] || statusColors.pending;
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
                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,60,110,0.10)")}
                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,60,110,0.06)")}
                                    >
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            alignItems: "center", flexWrap: "wrap", gap: "12px",
                                        }}>
                                            {/* Left: avatar + info */}
                                            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                                <div style={{
                                                    width: "46px", height: "46px", borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #1a3c6e, #2e5fa3)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "17px", fontWeight: 700, color: "#ffffff",
                                                    flexShrink: 0, letterSpacing: "0.5px",
                                                }}>
                                                    {apt.doctor_name?.charAt(0) || "D"}
                                                </div>

                                                <div>
                                                    <div style={{
                                                        fontWeight: 600, fontSize: "15px",
                                                        color: "#1a3c6e", marginBottom: "3px",
                                                    }}>
                                                        {apt.doctor_name}
                                                    </div>

                                                    <div style={{
                                                        fontSize: "13px", color: "#6b87a8",
                                                        display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap",
                                                    }}>
                                                        <Calendar size={12} color="#36454F" />
                                                        <span>{apt.slot_date || "—"}</span>
                                                        <span style={{ margin: "0 4px", color: "#d0dff0" }}>|</span>
                                                        <Clock size={12} color="#36454F" />
                                                        <span>{formatTime(apt.start_time)} – {formatTime(apt.end_time)}</span>
                                                    </div>

                                                    <div style={{ fontSize: "12px", color: "#9bb3cc", marginTop: "3px" }}>
                                                        {apt.appointment_type === "in_person" ? "In-Person" : "Online"}
                                                        {apt.reason && (
                                                            <span style={{ color: "#b0c4d8" }}> · {apt.reason}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: status badge + cancel */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{
                                                    padding: "4px 12px", borderRadius: "20px",
                                                    fontSize: "12px", fontWeight: 600,
                                                    background: sc.bg, color: sc.text,
                                                    border: `1px solid ${sc.border}`,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace("_", " ")}
                                                </span>

                                                {(apt.status === "confirmed" || apt.status === "pending") && (
                                                    <button
                                                        onClick={() => handleCancel(apt.appointment_id)}
                                                        disabled={cancellingId === apt.appointment_id}
                                                        style={{
                                                            padding: "6px 14px", borderRadius: "7px",
                                                            border: "1px solid #fecaca",
                                                            background: "#fef2f2",
                                                            color: "#dc2626",
                                                            cursor: cancellingId === apt.appointment_id ? "not-allowed" : "pointer",
                                                            fontWeight: 600, fontSize: "12px",
                                                            opacity: cancellingId === apt.appointment_id ? 0.6 : 1,
                                                            transition: "background 0.15s",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                        onMouseEnter={e => { if (cancellingId !== apt.appointment_id) e.currentTarget.style.background = "#fee2e2"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; }}
                                                    >
                                                        {cancellingId === apt.appointment_id ? "Cancelling…" : "Cancel"}
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