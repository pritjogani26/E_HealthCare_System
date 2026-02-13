import React from "react";
import { Shield } from "lucide-react";

interface SecurityCardProps {
    user: any;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({ user }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Security
            </h3>
            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Email Verified</span>
                    <span className={`font-semibold ${user?.email_verified ? 'text-emerald-600' : 'text-red-600'}`}>
                        {user?.email_verified ? "✓ Yes" : "✗ No"}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Two Factor Auth</span>
                    <span className={`font-semibold ${user?.two_factor_enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {user?.two_factor_enabled ? "✓ Enabled" : "Disabled"}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Account Active</span>
                    <span className={`font-semibold ${user?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                        {user?.is_active ? "✓ Yes" : "✗ No"}
                    </span>
                </div>
            </div>
        </div>
    );
};
