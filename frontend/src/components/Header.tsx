import React, { useState } from "react";
import {
  Menu,
  Bell,
  Mail,
  Search,
  User,
  ChevronDown,
  Calendar,
  Activity,
  Plus,
  Clock,
  LogOut as LogOutIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";

interface HeaderProps {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen }) => {
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiService.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback logout if API fails
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const { user, isAuthenticated } = useAuth();

  const displayRole =
    (user as any)?.user?.role ??
    (user as any)?.role ??
    (isAuthenticated ? "USER" : "Guest");

  const displayName =
    (user as any)?.full_name ??
    (user as any)?.lab_name ??
    (user as any)?.user?.email ??
    (user as any)?.email ??
    "Guest";

  return (
    <header
      className="sticky top-0 z-30 
  bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 
  border-b border-slate-800/50
  backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Mobile menu + Search + Quick Actions */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {/* <Menu className="w-6 h-6 text-slate-700" /> */}
            <Menu className="w-6 h-6 text-slate-300" />
          </button>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients, doctors, appointments..."
              className="w-full pl-10 pr-4 py-2.5 
  bg-slate-800 border border-slate-700 
  rounded-lg text-sm text-slate-200
  placeholder:text-slate-400
  focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Quick Action Buttons - Hidden on mobile */}
          {/* <div className="hidden lg:flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>New Patient</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div> */}
        </div>

        {/* Right: Status, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
            <Clock className="w-4 h-4 text-slate-600" />
            <div className="text-xs">
              <p className="font-semibold text-slate-800">{currentTime}</p>
              <p className="text-slate-500">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div> */}

          {/* Emergency Alert Button */}
          {/* <button className="relative p-2 hover:bg-red-50 rounded-lg transition-colors group">
            <Activity className="w-5 h-5 text-red-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <p className="text-xs font-semibold text-slate-800 mb-1">Emergency Status</p>
              <p className="text-xs text-slate-600">2 Critical Patients</p>
            </div>
          </button> */}

          {/* Notifications */}
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors group">
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              6
            </span>
          </button>

          {/* Messages */}
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Mail className="w-6 h-5 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              12
            </span>
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 rounded-lg transition-colors group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-emerald-400 font-medium">
                  {displayRole}
                </p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center relative">
                <User className="w-5 h-5 text-white" />
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"
                  title="Online"
                />
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">{displayRole}</p>
                </div>

                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  My Profile
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Header Bar - Quick Stats */}
      <div className="hidden xl:flex items-center justify-between px-6 py-2 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-600">System Status:</span>
            <span className="font-semibold text-emerald-600">Operational</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Today's Appointments:</span>
            <span className="font-semibold text-slate-800">24 Scheduled</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Active Patients:</span>
            <span className="font-semibold text-slate-800">156</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Last Updated:{" "}
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
