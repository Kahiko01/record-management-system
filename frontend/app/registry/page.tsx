"use client";

import { registryApi, clearanceApi } from "../lib/api";
import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useAuth, Permission } from "../context/AuthContext";
import { 
  Package, Search, RefreshCw, CheckCircle, Clock, Archive, FileText, Users, TrendingUp, Award
} from "lucide-react";
import toast from 'react-hot-toast';

const CERTIFICATE_TYPES = ["All Types", "Diploma", "Craft", "Transcript", "Testimonial"];

export default function RegistryPage() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [clearedStudents, setClearedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'cleared'>('inventory');
  const [filters, setFilters] = useState({ search: "", status: "", type: "All Types" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await registryApi.getRegistryStats();
      setStats(statsRes.data);

      const params: any = {};
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters.status && filters.status !== '' && filters.status !== 'All Status') params.status = filters.status;
      if (filters.type && filters.type !== 'All Types') params.certificate_type = filters.type;

      const hasParams = Object.keys(params).length > 0;
      const [inventoryRes, clearedRes] = await Promise.all([
        registryApi.getCertificates(hasParams ? params : undefined),
        clearanceApi.getClearedStudents(),
      ]);

      setInventory(inventoryRes.data || []);
      setClearedStudents(clearedRes.data || []);
    } catch (error: any) {
      console.error("Failed to fetch registry data:", error);
      toast.error("Failed to load registry data.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (studentId: number) => {
    const loadingToast = toast.loading('Processing certificate...');
    try {
      await registryApi.markReady(studentId);
      toast.success('Certificate marked as ready!', { id: loadingToast });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to mark ready.";
      toast.error(`Error: ${errorMessage}`, { id: loadingToast });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      "collected": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      "ready_for_collection": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
      "ready": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
      "awaiting_clearance": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30",
      "in_storage": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      "on_hold": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
    };
    const className = badges[status] || "bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border-gray-200 dark:border-slate-500/30";
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${className}`}>{status.replace(/_/g, ' ').toUpperCase()}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="h-8 w-8 text-emerald-500" />
                Certificate Registry
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage certificates, track collections, and monitor inventory</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Certificates</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total_certificates}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl"><Package className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Ready for Collection</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.ready_for_collection}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl"><CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Collected</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.collected}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl"><TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Awaiting Clearance</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.awaiting_clearance}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl"><Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /></div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 mb-6">
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Archive className="h-4 w-4" /> Certificate Inventory
            </button>
            <button onClick={() => setActiveTab('cleared')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cleared' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Users className="h-4 w-4" /> Cleared Students
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && fetchData()}
                  placeholder="Name or Certificate No"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              
              {/* NEW: Certificate Type Filter */}
              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {CERTIFICATE_TYPES.map(type => (
                    <option key={type} value={type === "All Types" ? "" : type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">All Status</option>
                  <option value="awaiting_clearance">Awaiting Clearance</option>
                  <option value="in_storage">In Storage</option>
                  <option value="ready_for_collection">Ready</option>
                  <option value="collected">Collected</option>
                </select>
              </div>

              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
              <button onClick={() => { setFilters({ search: "", status: "", type: "All Types" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificate No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {inventory.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Package className="h-12 w-12 text-emerald-500/30 mx-auto mb-3"/><p className="font-medium">No certificates found</p></td></tr>
                    ) : (
                      inventory.map((cert: any) => (
                        <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{cert.certificate_number}</td>
                          
                          {/* NEW: Certificate Type Column */}
                          <td className="px-6 py-4 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                              <Award className="h-3.5 w-3.5 text-emerald-500" />
                              {cert.certificate_type || "Diploma"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm">
                            <p className="text-gray-700 dark:text-slate-300">{cert.student?.first_name || 'Unknown'} {cert.student?.last_name || ''}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">{cert.student?.student_id || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{cert.programme || 'N/A'}</td>
                          <td className="px-6 py-4">{getStatusBadge(cert.status)}</td>
                          <td className="px-6 py-4">
                            {hasPermission(Permission.REGISTRY_MARK_AVAILABLE) && cert.status !== "collected" && cert.status !== "ready_for_collection" && (
                              <button onClick={() => handleMarkReady(cert.student_id || cert.student?.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                                Mark Ready
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
          )}

          {/* Cleared Students Table */}
          {activeTab === 'cleared' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Clearance Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificate Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {clearedStudents.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><CheckCircle className="h-12 w-12 text-emerald-500/30 mx-auto mb-3"/><p className="font-medium">No cleared students found</p></td></tr>
                    ) : (
                      clearedStudents.map((student: any) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">{student.student_id}</p>
                          </td>
                          <td className="px-6 py-4 text-sm"><p className="text-gray-700 dark:text-slate-300">{student.program}</p></td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.clearance_date ? new Date(student.clearance_date).toLocaleDateString() : "N/A"}</td>
                          <td className="px-6 py-4">{getStatusBadge(student.certificate_status || "awaiting_clearance")}</td>
                          <td className="px-6 py-4">
                            {hasPermission(Permission.REGISTRY_MARK_AVAILABLE) && student.certificate_status !== "collected" && (
                              <button onClick={() => handleMarkReady(student.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                                Mark Ready
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
          )}

        </div>
      </div>
    </div>
  );
}
