import React from "react";
import { Building2, FileText, Phone, Shield, MapPin, Calendar, Clock } from "lucide-react";
import { LabProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";

interface LabProfileDetailsProps {
    profile: LabProfile;
}

export const LabProfileDetails: React.FC<LabProfileDetailsProps> = ({ profile }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Laboratory Information
            </h4>
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
    );
};
