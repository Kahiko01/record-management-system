"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Permission } from "../context/AuthContext";
import Link from "next/link";
import {
  PackageCheck, Users, Award, Clock, AlertTriangle,
  CheckCircle2, XCircle, Calendar, FileText,
  RefreshCw, Download, Search, Filter, Plus,
  ArrowUpRight, Building2, Layers, UserCheck,
  ShieldCheck, Activity, TrendingUp, BarChart3,
  Settings, HelpCircle, ChevronRight, Eye
} from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// TYPES
// ============================================
interface DashboardStats {
  totalCertificates: number;
  readyForCollection: number;
  awaitingCollection: number;
  collected: number;
  onHold: number;
  pendingVerification: number;
  appointmentsToday: number;
  clearedStudents: number;
}

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  details: string;
  timestamp: string;
}

interface CertificateItem {
  id: number;
  certificateNumber: string;
  studentName: string;
  studentId: string;
  programme: string;
  status: string;
  location: string;
  createdAt: string;
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  href?: string;
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
    amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
    rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
    purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/20" },
    slate: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-500/20" },
  };

  const CardContent = () => (
    <div className={`rounded-2xl p-6 border ${colorMap[color].border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 group ${href ? 'cursor-pointer hover:-translate-y-1' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color].bg}`}>
          <Icon className={`h-5 w-5 ${colorMap[color].text}`} />
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <p className={`text-3xl font-extrabold ${colorMap[color].text} mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <CardContent />
      </Link>
    );
  }
  return <CardContent />;
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function RegistryDashboard() {
  const { hasPermission, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalCertificates: 0,
    readyForCollection: 0,
    awaitingCollection: 0,
    collected: 0,
    onHold: 0,
    pendingVerification: 0,
    appointmentsToday: 0,
    clearedStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Security Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Fetch Data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      const mockStats: DashboardStats = {
        totalCertificates: 124,
        readyForCollection: 86,
        awaitingCollection: 42,
        collected: 918,
        onHold: 5,
        pendingVerification: 7,
        appointmentsToday: 12,
        clearedStudents: 103,
      };
      setStats(mockStats);

      const mockActivity: RecentActivity[] = [
        { id: 1, user: "John Doe", action: "Released Certificate", details: "CERT-2024-001 to Jane Smith", timestamp: new Date().toISOString() },
        { id: 2, user: "Mary Wanjiku", action: "Verified Identity", details: "Student ID: KNP/2022/001", timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: 3, user: "Peter Ochieng", action: "Scheduled Appointment", details: "For John Kamau on 2024-12-20", timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, user: "System", action: "Auto-Cleared", details: "Finance clearance for 5 students", timestamp: new Date(Date.now() - 14400000).toISOString() },
        { id: 5, user: "James Mwangi", action: "Marked Ready", details: "Certificate CERT-2024-045 marked ready", timestamp: new Date(Date.now() - 21600000).toISOString() },
      ];
      setRecentActivity(mockActivity);

      const mockCertificates: CertificateItem[] = [
        { id: 1, certificateNumber: "CERT-2024-001", studentName: "John Kamau", studentId: "KNP/2022/001", programme: "ICT", status: "Ready", location: "Main Vault, Shelf 4B", createdAt: "2024-01-15" },
        { id: 2, certificateNumber: "CERT-2024-002", studentName: "Mary Wanjiku", studentId: "KNP/2021/043", programme: "Business Admin", status: "Ready", location: "Main Vault, Shelf 3A", createdAt: "2024-01-14" },
        { id: 3, certificateNumber: "CERT-2024-003", studentName: "Peter Mwangi", studentId: "KNP/2022/087", programme: "Electrical", status: "On Hold", location: "Hold Section", createdAt: "2024-01-13" },
        { id: 4, certificateNumber: "CERT-2024-004", studentName: "Jane Njeri", studentId: "KNP/2022/101", programme: "Nursing", status: "Collected", location: "Archived", createdAt: "2024-01-12" },
        { id: 5, certificateNumber: "CERT-2024-005", studentName: "David Odhiambo", studentId: "KNP/2022/045", programme: "Engineering", status: "Pending", location: "Processing", createdAt: "2024-01-11" },
      ];
      setCertificates(mockCertificates);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      "On Hold": "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
      Collected: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.Pending}`}>
        {status}
      </span>
    );
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Loading State
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <div className="flex">
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* ===== HEADER ===== */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="h-8 w-8 text-emerald-500" />
                  Registry Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage certificates, collections, and student verifications
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchDashboardData}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                  <Plus className="h-4 w-4" /> New Certificate
                </button>
              </div>
            </div>

            {/* ===== STATS CARDS ===== */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Certificates"
                value={stats.totalCertificates}
                subtitle="In inventory"
                icon={FileText}
                color="slate"
              />
              <StatCard
                title="Ready for Collection"
                value={stats.readyForCollection}
                subtitle="Available now"
                icon={Award}
                color="emerald"
                href="/dashboard/registry?filter=ready"
              />
              <StatCard
                title="Awaiting Collection"
                value={stats.awaitingCollection}
                subtitle="Ready but not collected"
                icon={Clock}
                color="amber"
                href="/dashboard/registry?filter=awaiting"
              />
              <StatCard
                title="Collected"
                value={stats.collected}
                subtitle="Successfully released"
                icon={CheckCircle2}
                color="blue"
              />
            </div>

            {/* ===== SECONDARY STATS ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="On Hold"
                value={stats.onHold}
                subtitle="Blocked certificates"
                icon={XCircle}
                color="rose"
              />
              <StatCard
                title="Pending Verification"
                value={stats.pendingVerification}
                subtitle="Identity checks"
                icon={UserCheck}
                color="purple"
              />
              <StatCard
                title="Appointments Today"
                value={stats.appointmentsToday}
                subtitle="Scheduled collections"
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Cleared Students"
                value={stats.clearedStudents}
                subtitle="Ready for graduation"
                icon={Users}
                color="emerald"
              />
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ===== CERTIFICATE TABLE ===== */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      Recent Certificates
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latest additions to inventory</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white w-36 sm:w-48"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-700 dark:text-slate-300"
                    >
                      <option value="all">All Status</option>
                      <option value="Ready">Ready</option>
                      <option value="Pending">Pending</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Collected">Collected</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Certificate</th>
                        <th className="px-4 py-3 text-left font-semibold">Student</th>
                        <th className="px-4 py-3 text-left font-semibold">Programme</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredCertificates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            No certificates found
                          </td>
                        </tr>
                      ) : (
                        filteredCertificates.map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white font-mono text-xs">
                              {cert.certificateNumber}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 dark:text-white">{cert.studentName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{cert.studentId}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cert.programme}</td>
                            <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{cert.location}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===== ACTIVITY FEED ===== */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Recent Activity
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Live updates from the registry</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{recentActivity.length} events</span>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-white">
                              {item.user}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {item.action}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {item.details}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {timeAgo(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== QUICK ACTIONS ===== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all group text-left">
                  <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Verify Student</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Identity check</p>
                </button>
                <button className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group text-left">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Schedule Collection</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Set appointment</p>
                </button>
                <button className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group text-left">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Release Certificate</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Final handover</p>
                </button>
                <button className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group text-left">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Generate Report</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Export data</p>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
