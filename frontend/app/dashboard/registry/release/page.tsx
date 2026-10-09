"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Search, ShieldCheck, AlertTriangle, CheckCircle, User, FileText, Lock, ArrowLeft } from "lucide-react";

export default function ReleaseCertificatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  
  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [notes, setNotes] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  if (!token) console.warn("⚠️ No auth token found in localStorage!");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      if (!token) {
        alert("⚠️ You are not logged in. Please log in again.");
        if (!pathname.startsWith("/appointment")) router.push("/login");
        return;
      }
      console.log("🔍 Searching for:", searchQuery, "with token:", token ? "Present" : "Missing");
      const res = await fetch(`http://127.0.0.1:8000/certificates/enriched?search=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      console.log("📡 Response status:", res.status);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Error: ${err.detail || "Failed to search (Status: " + res.status + ")"}`);
        return;
      }
      
      const data = await res.json();
      console.log("✅ Backend returned data:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log("🎯 Setting certificate to:", data[0]);
        setCertificate(data[0]);
        setRecipientName(data[0].student_name); // Auto-fill
      } else {
        console.warn("⚠️ Data array is empty");
        setCertificate(null);
        alert("No certificate found matching this search.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!acknowledged) {
      alert("⚠️ Zero Trust Policy: You must confirm that the recipient has signed the acknowledgment.");
      return;
    }
    if (!idNumber.trim()) {
      alert("⚠️ Please enter the recipient's identification number.");
      return;
    }

    setReleasing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/certificates/${certificate.id}/release`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_name: recipientName,
          identification_number: idNumber,
          identification_document: "National ID",
          acknowledgement_received: true,
          notes: notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ SUCCESS!\n\nCertificate ${data.certificate_number} has been officially released.\nChain of custody updated in the Audit Ledger.`);
        router.push("/dashboard/registry");
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.detail || "Failed to release certificate"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error occurred. Please check your connection.");
    } finally {
      setReleasing(false);
    }
  };

  const isCleared = certificate?.finance_cleared; // Simplified for prototype

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <button onClick={() => router.push("/dashboard/registry")} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Release Certificate
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Verify identity, check clearance, and officially hand over the certificate.</p>
        </div>

        {/* Step 1: Search */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">1. Find Certificate</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by certificate number, student name, or admission number..." 
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {certificate && (
          <div className="space-y-6">
            {/* Step 2: Verification Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">2. Verification & Clearance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Certificate</p>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{certificate.certificate_number}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{certificate.certificate_type} • {certificate.programme}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Student</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{certificate.student_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{certificate.admission_number}</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center gap-3 ${isCleared ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'}`}>
                {isCleared ? <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> : <Lock className="h-6 w-6 text-rose-600 dark:text-rose-400" />}
                <div>
                  <p className={`font-semibold ${isCleared ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {isCleared ? "All Clearances Verified" : "Clearance Pending"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isCleared ? "Student has satisfied all departmental requirements." : "Cannot release certificate until Finance and Exams clear the student."}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Handover Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">3. Recipient Identity & Handover</h2>
              
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recipient Name</label>
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identification Number (e.g., National ID)</label>
                  <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter ID number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Internal Notes (Optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      I confirm that I have verified the recipient's identity, checked their clearance status, and they have physically signed the collection register.
                    </span>
                  </label>
                </div>

                <button 
                  onClick={handleRelease} 
                  disabled={!isCleared || !acknowledged || !idNumber.trim() || releasing}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {releasing ? "Processing..." : "Confirm & Release Certificate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
