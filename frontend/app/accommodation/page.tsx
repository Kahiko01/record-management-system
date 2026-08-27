"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Home, Download, CheckCircle } from "lucide-react";

export default function AccommodationPage() {
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
      const res = await fetch("http://127.0.0.1:8000/students/merge-upload?update_columns=accommodation_status,hostel", {
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

  const downloadMasterList = async () => {
    setDownloading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/students?limit=10000", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const students = data.students || data.items || [];
        
        const headers = ["admission_number", "full_name", "programme", "accommodation_status", "hostel"];
        const csvRows = students.map((s: any) => 
          headers.map(h => `"${(s[h] !== undefined && s[h] !== null ? s[h] : '').toString().replace(/"/g, '""')}"`).join(",")
        );
        const csvContent = [headers.join(","), ...csvRows].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `accommodation_master_list_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Failed to fetch student data. Please log in again.");
      }
    } catch (err) {
      alert("Network error while downloading.");
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
            <Home className="w-7 h-7 text-orange-600" /> Accommodation Upload
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Update student hostel and boarding status</p>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Accommodation Department</h3>
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Updates <strong>only accommodation fields</strong> (accommodation_status, hostel). Other data remains unchanged.
        </p>
        <button 
          onClick={downloadMasterList}
          disabled={downloading}
          className="mt-3 text-sm flex items-center gap-1 text-orange-700 dark:text-orange-300 hover:underline disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {downloading ? "Downloading..." : "Download Master List (20 Students)"}
        </button>
      </div>

      <form onSubmit={handleUpload} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select File (.csv or .xlsx)</label>
          <input 
            type="file" 
            accept=".csv,.xlsx" 
            onChange={handleFileChange}
            className="block w-full text-sm"
          />
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4" />
          <label htmlFor="agree" className="text-sm text-gray-600 dark:text-gray-400">
            I confirm the accommodation data is accurate.
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
          <button type="submit" disabled={!file || !agreed || uploading} className="px-6 py-2.5 bg-orange-600 text-white rounded-lg disabled:bg-gray-400">
            {uploading ? "Uploading..." : "Update Accommodation"}
          </button>
        </div>
      </form>

      {result && (
        <div className="rounded-xl border p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Upload Complete</h3>
          <p>Updated <strong>{result.success}</strong> records. {result.errors} errors.</p>
          {result.messages.length > 0 && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded p-4 text-xs space-y-1">
              {result.messages.map((msg, i) => <div key={i} className="text-red-600">• {msg}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
