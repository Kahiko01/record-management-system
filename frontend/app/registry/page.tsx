"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, FileText, CheckCircle, Clock, GraduationCap, 
  Download, Archive, Package, TrendingUp, AlertTriangle, Shield, 
  BookOpen, ScrollText, FileCheck, Activity, Lock, Unlock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegistryDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>({
    total_registered: 0, expected: 0, in_storage: 0, ready: 0, 
    collected: 0, remaining_in_custody: 0, discrepancy: 0,
    by_type: { Diploma: 0, Craft: 0, Transcript: 0, Testimonial: 0 },
    recent: []
  });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // 🔐 ZERO TRUST: Enforce role-based access
  useEffect(() => {
    const allowedRoles = ["admin", "super_admin", "super admin", "registry_officer", "dean"];
    if (user && !allowedRoles.includes(user.role)) {
      alert("🚫 Access Denied: You do not have Zero Trust clearance for the Registry.");
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch("http://127.0.0.1:8000/certificates/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setStats(await statsRes.json());

      let url = "http://127.0.0.1:8000/certificates/enriched?limit=100";
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const certsRes = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      setCertificates(await certsRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      awaiting_clearance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      in_storage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      ready_for_collection: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      collected: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      on_hold: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      awaiting_clearance: "Awaiting Clearance",
      in_storage: "In Registry Custody",
      ready_for_collection: "Ready for Collection",
      collected: "Collected",
      on_hold: "On Hold",
    };
    return (
      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleExportCSV = () => {
    const headers = ["Certificate Number", "Student Name", "Admission", "Programme", "Type", "Status", "Finance Cleared"];
    const rows = certificates.map(c => [c.certificate_number, c.student_name, c.admission_number, c.programme, c.certificate_type, c.status, c.finance_cleared ? "Yes" : "No"]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registry_reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Shield className="text-blue-600 dark:text-blue-400" /> 
            Certificate Registry & Custody
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Controlled gateway for certificate custody, reconciliation, and verified collection.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" /> Export Reconciliation
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FileText className="w-4 h-4" /> Register Existing Certificate
          </button>
        </div>
      </div>

      {/* Reconciliation KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KPICard label="Expected" value={stats.expected} icon={<Package className="w-5 h-5" />} color="gray" />
        <KPICard label="Registered" value={stats.total_registered} icon={<FileText className="w-5 h-5" />} color="blue" />
        <KPICard label="In Custody" value={stats.remaining_in_custody} icon={<Archive className="w-5 h-5" />} color="purple" />
        <KPICard label="Collected" value={stats.collected} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <KPICard 
          label="Discrepancy" 
          value={stats.discrepancy} 
          icon={<AlertTriangle className="w-5 h-5" />} 
          color={stats.discrepancy > 0 ? "red" : "emerald"} 
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search certificate number, student name, or admission..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); fetchData(); }}
          >
            <option value="">All Custody Statuses</option>
            <option value="awaiting_clearance">Awaiting Clearance</option>
            <option value="in_storage">In Registry Custody</option>
            <option value="ready_for_collection">Ready for Collection</option>
            <option value="collected">Collected</option>
            <option value="on_hold">On Hold</option>
          </select>
          <button onClick={fetchData} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Certificate Register ({certificates.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse">Loading registry data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Certificate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clearance (Read-Only)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Custody Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {certificates.length > 0 ? (
                  certificates.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">{cert.certificate_number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{cert.certificate_type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.student_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{cert.admission_number} • {cert.programme}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cert.finance_cleared ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <CheckCircle className="w-3 h-3" /> Finance Cleared
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                              <Lock className="w-3 h-3" /> Finance Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                          View Chain of Custody
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                        <Archive className="w-12 h-12" />
                        <p className="text-sm">No certificates found in register</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    gray: { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", iconBg: "bg-gray-200 dark:bg-gray-700" },
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
    green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", iconBg: "bg-green-100 dark:bg-green-900/40" },
    red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", iconBg: "bg-red-100 dark:bg-red-900/40" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`${c.iconBg} p-2 rounded-lg ${c.text}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value.toLocaleString()}</p>
    </div>
  );
}
