"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { registryApi } from "../../lib/api";
import { FileText, Download, FileSpreadsheet, Search, RefreshCw, Filter, MapPin } from "lucide-react";
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
      case "ready_for_collection": return "bg-green-100 text-green-700";
      case "collected": return "bg-blue-100 text-blue-700";
      case "on_hold": return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" /> Collections & Storage Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">Track physical certificate placement and collection history</p>
            </div>
            <div className="flex gap-3">
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
              </button>
              <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                <Download className="h-4 w-4" /> Export PDF
              </button>
              <button onClick={fetchReport} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Ready for Collection</p>
              <p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'ready_for_collection').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Successfully Collected</p>
              <p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'collected').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Filtered Results</p>
              <p className="text-2xl font-bold text-purple-600">{filteredRecords.length}</p>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
              <Filter className="h-4 w-4" /> Advanced Filters & Sorting
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search (Name/ADM/Cert)</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} placeholder="Search..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Certificate Status</label>
                <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Circumstances</option>
                  {uniqueStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Storage Location</label>
                <select value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Locations</option>
                  {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Building</label>
                <select value={filters.building} onChange={(e) => setFilters({...filters, building: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Buildings</option>
                  {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Physical Location</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No records match your filters</td></tr>
                  ) : (
                    filteredRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 text-sm">
                        <td className="px-3 py-3 font-medium text-gray-900">{r.certificate_number}</td>
                        <td className="px-3 py-3">
                          {r.student_name}<br/>
                          <span className="text-xs text-gray-500">{r.student_id}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-600">{r.program}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(r.status)}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <div>
                              <p className="font-medium">{r.storage_location}</p>
                              <p className="text-xs text-gray-500">{r.building} {r.room && `• ${r.room}`} {r.shelf && `• ${r.shelf}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {r.status === 'collected' ? (
                            <div>
                              <p className="text-green-700 font-medium">Collected</p>
                              <p className="text-xs text-gray-500">{r.collection_date}</p>
                              <p className="text-xs text-gray-500">By: {r.collected_by}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not yet collected</span>
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
