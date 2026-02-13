import React from "react";
import { User, Phone, Calendar, Activity, MapPin, Heart } from "lucide-react";
import { PatientProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";

interface PatientProfileDetailsProps {
    profile: PatientProfile;
}

export const PatientProfileDetails: React.FC<PatientProfileDetailsProps> = ({ profile }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-600" />
                Patient Information
            </h4>
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
    );
};
