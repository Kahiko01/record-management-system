"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { userApi } from "../../lib/api";
import { User } from "../../types";
import { Users, Search, RefreshCw, Shield, X, Upload, CheckCircle, ListChecks, Lock, ChevronRight, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'tasks'>('roles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "student" });

  // Data State
  const [assignedRoles, setAssignedRoles] = useState<any[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  // Debounced Real-Time Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters({ ...filters, search: searchQuery });
      }
    }, 500); // 500ms delay after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll(filters);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [rolesRes, tasksRes] = await Promise.all([
        userApi.getRoles(),
        userApi.getTasks(),
      ]);
      setRoles(rolesRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error("Failed to fetch master data:", error);
    }
  };

  const openPermissionsModal = async (user: User) => {
    setSelectedUser(user);
    setActiveTab('roles');
    setShowModal(true);

    try {
      // Fetch user's current tasks
      const tasksRes = await userApi.getUserTasks(user.id);
      const userTaskIds = tasksRes.data.filter((t: any) => t.is_enabled).map((t: any) => t.task_id);

      setAssignedTasks(tasks.map(task => ({
        task_id: task.id,
        is_enabled: userTaskIds.includes(task.id)
      })));

      // For roles, start fresh (or you could fetch their current roles here if backend supports it)
      setAssignedRoles([]);
      setActiveRoleId(null);
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    }
  };

  // === ROLE MANAGEMENT ===
  const toggleRole = (roleId: number) => {
    setAssignedRoles(prev => {
      const exists = prev.find(r => r.role_id === roleId);
      if (exists) return prev.filter(r => r.role_id !== roleId);
      return [...prev, { role_id: roleId, is_department_uploader: false }];
    });
  };

  const toggleUploader = (roleId: number) => {
    setAssignedRoles(prev =>
      prev.map(r => r.role_id === roleId ? { ...r, is_department_uploader: !r.is_department_uploader } : r)
    );
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    try {
      await userApi.updateRoles(selectedUser.id, {
        roles: assignedRoles,
        active_role_id: activeRoleId || (assignedRoles.length > 0 ? assignedRoles[0].role_id : null)
      });
      alert("Base Roles updated successfully!");
      fetchData();
    } catch (error) {
      alert("Failed to update roles.");
    }
  };

  // === CREATE USER ===
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      alert("Username and Password are required!");
      return;
    }
    try {
      await userApi.create(newUser);
      alert("User created successfully!");
      setShowCreateModal(false);
      setNewUser({ username: "", email: "", password: "", role: "student" });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to create user.");
    }
  };

  // === TASK MANAGEMENT ===
  const toggleTask = (taskId: number) => {
    setAssignedTasks(prev =>
      prev.map(t => t.task_id === taskId ? { ...t, is_enabled: !t.is_enabled } : t)
    );
  };

  const saveTasks = async () => {
    if (!selectedUser) return;
    try {
      await userApi.updateTasks(selectedUser.id, assignedTasks);
      alert("Granular Tasks updated successfully!");
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert("Failed to update tasks.");
    }
  };

  // Group tasks by department
  const tasksByDepartment = tasks.reduce((acc: any, task: any) => {
    const dept = task.department || "General";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(task);
    return acc;
  }, {});

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">Super Admin</span>;
      case "finance": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Finance</span>;
      case "examination_office": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">Exams</span>;
      case "dean": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">Dean</span>;
      case "registry_officer": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">Registry</span>;
      case "internal_auditor": return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">Auditor</span>;
      default: return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border border-gray-200 dark:border-slate-500/30">Student</span>;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-500" /> User & Permission Management</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Assign base roles and Zero-Trust granular tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setSearchQuery(""); setFilters({ search: "" }); fetchData(); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {hasPermission(Permission.USER_CREATE) && (
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                  <UserPlus className="h-4 w-4" /> Add User
                </button>
              )}
            </div>
          </div>

          {/* Modern Debounced Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="relative">
              {/* Search Icon */}
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
              
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..." 
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-sm" 
              />
              
              {/* Clear Button (shows only when typing) */}
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> 
              {loading ? 'Searching...' : 'Results update automatically as you type'}
            </p>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Current Role</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Users className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No users found</p></td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">ID: {user.id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{user.email || "N/A"}</td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 text-right">
                          {hasPermission(Permission.USER_ASSIGN_ROLE) && (
                            <button onClick={() => openPermissionsModal(user)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                              <ListChecks className="h-3 w-3" /> Manage Permissions
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* === UNIFIED PERMISSION MODAL === */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="text-emerald-500" /> Permissions: {selectedUser.username}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-950 rounded-xl p-1 mb-4">
              <button onClick={() => setActiveTab('roles')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'roles' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>
                <Shield className="h-4 w-4" /> Base Roles & Uploaders
              </button>
              <button onClick={() => setActiveTab('tasks')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'tasks' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>
                <ListChecks className="h-4 w-4" /> Granular Tasks (Zero Trust)
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-2 mb-4">

              {/* TAB 1: ROLES */}
              {activeTab === 'roles' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Assign base roles. Toggle "Uploader" to allow bulk Excel imports for that department.</p>
                  {roles.map((role) => {
                    const isAssigned = assignedRoles.find(r => r.role_id === role.id);
                    return (
                      <div key={role.id} className={`p-3 rounded-xl border transition-colors ${isAssigned ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950'}`}>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={!!isAssigned} onChange={() => toggleRole(role.id)} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{role.display_name}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase">{role.department}</p>
                            </div>
                          </label>
                          {isAssigned && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Upload className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 uppercase">Uploader</span>
                              <input type="checkbox" checked={isAssigned.is_department_uploader} onChange={() => toggleUploader(role.id)} className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500/50" />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Check specific tasks this user is allowed to perform. Unchecked tasks will be hidden from their dashboard.</p>
                  {Object.entries(tasksByDepartment).map(([department, deptTasks]: any) => (
                    <div key={department}>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-slate-800 pb-1">
                        {department} Department
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deptTasks.map((task: any) => {
                          const taskState = assignedTasks.find(t => t.task_id === task.id);
                          const isEnabled = taskState?.is_enabled || false;
                          return (
                            <label key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isEnabled ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 hover:border-gray-300 dark:hover:border-slate-700'}`}>
                              <input type="checkbox" checked={isEnabled} onChange={() => toggleTask(task.id)} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{task.name}</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{task.code}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
              {activeTab === 'roles' ? (
                <button onClick={saveRoles} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" /> Save Base Roles
                </button>
              ) : (
                <button onClick={saveTasks} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Save Granular Tasks
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* === CREATE USER MODAL === */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-blue-500" /> Create New User
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Username *</label>
                <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g. john_doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g. john@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Password *</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Default Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="student">Student</option>
                  <option value="finance">Finance Officer</option>
                  <option value="examination_office">Examination Officer</option>
                  <option value="dean">Dean</option>
                  <option value="registry_officer">Registry Officer</option>
                  <option value="internal_auditor">Internal Auditor</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateUser} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">Create User</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
