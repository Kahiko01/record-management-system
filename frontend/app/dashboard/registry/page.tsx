"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import {
  PackageCheck, Users, Award, Clock, AlertTriangle,
  CheckCircle2, XCircle, Calendar, FileText,
  RefreshCw, Download, Search, Filter, Plus,
  ArrowUpRight, Building2, Layers, UserCheck,
  ShieldCheck, Activity, TrendingUp, BarChart3,
  Settings, HelpCircle, ChevronRight, Eye, Lock
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'indigo' | 'cyan';
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
    amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
    rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
    purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/20" },
    slate: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-500/20" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/20" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-500/20" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-2xl p-5 border ${c.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
      </div>
      <p className={`text-2xl font-extrabold ${c.text} mb-1`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function RegistryDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>({ totalCertificates: 124, readyForCollection: 86, awaitingCollection: 42, collected: 918, onHold: 5, pendingVerification: 7, appointmentsToday: 12, clearedStudents: 103 });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    const allowed = ["admin", "super_admin", "super admin", "registry_officer", "dean"];
    if (user && !allowed.includes(user.role)) { alert("🚫 Access Denied"); router.push("/dashboard"); }
  }, [user, router]);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/certificates/enriched?limit=5", { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCertificates(data);
      } else {
        setCertificates([
          { id: 1, certificate_number: "CERT-2024-001", student_name: "John Kamau", admission_number: "KNP/2022/001", programme: "ICT", status: "ready_for_collection", storage_location: "Main Vault, Shelf 4B" },
          { id: 2, certificate_number: "CERT-2024-002", student_name: "Mary Wanjiku", admission_number: "KNP/2021/043", programme: "Business Admin", status: "ready_for_collection", storage_location: "Main Vault, Shelf 3A" },
          { id: 3, certificate_number: "CERT-2024-003", student_name: "Peter Mwangi", admission_number: "KNP/2022/087", programme: "Electrical", status: "on_hold", storage_location: "Hold Section" },
          { id: 4, certificate_number: "CERT-2024-004", student_name: "Jane Njeri", admission_number: "KNP/2022/101", programme: "Nursing", status: "collected", storage_location: "Archived" },
          { id: 5, certificate_number: "CERT-2024-005", student_name: "David Odhiambo", admission_number: "KNP/2022/045", programme: "Engineering", status: "awaiting_clearance", storage_location: "Processing" },
        ]);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      awaiting_clearance: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      ready_for_collection: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      collected: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      on_hold: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    };
    const labels: Record<string, string> = { awaiting_clearance: "Pending", ready_for_collection: "Ready", collected: "Collected", on_hold: "On Hold" };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${m[status] || "bg-slate-100 text-slate-700"}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Registry Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage certificates, collections, and student verifications</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
            <Plus className="h-4 w-4" /> New Certificate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Certificates" value={stats.totalCertificates} subtitle="In inventory" icon={FileText} color="blue" />
        <StatCard title="Ready for Collection" value={stats.readyForCollection} subtitle="Available now" icon={PackageCheck} color="emerald" />
        <StatCard title="Awaiting Collection" value={stats.awaitingCollection} subtitle="Ready but not collected" icon={Clock} color="amber" />
        <StatCard title="Collected" value={stats.collected} subtitle="Successfully released" icon={CheckCircle2} color="purple" />
        <StatCard title="On Hold" value={stats.onHold} subtitle="Blocked certificates" icon={AlertTriangle} color="rose" />
        <StatCard title="Pending Verification" value={stats.pendingVerification} subtitle="Identity checks" icon={UserCheck} color="cyan" />
        <StatCard title="Appointments Today" value={stats.appointmentsToday} subtitle="Scheduled collections" icon={Calendar} color="indigo" />
        <StatCard title="Cleared Students" value={stats.clearedStudents} subtitle="Ready for graduation" icon={Award} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" /> Recent Certificates
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Latest additions to inventory</span>
          </div>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-3 pl-2">Certificate</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Programme</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading...</td></tr> :
                  certificates.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 pl-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{c.certificate_number}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{c.student_name}</p>
                        <p className="text-xs text-slate-500">{c.admission_number}</p>
                      </td>
                      <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{c.programme}</td>
                      <td className="py-3">{getStatusBadge(c.status)}</td>
                      <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{c.storage_location || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-600" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {[
                { user: "John Doe", action: "Released Certificate", details: "CERT-2024-001 to Jane Smith", time: "Just now", color: "bg-emerald-500" },
                { user: "Mary Wanjiku", action: "Verified Identity", details: "Student ID: KNP/2022/001", time: "30m ago", color: "bg-blue-500" },
                { user: "Peter Ochieng", action: "Scheduled Appointment", details: "For John Kamau on 2024-12-20", time: "2h ago", color: "bg-indigo-500" },
                { user: "System", action: "Auto-Cleared", details: "Finance clearance for 5 students", time: "4h ago", color: "bg-slate-500" },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${item.color} shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.user} <span className="font-normal text-slate-600 dark:text-slate-400">{item.action}</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.details}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/dashboard/registry/verify" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30 transition group">
                <UserCheck className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Verify Student</p>
                  <p className="text-xs text-slate-500">Identity check</p>
                </div>
              </Link>
              <button className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30 transition group">
                <Calendar className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Schedule Collection</p>
                  <p className="text-xs text-slate-500">Set appointment</p>
                </div>
              </button>
              <Link href="/dashboard/registry/release" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30 transition group">
                <CheckCircle2 className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Release Certificate</p>
                  <p className="text-xs text-slate-500">Final handover</p>
                </div>
              </Link>
              <button className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30 transition group">
                <BarChart3 className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Generate Report</p>
                  <p className="text-xs text-slate-500">Export data</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
