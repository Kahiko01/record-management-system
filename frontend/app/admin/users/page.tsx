"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { userApi } from "../../lib/api";
import { User } from "../../types";
import { Users, Search, RefreshCw, Shield, X, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", role: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "student" });

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleCreateUser = async () => {
    try {
      await userApi.create(newUser);
      alert("User created successfully!");
      setShowCreateModal(false);
      setNewUser({ username: "", email: "", password: "", role: "student" });
      fetchData();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await userApi.delete(userId);
      fetchData();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">Super Admin</span>;
      case "finance_officer":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Finance</span>;
      case "exam_officer":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">Exams</span>;
      case "dean":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">Dean</span>;
      case "registry_officer":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">Registry</span>;
      case "internal_auditor":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">Auditor</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border border-gray-200 dark:border-slate-500/30">Student</span>;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-500" /> User Management</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage system users and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {hasPermission(Permission.USER_MANAGE) && (
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                  <UserPlus className="h-4 w-4" /> Add User
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Username / Email</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. admin or admin@school.edu" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-48">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="exam_officer">Exam Officer</option>
                  <option value="dean">Dean</option>
                  <option value="registry_officer">Registry Officer</option>
                  <option value="internal_auditor">Internal Auditor</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", role: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
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
                        <td className="px-6 py-4">
                          {hasPermission(Permission.USER_MANAGE) && user.id !== currentUser?.id && (
                            <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors">Delete</button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-emerald-500" /> Create New User
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
                <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. john_doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. john@school.edu" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="student">Student</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="exam_officer">Exam Officer</option>
                  <option value="dean">Dean</option>
                  <option value="registry_officer">Registry Officer</option>
                  <option value="internal_auditor">Internal Auditor</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateUser} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">Create User</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
