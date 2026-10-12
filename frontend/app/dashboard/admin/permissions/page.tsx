"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Shield, Users, Lock, Unlock, CheckCircle2, XCircle,
  Building2, FileText, Download, Calendar, UserCheck,
  Settings, Eye, AlertTriangle
} from "lucide-react";

interface Task {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  department: string;
  description: string | null;
  user_count: number;
  tasks: Task[];
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    const allowed = ["admin", "super_admin", "super admin"];
    if (user && !allowed.includes(user.role)) {
      alert("🚫 Access Denied: Only admins can view permissions");
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (token) fetchRoles();
  }, [token]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/users/roles-with-tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 200) {
        const data = await res.json();
        setRoles(data);
      } else {
        alert("Failed to load roles");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      "System": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
      "Registry": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      "Finance": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      "Academics": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      "Audit": "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    };
    return colors[dept] || "bg-slate-100 text-slate-700";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "Registry": FileText,
      "Export": Download,
      "Clearance": UserCheck,
      "Admin": Settings,
    };
    return icons[category] || Shield;
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" /> User & Permission Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Zero Trust RBAC - View granular permissions for each role
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedRole?.id === role.id
                ? "border-blue-500 shadow-md"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {role.display_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {role.name}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(role.department)}`}>
                {role.department}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  <strong>{role.user_count}</strong> active users
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  <strong>{role.tasks.length}</strong> permissions
                </span>
              </div>
            </div>

            {role.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                {role.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Selected Role Details */}
      {selectedRole && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Permissions for {selectedRole.display_name}
          </h2>

          {/* Group tasks by category */}
          {Object.entries(
            selectedRole.tasks.reduce((acc, task) => {
              if (!acc[task.category]) acc[task.category] = [];
              acc[task.category].push(task);
              return acc;
            }, {} as Record<string, Task[]>)
          ).map(([category, tasks]) => {
            const Icon = getCategoryIcon(category);
            return (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {task.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
