"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Shield, BarChart3, Eye,
  DollarSign, BookOpen, GraduationCap,
  Package, FileText, MapPin,
  ScrollText, ClipboardList,
  Users, Settings, ChevronDown, ChevronRight, UserCog
} from "lucide-react";

const menuSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["all"] },
      { name: "System Monitor", href: "/admin/monitoring", icon: Shield, roles: ["super_admin", "internal_auditor"] },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["super_admin", "internal_auditor"] },
    ],
  },
  {
    title: "Clearance",
    items: [
      { name: "Overview", href: "/clearance/overview", icon: Eye, roles: ["super_admin", "finance", "examination_office", "dean", "registry_officer", "internal_auditor"] },
      { name: "Finance", href: "/clearance/finance", icon: DollarSign, roles: ["super_admin", "finance"] },
      { name: "Examination", href: "/clearance/examination", icon: BookOpen, roles: ["super_admin", "examination_office"] },
      { name: "Dean Approval", href: "/clearance/dean", icon: GraduationCap, roles: ["super_admin", "dean"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Fee Balances", href: "/finance/balances", icon: DollarSign, roles: ["super_admin", "finance", "internal_auditor"] },
      { name: "Payment Upload", href: "/finance/payments", icon: FileText, roles: ["super_admin", "finance"] },
    ],
  },
  {
    title: "Registry",
    items: [
      { name: "Registry Office", href: "/registry", icon: Package, roles: ["super_admin", "registry_officer"] },
      { name: "Collections", href: "/registry/collections", icon: ClipboardList, roles: ["super_admin", "registry_officer", "internal_auditor"] },
      { name: "Storage", href: "/storage", icon: MapPin, roles: ["super_admin", "registry_officer"] },
    ],
  },
  {
    title: "Audit",
    items: [
      { name: "Audit Logs", href: "/admin/audit", icon: ScrollText, roles: ["super_admin", "internal_auditor"] },
      { name: "Reports", href: "/audit/reports", icon: BarChart3, roles: ["super_admin", "internal_auditor"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { name: "Students", href: "/admin/students", icon: Users, roles: ["super_admin"] },
      { name: "Users", href: "/admin/users", icon: UserCog, roles: ["super_admin"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const canAccess = (roles: string[]) => {
    if (roles.includes("all")) return true;
    // Use the exact role string from the database/AuthContext
    return roles.includes(user?.role || "");
  };

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(item.roles)),
    }))
    .filter((section) => section.items.length > 0);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg">
            <LayoutDashboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 leading-none">Navigation</p>
            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">Clearance Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleSections.map((section) => {
          const isCollapsed = collapsedSections.includes(section.title);
          return (
            <div key={section.title} className="mb-1.5">
              <button onClick={() => toggleSection(section.title)} className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded">
                <span>{section.title}</span>
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"}`}>
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-700">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold text-gray-900 dark:text-white leading-tight">{user?.username || "Guest"}</p>
            <p className="truncate text-[9px] font-medium text-emerald-600 dark:text-emerald-400 leading-tight">{user?.role?.replace("_", " ") || "User"}</p>
          </div>
        </div>
        <p className="mt-2 text-[9px] text-gray-400 dark:text-slate-600 text-center font-mono">v2.0</p>
      </div>
    </aside>
  );
}
