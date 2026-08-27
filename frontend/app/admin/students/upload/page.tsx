"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";

export default function BulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);
  const [agreed, setAgreed] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const isValid = selected.name.endsWith('.csv') || selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls');
      if (!isValid) {
        alert("Please select a .csv or .xlsx file");
        return;
      }
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
      const res = await fetch("http://127.0.0.1:8000/students/bulk-upload", {
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
        alert(`Upload failed: ${data.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "admission_number,full_name,programme,department,registration_year,email,phone,national_id,total_fee,paid_fee\nKNP/2024/100,John Doe,Computer Science,Computing,1,john@knp.ac.ke,0712345678,12345678,150000,0\nKNP/2024/101,Jane Smith,Nursing,Health Sciences,2,jane@knp.ac.ke,0723456789,87654321,120000,120000";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_upload_template.csv";
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">←</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Upload Students</h1>
          <p className="text-gray-500 dark:text-gray-400">Upload multiple students via CSV or Excel</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Required Columns</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Your file must include: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admission_number</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">full_name</code>, and <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">programme</code>.
          </p>
          <button onClick={downloadTemplate} className="mt-3 text-sm flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline font-medium">
            <Download className="w-4 h-4" /> Download CSV Template
          </button>
        </div>
      </div>

      <form onSubmit={handleUpload} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select File (.csv or .xlsx)</label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            />
          </div>
          {file && <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {file.name}</p>}
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
          <label htmlFor="agree" className="text-sm text-gray-600 dark:text-gray-400">
            I confirm that the data in this file is accurate and I want to add these students to the system. Duplicate admission numbers will be skipped.
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button type="submit" disabled={!file || !agreed || uploading} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2">
            {uploading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Students</>}
          </button>
        </div>
      </form>

      {result && (
        <div className={`rounded-xl border p-6 ${result.errors > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            {result.errors > 0 ? <AlertCircle className="w-5 h-5 text-yellow-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
            Upload Complete
          </h3>
          <p className="text-sm mb-4">
            Successfully added <strong>{result.success}</strong> students. 
            {result.errors > 0 && <span className="text-yellow-700 dark:text-yellow-300"> {result.errors} rows were skipped due to errors or duplicates.</span>}
          </p>
          {result.messages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto text-xs font-mono space-y-1 border border-gray-200 dark:border-gray-700">
              {result.messages.map((msg, i) => <div key={i} className="text-red-600 dark:text-red-400">• {msg}</div>)}
            </div>
          )}
          <button onClick={() => router.push("/admin/students")} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
            View Students
          </button>
        </div>
      )}
    </div>
  );
}
