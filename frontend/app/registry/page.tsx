"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, FileText, CheckCircle, Download, Archive, 
  Package, AlertTriangle, Shield, BookOpen, Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegistryDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>({ total_registered: 0, expected: 0, in_storage: 0, ready: 0, collected: 0, remaining_in_custody: 0, discrepancy: 0 });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  useEffect(() => {
    const allowed = ["admin", "super_admin", "super admin", "registry_officer", "dean"];
    if (user && !allowed.includes(user.role)) { alert("Access Denied"); router.push("/dashboard"); }
  }, [user, router]);

  useEffect(() => { if (token) fetchData(); }, [token, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sr = await fetch("http://127.0.0.1:8000/certificates/stats", { headers: { "Authorization": `Bearer ${token}` } });
      setStats(await sr.json());
      let url = `http://127.0.0.1:8000/certificates/enriched?limit=100`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      const cr = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      setCertificates(await cr.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const badge = (s: string) => {
    const m: Record<string, [string, string]> = {
      awaiting_clearance: ["bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", "Awaiting Clearance"],
      in_storage: ["bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", "In Registry Custody"],
      ready_for_collection: ["bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", "Ready for Collection"],
      collected: ["bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", "Collected"],
      on_hold: ["bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", "On Hold"],
    };
    const [cls, lbl] = m[s] || ["bg-gray-100 text-gray-800", s];
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>{lbl}</span>;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield className="text-blue-600 dark:text-blue-400" /> Certificate Registry & Custody
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Controlled gateway for certificate custody, reconciliation, and verified collection.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { l: "Expected", v: stats.expected, i: <Package className="w-5 h-5" />, c: "gray" },
          { l: "Registered", v: stats.total_registered, i: <FileText className="w-5 h-5" />, c: "blue" },
          { l: "In Custody", v: stats.remaining_in_custody, i: <Archive className="w-5 h-5" />, c: "purple" },
          { l: "Collected", v: stats.collected, i: <CheckCircle className="w-5 h-5" />, c: "green" },
          { l: "Discrepancy", v: stats.discrepancy, i: <AlertTriangle className="w-5 h-5" />, c: stats.discrepancy > 0 ? "red" : "emerald" },
        ].map((k, idx) => {
          const cm: Record<string, string[]> = {
            gray: ["bg-gray-50 dark:bg-gray-800","text-gray-700 dark:text-gray-300","bg-gray-200 dark:bg-gray-700"],
            blue: ["bg-blue-50 dark:bg-blue-900/20","text-blue-700 dark:text-blue-300","bg-blue-100 dark:bg-blue-900/40"],
            purple: ["bg-purple-50 dark:bg-purple-900/20","text-purple-700 dark:text-purple-300","bg-purple-100 dark:bg-purple-900/40"],
            green: ["bg-green-50 dark:bg-green-900/20","text-green-700 dark:text-green-300","bg-green-100 dark:bg-green-900/40"],
            red: ["bg-red-50 dark:bg-red-900/20","text-red-700 dark:text-red-300","bg-red-100 dark:bg-red-900/40"],
            emerald: ["bg-emerald-50 dark:bg-emerald-900/20","text-emerald-700 dark:text-emerald-300","bg-emerald-100 dark:bg-emerald-900/40"],
          };
          const [bg, tx, ib] = cm[k.c] || cm.blue;
          return (
            <div key={idx} className={`${bg} p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{k.l}</p>
                <div className={`${ib} p-2 rounded-lg ${tx}`}>{k.i}</div>
              </div>
              <p className={`text-2xl font-bold ${tx}`}>{typeof k.v === 'number' ? k.v.toLocaleString() : k.v}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input type="text" placeholder="Search certificate, student name, or admission..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchData()} />
          </div>
          <select className="px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Custody Statuses</option>
            <option value="awaiting_clearance">Awaiting Clearance</option>
            <option value="in_storage">In Registry Custody</option>
            <option value="ready_for_collection">Ready for Collection</option>
            <option value="collected">Collected</option>
            <option value="on_hold">On Hold</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"><Search className="w-4 h-4" /> Search</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Certificate Register ({certificates.length})</h3>
        </div>
        {loading ? <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse">Loading registry...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Certificate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clearance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Custody Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {certificates.length > 0 ? certificates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3"><p className="font-mono text-sm font-medium text-gray-900 dark:text-white">{c.certificate_number}</p><p className="text-xs text-gray-500 dark:text-gray-400">{c.certificate_type}</p></td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900 dark:text-white">{c.student_name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{c.admission_number} • {c.programme}</p></td>
                    <td className="px-4 py-3">{c.finance_cleared ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle className="w-3 h-3" /> Cleared</span> : <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium"><Lock className="w-3 h-3" /> Pending</span>}</td>
                    <td className="px-4 py-3">{badge(c.status)}</td>
                    <td className="px-4 py-3 text-right"><button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">View History</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500"><Archive className="w-12 h-12" /><p>No certificates in register</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
