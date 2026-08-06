"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { studentApi } from "../../lib/api";
import { 
  Users, Search, RefreshCw, UserPlus, Upload, FileSpreadsheet, 
  CheckCircle, XCircle, AlertTriangle, Download, X, Edit, Trash2
} from "lucide-react";

export default function AdminStudentsPage() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", program: "", level: "" });
  
  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Manual Entry State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_id: "", first_name: "", last_name: "", 
    email: "", program: "", year_of_study: 1
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await studentApi.getAll(filters);
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  // === BULK IMPORT FUNCTIONS ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) { setFile(selectedFile); parseFile(selectedFile); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) { setFile(droppedFile); parseFile(droppedFile); }
  };

  const parseFile = async (selectedFile: File) => {
    try {
      const text = await selectedFile.text();
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"(.*)"$/, '$1').toLowerCase());
      
      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"(.*)"$/, '$1'));
        if (cols.length < 3) continue;
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
        if (!row.student_id || !row.first_name) continue;
        rows.push({
          student_id: row.student_id,
          first_name: row.first_name,
          last_name: row.last_name || "",
          email: row.email || "",
          program: row.program || "",
          year_of_study: parseInt(row.year_of_study) || 1,
        });
      }
      
      if (rows.length === 0) { alert("No valid rows found."); return; }
      setPreviewData(rows);
    } catch (error) {
      alert("Could not read the file.");
    }
  };

  const handleBulkUpload = async () => {
    if (previewData.length === 0) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const response = await studentApi.bulkImport(previewData);
      setUploadResult(response.data);
      setFile(null);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch (error: any) {
      setUploadResult({ message: error.response?.data?.detail || "Upload failed.", errors: [] });
    } finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const csv = `student_id,first_name,last_name,email,program,year_of_study
STU-2024-001,John,Doe,john@university.edu,Computer Science,3
STU-2024-002,Jane,Smith,jane@university.edu,Business Admin,2
STU-2024-003,Bob,Johnson,bob@university.edu,Engineering,4`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // === MANUAL ENTRY FUNCTIONS ===
  const handleManualAdd = async () => {
    if (!newStudent.student_id || !newStudent.first_name || !newStudent.last_name) {
      alert("Student ID, First Name, and Last Name are required!");
      return;
    }
    setSaving(true);
    try {
      await studentApi.create(newStudent);
      alert("Student added successfully!");
      setShowAddModal(false);
      setNewStudent({ student_id: "", first_name: "", last_name: "", email: "", program: "", year_of_study: 1 });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to add student.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-500" /> Student Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Bulk import, manual entry, and student records</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors">
                <Download className="h-4 w-4" /> Template
              </button>
              {hasPermission(Permission.USER_CREATE) && (
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-colors">
                  <UserPlus className="h-4 w-4" /> Add Student
                </button>
              )}
            </div>
          </div>

          {/* Bulk Import Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-500" /> Bulk Import Students
            </h2>
            
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                : 'border-gray-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
              <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-emerald-500' : 'text-gray-400 dark:text-slate-500'}`} />
              <p className="font-medium text-gray-900 dark:text-white">{file ? file.name : "Drop CSV file here or click to browse"}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Adds new students without removing existing data</p>
              {file && (
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData([]); }} 
                  className="mt-3 px-3 py-1 text-xs bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                  Remove File
                </button>
              )}
            </div>

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="mt-4 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Preview ({previewData.length} students)</span>
                  <button onClick={handleBulkUpload} disabled={uploading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                    {uploading ? "Uploading..." : "Confirm Import"}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-slate-400">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Program</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {previewData.slice(0, 10).map((row, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{row.student_id}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{row.first_name} {row.last_name}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{row.program}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && <p className="text-center text-xs text-gray-500 py-2">...and {previewData.length - 10} more</p>}
                </div>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className={`mt-4 p-4 rounded-xl border ${uploadResult.errors?.length ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                <p className="font-bold text-gray-900 dark:text-white">{uploadResult.message}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">➕ {uploadResult.created} Created</span>
                  <span className="text-blue-600 dark:text-blue-400">🔄 {uploadResult.updated} Updated</span>
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                    {uploadResult.errors.slice(0, 3).map((e: string, i: number) => <p key={i}>• {e}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                  onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="Search by name or ID"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm">Search</button>
              <button onClick={() => { setFilters({ search: "", program: "", level: "" }); setTimeout(fetchData, 100); }} 
                className="px-4 py-2.5 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl">Clear</button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Student ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {students.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500">No students found</td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{student.student_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.first_name} {student.last_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.program}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.year_of_study}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.email || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-purple-500" /> Add New Student
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Student ID *</label>
                  <input type="text" value={newStudent.student_id} onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="STU-2024-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Year *</label>
                  <select value={newStudent.year_of_study} onChange={(e) => setNewStudent({...newStudent, year_of_study: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50">
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">First Name *</label>
                  <input type="text" value={newStudent.first_name} onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Last Name *</label>
                  <input type="text" value={newStudent.last_name} onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="john@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Program</label>
                <input type="text" value={newStudent.program} onChange={(e) => setNewStudent({...newStudent, program: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="Computer Science" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleManualAdd} disabled={saving}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Add Student"}
              </button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
