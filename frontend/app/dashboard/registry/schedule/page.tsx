"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Search, Calendar, Clock, User, FileText, ArrowLeft, CheckCircle, AlertCircle, Link as LinkIcon, Copy } from "lucide-react";

export default function ScheduleCollectionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [expiresHours, setExpiresHours] = useState(24);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/certificates/enriched?search=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCertificate(data[0]);
      } else {
        setCertificate(null);
        alert("No certificate found matching this search.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!appointmentDate || !appointmentTime) {
      alert("⚠️ Please select both date and time for the appointment.");
      return;
    }

    setGeneratingLink(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/appointments/generate-link?certificate_id=${certificate.id}&expires_hours=${expiresHours}&appointment_date=${encodeURIComponent(appointmentDate)}&appointment_time=${encodeURIComponent(appointmentTime)}&notes=${encodeURIComponent(notes)}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (res.ok) {
        setGeneratedLink(data.link);
        setSuccess(true);
      } else {
        alert(`❌ Error: ${data.detail || "Failed to generate link"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error occurred.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <button onClick={() => router.push("/dashboard/registry")} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Link Generated Successfully!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
              Send this secure link to <strong>{certificate.student_name}</strong>
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Appointment Link:</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Appointment Details:</strong><br />
                Date: {appointmentDate} at {appointmentTime}<br />
                Expires in: {expiresHours} hours
              </p>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setGeneratedLink("");
                setCertificate(null);
                setSearchQuery("");
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Generate Another Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <button onClick={() => router.push("/dashboard/registry")} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" /> Schedule Certificate Collection
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate a secure appointment link for a student.</p>
        </div>

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
          <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">2. Certificate Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Certificate</p>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{certificate.certificate_number}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{certificate.certificate_type}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Student</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{certificate.student_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{certificate.admission_number}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">3. Generate Secure Link</h2>
              
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" /> Appointment Date
                    </label>
                    <input 
                      type="date" 
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" /> Appointment Time
                    </label>
                    <input 
                      type="time" 
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Expiry (hours)</label>
                  <input 
                    type="number" 
                    value={expiresHours}
                    onChange={(e) => setExpiresHours(Number(e.target.value))}
                    min="1"
                    max="168"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes for Student (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Please bring your National ID and student card..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>

                <button 
                  onClick={handleGenerateLink} 
                  disabled={!appointmentDate || !appointmentTime || generatingLink}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  {generatingLink ? "Generating..." : "Generate Secure Link"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
