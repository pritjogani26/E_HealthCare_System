// frontend/src/components/Dashboard.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Calendar,
  UserCheck,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  ShieldX,
  ToggleLeft,
  Settings,
  AlertTriangle,
  Mail,
} from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import StatCard from "./StatCard";
import { StatCardProps, Product } from "./types";
import { AuditLog, AuditAction } from "../types";
import { getAllDoctors, getAllLabs, getAllPatients, getPendingApprovalsCount, getRecentActivity } from "../services/admin_api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { getUserRole } from "../utils/roles";


function actionLabel(action: AuditAction): string {
  const map: Partial<Record<AuditAction, string>> = {
    USER_LOGIN: "Logged in",
    USER_LOGOUT: "Logged out",
    USER_LOGIN_FAILED: "Login failed",
    ACCOUNT_LOCKED: "Account locked",
    EMAIL_VERIFIED: "Email verified",
    PASSWORD_RESET: "Password reset",
    PATIENT_REGISTERED: "Patient registered",
    DOCTOR_REGISTERED: "Doctor registered",
    LAB_REGISTERED: "Lab registered",
    PATIENT_PROFILE_UPDATED: "Patient profile updated",
    DOCTOR_PROFILE_UPDATED: "Doctor profile updated",
    LAB_PROFILE_UPDATED: "Lab profile updated",
    DOCTOR_VERIFIED: "Doctor verified",
    DOCTOR_REJECTED: "Doctor rejected",
    LAB_VERIFIED: "Lab verified",
    LAB_REJECTED: "Lab rejected",
    PATIENT_ACTIVATED: "Patient activated",
    PATIENT_DEACTIVATED: "Patient deactivated",
    DOCTOR_ACTIVATED: "Doctor activated",
    DOCTOR_DEACTIVATED: "Doctor deactivated",
    LAB_ACTIVATED: "Lab activated",
    LAB_DEACTIVATED: "Lab deactivated",
    ADMIN_ACTION: "Admin action",
    SYSTEM_ERROR: "System error",
  };
  return map[action] ?? action;
}

