"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, GraduationCap, AlertCircle, CheckCircle, Download } from "lucide-react";

export default function ExamResultsUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !agreed) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/students/merge-upload?update_columns=status", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult({
          success: data.success_count || 0,
          errors: data.error_count || 0,
          messages: data.errors || []
        });
      } else {
        alert(`Upload failed: ${data.detail}`);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/students?finance_cleared=true&limit=10000", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const students = data.students || data.items || [];
        
        const headers = ["admission_number", "full_name", "programme", "status", "exams_status"];
        const csvRows = students.map((s: any) => 
          headers.map(h => `"${(s[h] !== undefined && s[h] !== null ? s[h] : '').toString().replace(/"/g, '""')}"`).join(",")
        );
        const csvContent = [headers.join(","), ...csvRows].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `exams_master_list_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Failed to fetch student data. Please log in again.");
      }
    } catch (err) {
      alert("Network error while downloading template.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">←</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" /> Exam Results Upload
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Update student status</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Examinations Department</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Updates <strong>only student status</strong> (GRADUATED, SUSPENDED, etc.).
        </p>
        <button 
          onClick={downloadTemplate}
          disabled={downloading}
          className="mt-3 text-sm flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {downloading ? "Downloading..." : "Download Cleared Students Only"}
        </button>
      </div>

      <form onSubmit={handleUpload} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select File</label>
          <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="block w-full text-sm" />
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4" />
          <label htmlFor="agree" className="text-sm">I confirm the data is accurate.</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border rounded-lg">Cancel</button>
          <button type="submit" disabled={!file || !agreed || uploading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
            {uploading ? "Uploading..." : "Update Status"}
          </button>
        </div>
      </form>

      {result && (
        <div className="rounded-xl border p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-bold mb-2">Complete</h3>
          <p>Updated <strong>{result.success}</strong> records.</p>
        </div>
      )}
    </div>
  );
}
