import React from "react";
import { Activity } from "lucide-react";

interface ActivityCardProps {
    user: any;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ user }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Activity
            </h3>
            <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-xs mb-1">Account Created</p>
                    <p className="text-slate-800 font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleString() : "—"}
                    </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-xs mb-1">Last Updated</p>
                    <p className="text-slate-800 font-medium">
                        {user?.updated_at ? new Date(user.updated_at).toLocaleString() : "—"}
                    </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-xs mb-1">Last Login</p>
                    <p className="text-slate-800 font-medium">
                        {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                    </p>
                </div>
            </div>
        </div>
    );
};
