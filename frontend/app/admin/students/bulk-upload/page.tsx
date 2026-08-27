"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const CSV_TEMPLATE = `admission_number,full_name,programme,department,school,registration_year,status,gender,national_id,email,phone
KNP/2024/001,John Doe,Diploma in IT,Computing,School of ICT,2024,ACTIVE,Male,12345678,john@test.com,0700000000
KNP/2024/002,Jane Smith,Diploma in Nursing,Nursing,School of Health,2024,ACTIVE,Female,87654321,jane@test.com,0711111111`;

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validStudents, setValidStudents] = useState<any[]>([]);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded successfully!");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid .csv file");
      return;
    }

    setLoading(true);
    setPreviewData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/students/bulk-preview", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Failed to preview file";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Handle Pydantic validation errors (list of objects)
            errorMsg = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
          } else if (typeof data.detail === 'object') {
            errorMsg = JSON.stringify(data.detail);
          } else {
            errorMsg = String(data.detail);
          }
        }
        throw new Error(errorMsg);
      }

      setPreviewData(data);
      setValidStudents(data.all_valid_students || []); 
      toast.success("File analyzed successfully!");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewData.valid_count === 0) {
      toast.error("No valid records to import");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/students/bulk-import-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(validStudents)
      });

      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Failed to import";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
          } else {
            errorMsg = String(data.detail);
          }
        }
        throw new Error(errorMsg);
      }

      toast.success(data.message);
      router.push("/admin/students");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <div className="flex">
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/students" className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="h-6 w-6 text-emerald-500" />
                Bulk Upload Students
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Upload a CSV file and review the validation checklist before importing</p>
            </div>
          </div>

          {!previewData && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-white dark:bg-slate-900"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  className="hidden" 
                />
                <div className="mx-auto h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Click to upload CSV</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Required columns: admission_number, full_name, programme</p>
                {loading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-emerald-500" />}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20"
                >
                  <Download className="h-4 w-4" /> Download CSV Template
                </button>
              </div>
            </div>
          )}

          {previewData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{previewData.total_rows}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Valid Records</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{previewData.valid_count}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Invalid Records</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{previewData.invalid_count}</p>
                  </div>
                </div>
              </div>

              {previewData.invalid_count > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-800 dark:text-red-300">Validation Errors (Fix these in your CSV)</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3 font-medium">Row</th>
                          <th className="px-6 py-3 font-medium">Admission No.</th>
                          <th className="px-6 py-3 font-medium">Name</th>
                          <th className="px-6 py-3 font-medium">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                        {previewData.errors.map((err: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                            <td className="px-6 py-3 font-mono text-red-600">Row {err.row}</td>
                            <td className="px-6 py-3">{err.admission_number}</td>
                            <td className="px-6 py-3">{err.full_name}</td>
                            <td className="px-6 py-3">
                              <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-1">
                                {err.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => { setPreviewData(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Upload Different File
                </button>
                <button 
                  onClick={handleConfirmImport}
                  disabled={loading || previewData.valid_count === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirm Import ({previewData.valid_count} students)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
