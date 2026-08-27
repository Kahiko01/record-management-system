"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, ShieldCheck, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CohortManagement() {
  const { user, hasTask } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; errorDetails: string[] } | null>(null);
  const [selectedTask, setSelectedTask] = useState("registry:manage_cohort");

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // 🔐 ZERO TRUST: Check granular task permission
  const canManage = hasTask("registry:manage_cohort") || hasTask("finance:update_cohort_fees") || hasTask("exam:update_cohort_status") || user?.role === 'super_admin';

  if (!canManage) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-600">🚫 Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have the granular task permission to manage the graduating cohort.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to Dashboard</button>
      </div>
    );
  }

  const downloadMasterList = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/students?limit=1000", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      const students = data.students || data.items || [];
      
      // Create CSV with all student data + empty department columns
      const headers = ["admission_number", "first_name", "last_name", "program", "year_of_study", "total_fee", "paid_fee", "exam_status", "accommodation_status"];
      const csvContent = [
        headers.join(","),
        ...students.map((s: any) => [
          s.student_id || s.admission_number,
          s.first_name,
          s.last_name,
          s.program || s.programme,
          s.year_of_study || 1,
          s.total_fee || 0,
          s.paid_fee || 0,
          "PENDING", // Default exam status
          "PENDING"  // Default accommodation status
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `master_graduating_cohort_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      alert("Failed to download master list.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("required_task", selectedTask);

    try {
      const response = await fetch("http://127.0.0.1:8000/students/cohort/update", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }
      
      const data = await response.json();
      setResult({
        success: data.success_count,
        errors: data.error_count,
        errorDetails: data.errors || []
      });
      setFile(null);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Graduating Cohort Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Download the master list, update your department's columns, and upload to merge changes safely.</p>
        </div>

        {/* Step 1: Download */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Download className="w-5 h-5 text-blue-600" /> Step 1: Download Master Cohort List
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This CSV contains all active students. Add or update your department's specific columns (e.g., Finance adds 'paid_fee', Exams adds 'exam_status').</p>
          <button onClick={downloadMasterList} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            <Download className="w-4 h-4" /> Download Master List.csv
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Upload className="w-5 h-5 text-green-600" /> Step 2: Upload Department Updates
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Your Department Task</label>
            <select 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="registry:manage_cohort">Registry (Full Update)</option>
              <option value="finance:update_cohort_fees">Finance (Fee Updates Only)</option>
              <option value="exam:update_cohort_status">Examinations (Academic Status)</option>
              <option value="accommodation:update_cohort_status">Accommodation (Hostel Status)</option>
            </select>
          </div>

          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition bg-gray-50 dark:bg-gray-900/50 ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="cohort-upload" />
            <label htmlFor="cohort-upload" className="cursor-pointer block">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="w-5 h-5" /> {file.name}
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to browse your updated CSV/Excel file</p>
                </div>
              )}
            </label>
          </div>

          <button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition">
            {uploading ? "Processing Merge..." : "Upload & Merge Department Data"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Merge Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Records Updated</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.success}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">Failed / Skipped</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{result.errors}</p>
              </div>
            </div>
            {result.errorDetails.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Error Details
                </h3>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
                  {result.errorDetails.map((err, idx) => <li key={idx}>• {err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
