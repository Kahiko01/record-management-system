"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { reportApi } from "../lib/api";
import ReportFilterPanel from "../components/ReportFilterPanel";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Download, Calendar, Filter, RefreshCw
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, hasPermission } = useAuth();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savedReports, setSavedReports] = useState<{ name: string; filters: any }[]>([]);
  const [filters, setFilters] = useState<any>({
    actions: [],
    modules: [],
    severities: [],
    username: ""
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasPermission("auditor:view_reports"))) {
      router.replace("/unauthorized");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    const saved = localStorage.getItem("savedReports");
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved reports:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && hasPermission("auditor:view_reports")) {
      fetchAnalytics();
    }
  }, [isAuthenticated, hasPermission, dateRange, filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      // Add filters if they exist
      if (filters.actions && filters.actions.length > 0) {
        params.actions = filters.actions.join(",");
      }
      if (filters.modules && filters.modules.length > 0) {
        params.modules = filters.modules.join(",");
      }
      if (filters.severities && filters.severities.length > 0) {
        params.severities = filters.severities.join(",");
      }
      if (filters.username) {
        params.username = filters.username;
      }
      
      const response = await reportApi.getAnalytics(params);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params: any = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      if (filters.actions && filters.actions.length > 0) params.actions = filters.actions.join(",");
      if (filters.modules && filters.modules.length > 0) params.modules = filters.modules.join(",");
      if (filters.severities && filters.severities.length > 0) params.severities = filters.severities.join(",");
      if (filters.username) params.username = filters.username;
      
      const response = await reportApi.exportCSV(params);
      
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params: any = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };
      
      if (filters.actions && filters.actions.length > 0) params.actions = filters.actions.join(",");
      if (filters.modules && filters.modules.length > 0) params.modules = filters.modules.join(",");
      if (filters.severities && filters.severities.length > 0) params.severities = filters.severities.join(",");
      if (filters.username) params.username = filters.username;
      
      const response = await reportApi.exportPDF(params);
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="flex">
        <main className="flex-1 ml-64 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Audit trail insights and exportable reports
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Custom Filter Panel */}
            <ReportFilterPanel
              filters={{
                start_date: dateRange.start,
                end_date: dateRange.end,
                actions: filters.actions || [],
                modules: filters.modules || [],
                severities: filters.severities || [],
                username: filters.username || ""
              }}
              onChange={(newFilters) => {
                setDateRange({ start: newFilters.start_date, end: newFilters.end_date });
                setFilters({
                  actions: newFilters.actions || [],
                  modules: newFilters.modules || [],
                  severities: newFilters.severities || [],
                  username: newFilters.username || ""
                });
              }}
              onSave={(name) => {
                const newReport = { 
                  name, 
                  filters: { 
                    start_date: dateRange.start, 
                    end_date: dateRange.end, 
                    actions: filters.actions || [], 
                    modules: filters.modules || [], 
                    severities: filters.severities || [], 
                    username: filters.username || "" 
                  } 
                };
                const updatedReports = [...savedReports, newReport];
                setSavedReports(updatedReports);
                localStorage.setItem("savedReports", JSON.stringify(updatedReports));
              }}
              savedReports={savedReports}
              onLoadReport={(loadedFilters) => {
                setDateRange({ 
                  start: loadedFilters.start_date, 
                  end: loadedFilters.end_date 
                });
                setFilters({
                  actions: loadedFilters.actions || [],
                  modules: loadedFilters.modules || [],
                  severities: loadedFilters.severities || [],
                  username: loadedFilters.username || ""
                });
              }}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : analytics ? (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KPICard
                    title="Total Events"
                    value={analytics.totals.total_events}
                    icon={TrendingUp}
                    color="blue"
                  />
                  <KPICard
                    title="Login Success"
                    value={analytics.totals.login_success}
                    icon={CheckCircle}
                    color="emerald"
                  />
                  <KPICard
                    title="Login Failed"
                    value={analytics.totals.login_failed}
                    icon={TrendingDown}
                    color="red"
                  />
                  <KPICard
                    title="Permission Denied"
                    value={analytics.totals.permission_denied}
                    icon={AlertTriangle}
                    color="amber"
                  />
                </div>

                {/* Time Series Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-lg font-bold mb-4">Daily Activity</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="login_success" stroke="#10b981" name="Login Success" />
                      <Line type="monotone" dataKey="login_failed" stroke="#ef4444" name="Login Failed" />
                      <Line type="monotone" dataKey="permission_denied" stroke="#f59e0b" name="Permission Denied" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Severity */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-bold mb-4">By Severity</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.by_severity).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analytics.by_severity).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* By Module */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-bold mb-4">By Module</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.by_module}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="module" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Users Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-lg font-bold mb-4">Top Active Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold">User</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold">Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.top_users && analytics.top_users.map((user: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 px-4 text-sm">{user.username}</td>
                            <td className="py-3 px-4 text-sm text-right font-mono">{user.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                No analytics data available for the selected date range.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    amber: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm opacity-80 mt-1">{title}</p>
    </div>
  );
}
