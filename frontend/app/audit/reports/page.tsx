"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { auditApi } from "../../lib/api";
import { BarChart3, Download, RefreshCw, Calendar, FileText, Clock, Filter } from "lucide-react";

export default function AuditReportsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getLogs();
      setLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return alert("No data to export");
    
    const headers = ["Timestamp", "User", "Role", "Action", "Details"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "",
        log.user?.username || "System",
        log.user?.role || "N/A",
        log.action,
        `"${(log.details || "").replace(/"/g, '""')}"` // Escape quotes
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    if (!dateRange.start && !dateRange.end) return true;
    const logDate = new Date(log.timestamp);
    if (dateRange.start && logDate < new Date(dateRange.start)) return false;
    if (dateRange.end && logDate > new Date(dateRange.end + "T23:59:59")) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 className="h-6 w-6 text-emerald-500" /> Audit Reports</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Export and analyze system activity logs</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors"><RefreshCw className="h-4 w-4" /> Refresh</button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"><Download className="h-4 w-4" /> Export CSV</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <button onClick={() => setDateRange({ start: "", end: "" })} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear Dates</button>
            </div>
          </div>

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
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><BarChart3 className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No logs found for selected dates</p></td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{log.user?.username || "System"}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{log.user?.role || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{log.action}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 max-w-md truncate">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
