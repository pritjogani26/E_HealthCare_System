import React from "react";
import { Mail, Shield, Calendar, Clock } from "lucide-react";
import { InfoRow } from "../common/InfoRow";

interface ProfileHeaderProps {
    user: any;
    profile: any;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, profile }) => {
    const profileImage =
        profile?.profile_image &&
            profile?.profile_image !== '/media/defaults/patient.png' &&
            profile?.profile_image !== '/media/defaults/doctor.png'
            ? profile.profile_image
            : profile?.lab_logo && profile?.lab_logo !== '/media/defaults/lab.png'
                ? profile.lab_logo
                : null;

    const fallback =
        profile?.full_name?.[0] ??
        profile?.lab_name?.[0] ??
        user?.email?.[0] ??
        "U";

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        fallback
                    )}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                        {profile?.full_name ?? profile?.lab_name ?? user?.email}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                        <span className="font-medium text-emerald-600">
                            {user?.role_display ?? user?.role}
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                <InfoRow
                    icon={Shield}
                    label="Account Status"
                    value={user?.account_status_display ?? user?.account_status ?? "ACTIVE"}
                />
                <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : null}
                />
                <InfoRow
                    icon={Clock}
                    label="Last Login"
                    value={user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                />
            </div>
        </div>
    );
};
