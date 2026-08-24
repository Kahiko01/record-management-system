"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Search, CheckCircle2, XCircle, Loader2, ArrowLeft, Award } from "lucide-react";

// NOTE: This page is intentionally PUBLIC. No AuthContext or ProtectedRoute is used here.

export default function VerifyCertificatePage() {
  const [certificateId, setCertificateId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<null | { valid: boolean; data?: any; message: string }>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) return;

    setIsVerifying(true);
    setResult(null);

    // Simulate API call (Replace with actual backend API call later)
    setTimeout(() => {
      // Mock logic: Any ID starting with "KNP" is considered valid for this demo
      const isValid = certificateId.toUpperCase().startsWith("KNP");
      
      if (isValid) {
        setResult({
          valid: true,
          message: "This certificate is authentic and was officially issued by KNP.",
          data: {
            studentName: "John Doe",
            program: "Bachelor of Science in Computer Science",
            issueDate: "August 15, 2026",
            clearanceStatus: "Fully Cleared",
          }
        });
      } else {
        setResult({
          valid: false,
          message: "Certificate ID not found or invalid. Please check the number and try again."
        });
      }
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-8" style={{ backgroundImage: "url('/login-bg.webp')" }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center">
        
        {/* Back to Login Link */}
        <Link href="/login" className="absolute left-4 top-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>

        <section className="w-full rounded-2xl border border-white/25 bg-white/90 p-6 shadow-xl shadow-black/15 backdrop-blur-md sm:p-10">
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify a Certificate</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter the unique Certificate ID printed on the document to verify its authenticity.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="certId" className="block text-sm font-medium text-slate-700 mb-1.5">
                Certificate ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="certId"
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                  placeholder="e.g., KNP-2026-XXXXX"
                  className="block h-12 w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 uppercase tracking-wider"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Tip: Try entering <strong>KNP-2026-12345</strong> for a demo success result.
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !certificateId.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Verify Now</>
              )}
            </button>
          </form>

          {/* Verification Result */}
          {result && (
            <div className={`mt-8 rounded-xl border p-5 ${result.valid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 rounded-full p-2 ${result.valid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {result.valid ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${result.valid ? "text-emerald-900" : "text-rose-900"}`}>
                    {result.valid ? "Certificate Verified Successfully" : "Verification Failed"}
                  </h3>
                  <p className={`mt-1 text-sm ${result.valid ? "text-emerald-700" : "text-rose-700"}`}>
                    {result.message}
                  </p>

                  {result.valid && result.data && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/60 p-3 border border-emerald-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Student Name</p>
                        <p className="text-sm font-medium text-slate-900">{result.data.studentName}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 p-3 border border-emerald-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Program</p>
                        <p className="text-sm font-medium text-slate-900">{result.data.program}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 p-3 border border-emerald-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issue Date</p>
                        <p className="text-sm font-medium text-slate-900">{result.data.issueDate}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 p-3 border border-emerald-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Clearance</p>
                        <p className="text-sm font-medium text-emerald-700">{result.data.clearanceStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Award className="h-3.5 w-3.5" />
            <span>Official KNP Digital Verification Portal</span>
          </div>
        </section>
      </div>
    </main>
  );
}
