import React, { useState } from "react";
import { Building2, FileText, Phone, Shield, MapPin, Calendar, Clock, Edit } from "lucide-react";
import { LabProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";
import { EditLabProfile } from "./EditLabProfile";

interface LabProfileDetailsProps {
    profile: LabProfile;
    onUpdate?: (updatedProfile: LabProfile) => void;
}

export const LabProfileDetails: React.FC<LabProfileDetailsProps> = ({ profile, onUpdate }) => {
    const [showEditModal, setShowEditModal] = useState(false);

    const handleUpdate = (updatedProfile: LabProfile) => {
        if (onUpdate) {
            onUpdate(updatedProfile);
        }
    };

    return (
        <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        Laboratory Information
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
                    <InfoRow icon={Building2} label="Lab Name" value={profile.lab_name} />
                    <InfoRow icon={FileText} label="License Number" value={profile.license_number} />
                    <InfoRow icon={Phone} label="Phone Number" value={profile.phone_number} />
                    <InfoRow
                        icon={Shield}
                        label="Verification Status"
                        value={profile.verification_status_display}
                    />
                </div>

                <div className="mt-3">
                    <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`}
                    />
                </div>

                {profile.operating_hours && (
                    <div className="mt-4">
                        <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Operating Hours
                        </h5>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                                {JSON.stringify(profile.operating_hours, null, 2)}
                            </pre>
                        </div>
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

                {profile.verified_at && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoRow
                            icon={Shield}
                            label="Verified By"
                            value={profile.verified_by_details?.email ?? "System"}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Verified At"
                            value={new Date(profile.verified_at).toLocaleString()}
                        />
                    </div>
                )}
            </div>

            {showEditModal && (
                <EditLabProfile
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    );
};
