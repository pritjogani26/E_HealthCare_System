// frontend/src/components/profile/PatientProfileDetails.tsx
import React, { useState } from "react";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Edit,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import { PatientProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";
import EditPatientProfile from "./EditPatientProfile";

interface PatientProfileDetailsProps {
  profile: PatientProfile;
  onUpdate?: (updatedProfile: PatientProfile) => void;
}

export const PatientProfileDetails: React.FC<PatientProfileDetailsProps> = ({
  profile,
  onUpdate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const addr = profile.address || {
    address_line: (profile as any).user?.address_line || (profile as any).address_line,
    city: (profile as any).user?.city || (profile as any).city,
    state: (profile as any).user?.state || (profile as any).state,
    pincode: (profile as any).user?.pincode || (profile as any).pincode
  };
  const hasAddr = addr.address_line || addr.city || addr.state || addr.pincode;

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-600" />
            Patient Information
          </h4>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        {/* Core Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <InfoRow icon={User} label="Full Name" value={profile.full_name} />
          <InfoRow icon={Phone} label="Mobile" value={profile.mobile} />
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={
              profile.date_of_birth
                ? new Date(profile.date_of_birth).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : null
            }
          />
          <InfoRow
            icon={User}
            label="Gender"
            value={profile.gender_details?.gender_value || (profile as any).user?.gender || (profile as any).gender}
          />
          <InfoRow
            icon={Droplets}
            label="Blood Group"
            value={profile.blood_group_details?.blood_group_value || (profile as any).user?.blood_group || (profile as any).blood_group}
          />
        </div>

        {/* Address */}
        {hasAddr ? (
          <div className="border-t border-slate-100 pt-4 mb-4">
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> Address
            </h5>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 space-y-0.5">
              {addr.address_line && <p>{addr.address_line}</p>}
              <p>
                {[addr.city, addr.state].filter(Boolean).join(", ")}
                {addr.pincode ? ` - ${addr.pincode}` : ""}
              </p>
            </div>
          </div>
        ) : null}

        {/* Emergency Contact */}
        {(profile.emergency_contact_name ||
          profile.emergency_contact_phone) && (
            <div className="border-t border-slate-100 pt-4">
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Emergency
                Contact
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={User}
                  label="Contact Name"
                  value={profile.emergency_contact_name}
                />
                <InfoRow
                  icon={Phone}
                  label="Contact Phone"
                  value={profile.emergency_contact_phone}
                />
              </div>
            </div>
          )}
      </div>

      {showEditModal && (
        <EditPatientProfile
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
