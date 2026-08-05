"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import { RefreshCw, Search, Filter, X } from "lucide-react";

export default function FinanceBalancesPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", course: "", level: "", status: "" });
  const [stats, setStats] = useState({ cleared: 0, pending: 0, not_cleared: 0, no_request: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await clearanceApi.getFeeBalances(filters);
      setBalances(response.data?.students || []);
      setStats(response.data?.stats || { cleared: 0, pending: 0, not_cleared: 0, no_request: 0 });
    } catch (error) {
      console.error("Failed to fetch fee balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Cleared</span>;
      case "pending":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">Pending</span>;
      case "not_cleared":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">Not Cleared</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border border-gray-200 dark:border-slate-500/30">No Request</span>;
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">💰 Fee Balances & Reports</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Complete view of student fee balances across all circumstances</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. John or ADM/123" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Course / Program</label>
                <input type="text" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Level</label>
                <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Fee Status</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All Status</option><option value="cleared">Cleared</option><option value="pending">Pending</option><option value="not_cleared">Not Cleared</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", course: "", level: "", status: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400">Cleared</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.cleared}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400">Not Cleared</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.not_cleared}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-slate-400">No Request</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-slate-400">{stats.no_request}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Finance Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {balances.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500">No records found</td></tr>
                  ) : (
                    balances.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{student.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-gray-700 dark:text-slate-300">{student.program}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">Year {student.year_of_study}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">${student.amount_due?.toLocaleString() || "0.00"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">${student.amount_paid?.toLocaleString() || "0.00"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">${student.outstanding?.toLocaleString() || "0.00"}</td>
                        <td className="px-6 py-4">{getStatusBadge(student.finance_status || "no_request")}</td>
                        <td className="px-6 py-4">{getStatusBadge(student.overall_status || "no_request")}</td>
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
