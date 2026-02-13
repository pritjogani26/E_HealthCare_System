import React from "react";
import { User, Shield } from "lucide-react";
import { AdminStaffProfile } from "../../types";
import { InfoRow } from "../common/InfoRow";

interface AdminProfileDetailsProps {
    profile: AdminStaffProfile;
}

export const AdminProfileDetails: React.FC<AdminProfileDetailsProps> = ({ profile }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Administrator Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                    icon={User}
                    label="Role"
                    value={profile.role_display}
                />
                <InfoRow
                    icon={Shield}
                    label="Account Status"
                    value={profile.account_status_display}
                />
                <InfoRow
                    icon={Shield}
                    label="Staff Member"
                    value={profile.is_staff ? "Yes" : "No"}
                />
                <InfoRow
                    icon={Shield}
                    label="Superuser"
                    value={profile.is_superuser ? "Yes" : "No"}
                />
            </div>
        </div>
    );
};
