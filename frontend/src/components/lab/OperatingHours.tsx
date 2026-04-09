import React, { useEffect, useState } from "react";
import { Clock, Save, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { getLabProfile, updateLabProfile } from "../../services/lab_api";
import { LabOperatingHour } from "../../types";
import { useToast } from "../../hooks/useToast";

const DAYS = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

export const OperatingHours: React.FC = () => {
  const [hours, setHours] = useState<LabOperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      setLoading(true);
      const profile = await getLabProfile();
      setHours(profile.operating_hours || []);
    } catch (err) {
      toast.error("Failed to load operating hours");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = () => {
    const usedDays = hours.map((h) => h.day_of_week);
    const nextDay = DAYS.find((d) => !usedDays.includes(d.id));
    
    if (nextDay) {
      setHours([
        ...hours,
        {
          day_of_week: nextDay.id,
          open_time: "09:00",
          close_time: "18:00",
          is_closed: false,
        },
      ]);
    } else {
      toast.warning("All days are already added");
    }
  };

  const handleRemoveDay = (index: number) => {
    const newHours = [...hours];
    newHours.splice(index, 1);
    setHours(newHours);
  };

  const handleChange = (index: number, field: keyof LabOperatingHour, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateLabProfile({ operating_hours: hours });
      toast.success("Operating hours updated successfully!");
    } catch (err) {
      toast.error("Failed to update operating hours");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading hours...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Manage Operating Hours
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure your laboratory's daily opening and closing times. These are used to generate booking slots.
          </p>
        </div>
        <button
          onClick={handleAddDay}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Day
        </button>
      </div>

      {hours.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-slate-900 font-semibold mb-1">No Hours Configured</h4>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You haven't set any operating hours yet. Without these, patients won't be able to book tests as no slots can be generated.
          </p>
          <button
            onClick={handleAddDay}
            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            Set Hours Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-lg border border-slate-100">
            <div className="col-span-3">Day</div>
            <div className="col-span-3">Open Time</div>
            <div className="col-span-3">Close Time</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {hours
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((oh, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="col-span-3 font-semibold text-slate-700">
                  <select
                    value={oh.day_of_week}
                    onChange={(e) => handleChange(idx, "day_of_week", parseInt(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {DAYS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={oh.open_time}
                    disabled={oh.is_closed}
                    onChange={(e) => handleChange(idx, "open_time", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={oh.close_time}
                    disabled={oh.is_closed}
                    onChange={(e) => handleChange(idx, "close_time", e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleChange(idx, "is_closed", !oh.is_closed)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                      oh.is_closed
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {oh.is_closed ? "Closed" : "Open"}
                  </button>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemoveDay(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-semibold shadow-lg shadow-slate-200"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
