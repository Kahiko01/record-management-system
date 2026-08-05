"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { clearanceApi } from "../../lib/api";
import { Eye, Search, RefreshCw, Users, CheckCircle, Clock, XCircle, Minus } from "lucide-react";

export default function ClearanceOverviewPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await clearanceApi.getOverview(filters);
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared": return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"><CheckCircle className="h-3 w-3" /> Cleared</span>;
      case "pending": return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"><Clock className="h-3 w-3" /> Pending</span>;
      case "not_cleared": return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"><XCircle className="h-3 w-3" /> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700"><Minus className="h-3 w-3" /> N/A</span>;
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="h-6 w-6 text-emerald-500" /> System-Wide Clearance Overview</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track the real-time progress of all students across all departments</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. John or ADM/123" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Course / Program</label>
                <input type="text" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Level</label>
                <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", course: "", level: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Finance</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Exams</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Dean</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {students.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500"><Users className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No students found</p></td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{student.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{student.program} (Yr {student.year_of_study})</td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(student.finance_status)}</td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(student.exam_status)}</td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(student.dean_status)}</td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(student.overall_status)}</td>
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
