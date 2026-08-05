"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { userApi } from "../../lib/api";
import { Users, Plus, Edit, Trash2, Search, RefreshCw, UserCheck, UserX, Key, X, AlertTriangle } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Role {
  value: string;
  label: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    username: "", email: "", full_name: "", password: "",
    role: "student", department: ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll();
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await userApi.getRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.full_name.toLowerCase().includes(search)
      );
    }
    if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
    if (statusFilter) {
      filtered = filtered.filter(u => 
        statusFilter === "active" ? u.is_active : !u.is_active
      );
    }
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleCreate = async () => {
    setError("");
    if (!formData.username || !formData.email || !formData.full_name || !formData.password) {
      setError("All fields are required");
      return;
    }
    try {
      await userApi.create(formData);
      setSuccess("User created successfully");
      setShowCreateModal(false);
      setFormData({ username: "", email: "", full_name: "", password: "", role: "student", department: "" });
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to create user");
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setError("");
    try {
      await userApi.update(selectedUser.id, formData);
      setSuccess("User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to update user");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userApi.delete(selectedUser.id);
      setSuccess("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userApi.toggleStatus(user.id);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to update user status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await userApi.resetPassword(selectedUser.id, { new_password: newPassword });
      setSuccess("Password reset successfully");
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to reset password");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username, email: user.email,
      full_name: user.full_name, password: "",
      role: user.role, department: user.department || ""
    });
    setShowEditModal(true);
    setError("");
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setError("");
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordModal(true);
    setError("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-red-100 text-red-700";
      case "finance": return "bg-yellow-100 text-yellow-700";
      case "examination_office": return "bg-blue-100 text-blue-700";
      case "dean": return "bg-purple-100 text-purple-700";
      case "registry_officer": return "bg-green-100 text-green-700";
      case "internal_auditor": return "bg-gray-100 text-gray-700";
      case "student": return "bg-indigo-100 text-indigo-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create, edit, and manage system users</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateModal(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Create User
              </button>
              <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search Users</label>
                <input
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by username, email, or name..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button onClick={() => { setSearchTerm(""); setRoleFilter(""); setStatusFilter(""); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                Clear
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.department || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal(user)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => openPasswordModal(user)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Reset Password">
                              <Key className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(user)} className={`p-1 rounded ${user.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title={user.is_active ? 'Deactivate' : 'Activate'}>
                              {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                            <button onClick={() => openDeleteModal(user)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Create New User</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="johndoe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@school.edu" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleCreate} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create User</button>
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Edit User</h2>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleEdit} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                  <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-full"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                  <h2 className="text-xl font-bold">Delete User</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{selectedUser.full_name}</strong> (@{selectedUser.username})?
                  This action cannot be undone.
                </p>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
                <div className="flex gap-3">
                  <button onClick={handleDelete} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete User</button>
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {showPasswordModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Reset Password</h2>
                  <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Reset password for <strong>{selectedUser.full_name}</strong>
                </p>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min 6 characters" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleResetPassword} className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Reset Password</button>
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
