"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, ClipboardCheck, Users, DollarSign, BookOpen,
  Archive, Building2, Home, Scale, ShieldCheck, BarChart3, Activity,
  UserCog, Layers, Settings, ChevronLeft, ChevronRight, LogOut,
  UserCheck, CalendarClock, PackageCheck, Clock, ChevronDown, CheckCircle
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, hasTask, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const hasAnyTask = (tasks: string[]) => {
    if (!user) return false;
    if (user.role === "super_admin" || user.role === "admin") return true;
    if (tasks.length === 0) return false;
    return tasks.some(task => hasTask(task));
  };

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tasks: ["dashboard:view_student", "dashboard:view_finance", "dashboard:view_examination", "dashboard:view_dean", "dashboard:view_registry", "dashboard:view_auditor", "dashboard:view_admin"] },
      ]
    },
    {
      title: "STUDENT MANAGEMENT",
      items: [
        { name: "Student Records", href: "/admin/students", icon: Users, tasks: ["user:view", "user:create", "search:students"] },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "My Tasks", href: "/admin/my-tasks", icon: CheckCircle, tasks: ["task:view", "task:update"] },
        { name: "Finance", href: "/clearance/finance", icon: DollarSign, tasks: ["finance:view_pending", "finance:view_dashboard"] },
        { name: "Examination", href: "/clearance/examination", icon: BookOpen, tasks: ["exam:view_pending", "exam:view_dashboard"] },
        {
          name: "Registry",
          href: "/dashboard/registry",
          icon: Archive,
          tasks: ["registry:view_inventory", "registry:view_dashboard"],
          children: [
            { name: "Registry Dashboard", href: "/dashboard/registry", icon: LayoutDashboard, tasks: ["registry:view_dashboard"] },
            { name: "Verify Student", href: "/dashboard/registry?action=verify", icon: UserCheck, tasks: ["registry:verify_identity"] },
            { name: "Schedule Collection", href: "/dashboard/registry?action=schedule", icon: CalendarClock, tasks: ["registry:schedule_collection"] },
            { name: "Release Certificate", href: "/dashboard/registry?action=release", icon: PackageCheck, tasks: ["registry:record_collection"] },
            { name: "View Pending", href: "/dashboard/registry?filter=pending", icon: Clock, tasks: ["registry:search_cleared"] },
            { name: "Inventory", href: "/dashboard/registry/inventory", icon: Archive, tasks: ["registry:view_inventory"] },
            { name: "Reports", href: "/dashboard/registry/reports", icon: BarChart3, tasks: ["registry:view_reports"] },
          ]
        },
        { name: "Dean", href: "/clearance/dean", icon: Building2, tasks: ["dean:view_pending", "dean:view_dashboard"] },
        { name: "Accommodation", href: "#", icon: Home, tasks: [], disabled: true },
        { name: "Discipline", href: "#", icon: Scale, tasks: [], disabled: true },
      ]
    },
    {
      title: "GOVERNANCE",
      items: [
        { name: "Audit Trail", href: "/admin/audit", icon: ShieldCheck, tasks: ["auditor:view_logs"] },
        { name: "Reports & Analytics", href: "/reports", icon: BarChart3, tasks: ["auditor:view_reports"] },
        { name: "Operations Center", href: "/admin/monitoring", icon: Activity, tasks: ["admin:view_monitoring"] },
      ]
    },
    {
      title: "ADMINISTRATION",
      items: [
        { name: "Users & Roles", href: "/admin/users", icon: UserCog, tasks: ["user:assign_role", "admin:manage_roles", "admin:manage_users", "user:view"] },
        { name: "Departments", href: "#", icon: Layers, tasks: [], disabled: true },
        { name: "Settings", href: "/admin/settings", icon: Settings, tasks: ["admin:configure_system"] },
        { name: "System Settings", href: "#", icon: Settings, tasks: [], disabled: true },
      ]
    },
  ];

  const handleDisabledClick = (name: string) => {
    toast(`${name} module is currently in development.`, {
      icon: '🛠️',
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
          const visibleItems = section.items.filter(item => {
            if (item.disabled && (user?.role === "super_admin" || user?.role === "admin")) return true;
            if (item.disabled) return false;
            return hasAnyTask(item.tasks);
          });

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
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems.includes(item.name);

                  const visibleChildren = hasChildren ? item.children.filter(child => hasAnyTask(child.tasks)) : [];

                  // Render Parent with Expandable Children
                  if (hasChildren && visibleChildren.length > 0) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleExpand(item.name)}
                          className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive || isExpanded
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive || isExpanded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`} />
                            {!collapsed && <span className="truncate">{item.name}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          )}
                        </button>

                        {isExpanded && !collapsed && (
                          <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            {visibleChildren.map(child => {
                              const ChildIcon = child.icon;
                              const childPath = child.href.split('?')[0];
                              const isChildActive = pathname === childPath;
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    isChildActive
                                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">{child.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Render Disabled Items
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

                  // Render Standard Link Items
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
