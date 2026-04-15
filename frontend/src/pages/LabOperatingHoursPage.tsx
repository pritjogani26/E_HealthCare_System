// frontend/src/pages/LabOperatingHoursPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Clock, FlaskConical, Save, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { Toaster } from "react-hot-toast";
import { getLabOperatingHours, updateLabOperatingHours } from "../services/lab_api";
import { LabOperatingHour } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Backend day_of_week convention:  0 = Sunday … 6 = Saturday
 * Display order starts from Monday for a natural week view.
 */
const DAY_MAP: { label: string; dbDay: number }[] = [
  { label: "Monday", dbDay: 1 },
  { label: "Tuesday", dbDay: 2 },
  { label: "Wednesday", dbDay: 3 },
  { label: "Thursday", dbDay: 4 },
  { label: "Friday", dbDay: 5 },
  { label: "Saturday", dbDay: 6 },
  { label: "Sunday", dbDay: 0 },
];

interface EditableHour {
  dbDay: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

function buildDefaultHours(existing: LabOperatingHour[]): EditableHour[] {
  return DAY_MAP.map(({ dbDay }) => {
    const found = existing.find((h) => h.day_of_week === dbDay);
    return found
      ? {
          dbDay,
          open_time: found.open_time ?? "09:00",
          close_time: found.close_time ?? "18:00",
          is_closed: found.is_closed ?? false,
        }
      : { dbDay, open_time: "09:00", close_time: "18:00", is_closed: true };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const LabOperatingHoursPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<EditableHour[]>(buildDefaultHours([]));

  // ── Fetch existing hours ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const existing = await getLabOperatingHours();
        setHours(buildDefaultHours(existing));
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load operating hours",
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const updateHour = useCallback(
    (dbDay: number, field: keyof EditableHour, value: string | boolean) => {
      setHours((prev) =>
        prev.map((h) => (h.dbDay === dbDay ? { ...h, [field]: value } : h)),
      );
    },
    [],
  );

  const toggleDay = (dbDay: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dbDay === dbDay ? { ...h, is_closed: !h.is_closed } : h,
      ),
    );
  };

  /** Total open hours across the week */
  const totalWeeklyHours = hours.reduce((sum, h) => {
    if (h.is_closed || !h.open_time || !h.close_time) return sum;
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    const mins = (ch * 60 + cm) - (oh * 60 + om);
    return sum + (mins > 0 ? mins / 60 : 0);
  }, 0);

  const activeDays = hours.filter((h) => !h.is_closed).length;

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    for (const h of hours) {
      if (!h.is_closed) {
        if (!h.open_time || !h.close_time) {
          toast.error("Please set open and close times for all active days.");
          return;
        }
        if (h.open_time >= h.close_time) {
          const label =
            DAY_MAP.find((d) => d.dbDay === h.dbDay)?.label ?? "day";
          toast.error(
            `Open time must be before close time on ${label}.`,
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: LabOperatingHour[] = hours.map((h) => ({
        day_of_week: h.dbDay,
        open_time: h.is_closed ? "00:00" : h.open_time,
        close_time: h.is_closed ? "00:00" : h.close_time,
        is_closed: h.is_closed,
      }));

      const updated = await updateLabOperatingHours(payload);
      setHours(buildDefaultHours(updated));
      toast.success(
        "Operating hours saved and slots regenerated successfully!",
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save operating hours",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Shared input styles (mirrors DoctorSchedulePage) ─────────────────────
  const inputStyle: React.CSSProperties = {
    border: "1px solid #d0dff0",
    backgroundColor: "#ffffff",
    color: "#1a3c6e",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid #36454F";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(244,121,32,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid #d0dff0";
    e.currentTarget.style.boxShadow = "none";
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#e8f0f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: "#1a3c6e" }}
        />
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e8f0f7",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 72, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "system-ui, sans-serif",
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-1 flex items-center gap-2"
            style={{ color: "#1a3c6e" }}
          >
            <FlaskConical className="w-6 h-6" style={{ color: "#36454F" }} />
            Operating Hours
          </h1>
          <p className="text-sm" style={{ color: "#555555" }}>
            Configure your lab's weekly opening schedule. Changes automatically
            update available booking slots for patients.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Day grid ───────────────────────────────────────────── */}
          <div
            className="p-5"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d0dff0",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(26,60,110,0.07)",
            }}
          >
            <h2
              className="text-base font-semibold mb-4 flex items-center gap-2"
              style={{ color: "#1a3c6e" }}
            >
              <Clock className="w-5 h-5" style={{ color: "#36454F" }} />
              Weekly Schedule
            </h2>

            <div className="space-y-2.5">
              {DAY_MAP.map(({ label, dbDay }) => {
                const h = hours.find((x) => x.dbDay === dbDay)!;
                const isOpen = !h.is_closed;

                // Compute daily hours for the badge
                let dayHours = 0;
                if (isOpen && h.open_time && h.close_time) {
                  const [oh, om] = h.open_time.split(":").map(Number);
                  const [ch, cm] = h.close_time.split(":").map(Number);
                  const mins = ch * 60 + cm - (oh * 60 + om);
                  dayHours = mins > 0 ? mins / 60 : 0;
                }

                return (
                  <div
                    key={dbDay}
                    className="rounded-lg transition-colors"
                    style={{
                      border: isOpen
                        ? "1px solid #2e5fa3"
                        : "1px solid #d0dff0",
                      backgroundColor: isOpen ? "#f0f5fc" : "#f9fbfd",
                    }}
                  >
                    {/* Day header toggle */}
                    <button
                      type="button"
                      onClick={() => toggleDay(dbDay)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                          style={
                            isOpen
                              ? {
                                  borderColor: "#1a3c6e",
                                  backgroundColor: "#1a3c6e",
                                }
                              : {
                                  borderColor: "#d0dff0",
                                  backgroundColor: "#ffffff",
                                }
                          }
                        >
                          {isOpen && (
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
                          className="font-medium text-sm"
                          style={{ color: isOpen ? "#1a3c6e" : "#555555" }}
                        >
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOpen && dayHours > 0 ? (
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: "#e8f0f7",
                              color: "#1a3c6e",
                            }}
                          >
                            {dayHours.toFixed(1)} hrs open
                          </span>
                        ) : !isOpen ? (
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            Closed
                          </span>
                        ) : null}
                      </div>
                    </button>

                    {/* Time inputs (only when open) */}
                    {isOpen && (
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                        {/* Open time */}
                        <div>
                          <label
                            className="block text-xs mb-1"
                            style={{ color: "#555555" }}
                          >
                            Open Time
                          </label>
                          <input
                            id={`open-${dbDay}`}
                            type="time"
                            value={h.open_time}
                            onChange={(e) =>
                              updateHour(dbDay, "open_time", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg outline-none transition-shadow"
                            style={inputStyle}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            required={isOpen}
                          />
                        </div>

                        {/* Close time */}
                        <div>
                          <label
                            className="block text-xs mb-1"
                            style={{ color: "#555555" }}
                          >
                            Close Time
                          </label>
                          <input
                            id={`close-${dbDay}`}
                            type="time"
                            value={h.close_time}
                            onChange={(e) =>
                              updateHour(dbDay, "close_time", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg outline-none transition-shadow"
                            style={inputStyle}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            required={isOpen}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Weekly summary ─────────────────────────────────────── */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "#1a3c6e",
              boxShadow: "0 4px 16px rgba(26,60,110,0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-medium mb-1 text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Weekly Availability Summary
                </p>
                <h3 className="text-3xl font-bold text-white">
                  {totalWeeklyHours.toFixed(1)} hrs
                </h3>
                <p
                  className="text-xs mt-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Across {activeDays} open day
                  {activeDays !== 1 ? "s" : ""} · 1 slot / hr generated
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* ── Info note ──────────────────────────────────────────── */}
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
            }}
          >
            <strong>Note:</strong> Saving will delete future unbooked slots and
            regenerate new ones based on these hours (next 30 days, 1-hour
            intervals). Slots that already have bookings are preserved.
          </div>

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  const existing = await getLabOperatingHours();
                  setHours(buildDefaultHours(existing));
                  toast.success("Hours refreshed.");
                } catch {
                  toast.error("Failed to refresh.");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
              style={{
                border: "1px solid #d0dff0",
                backgroundColor: "#ffffff",
                color: "#555555",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#f0f5fc";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#ffffff";
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Discard Changes
            </button>

            <button
              type="submit"
              disabled={saving}
              id="save-operating-hours"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200"
              style={{
                backgroundColor: saving ? "#a0aec0" : "#1a3c6e",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 12px rgba(26,60,110,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!saving)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#2e5fa3";
              }}
              onMouseLeave={(e) => {
                if (!saving)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#1a3c6e";
              }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Regenerate Slots
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default LabOperatingHoursPage;
