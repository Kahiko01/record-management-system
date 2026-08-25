"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopBar from "@/app/components/TopBar";
import { 
  Users, Search, Plus, Filter, Upload, 
  UserCheck, GraduationCap, AlertCircle, Edit, Eye,
  ChevronLeft, ChevronRight
} from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [programmes, setProgrammes] = useState<string[]>([]);
  
  // Safely initialize pagination
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({ total: 0, active: 0, graduated: 0, suspended: 0 });

  useEffect(() => {
    fetchStudents();
    fetchStats();
    fetchProgrammes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, programmeFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const params = new URLSearchParams({
        page: (pagination.page || 1).toString(),
        per_page: (pagination.per_page || 20).toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (programmeFilter) params.append('programme', programmeFilter);

      const res = await fetch(`http://localhost:8000/students?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setStudents(data.students || []);
      setPagination(data.pagination || { page: 1, per_page: 20, total: 0, pages: 1 });
    } catch (err) { 
      console.error("Failed to fetch students:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await fetch('http://localhost:8000/students/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const fetchProgrammes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await fetch('http://localhost:8000/students/meta/programmes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProgrammes(await res.json());
    } catch (err) { console.error("Failed to fetch programmes:", err); }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStudents();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'ACTIVE': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      'GRADUATED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'SUSPENDED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'WITHDRAWN': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      'DEFERRED': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Student Records
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Centralized student database</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                  <Upload className="w-4 h-4" /> Import CSV
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition">
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold uppercase text-gray-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-semibold uppercase text-gray-500">Active</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{stats.active || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold uppercase text-gray-500">Graduated</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.graduated || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-xs font-semibold uppercase text-gray-500">Suspended</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.suspended || 0}</p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by admission number, name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
                <select
                  value={programmeFilter}
                  onChange={(e) => setProgrammeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">All Programmes</option>
                  {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" /> Apply
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Admission No.</th>
                      <th className="px-6 py-3 font-medium">Full Name</th>
                      <th className="px-6 py-3 font-medium">Programme</th>
                      <th className="px-6 py-3 font-medium">School</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading students...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No students found</td></tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <td className="px-6 py-4 font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {student.admission_number}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {student.full_name}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{student.programme || '-'}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{student.school || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} students
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {Math.max(1, pagination.pages)}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
