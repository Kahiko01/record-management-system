"use client";

import { useState, useEffect } from "react";
import { clearanceApi, feeApi } from "../../lib/api";
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, XCircle, DollarSign, Award, RefreshCw } from "lucide-react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [balanceSummary, setBalanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, balanceRes] = await Promise.all([
        clearanceApi.getStats(),
        feeApi.getSummary(),
      ]);
      setStats(statsRes.data);
      setBalanceSummary(balanceRes.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  const clearanceProgress = stats ? Math.round((stats.cleared_students / (stats.total_students || 1)) * 100) : 0;
  const financeProgress = stats ? Math.round((stats.finance_cleared / ((stats.finance_pending + stats.finance_cleared + stats.finance_not_cleared) || 1)) * 100) : 0;
  const examProgress = stats ? Math.round((stats.examination_cleared / ((stats.examination_pending + stats.examination_cleared + stats.examination_not_cleared) || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <div className="flex">
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 className="h-6 w-6 text-emerald-500" /> Advanced Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Clearance trends, department performance, and financial insights</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Students</span>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_students || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Fully Cleared</span>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.cleared_students || 0}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{clearanceProgress}% completion rate</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">In Progress</span>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.in_progress_clearance || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificates Ready</span>
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.certificates_ready || 0}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{stats?.certificates_collected || 0} already collected</p>
            </div>
          </div>

          {/* Department Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Finance Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /> Finance Department Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Cleared</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats?.finance_cleared || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${financeProgress}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Pending</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{stats?.finance_pending || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((stats?.finance_pending || 0) / ((stats?.finance_pending + stats?.finance_cleared + stats?.finance_not_cleared) || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Not Cleared</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{stats?.finance_not_cleared || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((stats?.finance_not_cleared || 0) / ((stats?.finance_pending + stats?.finance_cleared + stats?.finance_not_cleared) || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Examinations Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /> Examinations Department Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Cleared</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats?.examination_cleared || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${examProgress}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Pending</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{stats?.examination_pending || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((stats?.examination_pending || 0) / ((stats?.examination_pending + stats?.examination_cleared + stats?.examination_not_cleared) || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-slate-400">Not Cleared</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{stats?.examination_not_cleared || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((stats?.examination_not_cleared || 0) / ((stats?.examination_pending + stats?.examination_cleared + stats?.examination_not_cleared) || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /> Financial Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Due</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${(balanceSummary?.total_due || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${(balanceSummary?.total_paid || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">${(balanceSummary?.total_outstanding || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{balanceSummary?.total_due ? Math.round((balanceSummary.total_paid / balanceSummary.total_due) * 100) : 0}%</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
