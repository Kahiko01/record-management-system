"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { auditApi } from "../../lib/api";
import { AuditLog } from "../../types";
import { ScrollText, Search, RefreshCw, Download, Filter, Clock } from "lucide-react";

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", action: "", user_id: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * 50;

      const response = await auditApi.getLogs({
        search: filters.search || undefined,
        action: filters.action || undefined,
        user_id: filters.user_id || undefined,
        limit: 50,
        offset: offset
      });

      // Handle the new paginated response format
      const data = response.data;
      setLogs(Array.isArray(data) ? data : (data.items || []));
      setTotalCount(data.total || (Array.isArray(data) ? data.length : 0));

    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await auditApi.export(filters);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      alert("Failed to export audit logs.");
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "approve":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Approve</span>;
      case "reject":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">Reject</span>;
      case "create":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">Create</span>;
      case "update":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">Update</span>;
      case "delete":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">Delete</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border border-gray-200 dark:border-slate-500/30">{action}</span>;
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><ScrollText className="h-6 w-6 text-emerald-500" /> Audit Logs</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track all system actions and changes</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Details</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. clearance or student" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Action</label>
                <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All Actions</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", action: "", user_id: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><ScrollText className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No audit logs found</p></td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                            {log.timestamp ? (
                              new Date(log.timestamp).toLocaleString('en-KE', {
                                timeZone: 'Africa/Nairobi',
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-gray-700 dark:text-slate-300 font-medium">{log.user || "System"}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{log.metadata?.role || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 max-w-md truncate">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500 dark:text-slate-400">Page {currentPage} of {totalPages} ({totalCount} total records)</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
