// frontend/src/components/profile/DoctorProfileDetails.tsx
import React, { useState } from "react";
import {
  User,
  Phone,
  FileText,
  Award,
  Activity,
  Calendar,
  Shield,
  Stethoscope,
  Edit,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DoctorProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";
import EditDoctorProfile from "./EditDoctorProfile";
import { useNavigate } from "react-router";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DoctorProfileDetailsProps {
  profile: DoctorProfile;
  onUpdate?: (updatedProfile: DoctorProfile) => void;
}

export const DoctorProfileDetails: React.FC<DoctorProfileDetailsProps> = ({
  profile,
  onUpdate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const sch = profile.schedule;
  const addr = profile.address || ((profile as any).address_line || (profile as any).city || (profile as any).state || (profile as any).pincode ? {
    address_line: (profile as any).address_line || "",
    city: (profile as any).city || "",
    state: (profile as any).state || "",
    pincode: (profile as any).pincode || "",
  } : null);

  const formatTime = (t?: string | null) => {
    if (!t) return null;
    const parts = t.split(":");
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <>
      {/* ── Core Info ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            Doctor Information
          </h4>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={User} label="Full Name" value={profile.full_name} />
          <InfoRow
            icon={Phone}
            label="Phone Number"
            value={profile.phone_number}
          />
          <InfoRow
            icon={User}
            label="Gender"
            value={profile.gender_details?.gender_value}
          />
          <InfoRow
            icon={FileText}
            label="Registration Number"
            value={profile.registration_number}
          />
          <InfoRow
            icon={Award}
            label="Experience"
            value={`${profile.experience_years} years`}
          />
          <InfoRow
            icon={Activity}
            label="Consultation Fee"
            value={
              profile.consultation_fee
                ? `₹${profile.consultation_fee}`
                : undefined
            }
          />
          <InfoRow
            icon={Calendar}
            label="Joining Date"
            value={
              profile.joining_date
                ? new Date(profile.joining_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : undefined
            }
          />
          <InfoRow
            icon={Shield}
            label="Verification Status"
            value={profile.verification_status_display || profile.verification_status || "Pending"}
          />
        </div>

        {/* Address */}
        {addr && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Clinic Address
            </h5>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 space-y-0.5">
              {addr.address_line && <p>{addr.address_line}</p>}
              <p>
                {[addr.city, addr.state].filter(Boolean).join(", ")}
                {addr.pincode ? ` – ${addr.pincode}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Verification details */}
        {profile.verified_at && (
          <div className="border-t border-slate-100 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow
              icon={Shield}
              label="Verified By"
              value={profile.verified_by_details?.email ?? (profile as any).verified_by_email ?? "System"}
            />
            <InfoRow
              icon={Calendar}
              label="Verified At"
              value={new Date(profile.verified_at).toLocaleString()}
            />
          </div>
        )}
        {profile.verification_notes && (
          <div className="mt-3">
            <InfoRow
              icon={FileText}
              label="Verification Notes"
              value={profile.verification_notes}
            />
          </div>
        )}
      </div>

      {/* ── Specializations & Qualifications ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />{" "}
              Specializations
            </h4>
            <div className="space-y-2">
              {profile.specializations.map((spec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {spec.specialization_details?.specialization_name ??
                        `Specialization ${idx + 1}`}
                    </p>
                    {spec.is_primary && (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap">
                    {spec.years_in_specialty
                      ? `${spec.years_in_specialty} yrs`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Qualifications */}
        {profile.qualifications && profile.qualifications.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> Qualifications
            </h4>
            <div className="space-y-3">
              {profile.qualifications.map((qual, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <p className="font-semibold text-slate-900 text-sm">
                    {qual.qualification_details?.qualification_name}
                    {qual.qualification_details?.qualification_code
                      ? ` (${qual.qualification_details.qualification_code})`
                      : ""}
                  </p>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    {qual.institution && (
                      <p>
                        <span className="font-medium">Institution:</span>{" "}
                        {qual.institution}
                      </p>
                    )}
                    {qual.year_of_completion && (
                      <p>
                        <span className="font-medium">Year:</span>{" "}
                        {qual.year_of_completion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Schedule ─────────────────────────────────────────────────────────── */}
      {sch && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Schedule
            </h4>
            <button
              onClick={() => navigate("/doctor/schedule")}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {sch.consultation_duration_min && (
              <InfoRow
                icon={Activity}
                label="Avg. Consultation"
                value={`${sch.consultation_duration_min} minutes`}
              />
            )}
            {sch.appointment_contact && (
              <InfoRow
                icon={Phone}
                label="Appointment Contact"
                value={sch.appointment_contact}
              />
            )}
          </div>

          {/* Working Days — each entry is a WorkingDay object {day_of_week, arrival, leaving, ...} */}
          {Array.isArray(sch.working_days) && sch.working_days.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500">Working Days</p>

              {/* Day chips showing active/inactive */}
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, idx) => {
                  const wd = sch.working_days!.find(
                    (d) => d.day_of_week === idx,
                  );
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${wd
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                    >
                      {wd ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {DAY_NAMES[idx]}
                    </div>
                  );
                })}
              </div>

              {/* Per-day timing detail rows */}
              <div className="space-y-1.5">
                {sch
                  .working_days!.slice()
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((wd) => (
                    <div
                      key={wd.day_of_week}
                      className="bg-slate-50 rounded-lg px-3 py-2 text-sm flex flex-wrap items-center gap-x-4 gap-y-1"
                    >
                      <span className="font-semibold text-slate-800 w-24 shrink-0">
                        {DAY_NAMES[wd.day_of_week]}
                      </span>
                      {wd.arrival && wd.leaving && (
                        <span className="text-slate-600">
                          <span className="text-slate-400 text-xs mr-1">
                            Hours:
                          </span>
                          {formatTime(wd.arrival)} – {formatTime(wd.leaving)}
                        </span>
                      )}
                      {wd.lunch_start && wd.lunch_end && (
                        <span className="text-slate-500 text-xs">
                          Lunch: {formatTime(wd.lunch_start)} –{" "}
                          {formatTime(wd.lunch_end)}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <EditDoctorProfile
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updated) => {
            onUpdate?.(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};
