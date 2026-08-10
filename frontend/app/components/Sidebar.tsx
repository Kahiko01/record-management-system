"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, DollarSign, BookOpen, GraduationCap, Archive, 
  Users, ShieldCheck, Activity, Home, LogOut, FileSpreadsheet,
  Wallet, Package, Database, UserPlus, Server, ChevronDown, Menu, X
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, hasTask, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const hasAnyTask = (tasks: string[]) => {
    if (!user) return false;
    if (user.role === "super_admin" || user.role === "admin") return true;
    if (tasks.length === 0) return true;
    return tasks.some(task => hasTask(task));
  };

  const menuSections = [
    {
      title: null,
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Home, tasks: [] },
        { name: "Clearance Overview", href: "/clearance/overview", icon: LayoutDashboard, tasks: [] },
      ]
    },
    {
      title: "Finance",
      items: [
        { name: "Fee Balances", href: "/finance/balances", icon: Wallet, 
          tasks: ["finance_view_dashboard", "finance_view_reports"] },
        { name: "Payment Upload", href: "/finance/payments", icon: FileSpreadsheet, 
          tasks: ["finance_upload", "finance_data_entry"] },
        { name: "Clearance Queue", href: "/clearance/finance", icon: DollarSign, 
          tasks: ["finance_view_dashboard", "finance_approve", "finance_reject"] },
      ]
    },
    {
      title: "Academics",
      items: [
        { name: "Examination", href: "/clearance/examination", icon: BookOpen, 
          tasks: ["exam_view_dashboard", "exam_approve", "exam_reject"] },
        { name: "Dean Review", href: "/clearance/dean", icon: GraduationCap, 
          tasks: ["dean_view_dashboard", "dean_approve", "dean_reject", "dean_review"] },
      ]
    },
    {
      title: "Registry",
      items: [
        { name: "Registry Office", href: "/registry", icon: Archive, 
          tasks: ["registry_view_dashboard", "registry_approve", "registry_data_entry"] },
        { name: "Collections", href: "/registry/collections", icon: Package, 
          tasks: ["registry_view_dashboard", "registry_approve"] },
        { name: "Storage", href: "/storage", icon: Database, 
          tasks: ["registry_view_dashboard", "registry_data_entry"] },
      ]
    },
    {
      title: "Admin",
      items: [
        { name: "Students", href: "/admin/students", icon: UserPlus, 
          tasks: ["user_view", "user_create"] },
        { name: "Users & Roles", href: "/admin/users", icon: Users, 
          tasks: ["user_view", "user_create", "user_assign_role"] },
        { name: "Audit Logs", href: "/admin/audit", icon: ShieldCheck, 
          tasks: ["auditor_view_logs", "auditor_export_reports"] },
        { name: "System Monitor", href: "/admin/monitoring", icon: Server, 
          tasks: ["admin_view_all_logs", "admin_configure_system"] },
      ]
    },
  ];

  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasAnyTask(item.tasks))
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside className={`min-h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Navigation Bar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Navigation</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {visibleSections.map((section, idx) => (
          <div key={idx}>
            {section.title && !collapsed && (
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-800">
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.username}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate capitalize">{user.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Logout"
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium transition-colors ${collapsed ? '' : ''}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
