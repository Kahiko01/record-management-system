"use client";
import { useState, useEffect } from "react";
import { FileText } from "lucide-react";

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAuditLogs(); }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/id-management/audit-logs', { headers: { 'Authorization': `Bearer ${token}` } });
      setAuditLogs(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unified tamper-evident history of all ID actions</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Unified Audit Trail</h3>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{auditLogs.length} records found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Card Number</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Officer</th>
                <th className="px-6 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading audit logs...</td></tr> :
               auditLogs.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No audit logs found.</td></tr> :
               auditLogs.map((log, idx) => (
                 <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                   <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       log.action.includes("ISSUED") ? "bg-blue-100 text-blue-700" :
                       log.action.includes("COLLECTED") ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                     }`}>{log.action}</span>
                   </td>
                   <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{log.card_number}</td>
                   <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.student_name}</td>
                   <td className="px-6 py-4 text-gray-500">{log.officer}</td>
                   <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