function actionMeta(action: AuditAction): {
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
} {
  if (action === "USER_LOGIN")
    return { icon: <LogIn size={16} />, bg: "bg-emerald-100", iconColor: "text-emerald-700" };
  if (action === "USER_LOGOUT")
    return { icon: <LogOut size={16} />, bg: "bg-slate-100", iconColor: "text-slate-600" };
  if (action === "EMAIL_VERIFIED" || action === "PASSWORD_RESET")
    return { icon: <Mail size={16} />, bg: "bg-cyan-100", iconColor: "text-cyan-700" };
  if (["PATIENT_REGISTERED", "DOCTOR_REGISTERED", "LAB_REGISTERED"].includes(action))
    return { icon: <UserPlus size={16} />, bg: "bg-blue-100", iconColor: "text-blue-700" };
  if (action.includes("PROFILE_UPDATED"))
    return { icon: <Settings size={16} />, bg: "bg-indigo-100", iconColor: "text-indigo-700" };
  if (["DOCTOR_VERIFIED", "LAB_VERIFIED"].includes(action))
    return { icon: <ShieldCheck size={16} />, bg: "bg-emerald-100", iconColor: "text-emerald-700" };
  if (["DOCTOR_REJECTED", "LAB_REJECTED"].includes(action))
    return { icon: <ShieldX size={16} />, bg: "bg-red-100", iconColor: "text-red-700" };
  if (action.includes("ACTIVATED") || action.includes("DEACTIVATED"))
    return { icon: <ToggleLeft size={16} />, bg: "bg-amber-100", iconColor: "text-amber-700" };
  if (action === "USER_LOGIN_FAILED" || action === "ACCOUNT_LOCKED")
    return { icon: <AlertTriangle size={16} />, bg: "bg-red-100", iconColor: "text-red-700" };
  if (action === "SYSTEM_ERROR")
    return { icon: <AlertCircle size={16} />, bg: "bg-rose-100", iconColor: "text-rose-700" };
  return { icon: <Activity size={16} />, bg: "bg-slate-100", iconColor: "text-slate-600" };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ── component ─────────────────────────────────────────────────────────────────

const INITIAL_STATS: StatCardProps[] = [
  { icon: Users,     title: "Registered Patients",    value: "—", change: "—", trend: "up", color: "from-blue-500 to-blue-600"   },
  { icon: UserCheck, title: "Verified Doctors",        value: "—", change: "—", trend: "up", color: "from-purple-500 to-purple-600" },
  { icon: Calendar,  title: "Verified Labs",           value: "—", change: "—", trend: "up", color: "from-cyan-500 to-cyan-600"   },
  { icon: AlertCircle, title: "Pending Verifications", value: "—", change: "—", trend: "up", color: "from-orange-500 to-orange-600" },
];

const INITIAL_PLATFORM: Product[] = [
  { id: 1, name: "Active Patients",        sales: 0, revenue: "Online",  trend: "up"   },
  { id: 2, name: "Verified Doctors",       sales: 0, revenue: "Active",  trend: "up"   },
  { id: 3, name: "Verified Labs",          sales: 0, revenue: "Active",  trend: "up"   },
  { id: 4, name: "Staff Members",          sales: 0, revenue: "Active",  trend: "up"   },
  { id: 5, name: "Pending Verifications",  sales: 0, revenue: "Awaiting",trend: "down" },
];

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Single authoritative role derivation – no repeated (user as any) casts below.
  const role = getUserRole(user);
  const isAdminOrStaff = role === "ADMIN" || role === "STAFF" || role === "SUPERADMIN";

  const [pendingCounts, setPendingCounts] = useState<{
    doctors: number; labs: number; total: number;
  } | null>(null);

  const [stats, setStats] = useState<StatCardProps[]>(() =>
    isAdminOrStaff
      ? INITIAL_STATS
      : INITIAL_STATS.slice(0, 3)
  );
  const [platformStats, setPlatformStats] = useState<Product[]>(INITIAL_PLATFORM);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchPendingCounts = useCallback(async () => {
    if (!isAdminOrStaff) return;
    try {
      const counts = await getPendingApprovalsCount();
      setPendingCounts(counts);
    } catch {
      // non-critical – silently ignore
    }
  }, [isAdminOrStaff]);

  useEffect(() => {
    fetchPendingCounts();
    const id = setInterval(fetchPendingCounts, 60_000);
    return () => clearInterval(id);
  }, [fetchPendingCounts]);

  useEffect(() => {
    if (!pendingCounts) return;

    setStats((prev) => {
      // Only update index 3 (Pending Verifications card) if it exists
      if (prev.length < 4) return prev;
      const updated = [...prev];
      updated[3] = {
        ...updated[3],
        value: pendingCounts.total.toString(),
        change: pendingCounts.total > 0 ? `${pendingCounts.total} awaiting` : "All clear",
        trend: pendingCounts.total > 0 ? "up" : "down",
      };
      return updated;
    });

    setPlatformStats((prev) =>
      prev.map((item) =>
        item.name === "Pending Verifications"
          ? { ...item, sales: pendingCounts.total, revenue: pendingCounts.total > 0 ? "Awaiting" : "Clear", trend: pendingCounts.total > 0 ? "down" : "up" }
          : item
      )
    );
  }, [pendingCounts]);

  // ── Load entity counts ─────────────────────────────────────────────────────
  const loadCounts = useCallback(async () => {
    try {
      const [patients, doctors, labs] = await Promise.all([
        getAllPatients(),
        getAllDoctors(),
        getAllLabs(),
      ]);

      setStats((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], value: patients.length.toString() };
        updated[1] = { ...updated[1], value: doctors.length.toString() };
        updated[2] = { ...updated[2], value: labs.length.toString()   };
        return updated;
      });

      setPlatformStats((prev) =>
        prev.map((item) => {
          if (item.name === "Active Patients")  return { ...item, sales: patients.length };
          if (item.name === "Verified Doctors") return { ...item, sales: doctors.length };
          if (item.name === "Verified Labs")    return { ...item, sales: labs.length    };
          return item;
        })
      );
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // ── Load recent activity (admin only) ─────────────────────────────────────
  // FIX: Added `toast` to the dependency array of useCallback – it was a stale
  //      closure before (toast object never changes identity so this is safe).
  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const logs = await getRecentActivity();
      setRecentActivity(logs);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to load activity. Please try again.";
      setActivityError(msg);
      toast.error(msg);
    } finally {
      setActivityLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdminOrStaff) loadActivity();
  }, [isAdminOrStaff, loadActivity]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="lg:pl-72">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Platform Dashboard</h2>
            <p className="text-slate-600">Manage registrations, verifications, and monitor platform activity.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} style={{ animationDelay: `${idx * 100}ms` }} className="animate-fade-in">
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                  {lastRefreshed && (
                    <p className="text-xs text-slate-400 mt-0.5">Updated {timeAgo(lastRefreshed.toISOString())}</p>
                  )}
                </div>
                <button
                  onClick={loadActivity}
                  disabled={activityLoading}
                  title="Refresh"
                  className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all ${activityLoading ? "opacity-50 cursor-not-allowed" : "hover:text-emerald-600"}`}
                >
                  <RefreshCw size={16} className={activityLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="divide-y divide-slate-50">
                {activityLoading && (
                  <div className="px-6 py-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-4 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-100 rounded w-2/5" />
                          <div className="h-3 bg-slate-100 rounded w-3/5" />
                        </div>
                        <div className="h-3 w-14 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {!activityLoading && activityError && (
                  <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertCircle size={22} className="text-red-500" />
                    </div>
                    <p className="text-sm text-slate-600">{activityError}</p>
                    <button onClick={loadActivity} className="text-sm font-medium text-emerald-600 hover:underline">
                      Try again
                    </button>
                  </div>
                )}

                {!activityLoading && !activityError && recentActivity.length === 0 && (
                  <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <Activity size={22} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No activity recorded yet.</p>
                  </div>
                )}

                {!activityLoading && !activityError &&
                  recentActivity.slice(0, 5).map((log) => {
                    const { icon, bg, iconColor } = actionMeta(log.action);
                    const actor = log.performed_by ?? log.target_user ?? "System";
                    const isFailure = log.status === "FAILURE";
                    return (
                      <div key={log.log_id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${iconColor}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{actor}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {log.entity_name ? `${actionLabel(log.action)} · ${log.entity_name}` : actionLabel(log.action)}
                          </p>
                          {log.details && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{log.details}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${isFailure ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {isFailure ? "FAILED" : "OK"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Platform Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Platform Overview</h3>
              <div className="space-y-6">
                {[
                  { label: "Verification Rate",   value: "94%",   pct: 94, gradient: "from-emerald-500 to-cyan-500"  },
                  { label: "User Satisfaction",   value: "4.7/5", pct: 94, gradient: "from-blue-500 to-purple-500"   },
                  { label: "Active Users Today",  value: recentActivity.length > 0
                      ? String(new Set(recentActivity.map((l) => l.performed_by).filter(Boolean)).size)
                      : "—",
                    pct: 68, gradient: "from-purple-500 to-pink-500" },
                  { label: "Monthly Growth",      value: "+18.5%", pct: 78, gradient: "from-orange-500 to-red-500"   },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">{row.label}</span>
                      <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`bg-gradient-to-r ${row.gradient} h-2 rounded-full`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}

                {recentActivity.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Log Summary</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Total Events",  value: recentActivity.length,                                             color: "text-slate-800"   },
                        { label: "Failed",        value: recentActivity.filter((l) => l.status === "FAILURE").length,       color: "text-red-600"     },
                        { label: "Registrations", value: recentActivity.filter((l) => l.action.includes("_REGISTERED")).length, color: "text-blue-600"},
                        { label: "Logins",        value: recentActivity.filter((l) => l.action === "USER_LOGIN").length,    color: "text-emerald-600" },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                          <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Platform Statistics Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Platform Statistics</h3>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View Details</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    {["User Type", "Count", "Status", "Trend"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-sm font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {platformStats.map((stat) => (
                    <tr key={stat.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                            {stat.name.includes("Patient") && <Users className="w-5 h-5 text-emerald-600" />}
                            {stat.name.includes("Doctor")  && <UserCheck className="w-5 h-5 text-blue-600" />}
                            {stat.name.includes("Lab")     && <Activity className="w-5 h-5 text-purple-600" />}
                            {stat.name.includes("Staff")   && <CheckCircle className="w-5 h-5 text-cyan-600" />}
                            {stat.name.includes("Pending") && <Clock className="w-5 h-5 text-orange-600" />}
                          </div>
                          <span className="font-medium text-slate-800">{stat.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{stat.sales}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${stat.revenue === "Online" || stat.revenue === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                          {stat.revenue}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${stat.trend === "up" ? "text-emerald-600" : "text-orange-600"}`}>
                          {stat.trend === "up" ? "↑" : "↓"}
                          {stat.trend === "up" ? "+12%" : "6 pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;