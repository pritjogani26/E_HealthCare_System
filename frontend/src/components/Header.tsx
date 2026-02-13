import React, { useState } from "react";
import {
  Menu,
  Bell,
  Mail,
  Search,
  User,
  ChevronDown,
  LogOut as LogOutIcon,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiService } from "../services/api";

interface HeaderProps {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
  bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
  border-b border-slate-200 dark:border-slate-800/50
  backdrop-blur-xl shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Mobile menu + Search + Quick Actions */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search patients, doctors, appointments..."
              className="w-full pl-10 pr-4 py-2.5 
  bg-slate-50 dark:bg-slate-800 
  border border-slate-300 dark:border-slate-700 
  rounded-lg text-sm text-slate-900 dark:text-slate-200
  placeholder:text-slate-500 dark:placeholder:text-slate-400
  focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right: Theme Toggle, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900" />
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              6
            </span>
          </button>

          {/* Messages */}
          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Mail className="w-6 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900" />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              12
            </span>
          </button>

          <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-2" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {displayRole}
                </p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-full flex items-center justify-center relative">
                <User className="w-5 h-5 text-white" />
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"
                  title="Online"
                />
              </div>

              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 sm:hidden">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {displayRole}
                  </p>
                </div>

                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => setIsProfileOpen(false)}
                >
                  My Profile
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
      <div className="hidden xl:flex items-center justify-between px-6 py-2 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400">
              System Status:
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Operational
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              Today's Appointments:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              24 Scheduled
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              Active Patients:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              156
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
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
