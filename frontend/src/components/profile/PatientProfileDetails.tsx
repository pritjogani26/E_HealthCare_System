import React, { useState } from "react";
import { User, Phone, Calendar, Activity, MapPin, Heart, Edit } from "lucide-react";
import { PatientProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";
import { EditPatientProfile } from "./EditPatientProfile";

interface PatientProfileDetailsProps {
    profile: PatientProfile;
    onUpdate?: (updatedProfile: PatientProfile) => void;
}

export const PatientProfileDetails: React.FC<PatientProfileDetailsProps> = ({ profile, onUpdate }) => {
    const [showEditModal, setShowEditModal] = useState(false);

    const handleUpdate = (updatedProfile: PatientProfile) => {
        if (onUpdate) {
            onUpdate(updatedProfile);
        }
    };

    return (
        <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-emerald-600" />
                        Patient Information
                    </h4>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Full Name" value={profile.full_name} />
                    <InfoRow icon={Phone} label="Mobile" value={profile.mobile} />
                    <InfoRow
                        icon={Calendar}
                        label="Date of Birth"
                        value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null}
                    />
                    <InfoRow icon={User} label="Gender" value={profile.gender_details?.gender_value} />
                    <InfoRow
                        icon={Activity}
                        label="Blood Group"
                        value={profile.blood_group_details?.blood_group_value}
                    />
                    <InfoRow
                        icon={User}
                        label="Emergency Contact"
                        value={profile.emergency_contact_name}
                    />
                    <InfoRow
                        icon={Phone}
                        label="Emergency Phone"
                        value={profile.emergency_contact_phone}
                    />
                </div>

                {profile.address && (
                    <div className="mt-3">
                        <InfoRow
                            icon={MapPin}
                            label="Address"
                            value={`${profile.address}${profile.city ? ', ' + profile.city : ''}${profile.state ? ', ' + profile.state : ''}${profile.pincode ? ' - ' + profile.pincode : ''}`}
                        />
                    </div>
                )}
            </div>

            {showEditModal && (
                <EditPatientProfile
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    );
};
