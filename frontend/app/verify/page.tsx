"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Search, CheckCircle2, XCircle, GraduationCap, Award, Calendar, User, BookOpen } from "lucide-react";

export default function VerifyCertificatePage() {
  const [certNumber, setCertNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!certNumber.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`http://localhost:8000/certificates/verify/${certNumber.trim()}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult({ valid: false, message: "Certificate not found or invalid." });
      }
    } catch (error) {
      setResult({ valid: false, message: "Unable to connect to verification server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/10">

      {/* Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="KNP Digital Office" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">KNP Digital Office</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Certificate Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Secure Verification</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Verify a Certificate</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Enter the certificate number below to verify its authenticity. This service is provided by KNP Digital Office.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter certificate number (e.g., CERT-2024-001)"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || !certNumber.trim()}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Verify
            </button>
          </div>
        </div>

        {/* Result */}
        {searched && !loading && result && (
          <div className={`rounded-2xl border p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            result.valid
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/60"
              : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/60"
          }`}>
            {result.valid ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2"> Certificate Verified</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-6">This certificate is authentic and issued by KNP Digital Office.</p>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-5 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm"><span className="text-slate-500 dark:text-slate-400">Student:</span> <span className="font-semibold text-slate-900 dark:text-white">{result.student_name}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span className="text-sm"><span className="text-slate-500 dark:text-slate-400">Certificate No:</span> <span className="font-mono font-semibold text-slate-900 dark:text-white">{result.certificate_number}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-sm"><span className="text-slate-500 dark:text-slate-400">Programme:</span> <span className="font-semibold text-slate-900 dark:text-white">{result.programme}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm"><span className="text-slate-500 dark:text-slate-400">Graduation Year:</span> <span className="font-semibold text-slate-900 dark:text-white">{result.graduation_year}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm"><span className="text-slate-500 dark:text-slate-400">Status:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result.status}</span></span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-4">
                  <XCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-rose-800 dark:text-rose-300 mb-2"> Certificate Not Found</h3>
                <p className="text-sm text-rose-600 dark:text-rose-400">{result.message}</p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center space-y-3">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium transition-colors"
          >
            ← Back to Login Portal
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} KNP Digital Office. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            For inquiries, contact the Registry Office at registry@knp.edu
          </p>
        </div>
      </main>
    </div>
  );
}
