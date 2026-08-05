"use client";

import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { clearanceApi } from "../lib/api";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Award, 
  FileText, 
  GraduationCap, 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Layers, 
  Calendar,
  ShieldCheck,
  Activity,
  Sparkles,
  RefreshCw,
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  Building2
} from "lucide-react";
import Link from "next/link";

// Custom Enterprise KPI Card
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badgeText, 
  badgeType = "emerald" 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: any; 
  badgeText?: string; 
  badgeType?: "emerald" | "amber" | "rose" | "blue" | "purple";
}) {
  const badgeStyles = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80",
  };

  const iconStyles = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60",
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${iconStyles[badgeType]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        {badgeText && (
          <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isStudent, isFinance, isExamination, isDean, isRegistry, isAuditor, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearanceApi.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-600"></div>
          <Activity className="w-6 h-6 text-emerald-600 absolute" />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          Initializing Analytics Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* WELCOME HERO BANNER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8 relative overflow-hidden">
            {/* Top Emerald Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {getRoleBadgeTitle()}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Clearance Session Active
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.username || "Authorized User"} 👋
                </h1>
                
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isStudent() && "Track your clearance progress across institutional departments."}
                  {isFinance() && "Review, audit, and approve student fee settlement clearances."}
                  {isExamination() && "Verify academic records, transcript status, and exam eligibility."}
                  {isDean() && "Oversee faculty clearance operations and student approvals."}
                  {isRegistry() && "Manage certificate issuance, collection schedules, and student archives."}
                  {isAuditor() && "Monitor system access logs, clearance workflows, and compliance."}
                  {isAdmin() && "Institutional clearance dashboard and operational metrics overview."}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Refresh Feed
                </button>
              </div>
            </div>
          </div>

          {/* STUDENT DASHBOARD */}
          {isStudent() && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard 
                title="Clearance Status" 
                value="Pending Review" 
                subtitle="Application submitted & awaiting verification" 
                icon={Clock} 
                badgeText="In Progress" 
                badgeType="amber" 
              />
              <KPICard 
                title="Degree Certificate" 
                value="Not Ready" 
                subtitle="Issued upon final clearance completion" 
                icon={Award} 
                badgeText="Locked" 
                badgeType="rose" 
              />
              <KPICard 
                title="Notifications" 
                value="0 New Alerts" 
                subtitle="All department updates will appear here" 
                icon={FileText} 
                badgeText="Up to date" 
                badgeType="emerald" 
              />
            </div>
          )}

          {/* FINANCE OFFICER */}
          {isFinance() && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard 
                title="Pending Review" 
                value={stats.finance_pending || 0} 
                subtitle="Requests requiring settlement audit" 
                icon={Clock} 
                badgeText="Action Required" 
                badgeType="amber" 
              />
              <KPICard 
                title="Cleared Requests" 
                value={stats.finance_cleared || 0} 
                subtitle="Successfully approved applications" 
                icon={CheckCircle2} 
                badgeText="Approved" 
                badgeType="emerald" 
              />
              <KPICard 
                title="Rejected Requests" 
                value={stats.finance_not_cleared || 0} 
                subtitle="Withheld due to fee arrears" 
                icon={XCircle} 
                badgeText="Withheld" 
                badgeType="rose" 
              />
              <KPICard 
                title="Total Enrolled" 
                value={stats.total_students || 0} 
                subtitle="Student directory database" 
                icon={Users} 
                badgeText="Database Total" 
                badgeType="blue" 
              />
            </div>
          )}

          {/* EXAMINATION OFFICE */}
          {isExamination() && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard 
                title="Pending Audits" 
                value={stats.examination_pending || 0} 
                subtitle="Academic transcripts awaiting signoff" 
                icon={Clock} 
                badgeText="Queue Active" 
                badgeType="amber" 
              />
              <KPICard 
                title="Academically Cleared" 
                value={stats.examination_cleared || 0} 
                subtitle="Verified for graduation" 
                icon={CheckCircle2} 
                badgeText="Verified" 
                badgeType="emerald" 
              />
              <KPICard 
                title="Academic Holds" 
                value={stats.examination_not_cleared || 0} 
                subtitle="Pending course unit requirements" 
                icon={XCircle} 
                badgeText="On Hold" 
                badgeType="rose" 
              />
              <KPICard 
                title="Total Candidates" 
                value={stats.total_students || 0} 
                subtitle="Exam roster database" 
                icon={GraduationCap} 
                badgeText="Roster Total" 
                badgeType="purple" 
              />
            </div>
          )}

          {/* DEAN */}
          {isDean() && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard 
                title="Pending Faculty Reviews" 
                value={stats.pending_clearance || 0} 
                subtitle="Faculty queue awaiting review" 
                icon={Clock} 
                badgeText="Pending Signoff" 
                badgeType="purple" 
              />
              <KPICard 
                title="Clearances In Progress" 
                value={stats.in_progress_clearance || 0} 
                subtitle="Active cross-department clearance" 
                icon={TrendingUp} 
                badgeText="Processing" 
                badgeType="amber" 
              />
              <KPICard 
                title="Fully Cleared Students" 
                value={stats.cleared_students || 0} 
                subtitle="Ready for degree conferment" 
                icon={GraduationCap} 
                badgeText="Degree Ready" 
                badgeType="emerald" 
              />
            </div>
          )}

          {/* REGISTRY */}
          {isRegistry() && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPICard 
                title="Cleared Candidates" 
                value={stats.cleared_students || 0} 
                subtitle="Eligible for certificate dispatch" 
                icon={Users} 
                badgeText="Completed" 
                badgeType="emerald" 
              />
              <KPICard 
                title="Certificates Ready" 
                value={stats.certificates_ready || 0} 
                subtitle="Printed and available for collection" 
                icon={Award} 
                badgeText="Available" 
                badgeType="blue" 
              />
              <KPICard 
                title="Certificates Issued" 
                value={stats.certificates_collected || 0} 
                subtitle="Successfully handed over to alumni" 
                icon={CheckCircle2} 
                badgeText="Collected" 
                badgeType="purple" 
              />
              <KPICard 
                title="Scheduled Collection Appointments" 
                value={stats.appointments_scheduled || 0} 
                subtitle="Booked registry time slots" 
                icon={Calendar} 
                badgeText="Appointments" 
                badgeType="amber" 
              />
            </div>
          )}

          {/* AUDITOR */}
          {isAuditor() && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard 
                title="Total System Students" 
                value={stats.total_students || 0} 
                subtitle="Registered student ledger" 
                icon={Users} 
                badgeText="Total Records" 
                badgeType="blue" 
              />
              <KPICard 
                title="Total Cleared Records" 
                value={stats.cleared_students || 0} 
                subtitle="Finalized clearance records" 
                icon={CheckCircle2} 
                badgeText="Audit Verified" 
                badgeType="emerald" 
              />
              <KPICard 
                title="Pending Clearances" 
                value={stats.pending_clearance || 0} 
                subtitle="Active open workflows" 
                icon={Clock} 
                badgeText="Under Audit" 
                badgeType="amber" 
              />
            </div>
          )}

          {/* SUPER ADMIN OVERVIEW */}
          {isAdmin() && stats && (
            <>
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard 
                  title="Total Students" 
                  value={stats.total_students || 0} 
                  subtitle="Total enrolled institutional database" 
                  icon={Users} 
                  badgeText="Live Ledger" 
                  badgeType="blue" 
                />
                <KPICard 
                  title="Pending Clearances" 
                  value={stats.pending_clearance || 0} 
                  subtitle="Applications awaiting first review" 
                  icon={Clock} 
                  badgeText="Queue Active" 
                  badgeType="amber" 
                />
                <KPICard 
                  title="Clearance In Progress" 
                  value={stats.in_progress_clearance || 0} 
                  subtitle="Multi-department active checks" 
                  icon={TrendingUp} 
                  badgeText="Processing" 
                  badgeType="purple" 
                />
                <KPICard 
                  title="Fully Cleared Students" 
                  value={stats.cleared_students || 0} 
                  subtitle="Verified graduation candidates" 
                  icon={CheckCircle2} 
                  badgeText="Completed" 
                  badgeType="emerald" 
                />
              </div>

              {/* Departmental Breakdown Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Departmental Operations Audit
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Finance Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Finance Division
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Fee Clearance
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Review
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                          {stats.finance_pending || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cleared
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                          {stats.finance_cleared || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected / Holds
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">
                          {stats.finance_not_cleared || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exams Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/60 dark:border-blue-800/60">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Examinations Office
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Academic Audit
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Review
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                          {stats.examination_pending || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cleared
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                          {stats.examination_cleared || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected / Holds
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">
                          {stats.examination_not_cleared || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registry Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200/60 dark:border-purple-800/60">
                          <Layers className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Registry & Archive
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Certificates
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-blue-500" /> Certificates Ready
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">
                          {stats.certificates_ready || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Certificates Issued
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60">
                          {stats.certificates_collected || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* QUICK ACTIONS & SYSTEM AUDIT PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Operational Shortcuts & Navigation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct management links based on your active access role.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin() && (
                <Link 
                  href="/admin/users" 
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Manage System Users
                </Link>
              )}
              {isFinance() && (
                <Link 
                  href="/clearance/finance" 
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Finance Clearance Queue
                </Link>
              )}
              {isRegistry() && (
                <Link 
                  href="/registry" 
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" /> Registry Collection Desk
                </Link>
              )}
              <Link 
                href="/dashboard" 
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Operational Data
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
