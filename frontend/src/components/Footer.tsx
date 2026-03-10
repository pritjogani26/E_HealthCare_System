import React from "react";
import { Heart } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800/50 mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2026{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                E-Health Care
              </span>
              . All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
            >
              About
            </a>
            <a
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
            >
              Support
            </a>
            <a
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
