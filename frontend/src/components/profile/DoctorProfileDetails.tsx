import React from "react";
import { User, Phone, FileText, Award, Activity, Calendar, Shield, Stethoscope } from "lucide-react";
import { DoctorProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";

interface DoctorProfileDetailsProps {
    profile: DoctorProfile;
}

export const DoctorProfileDetails: React.FC<DoctorProfileDetailsProps> = ({ profile }) => {
    return (
        <>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                    Doctor Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Full Name" value={profile.full_name} />
                    <InfoRow icon={Phone} label="Phone Number" value={profile.phone_number} />
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
                        value={profile.consultation_fee ? `₹${profile.consultation_fee}` : null}
                    />
                    <InfoRow
                        icon={Calendar}
                        label="Joining Date"
                        value={profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : null}
                    />
                    <InfoRow
                        icon={Shield}
                        label="Verification Status"
                        value={profile.verification_status_display}
                    />
                </div>

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

            {profile.qualifications && profile.qualifications.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        Qualifications
                    </h4>
                    <div className="space-y-3">
                        {profile.qualifications.map((qual, idx) => (
                            <div key={idx} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <h5 className="font-semibold text-slate-900 mb-2">
                                    {qual.qualification_details?.qualification_name} ({qual.qualification_details?.qualification_code})
                                </h5>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p><span className="font-medium">Institution:</span> {qual.institution}</p>
                                    <p><span className="font-medium">Year:</span> {qual.year_of_completion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
