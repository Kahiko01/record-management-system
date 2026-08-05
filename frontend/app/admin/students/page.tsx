"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { studentApi } from "../../lib/api";
import { Student } from "../../types";
import { Users, Search, Upload, RefreshCw, Trash2, Edit, X } from "lucide-react";

export default function AdminStudentsPage() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", program: "", year: "" });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await studentApi.getAll({ ...filters, limit: 1000 });
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await studentApi.bulkImport(formData);
      alert("Students imported successfully!");
      fetchData();
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import students.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await studentApi.delete(studentId);
      fetchData();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Failed to delete student.");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="h-6 w-6 text-emerald-500" /> Student Management</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage student records and bulk imports</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              {hasPermission(Permission.STUDENT_IMPORT) && (
                <>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                    <Upload className="h-4 w-4" /> Import Excel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. John or ADM/123" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Program</label>
                <input type="text" value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Year</label>
                <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", program: "", year: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {students.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Users className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No students found</p></td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{student.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.program}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">Year {student.year_of_study}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.email || "N/A"}</td>
                        <td className="px-6 py-4">
                          {hasPermission(Permission.STUDENT_MANAGE) && (
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedStudent(student); setEditMode(true); }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(student.id)} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
