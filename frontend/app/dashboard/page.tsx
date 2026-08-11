"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { clearanceApi } from "../lib/api";
import PremiumKPICard from "../components/PremiumKPICard";
import Link from "next/link";
import {
  Users, CheckCircle2, Clock, XCircle, Award, FileText,
  GraduationCap, TrendingUp, DollarSign, BookOpen, Layers,
  Calendar, ShieldCheck, Activity, Sparkles, RefreshCw,
  ChevronRight, BarChart3, ArrowUpRight, Building2,
  AlertTriangle, Download, Wifi, WifiOff
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import toast from "react-hot-toast";

// ==================== TYPES ====================
interface TrendData {
  day: string;
  date: string;
  cleared: number;
  pending: number;
}

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

// ==================== SKELETON LOADER ====================
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
      <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
    </div>
  );
}

// ==================== PIE CHART COLORS ====================
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

// ==================== MAIN DASHBOARD ====================
export default function DashboardPage() {
  const { user, isStudent, isFinance, isExamination, isDean, isRegistry, isAuditor, isAdmin } = useAuth();

  // Real data states
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [programData, setProgramData] = useState<any[]>([]);
  const [bottleneckData, setBottleneckData] = useState<any[]>([]);

  // Loading states per section
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  // Error states per section
  const [statsError, setStatsError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ==================== DATA FETCHING ====================
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await clearanceApi.getStats();
      setStats(res.data);
    } catch (error: any) {
      setStatsError(error.message || "Failed to load stats");
      console.error("Stats fetch error:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const res = await clearanceApi.getTrend();
      setTrendData(res.data || []);
    } catch (error: any) {
      setTrendError(error.message || "Failed to load trend");
      console.error("Trend fetch error:", error);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/admin/monitoring/activity?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityFeed(data || []);
      } else {
        setActivityError(`HTTP ${res.status}`);
      }
    } catch (error: any) {
      setActivityError(error.message || "Failed to load activity");
      console.error("Activity fetch error:", error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await clearanceApi.getPrograms();
      setProgramData(res.data || []);
    } catch (error) {
      console.error("Programs fetch error:", error);
    }
  }, []);

  const fetchBottlenecks = useCallback(async () => {
    try {
      const res = await clearanceApi.getBottlenecks();
      setBottleneckData(res.data || []);
    } catch (error) {
      console.error("Bottlenecks fetch error:", error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchTrend(), fetchActivity(), fetchPrograms(), fetchBottlenecks()]);
    setLastUpdated(new Date());
  }, [fetchStats, fetchTrend, fetchActivity, fetchPrograms, fetchBottlenecks]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshAll]);

  // ==================== EXPORT CSV ====================
  const exportReport = () => {
    if (!stats) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Students", stats.total_students || 0],
      ["Pending Clearances", stats.pending_clearance || 0],
      ["In Progress", stats.in_progress_clearance || 0],
      ["Fully Cleared", stats.cleared_students || 0],
      ["Finance Pending", stats.finance_pending || 0],
      ["Finance Cleared", stats.finance_cleared || 0],
      ["Exam Pending", stats.examination_pending || 0],
      ["Exam Cleared", stats.examination_cleared || 0],
      ["Certificates Ready", stats.certificates_ready || 0],
      ["Certificates Collected", stats.certificates_collected || 0],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearance_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("📥 Report exported!");
  };

  // ==================== ROLE HELPERS ====================
  const getRoleBadgeTitle = () => {
    if (isStudent()) return "Student Portal";
    if (isFinance()) return "Finance Division";
    if (isExamination()) return "Examinations Desk";
    if (isDean()) return "Dean's Office";
    if (isRegistry()) return "Registry & Certificates";
    if (isAuditor()) return "Audit & Compliance";
    if (isAdmin()) return "Executive Administration";
    return "Portal Access";
  };

  const getRoleDescription = () => {
    if (isStudent()) return "Track your clearance progress across institutional departments.";
    if (isFinance()) return "Review, audit, and approve student fee settlement clearances.";
    if (isExamination()) return "Verify academic records, transcript status, and exam eligibility.";
    if (isDean()) return "Oversee faculty clearance operations and student approvals.";
    if (isRegistry()) return "Manage certificate issuance, collection schedules, and student archives.";
    if (isAuditor()) return "Monitor system access logs, clearance workflows, and compliance.";
    if (isAdmin()) return "Institutional clearance dashboard and operational metrics overview.";
    return "";
  };

  // ==================== ACTIVITY ICON MAPPING ====================
  const getActivityIcon = (action: string) => {
    if (action.includes("CLEARED") || action.includes("APPROVED")) return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" };
    if (action.includes("REJECTED") || action.includes("NOT_CLEARED")) return { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40" };
    if (action.includes("UPDATED") || action.includes("SUBMITTED")) return { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" };
    return { icon: Activity, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800" };
  };

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">

          {/* ===== WELCOME HERO ===== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {getRoleBadgeTitle()}
                  </span>
                  {lastUpdated && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Updated {timeAgo(lastUpdated.toISOString())}
                    </span>
                  )}
                  <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${autoRefresh ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"}`}>
                    {autoRefresh ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {autoRefresh ? "Live" : "Paused"}
                  </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.username || "Authorized User"} 👋
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{getRoleDescription()}</p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-auto">
                <button onClick={refreshAll} className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Refresh
                </button>
                {(isAdmin() || isAuditor()) && (
                  <button onClick={exportReport} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===== KPI CARDS ===== */}
          <div className="mb-8">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : statsError ? (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Failed to load statistics</p>
                <p className="text-xs text-rose-500 mt-1">{statsError}</p>
                <button onClick={fetchStats} className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">Retry</button>
              </div>
            ) : stats && (
              <>
                {/* Admin KPIs */}
                {isAdmin() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/clearance/overview">
                      <PremiumKPICard title="Total Students" value={stats.total_students || 0} subtitle="Enrolled database" icon={Users} color="blue" />
                    </Link>
                    <Link href="/clearance/overview?status=pending">
                      <PremiumKPICard title="Pending Clearances" value={stats.pending_clearance || 0} subtitle="Awaiting review" icon={Clock} color="amber" />
                    </Link>
                    <Link href="/clearance/overview?status=in_progress">
                      <PremiumKPICard title="In Progress" value={stats.in_progress_clearance || 0} subtitle="Active checks" icon={TrendingUp} color="purple" />
                    </Link>
                    <Link href="/clearance/overview?status=cleared">
                      <PremiumKPICard title="Fully Cleared" value={stats.cleared_students || 0} subtitle="Graduation ready" icon={CheckCircle2} color="emerald" />
                    </Link>
                  </div>
                )}

                {/* Finance KPIs */}
                {isFinance() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/clearance/finance"><PremiumKPICard title="Pending Review" value={stats.finance_pending || 0} subtitle="Settlement audits" icon={Clock} color="amber" /></Link>
                    <Link href="/clearance/finance?status=cleared"><PremiumKPICard title="Cleared" value={stats.finance_cleared || 0} subtitle="Approved" icon={CheckCircle2} color="emerald" /></Link>
                    <Link href="/clearance/finance?status=not_cleared"><PremiumKPICard title="Rejected" value={stats.finance_not_cleared || 0} subtitle="Fee arrears" icon={XCircle} color="rose" /></Link>
                    <Link href="/finance/balances"><PremiumKPICard title="Total Enrolled" value={stats.total_students || 0} subtitle="Student directory" icon={Users} color="blue" /></Link>
                  </div>
                )}

                {/* Examination KPIs */}
                {isExamination() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/clearance/examination"><PremiumKPICard title="Pending Audits" value={stats.examination_pending || 0} subtitle="Transcript signoff" icon={Clock} color="amber" /></Link>
                    <Link href="/clearance/examination?status=cleared"><PremiumKPICard title="Academically Cleared" value={stats.examination_cleared || 0} subtitle="Verified" icon={CheckCircle2} color="emerald" /></Link>
                    <Link href="/clearance/examination?status=not_cleared"><PremiumKPICard title="Academic Holds" value={stats.examination_not_cleared || 0} subtitle="Pending requirements" icon={XCircle} color="rose" /></Link>
                    <Link href="/clearance/overview"><PremiumKPICard title="Total Candidates" value={stats.total_students || 0} subtitle="Exam roster" icon={GraduationCap} color="purple" /></Link>
                  </div>
                )}

                {/* Dean KPIs */}
                {isDean() && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/clearance/dean"><PremiumKPICard title="Pending Reviews" value={stats.pending_clearance || 0} subtitle="Faculty queue" icon={Clock} color="purple" /></Link>
                    <Link href="/clearance/dean?status=in_progress"><PremiumKPICard title="In Progress" value={stats.in_progress_clearance || 0} subtitle="Cross-dept checks" icon={TrendingUp} color="amber" /></Link>
                    <Link href="/clearance/dean?status=cleared"><PremiumKPICard title="Fully Cleared" value={stats.cleared_students || 0} subtitle="Degree ready" icon={GraduationCap} color="emerald" /></Link>
                  </div>
                )}

                {/* Registry KPIs */}
                {isRegistry() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/registry"><PremiumKPICard title="Cleared Candidates" value={stats.cleared_students || 0} subtitle="Eligible for dispatch" icon={Users} color="emerald" /></Link>
                    <Link href="/registry?status=ready"><PremiumKPICard title="Certificates Ready" value={stats.certificates_ready || 0} subtitle="Available for pickup" icon={Award} color="blue" /></Link>
                    <Link href="/registry/collections"><PremiumKPICard title="Certificates Issued" value={stats.certificates_collected || 0} subtitle="Handed to alumni" icon={CheckCircle2} color="purple" /></Link>
                    <Link href="/registry/collections"><PremiumKPICard title="Scheduled Appointments" value={stats.appointments_scheduled || 0} subtitle="Booked slots" icon={Calendar} color="amber" /></Link>
                  </div>
                )}

                {/* Auditor KPIs */}
                {isAuditor() && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/clearance/overview"><PremiumKPICard title="Total Students" value={stats.total_students || 0} subtitle="Registered ledger" icon={Users} color="blue" /></Link>
                    <Link href="/clearance/overview?status=cleared"><PremiumKPICard title="Cleared Records" value={stats.cleared_students || 0} subtitle="Audit verified" icon={CheckCircle2} color="emerald" /></Link>
                    <Link href="/clearance/overview?status=pending"><PremiumKPICard title="Pending" value={stats.pending_clearance || 0} subtitle="Under audit" icon={Clock} color="amber" /></Link>
                  </div>
                )}

                {/* Student KPIs */}
                {isStudent() && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PremiumKPICard title="Clearance Status" value="Pending Review" subtitle="Awaiting verification" icon={Clock} color="amber" />
                    <PremiumKPICard title="Degree Certificate" value="Not Ready" subtitle="Upon final clearance" icon={Award} color="rose" />
                    <PremiumKPICard title="Notifications" value="0 New" subtitle="All up to date" icon={FileText} color="emerald" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== ANALYTICS CHARTS (Admin/Auditor only) ===== */}
          {(isAdmin() || isAuditor()) && (
            <>
              {/* Trend Chart + Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2">
                  {trendLoading ? <SkeletonChart /> : trendError ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Failed to load trend data</p>
                      <button onClick={fetchTrend} className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Retry</button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Clearance Velocity</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real data from audit logs — last 7 days</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1">
                          <Activity className="h-3 w-3" /> Live Data
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" vertical={false} />
                            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc" }} />
                            <Line type="monotone" dataKey="cleared" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} name="Cleared" />
                            <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} strokeDasharray="5 5" name="Pending" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Feed */}
                <div>
                  {activityLoading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-pulse">
                      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                      {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-3" />)}
                    </div>
                  ) : activityError ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Failed to load activity</p>
                      <button onClick={fetchActivity} className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Retry</button>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Live Activity
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{activityFeed.length} events</span>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {activityFeed.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No recent activity</p>
                        ) : (
                          activityFeed.map((item) => {
                            const { icon: Icon, color, bg } = getActivityIcon(item.action);
                            return (
                              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <div className={`p-1.5 rounded-lg ${bg} flex-shrink-0`}>
                                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-900 dark:text-slate-200">
                                    <span className="font-bold">{item.user || "System"}</span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-1">{item.action?.replace(/_/g, " ").toLowerCase()}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{item.details || item.module}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" /> {timeAgo(item.timestamp)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===== ADVANCED ANALYTICS (All Departments) ===== */}
          {(programData.length > 0 || bottleneckData.length > 0) && (
            <div className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Advanced Analytics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie Chart: Program Distribution */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Program Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={programData}
                          dataKey="count"
                          nameKey="program"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ program, count }) => `${program}: ${count}`}
                        >
                          {programData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Department Bottlenecks Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Department Bottlenecks</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bottleneckData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" vertical={false} />
                        <XAxis dataKey="department" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                        <Bar dataKey="pending" name="Pending" radius={[8, 8, 0, 0]}>
                          {bottleneckData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== DEPARTMENTAL BREAKDOWN (Admin only) ===== */}
          {isAdmin() && stats && !statsLoading && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Departmental Operations
                </h2>
                <button onClick={exportReport} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium">
                  <Download className="h-3 w-3" /> Export CSV
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Finance Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/60 dark:border-amber-800/60"><DollarSign className="h-5 w-5" /></div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Finance Division</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending</span><span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">{stats.finance_pending || 0}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cleared</span><span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">{stats.finance_cleared || 0}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected</span><span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">{stats.finance_not_cleared || 0}</span></div>
                  </div>
                </div>
                {/* Exams Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/60 dark:border-blue-800/60"><BookOpen className="h-5 w-5" /></div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Examinations Office</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending</span><span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">{stats.examination_pending || 0}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cleared</span><span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">{stats.examination_cleared || 0}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected</span><span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">{stats.examination_not_cleared || 0}</span></div>
                  </div>
                </div>
                {/* Registry Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200/60 dark:border-purple-800/60"><Layers className="h-5 w-5" /></div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Registry & Archive</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-500" /> Ready</span><span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">{stats.certificates_ready || 0}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Issued</span><span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60">{stats.certificates_collected || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
