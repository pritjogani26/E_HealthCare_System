import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Home,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  DollarSign,
  UserCog,
  BarChart3,
  FlaskConical,
  MessageSquare,
  Bell,
  Settings,
  AlertCircle,
  Heart,
} from "lucide-react";
import { ExpandedSections } from "./types";
import { apiService } from "../services/api";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    patients: false,
    doctors: false,
    pharmacy: false,
    laboratory: false,
    administration: false,
    reports: false,
  });

  const [pendingCounts, setPendingCounts] = useState<{ doctors: number; labs: number; total: number } | null>(null);

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await apiService.getPendingApprovalsCount();
        setPendingCounts(counts);
      } catch (error) {
        console.error("Failed to fetch pending approval counts", error);
      }
    };

    fetchCounts();
    // Refresh every minute
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section: string): void => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleNavigation = (route?: string) => {
    if (route) {
      navigate(route);
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === "/profile" && location.pathname === "/profile") return true;
    if (route !== "/profile" && location.pathname.startsWith(route)) return true;
    return false;
  };

  const menuItems: any[] = [
    { icon: Home, label: "Dashboard", route: "/profile" },
    {
      icon: Users,
      label: "Patients",
      section: "patients",
      subitems: [
        { label: "All Patients", route: "/admin/patients" },
        { label: "Add New Patient", route: "/patients/new" },
        { label: "Patient Records", route: "/patients/records" },
        { label: "Admissions", route: "/patients/admissions" },
      ],
    },
    {
      icon: Stethoscope,
      label: "Doctors",
      section: "doctors",
      subitems: [
        { label: "All Doctors", route: "/admin/doctors" },
        { label: "Schedules", route: "/doctors/schedules" },
        { label: "Specializations", route: "/doctors/specializations" },
      ],
    },
    { icon: Calendar, label: "Appointments", route: "/appointments" },
    {
      icon: FileText,
      label: "Medical Records",
      route: "/medical-records",
    },
    {
      icon: Pill,
      label: "Pharmacy",
      section: "pharmacy",
      subitems: [
        { label: "Medicines", route: "/pharmacy/medicines" },
        { label: "Prescriptions", route: "/pharmacy/prescriptions" },
        { label: "Inventory", route: "/pharmacy/inventory" },
      ],
    },
    {
      icon: FlaskConical,
      label: "Laboratory",
      section: "laboratory",
      subitems: [
        { label: "Lab Tests", route: "/laboratory/tests" },
        { label: "Test Reports", route: "/laboratory/reports" },
        { label: "Equipment", route: "/laboratory/equipment" },
      ],
    },
    { icon: DollarSign, label: "Billing & Payments", route: "/billing" },
    {
      icon: UserCog,
      label: "Staff Management",
      section: "administration",
      subitems: [
        { label: "Nurses", route: "/staff/nurses" },
        { label: "Technicians", route: "/staff/technicians" },
        { label: "Admin Staff", route: "/staff/admin" },
        { label: "Attendance", route: "/staff/attendance" },
      ],
    },
    {
      icon: BarChart3,
      label: "Reports & Analytics",
      section: "reports",
      subitems: [
        { label: "Patient Reports", route: "/reports/patients" },
        { label: "Revenue Reports", route: "/reports/revenue" },
        { label: "Inventory Reports", route: "/reports/inventory" },
      ],
    },
    { icon: Settings, label: "Settings", route: "/settings" },
  ];

  const supportItems: any[] = [
    {
      icon: AlertCircle,
      label: "Pending Approvals",
      badge: pendingCounts && pendingCounts.total > 0 ? pendingCounts.total.toString() : "",
      badgeColor: "bg-orange-500",
      section: "approvals",
      subitems: [
        { label: `Doctor Approvals ${pendingCounts && pendingCounts.doctors > 0 ? `(${pendingCounts.doctors})` : ''}`, route: "/admin/doctors?status=PENDING" },
        { label: `Lab Approvals ${pendingCounts && pendingCounts.labs > 0 ? `(${pendingCounts.labs})` : ''}`, route: "/admin/labs?status=PENDING" },
      ]
    },
    {
      icon: Bell,
      label: "Emergency Alerts",
      badge: "2",
      badgeColor: "bg-red-500",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      badge: "12",
      badgeColor: "bg-blue-500",
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-screen 
        bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
        border-r border-slate-200 dark:border-slate-800/50
        z-50 transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        w-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-slate-100 dark:scrollbar-track-slate-900
      `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                E-Health Care
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Hospital Management System</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4 px-3">
            MAIN MENU
          </p>
          <nav className="space-y-1">
            {menuItems.map((item: any, idx: any) => {
              const active = isActive(item.route) || (item.subitems && item.subitems.some((sub: any) => isActive(sub.route)));

              return (
                <div key={idx}>
                  <button
                    onClick={() => {
                      if (item.section) {
                        toggleSection(item.section);
                      } else {
                        handleNavigation(item.route);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${active
                        ? "bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:to-teal-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-lg dark:shadow-emerald-500/5"
                        : "text-slate-700 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-5 h-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {item.section && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${expandedSections[item.section] ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </button>

                  {/* Subitems */}
                  {item.subitems &&
                    item.section &&
                    expandedSections[item.section] && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subitems.map((subitem: any, subIdx: any) => {
                          const subActive = isActive(subitem.route);
                          return (
                            <button
                              key={subIdx}
                              onClick={() => handleNavigation(subitem.route)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 ${subActive
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800/50 font-medium"
                                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                }`}
                            >
                              <span className="text-sm">{subitem.label}</span>
                              {subitem.badge && (
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-md font-medium">
                                  {subitem.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}
          </nav>

          {/* Support Section */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-3">
            NOTIFICATIONS
          </p>
          <nav className="space-y-1">
            {supportItems.map((item, idx) => {
              const active = isActive(item.route) || (item.subitems && item.subitems.some((sub: any) => isActive(sub.route)));

              return (
                <div key={idx}>
                  <button
                    onClick={() => {
                      if (item.section) {
                        toggleSection(item.section);
                      } else {
                        handleNavigation(item.route);
                      }
                    }}
                    className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${active
                        ? "bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:to-teal-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-lg dark:shadow-emerald-500/5"
                        : "text-slate-700 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      }
                `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 ${item.badgeColor} text-white text-xs rounded-md font-medium animate-pulse`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.section && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${expandedSections[item.section] ? "rotate-180" : ""
                            }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Subitems */}
                  {item.subitems &&
                    item.section &&
                    expandedSections[item.section] && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subitems.map((subitem: any, subIdx: any) => {
                          const subActive = isActive(subitem.route);
                          return (
                            <button
                              key={subIdx}
                              onClick={() => handleNavigation(subitem.route)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 ${subActive
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800/50 font-medium"
                                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                }`}
                            >
                              <span className="text-sm">{subitem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-8 px-3">
            <div className="bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Quick Stats</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Today's Appointments</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">24</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Active Patients</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">156</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Available Beds</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">12/50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;