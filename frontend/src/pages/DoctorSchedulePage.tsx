import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { WorkingDay } from "../types";
import { Clock, Phone, Calendar, Save } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../hooks/useToast";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Build a full 7-entry WorkingDay array (one per day index 0-6) */
function buildWorkingDays(existingDays?: WorkingDay[]): WorkingDay[] {
  return Array.from({ length: 7 }, (_, idx) => {
    const existing = existingDays?.find((d) => d.day_of_week === idx);
    return existing
      ? { ...existing }
      : {
        day_of_week: idx,
        arrival: "",
        leaving: "",
        lunch_start: "",
        lunch_end: "",
      };
  });
}

const DoctorSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [consultationDuration, setConsultationDuration] = useState(30);
  const [appointmentContact, setAppointmentContact] = useState("");
  const [activeDays, setActiveDays] = useState<boolean[]>(Array(7).fill(false));
  const [workingDays, setWorkingDays] =
    useState<WorkingDay[]>(buildWorkingDays());

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await apiService.getDoctorProfile();
      const sch = profile.schedule || {};

      setConsultationDuration(sch.consultation_duration_min || 30);
      setAppointmentContact(sch.appointment_contact || "");

      const serverDays: WorkingDay[] = Array.isArray(sch.working_days)
        ? sch.working_days
        : [];
      const built = buildWorkingDays(serverDays);
      setWorkingDays(built);

      const active = Array.from({ length: 7 }, (_, idx) =>
        serverDays.some((d) => d.day_of_week === idx),
      );
      setActiveDays(active);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Failed to load schedule",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (idx: number) => {
    setActiveDays((prev) => {
      const n = [...prev];
      n[idx] = !n[idx];
      return n;
    });
  };

  const handleTimeChange = (
    dayIdx: number,
    field: "arrival" | "leaving" | "lunch_start" | "lunch_end",
    value: string,
  ) => {
    setWorkingDays((prev) =>
      prev.map((wd) =>
        wd.day_of_week === dayIdx ? { ...wd, [field]: value } : wd,
      ),
    );
  };

  /** Calculate slots for a single WorkingDay */
  const calcSlots = useCallback(
    (wd: WorkingDay): number => {
      if (!wd.arrival || !wd.leaving || consultationDuration <= 0) return 0;
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const start = toMin(wd.arrival);
      const end = toMin(wd.leaving);
      if (end <= start) return 0;
      let avail = end - start;
      if (wd.lunch_start && wd.lunch_end) {
        const ls = toMin(wd.lunch_start);
        const le = toMin(wd.lunch_end);
        if (le > ls && ls >= start && le <= end) avail -= le - ls;
      }
      return avail > 0 ? Math.floor(avail / consultationDuration) : 0;
    },
    [consultationDuration],
  );

  const totalWeeklySlots = workingDays
    .filter((_, idx) => activeDays[idx])
    .reduce((sum, wd) => sum + calcSlots(wd), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedWorkingDays: WorkingDay[] = workingDays
        .filter((_, idx) => activeDays[idx])
        .map((wd) => ({
          day_of_week: wd.day_of_week,
          arrival: wd.arrival || null,
          leaving: wd.leaving || null,
          lunch_start: wd.lunch_start || null,
          lunch_end: wd.lunch_end || null,
        }));

      await apiService.updateDoctorProfile({
        schedule: {
          consultation_duration_min: consultationDuration,
          appointment_contact: appointmentContact || undefined,
          working_days: selectedWorkingDays,
        },
      });
      toast.success("Schedule updated successfully!");
      navigate("/profile");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Failed to update schedule",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <Header setIsSidebarOpen={setIsSidebarOpen} showSidebarToggle={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 72, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "12px",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)",
            padding: "12px 16px",
            maxWidth: "380px",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            duration: 5000,
            style: {
              background: "#fff1f2",
              color: "#9f1239",
              border: "1px solid #fecdd3",
            },
            iconTheme: { primary: "#e11d48", secondary: "#fff1f2" },
          },
        }}
      />
      <Header setIsSidebarOpen={setIsSidebarOpen} showSidebarToggle={false} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Manage Schedule
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure your working hours and consultation settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Workflow & Contact ─────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Workflow &amp;
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Avg. Consultation Time (minutes)
                </label>
                <input
                  type="number"
                  value={consultationDuration}
                  onChange={(e) =>
                    setConsultationDuration(Number(e.target.value))
                  }
                  min="5"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Appointment Inquiry Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={appointmentContact}
                    onChange={(e) => setAppointmentContact(e.target.value)}
                    placeholder="e.g. +91 XXXXX XXXXX"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Working Days ───────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Working Days &amp;
              Hours
            </h2>
            <div className="space-y-3">
              {DAY_NAMES.map((dayName, idx) => {
                const wd = workingDays[idx];
                const isActive = activeDays[idx];
                const slots = isActive ? calcSlots(wd) : 0;

                return (
                  <div
                    key={idx}
                    className={`border rounded-xl transition-colors ${isActive
                      ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-900/10"
                      : "border-slate-200 bg-slate-50 dark:bg-slate-900/30"
                      }`}
                  >
                    {/* Day header toggle */}
                    <button
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}
                        >
                          {isActive && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 12 12"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`font-medium text-sm ${isActive ? "text-slate-800 dark:text-white" : "text-slate-500"}`}
                        >
                          {dayName}
                        </span>
                      </div>
                      {isActive && slots > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          {slots} slots
                        </span>
                      )}
                    </button>

                    {/* Time inputs (shown when day is active) */}
                    {isActive && (
                      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(
                          [
                            "arrival",
                            "leaving",
                            "lunch_start",
                            "lunch_end",
                          ] as const
                        ).map((field) => (
                          <div key={field}>
                            <label className="block text-xs text-slate-500 mb-1 capitalize">
                              {field.replace("_", " ")}
                            </label>
                            <input
                              type="time"
                              value={wd[field] || ""}
                              onChange={(e) =>
                                handleTimeChange(idx, field, e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Weekly Summary ─────────────────────────────────── */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 font-medium mb-1">
                  Estimated Weekly Capacity
                </p>
                <h3 className="text-3xl font-bold">{totalWeeklySlots} Slots</h3>
                <p className="text-xs text-emerald-100 mt-2 opacity-80">
                  Across {activeDays.filter(Boolean).length} working day
                  {activeDays.filter(Boolean).length !== 1 ? "s" : ""}
                  {consultationDuration
                    ? ` · ${consultationDuration} min/consultation`
                    : ""}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 ${saving ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg shadow-emerald-500/20"}`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default DoctorSchedulePage;
