// frontend/src/components/profile/LabProfileDetails.tsx
import React, { useState } from "react";
import {
  Building2,
  FileText,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Edit,
  CheckCircle,
} from "lucide-react";
import { LabProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";
import EditLabProfile from "./EditLabProfile";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface LabProfileDetailsProps {
  profile: LabProfile;
  onUpdate?: (updatedProfile: LabProfile) => void;
}

export const LabProfileDetails: React.FC<LabProfileDetailsProps> = ({
  profile,
  onUpdate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const addr = profile.address || (profile.address_line || profile.city || profile.state || profile.pincode ? {
    address_line: profile.address_line || "",
    city: profile.city || "",
    state: profile.state || "",
    pincode: profile.pincode || "",
  } : null);

  return (
    <>
      {/* ── Core Info ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Laboratory Information
          </h4>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Building2} label="Lab Name" value={profile.lab_name} />
          <InfoRow
            icon={FileText}
            label="License Number"
            value={profile.license_number}
          />
          <InfoRow
            icon={Phone}
            label="Phone Number"
            value={profile.phone_number}
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
              <MapPin className="w-4 h-4 text-emerald-600" /> Address
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
              value={profile.verified_by_details?.email ?? profile.verified_by_email ?? "System"}
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

      {/* ── Operating Hours ──────────────────────────────────────────────── */}
      {profile.operating_hours && profile.operating_hours.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Operating Hours
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.operating_hours.map((oh, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm ${oh.is_closed
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${oh.is_closed ? "text-red-400" : "text-emerald-600"}`}
                  />
                  <span className="font-medium">
                    {DAY_NAMES[oh.day_of_week] ?? `Day ${oh.day_of_week}`}
                  </span>
                </div>
                <span>
                  {oh.is_closed
                    ? "Closed"
                    : `${oh.open_time} – ${oh.close_time}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Services ─────────────────────────────────────────────────────── */}
      {profile.services && profile.services.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Services Offered
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-600 font-semibold">
                    Service
                  </th>
                  <th className="text-left py-2 px-3 text-slate-600 font-semibold">
                    Price (₹)
                  </th>
                  <th className="text-left py-2 px-3 text-slate-600 font-semibold">
                    Turnaround
                  </th>
                </tr>
              </thead>
              <tbody>
                {profile.services.map((svc, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {svc.service_name}
                    </td>
                    <td className="py-2 px-3 text-slate-600">₹{svc.price}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {svc.turnaround_hours ? `${svc.turnaround_hours}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditLabProfile
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
