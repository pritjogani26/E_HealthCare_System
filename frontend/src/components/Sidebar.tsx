import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Home,
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  Settings,
  AlertCircle,
  Heart,
  Shield,
  ClipboardList,
} from "lucide-react";
import { ExpandedSections } from "./types";
import { getPendingApprovalsCount } from "../services/admin_api";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/roles";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const admin = isAdmin(user);

  // Fine-grained permission helpers (from login response)
  const { permissions } = useAuth();
  const can = (perm: string) => permissions.includes(perm);

  const userRole = user?.role || (user as any)?.user?.role;
  const isSuperAdmin = userRole === "SUPERADMIN";
  const isAdminOrSuper = admin || isSuperAdmin;

  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    patients: false,
    doctors: false,
    pharmacy: false,
    laboratory: false,
    administration: false,
    reports: false,
  });

  const [pendingCounts, setPendingCounts] = useState<{
    doctors: number;
    labs: number;
    total: number;
  } | null>(null);

  React.useEffect(() => {
    if (!admin) return;
    const fetchCounts = async () => {
      try {
        const counts = await getPendingApprovalsCount();
        setPendingCounts(counts);
      } catch (error) {
        console.error("Failed to fetch pending approval counts", error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [admin]);

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

  const baseMenuItems: any[] = [
    { icon: Home, label: "Dashboard", route: "/dashboard" },
    // Patient management — only for admin roles or explicit permission
    ...(can("patient : view") || admin
      ? [{ icon: Users, label: "Patients", route: "/admin/patients" }]
      : []),
    // Doctor management — only for admin roles or explicit permission
    ...(can("doctor : view") || admin
      ? [{ icon: Stethoscope, label: "Doctors", route: "/admin/doctors" }]
      : []),
    // Lab management
    ...(can("lab : view") || admin
      ? [{ icon: FlaskConical, label: "Laboratory", route: "/admin/labs" }]
      : []),
    // Audit Logs — ADMIN and SUPERADMIN only
    ...(isAdminOrSuper
      ? [{ icon: ClipboardList, label: "Audit Logs", route: "/audit-logs" }]
      : []),
    // Settings
    ...(can("settings : view") || admin
      ? [{ icon: Settings, label: "Settings", route: "/settings" }]
      : []),
    // Role Permissions — SUPERADMIN only
    ...(isSuperAdmin
      ? [{ icon: Shield, label: "Role Permissions", route: "/admin/role-permissions" }]
      : []),
  ];

  const menuItems: any[] = [...baseMenuItems];

  if (userRole === "DOCTOR") {
    menuItems.splice(
      1,
      0,
      { icon: Calendar, label: "My Schedule", route: "/doctor/schedule" },
      { icon: Calendar, label: "My Appointments", route: "/doctor/appointments" },
    );
  }

  if (userRole === "PATIENT") {
    menuItems.splice(
      1,
      0,
      { icon: Stethoscope, label: "Book Appointment", route: "/book-appointment" },
      { icon: Calendar, label: "My Appointments", route: "/my-appointments" },
    );
  }

  // Pending approvals only relevant for admin-type users
  const supportItems: any[] = admin
    ? [
        {
          icon: AlertCircle,
          label: "Pending Approvals",
          badge:
            pendingCounts && pendingCounts.total > 0
              ? pendingCounts.total.toString()
              : "",
          badgeColor: "bg-orange-500",
          section: "approvals",
          subitems: [
            {
              label: `Doctor Approvals ${pendingCounts && pendingCounts.doctors > 0 ? `(${pendingCounts.doctors})` : ""}`,
              route: "/admin/doctors?status=PENDING",
            },
            {
              label: `Lab Approvals ${pendingCounts && pendingCounts.labs > 0 ? `(${pendingCounts.labs})` : ""}`,
              route: "/admin/labs?status=PENDING",
            },
          ],
        },
      ]
    : [];

  const renderMenuItem = (item: any, idx: number) => {
    const active =
      isActive(item.route) ||
      (item.subitems && item.subitems.some((sub: any) => isActive(sub.route)));

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
            ${
              active
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
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedSections[item.section] ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        </button>

        {/* Subitems */}
        {item.subitems && item.section && expandedSections[item.section] && (
          <div className="ml-8 mt-1 space-y-1">
            {item.subitems.map((subitem: any, subIdx: number) => {
              const subActive = isActive(subitem.route);
              return (
                <button
                  key={subIdx}
                  onClick={() => handleNavigation(subitem.route)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 ${
                    subActive
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
  };

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
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Hospital Management System
              </p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4 px-3">
            MAIN MENU
          </p>
          <nav className="space-y-1">
            {menuItems.map((item: any, idx: number) => renderMenuItem(item, idx))}
          </nav>

          {/* Support Section */}
          {supportItems.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-3">
                NOTIFICATIONS
              </p>
              <nav className="space-y-1">
                {supportItems.map((item, idx) => renderMenuItem(item, idx))}
              </nav>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;