"use client";

import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ChevronRight,
  CircleUserRound,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  const { getUserMenus, user } = useAuth();
  const pathname = usePathname();
  const menus = getUserMenus();

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

  return (
    <aside className="hidden lg:flex lg:flex-col w-72 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shrink-0 select-none overflow-hidden justify-between">
      
      {/* TOP SECTION: Header & Navigation */}
      <div className="flex flex-col min-h-0 flex-1">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 block leading-none">
              Navigation
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              Clearance Portal
            </span>
          </div>
        </div>

        {/* Navigation Menu (Scrollbar Completely Hidden) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [::-webkit-scrollbar]:hidden">
          {menus.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== "/dashboard" && pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>

                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: Security Card & User Profile */}
      <div className="shrink-0 space-y-2.5 p-3 border-t border-slate-100 dark:border-slate-800/80">
        
        {/* Security & Audit Info Card */}
        <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Audit Logging Active
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-emerald-800/80 dark:text-emerald-400/80">
                User activity and record updates are logged for compliance.
              </p>
            </div>
          </div>
        </div>

        {/* User Info Footer Box */}
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 p-2.5 border border-slate-200/50 dark:border-slate-700/50">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-700">
              <CircleUserRound className="h-5 w-5" />
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Signed in as
            </p>
            <p className="truncate text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.username || "Authorized User"}
            </p>
            <p className="truncate text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
              {getRoleLabel(user?.role || "")}
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
}
