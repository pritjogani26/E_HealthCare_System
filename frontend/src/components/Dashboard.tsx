import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  UserCheck,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import StatCard from "./StatCard";
import { StatCardProps, Activity as ActivityType, Product } from "./types";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { user } = useAuth();

  const [stats, setStats] = useState<StatCardProps[]>([
    {
      icon: Users,
      title: "Registered Patients",
      value: "0",
      change: "—",
      trend: "up",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: UserCheck,
      title: "Verified Doctors",
      value: "0",
      change: "—",
      trend: "up",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Calendar,
      title: "Today's Appointments",
      value: "0",
      change: "—",
      trend: "up",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: AlertCircle,
      title: "Pending Verifications",
      value: "0",
      change: "—",
      trend: "up",
      color: "from-orange-500 to-orange-600",
    },
  ]);

  const [recentActivity] = useState<ActivityType[]>([
    {
      id: 1,
      user: "Dr. Sarah Johnson",
      action: "Registration verified by Admin",
      time: "5 min ago",
      type: "create",
    },
    {
      id: 2,
      user: "John Smith (Patient)",
      action: "Booked appointment with Dr. Michael Chen",
      time: "15 min ago",
      type: "create",
    },
    {
      id: 3,
      user: "City Lab Center",
      action: "Lab registration submitted for verification",
      time: "32 min ago",
      type: "update",
    },
    {
      id: 4,
      user: "Staff - Emily Davis",
      action: "Verified Dr. Robert Wilson's credentials",
      time: "1 hour ago",
      type: "report",
    },
    {
      id: 5,
      user: "Maria Garcia (Patient)",
      action: "Completed registration and profile setup",
      time: "2 hours ago",
      type: "create",
    },
  ]);

  const [platformStats, setPlatformStats] = useState<Product[]>([
    {
      id: 1,
      name: "Active Patients",
      sales: 0,
      revenue: "Online",
      trend: "up",
    },
    {
      id: 2,
      name: "Verified Doctors",
      sales: 0,
      revenue: "Active",
      trend: "up",
    },
    {
      id: 3,
      name: "Verified Labs",
      sales: 0,
      revenue: "Active",
      trend: "up",
    },
    {
      id: 4,
      name: "Staff Members",
      sales: 0,
      revenue: "Active",
      trend: "up",
    },
    {
      id: 5,
      name: "Pending Verifications",
      sales: 0,
      revenue: "Awaiting",
      trend: "down",
    },
  ]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const role = (user as any)?.user?.role ?? (user as any)?.role ?? null;
        if (!role || !["ADMIN", "STAFF"].includes(role)) {
          return;
        }

        const [patients, doctors, labs] = await Promise.all([
          apiService.getAllPatients(),
          apiService.getAllDoctors(),
          apiService.getAllLabs(),
        ]);

        const patientsCount = patients.length;
        const doctorsCount = doctors.length;
        const labsCount = labs.length;

        setStats((prev) => [
          {
            ...prev[0],
            value: patientsCount.toString(),
          },
          {
            ...prev[1],
            value: doctorsCount.toString(),
          },
          {
            ...prev[2],
            value: "0",
          },
          {
            ...prev[3],
            value: labsCount.toString(),
          },
        ]);

        setPlatformStats((prev) =>
          prev.map((item) => {
            if (item.name === "Active Patients") {
              return { ...item, sales: patientsCount };
            }
            if (item.name === "Verified Doctors") {
              return { ...item, sales: doctorsCount };
            }
            if (item.name === "Verified Labs") {
              return { ...item, sales: labsCount };
            }
            return item;
          }),
        );
      } catch (error) {
        // Silently ignore for now; dashboard will just show zeros
        console.error("Failed to load dashboard stats", error);
      }
    };

    loadCounts();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="lg:pl-72">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <main className="p-6 min-h-[calc(100vh-73px)] flex flex-col">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Platform Dashboard
            </h2>
            <p className="text-slate-600">
              Manage registrations, verifications, and monitor platform activity.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="animate-fade-in"
              >
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Recent Activity
                </h3>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "create"
                          ? "bg-emerald-100 text-emerald-600"
                          : activity.type === "update"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                    >
                      {activity.type === "create" && "✓"}
                      {activity.type === "update" && "⟳"}
                      {activity.type === "report" && "✓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {activity.user}
                      </p>
                      <p className="text-sm text-slate-600">
                        {activity.action}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                Platform Overview
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Verification Rate
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      94%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                      style={{ width: "94%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      User Satisfaction
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      4.7/5.0
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: "94%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Active Users Today
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      342
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: "68%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Monthly Growth
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      +18.5%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                      style={{ width: "78%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Statistics Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Platform Statistics
              </h3>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                View Details
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      User Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Count
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {platformStats.map((stat) => (
                    <tr
                      key={stat.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                            {stat.name.includes("Patient") && <Users className="w-5 h-5 text-emerald-600" />}
                            {stat.name.includes("Doctor") && <UserCheck className="w-5 h-5 text-blue-600" />}
                            {stat.name.includes("Lab") && <Activity className="w-5 h-5 text-purple-600" />}
                            {stat.name.includes("Staff") && <CheckCircle className="w-5 h-5 text-cyan-600" />}
                            {stat.name.includes("Pending") && <Clock className="w-5 h-5 text-orange-600" />}
                          </div>
                          <span className="font-medium text-slate-800">
                            {stat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{stat.sales}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${stat.revenue === "Online" || stat.revenue === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                          }`}>
                          {stat.revenue}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-semibold ${stat.trend === "up"
                              ? "text-emerald-600"
                              : "text-orange-600"
                            }`}
                        >
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

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;