import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { logout } from "../services/api";
import { useToast } from "../hooks/useToast";

interface HeaderProps {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showSidebarToggle?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  setIsSidebarOpen,
  showSidebarToggle = true,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been signed out.");
      // small delay so the toast is visible before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Clearing session locally.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
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
          {isAuthenticated && showSidebarToggle && (
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </button>
          )}
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

          {/* User Profile or Login/Guest Actions */}
          {isAuthenticated ? (
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
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/registration"
                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-500/30 transition-all hover:scale-105"
                onClick={() => setIsProfileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
