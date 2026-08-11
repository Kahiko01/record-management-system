"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, ClipboardCheck, Award, Users, DollarSign, BookOpen,
  Archive, Building2, Home, Scale, ShieldCheck, BarChart3, Activity,
  UserCog, Layers, Settings, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

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
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tasks: [] },
      ]
    },
    {
      title: "STUDENT SERVICES",
      items: [
        { name: "Clearance", href: "/clearance/overview", icon: ClipboardCheck, tasks: [] },
        { name: "Certificates", href: "/registry", icon: Award, tasks: [] },
        { name: "Student Records", href: "/admin/students", icon: Users, tasks: [] },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "Finance", href: "/clearance/finance", icon: DollarSign, tasks: [] },
        { name: "Examination", href: "/clearance/examination", icon: BookOpen, tasks: [] },
        { name: "Registry", href: "/registry/collections", icon: Archive, tasks: [] },
        { name: "Dean", href: "/clearance/dean", icon: Building2, tasks: [] },
        { name: "Accommodation", href: "#", icon: Home, tasks: [], disabled: true },
        { name: "Discipline", href: "#", icon: Scale, tasks: [], disabled: true },
      ]
    },
    {
      title: "GOVERNANCE",
      items: [
        { name: "Audit Trail", href: "/admin/audit", icon: ShieldCheck, tasks: [] },
        { name: "Reports", href: "/admin/audit", icon: BarChart3, tasks: [] }, 
        { name: "System Activity", href: "/admin/monitoring", icon: Activity, tasks: [] },
      ]
    },
    {
      title: "ADMINISTRATION",
      items: [
        { name: "Users & Roles", href: "/admin/users", icon: UserCog, tasks: [] },
        { name: "Departments", href: "#", icon: Layers, tasks: [], disabled: true },
        { name: "System Settings", href: "#", icon: Settings, tasks: [], disabled: true },
      ]
    },
  ];

  const handleDisabledClick = (name: string) => {
    toast(`${name} module is currently in development.`, {
      icon: '🛠️', // Keeping one functional emoji for the toast system icon is standard, but text is clean
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
    });
  };

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 z-30 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Sidebar Branding Header */}
      {!collapsed && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
            KNP Digital Office
          </h1>
        </div>
      )}

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all z-40"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => hasAnyTask(item.tasks));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              {!collapsed && section.title && (
                <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isDisabled = item.disabled;
                  
                  if (isDisabled) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleDisabledClick(item.name)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? `${item.name} (Coming Soon)` : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </button>
                    );
                  }

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
            <p className="text-[11px] text-gray-500 dark:text-slate-400 capitalize truncate font-medium">{user.role?.replace('_', ' ')}</p>
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
