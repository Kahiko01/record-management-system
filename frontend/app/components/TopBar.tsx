"use client";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LogOut,
  User,
  Building2,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "finance":
        return "Finance Officer";
      case "examination_office":
        return "Examinations Officer";
      case "dean":
        return "Dean";
      case "registry_officer":
        return "Registry Officer";
      case "internal_auditor":
        return "Internal Auditor";
      case "student":
        return "Student";
      default:
        return role || "User";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "border border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300";

      case "finance":
        return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

      case "examination_office":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

      case "dean":
        return "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";

      case "registry_officer":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

      case "internal_auditor":
        return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";

      case "student":
        return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

      default:
        return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors duration-300 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ================= LEFT ================= */}

        <div className="flex items-center gap-3 min-w-0">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123C2F] shadow-md">
            <Building2 className="h-5 w-5 text-amber-300" />
          </div>

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                KNP Digital Office
              </h1>

              <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Secure
              </span>

            </div>

            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              Records, Clearance & Certificate Management
            </p>

          </div>

        </div>

        {/* ================= RIGHT ================= */}

        <div className="flex items-center gap-3">

          {/* Theme Toggle */}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* User */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>

            <div className="hidden md:block">

              <div className="flex items-center gap-1">

                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {user?.username || "User"}
                </p>

                <ChevronDown className="h-3 w-3 text-slate-400" />

              </div>

              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleColor(
                  user?.role || ""
                )}`}
              >
                {getRoleLabel(user?.role || "")}
              </span>

            </div>

          </div>

          {/* Logout */}

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>

      </div>
    </header>
  );
}
