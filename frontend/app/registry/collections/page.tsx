"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { registryApi } from "../../lib/api";
import CollectionCalendar from "../../components/CollectionCalendar";
import { FileText, Download, FileSpreadsheet, Search, RefreshCw, Filter, MapPin, Calendar, Package, Clock, LayoutGrid, List } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface CollectionRecord {
  certificate_number: string;
  student_name: string;
  student_id: string;
  program: string;
  status: string;
  storage_location: string;
  building: string;
  room: string;
  shelf: string;
  collection_date: string;
  collected_by: string;
}

export default function CollectionsReportPage() {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'report' | 'calendar'>('report');

  // Filters
  const [filters, setFilters] = useState({
    search: "", status: "", location: "", building: ""
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await registryApi.getCollectionsReport();
      setRecords(res.data || []);
      setFilteredRecords(res.data || []);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...records];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.student_name.toLowerCase().includes(s) ||
        r.student_id.toLowerCase().includes(s) ||
        r.certificate_number.toLowerCase().includes(s)
      );
    }
    if (filters.status) filtered = filtered.filter(r => r.status === filters.status);
    if (filters.location) filtered = filtered.filter(r => r.storage_location.toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.building) filtered = filtered.filter(r => r.building.toLowerCase().includes(filters.building.toLowerCase()));

    setFilteredRecords(filtered);
  }, [filters, records]);

  // Get unique values for dropdowns
  const uniqueStatuses = Array.from(new Set(records.map(r => r.status)));
  const uniqueLocations = Array.from(new Set(records.map(r => r.storage_location).filter(Boolean)));
  const uniqueBuildings = Array.from(new Set(records.map(r => r.building).filter(Boolean)));

  // === EXPORT TO EXCEL ===
  const exportToExcel = () => {
    const exportData = filteredRecords.map(r => ({
      "Certificate No": r.certificate_number,
      "Student Name": r.student_name,
      "ADM No": r.student_id,
      "Program": r.program,
      "Status": r.status.toUpperCase(),
      "Storage Location": r.storage_location,
      "Building": r.building,
      "Room": r.room,
      "Shelf": r.shelf,
      "Collection Date": r.collection_date,
      "Collected By": r.collected_by
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collections Report");
    XLSX.writeFile(wb, `Collections_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // === EXPORT TO PDF ===
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text("Certificate Collections Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${filteredRecords.length}`, 14, 30);

    const headers = [["Cert No", "Student", "ADM No", "Program", "Status", "Location", "Building", "Room", "Collected By"]];
    const data = filteredRecords.map(r => [
      r.certificate_number, r.student_name, r.student_id, r.program,
      r.status, r.storage_location, r.building, r.room, r.collected_by || "Not Collected"
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    doc.save(`Collections_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready_for_collection": return "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30";
      case "collected": return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30";
      case "on_hold": return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30";
      default: return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Collections & Storage Report
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track physical certificate placement and collection history</p>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('report')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <List className="h-3.5 w-3.5" /> Report
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Calendar className="h-3.5 w-3.5" /> Calendar
                </button>
              </div>
              {viewMode === 'report' && (
                <>
                  <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20">
                    <FileSpreadsheet className="h-4 w-4" /> Export Excel
                  </button>
                  <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20">
                    <Download className="h-4 w-4" /> Export PDF
                  </button>
                </>
              )}
              <button onClick={fetchReport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Conditional Rendering: Report or Calendar */}
          {viewMode === 'calendar' ? (
            <>
              {/* Calendar Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Today's Appointments", value: "2", icon: Clock, color: "blue" },
                  { label: "This Week", value: "8", icon: Calendar, color: "emerald" },
                  { label: "Total Collected", value: "142", icon: Package, color: "purple" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  const colorMap: any = {
                    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60",
                    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
                    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60",
                  };
                  return (
                    <div key={stat.label} className={`rounded-2xl p-5 border ${colorMap[stat.color]} transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                          <p className="text-3xl font-black mt-1">{stat.value}</p>
                        </div>
                        <Icon className="h-8 w-8 opacity-30" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Component */}
              <CollectionCalendar />
            </>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Ready for Collection</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{records.filter(r => r.status === 'ready_for_collection').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Successfully Collected</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{records.filter(r => r.status === 'collected').length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Filtered Results</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredRecords.length}</p>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 mb-6">
                <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-slate-300 font-medium">
                  <Filter className="h-4 w-4" /> Advanced Filters & Sorting
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Search (Name/ADM/Cert)</label>
                    <input type="text" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} placeholder="Search..." className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Certificate Status</label>
                    <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option value="">All Circumstances</option>
                      {uniqueStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Storage Location</label>
                    <select value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option value="">All Locations</option>
                      {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Building</label>
                    <select value={filters.building} onChange={(e) => setFilters({...filters, building: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option value="">All Buildings</option>
                      {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certificate</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Physical Location</th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Collection Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {filteredRecords.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">No records match your filters</td></tr>
                      ) : (
                        filteredRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors text-sm">
                            <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">{r.certificate_number}</td>
                            <td className="px-3 py-4">
                              <span className="text-gray-700 dark:text-slate-300">{r.student_name}</span><br/>
                              <span className="text-xs text-gray-500 dark:text-slate-400">{r.student_id}</span>
                            </td>
                            <td className="px-3 py-4 text-gray-600 dark:text-slate-400">{r.program}</td>
                            <td className="px-3 py-4">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${getStatusColor(r.status)}`}>
                                {r.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-1 text-gray-700 dark:text-slate-300">
                                <MapPin className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                                <div>
                                  <p className="font-medium">{r.storage_location}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">{r.building} {r.room && `• ${r.room}`} {r.shelf && `• ${r.shelf}`}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-gray-600 dark:text-slate-400">
                              {r.status === 'collected' ? (
                                <div>
                                  <p className="text-green-700 dark:text-green-400 font-medium">Collected</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">{r.collection_date}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">By: {r.collected_by}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-slate-500 italic">Not yet collected</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
