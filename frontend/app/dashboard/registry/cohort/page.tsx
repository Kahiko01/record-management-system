"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Upload, Download, FileText, CheckCircle2, XCircle, AlertTriangle, Users } from "lucide-react";

export default function CohortDataEntryPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const downloadTemplate = () => {
    const csvContent = "student_id,first_name,last_name,email,program,year_of_study
KNP/2024/001,John,Doe,john.doe@uni.ac.ke,Computer Science,1
KNP/2024/002,Jane,Smith,jane.smith@uni.ac.ke,Business Admin,1";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "student_cohort_template.csv";
    link.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = h === "year_of_study" ? parseInt(values[idx]) || 1 : values[idx];
        });
        data.push(row);
      }
    }
    return data;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResult(null);
      setError("");
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        setParsedData(data);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("No data to import. Please upload a valid CSV file.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/students/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      });

      const data = await res.json();
      if (res.status === 200 || res.status === 201) {
        setResult(data);
        setFile(null);
        setParsedData([]);
      } else {
        setError(data.detail || "Import failed. Check permissions or data format.");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" /> Cohort Data Entry
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Bulk import students into the system via CSV file
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">1</span>
              <span>Download the CSV template below. It contains the required column headers.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">2</span>
              <span>Fill in the student details. <strong className="text-slate-900 dark:text-white">student_id</strong> must be unique (e.g., Admission Number).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">3</span>
              <span>Upload the file. The system will automatically create Student records and disabled User accounts (password: student123).</span>
            </li>
          </ol>
          
          <button 
            onClick={downloadTemplate}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            <Download className="h-4 w-4" /> Download CSV Template
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Import Summary</h2>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Created</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.created}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Skipped (Exists)</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{result.skipped}</p>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">Errors</p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{result.errors.length}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload a file to see import results.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upload CSV File</h2>
        
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">CSV files only (.csv)</p>
          </div>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</span>
              <span className="text-xs text-slate-500">({parsedData.length} rows detected)</span>
            </div>
            <button 
              onClick={() => { setFile(null); setParsedData([]); }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {parsedData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Data Preview (First 10 rows)</h3>
            <span className="text-xs text-slate-500">Verify data before importing</span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-2">Student ID</th>
                  <th className="pb-2">First Name</th>
                  <th className="pb-2">Last Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Program</th>
                  <th className="pb-2">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 font-mono text-xs">{row.student_id}</td>
                    <td className="py-2">{row.first_name}</td>
                    <td className="py-2">{row.last_name}</td>
                    <td className="py-2 text-xs">{row.email}</td>
                    <td className="py-2">{row.program}</td>
                    <td className="py-2">{row.year_of_study}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p className="text-center text-xs text-slate-500 mt-3">... and {parsedData.length - 10} more rows</p>
            )}
          </div>
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            {uploading ? "Importing..." : `Import ${parsedData.length} Students`}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
