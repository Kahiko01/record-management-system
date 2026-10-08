"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Search, ShieldCheck, CheckCircle, XCircle, ArrowLeft, FileText, User, GraduationCap, Calendar, Lock } from "lucide-react";

export default function VerifyStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const handleVerify = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      // First try searching enriched certificates
      const res = await fetch(`http://127.0.0.1:8000/certificates/enriched?search=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setResult(data);
        } else {
          setResult([]);
        }
      } else {
        setResult([]);
      }
    } catch (err) {
      console.error(err);
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const m: Record<string, [string, string]> = {
      COLLECTED: ["bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", "Verified & Collected"],
      collected: ["bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", "Verified & Collected"],
      READY_FOR_COLLECTION: ["bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", "Ready for Collection"],
      ready_for_collection: ["bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", "Ready for Collection"],
      IN_STORAGE: ["bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", "In Registry Custody"],
      in_storage: ["bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", "In Registry Custody"],
      AWAITING_CLEARANCE: ["bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", "Awaiting Clearance"],
      awaiting_clearance: ["bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", "Awaiting Clearance"],
      ON_HOLD: ["bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", "On Hold"],
      on_hold: ["bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", "On Hold"],
    };
    const [cls, lbl] = m[status] || ["bg-gray-100 text-gray-800", status];
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cls}`}>{lbl}</span>;
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <button onClick={() => router.push("/dashboard/registry")} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Verify Student Certificate
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Confirm whether a certificate record is genuine and view its status.</p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Search Certificate Record</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter certificate number, student name, or admission number..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            <button onClick={handleVerify} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="space-y-4">
            {result && result.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verification Results ({result.length} found)</h3>
                </div>
                {result.map((cert: any) => (
                  <div key={cert.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">VERIFIED</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Certificate record is genuine</p>
                        </div>
                      </div>
                      {getStatusBadge(cert.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Certificate</p>
                        </div>
                        <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{cert.certificate_number}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{cert.certificate_type}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Student</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{cert.student_name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{cert.admission_number}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Programme</p>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{cert.programme}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{cert.department}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Clearance</p>
                        </div>
                        {cert.finance_cleared ? (
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Finance Cleared</p>
                        ) : (
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><XCircle className="h-4 w-4" /> Finance Pending</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 shadow-sm text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Record Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">No certificate record matches your search. The certificate may not be registered in this system.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
