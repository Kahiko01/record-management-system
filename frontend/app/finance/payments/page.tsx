"use client";

import { useState, useRef } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, RefreshCw, DollarSign } from "lucide-react";

export default function FinancePaymentsPage() {
  const { hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      parseFile(droppedFile);
    }
  };

  const parseFile = async (selectedFile: File) => {
    // In a real app, use a library like 'xlsx' or 'papaparse' to parse the file here.
    // For this UI demo, we will simulate parsed data so you can see the preview table.
    setPreviewData([
      { student_id: "STU-2024-001", amount_due: 50000, amount_paid: 50000 },
      { student_id: "STU-2024-002", amount_due: 45000, amount_paid: 20000 },
      { student_id: "STU-2024-003", amount_due: 60000, amount_paid: 60000 },
    ]);
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) return;
    setUploading(true);
    setUploadResult(null);

    try {
      const response = await clearanceApi.uploadPayments(previewData);
      setUploadResult(response.data);
      setFile(null);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      setUploadResult({ message: error.response?.data?.detail || "Failed to upload payments.", errors: [] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-emerald-500" /> Bulk Payment Upload
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Import student fee payments via Excel or CSV</p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed p-8 mb-6 transition-all cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
            />
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
                <Upload className={`h-8 w-8 ${isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {file ? file.name : "Drop your file here, or click to browse"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Supports .CSV, .XLSX, .XLS (Max 10MB)
              </p>
              {file && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData([]); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="mt-4 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                >
                  Remove File
                </button>
              )}
            </div>
          </div>

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Data Preview ({previewData.length} records)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount Due</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.student_id}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">${row.amount_due.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">${row.amount_paid.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={handleUpload}
                  disabled={uploading || !hasPermission(Permission.FINANCE_APPROVE)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Confirm & Upload to System"}
                </button>
              </div>
            </div>
          )}

          {/* Upload Result Message */}
          {uploadResult && (
            <div className={`rounded-2xl border p-5 mb-6 ${uploadResult.errors && uploadResult.errors.length > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
              <div className="flex items-start gap-3">
                {uploadResult.errors && uploadResult.errors.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">Upload Complete</h4>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{uploadResult.message}</p>
                  {uploadResult.updated !== undefined && (
                    <div className="flex gap-4 mt-2 text-xs font-medium">
                      <span className="text-emerald-700 dark:text-emerald-400">✅ {uploadResult.updated} Updated</span>
                      <span className="text-blue-700 dark:text-blue-400">➕ {uploadResult.created} Created</span>
                    </div>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto bg-white/50 dark:bg-black/20 rounded-lg p-2">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Errors:</p>
                      {uploadResult.errors.map((err: string, i: number) => (
                        <p key={i} className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions Box */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">📋 File Format Instructions</h3>
            <p className="text-xs text-blue-800 dark:text-blue-400 mb-2">Your Excel or CSV file must contain the following exact column headers:</p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li><code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] font-mono">student_id</code> (e.g., STU-2024-001)</li>
              <li><code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] font-mono">amount_due</code> (Numeric, e.g., 50000.00)</li>
              <li><code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] font-mono">amount_paid</code> (Numeric, e.g., 50000.00)</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
