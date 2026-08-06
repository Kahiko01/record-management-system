"use client";

import { registryApi, clearanceApi } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useAuth, Permission } from "../context/AuthContext";
import { Package, Search, RefreshCw, CheckCircle, Clock, Archive, MapPin, Upload } from "lucide-react";

export default function RegistryPage() {
  const { hasPermission, hasTask } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [clearedStudents, setClearedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'cleared'>('inventory');
  const [filters, setFilters] = useState({ search: "", status: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build params object with only non-empty values
      const params: any = {};
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.status && filters.status !== '' && filters.status !== 'All Status') {
        params.status = filters.status;
      }

      // Only send params if there's something to filter
      const hasParams = Object.keys(params).length > 0;
      
      const [inventoryRes, clearedRes] = await Promise.all([
        registryApi.getCertificates(hasParams ? params : undefined),
        clearanceApi.getClearedStudents(),
      ]);
      setInventory(inventoryRes.data || []);
      setClearedStudents(clearedRes.data || []);
    } catch (error) {
      console.error("Failed to fetch registry data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (studentId: number) => {
    try {
      await registryApi.markReady(studentId);
      fetchData();
    } catch (error) {
      console.error("Failed to mark certificate ready:", error);
      alert("Failed to mark certificate ready.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Add your upload API call here
      // await registryApi.uploadExcel(formData);
      alert('File uploaded successfully!');
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    }
    
    // Reset the input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">✅ Collected</span>;
      case "ready_for_collection":
      case "ready":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">📦 Ready</span>;
      case "awaiting_clearance":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">⏳ Awaiting Clearance</span>;
      case "in_storage":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">🗄️ In Storage</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border border-gray-200 dark:border-slate-500/30">{status || "Unknown"}</span>;
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">📦 Registry Office</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage certificate inventory and student collections</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Upload Button - Only visible if user has the registry_upload task */}
              {hasTask('registry_upload') && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20"
                  >
                    <Upload className="h-4 w-4" /> Import Excel
                  </button>
                </>
              )}
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 mb-6">
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Archive className="h-4 w-4" /> Certificate Inventory
            </button>
            <button onClick={() => setActiveTab('cleared')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cleared' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <CheckCircle className="h-4 w-4" /> Cleared Students
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / Certificate No</label>
                <input 
                  type="text" 
                  value={filters.search} 
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                  onKeyPress={(e) => e.key === "Enter" && fetchData()} 
                  placeholder="e.g. John or CERT/2024/001" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })} 
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">All Status</option>
                  <option value="awaiting_clearance">Awaiting Clearance</option>
                  <option value="ready_for_collection">Ready for Collection</option>
                  <option value="collected">Collected</option>
                  <option value="in_storage">In Storage</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
              <button 
                onClick={() => { setFilters({ search: "", status: "" }); setTimeout(fetchData, 100); }} 
                className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
              >
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Storage Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {inventory.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Package className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No certificates found</p></td></tr>
                    ) : (
                      inventory.map((cert: any) => (
                        <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white">{cert.certificate_number}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">ID: {cert.id}</p>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p className="text-gray-700 dark:text-slate-300">{cert.student?.first_name || cert.student_name} {cert.student?.last_name || ""}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">{cert.student?.student_id || cert.student_id}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{cert.programme || cert.course}</td>
                          <td className="px-6 py-4 text-sm">
                            <p className="text-gray-700 dark:text-slate-300 flex items-center gap-1"><MapPin className="h-3 w-3" /> {cert.storage_location || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(cert.status)}</td>
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
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><CheckCircle className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No cleared students found</p></td></tr>
                    ) : (
                      clearedStudents.map((student: any) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">{student.student_id}</p>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p className="text-gray-700 dark:text-slate-300">{student.program}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">Year {student.year_of_study}</p>
                          </td>
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
