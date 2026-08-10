"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, DollarSign, BookOpen, GraduationCap, Archive,
  Users, ShieldCheck, Activity, Home, LogOut, FileSpreadsheet,
  Wallet, Package, UserPlus, ChevronLeft, ChevronRight
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
      title: "Main",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Home, tasks: [] },
        { name: "Clearance Overview", href: "/clearance/overview", icon: LayoutDashboard, tasks: [] },
      ]
    },
    {
      title: "Finance",
      items: [
        { name: "Fee Balances", href: "/finance/balances", icon: Wallet,
          tasks: ["finance_view_dashboard", "finance:view_dashboard", "finance_view_reports", "finance:view_reports"] },
        { name: "Payment Upload", href: "/finance/payments", icon: FileSpreadsheet,
          tasks: ["finance_upload", "finance:upload", "finance_data_entry", "finance:data_entry"] },
        { name: "Clearance Queue", href: "/clearance/finance", icon: DollarSign,
          tasks: ["finance_view_dashboard", "finance:view_dashboard", "finance_approve", "finance:approve"] },
      ]
    },
    {
      title: "Academics",
      items: [
        { name: "Examination", href: "/clearance/examination", icon: BookOpen,
          tasks: ["exam_view_dashboard", "exam:view_dashboard", "exam_approve", "exam:approve"] },
        { name: "Dean Review", href: "/clearance/dean", icon: GraduationCap,
          tasks: ["dean_view_dashboard", "dean:view_dashboard", "dean_approve", "dean:approve"] },
      ]
    },
    {
      title: "Registry",
      items: [
        { name: "Certificates", href: "/registry", icon: Archive,
          tasks: ["registry_view_inventory", "registry:view_inventory", "registry_mark_available", "registry:mark_available"] },
        { name: "Collections", href: "/registry/collections", icon: Package,
          tasks: ["registry_view_collections", "registry:view_collections"] },
      ]
    },
    {
      title: "Administration",
      items: [
        { name: "User Management", href: "/admin/users", icon: Users,
          tasks: ["admin_manage_users", "admin:manage_users"] },
        { name: "Student Import", href: "/admin/students", icon: UserPlus,
          tasks: ["admin_import_students", "admin:import_students"] },
        { name: "Audit Logs", href: "/admin/audit", icon: ShieldCheck,
          tasks: ["admin_view_audit", "admin:view_audit"] },
        { name: "System Monitor", href: "/admin/monitoring", icon: Activity,
          tasks: ["admin_view_monitoring", "admin:view_monitoring"] },
      ]
    },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 z-30 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all z-40"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => hasAnyTask(item.tasks));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              {!collapsed && section.title && (
                <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'
                      }`} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-800">
        {!collapsed && user && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.username}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 capitalize truncate">{user.role?.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
