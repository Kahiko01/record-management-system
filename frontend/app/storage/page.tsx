"use client";

import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import { useAuth, Permission } from "../context/AuthContext";
import { storageApi, registryApi, collectionApi } from "../lib/api";
import { Package, Upload, Download, Search, Filter, RefreshCw, CheckCircle, MapPin, AlertTriangle, X } from "lucide-react";
import * as XLSX from "xlsx";

interface Certificate {
  id: number;
  certificate_number: string;
  student_id: number;
  programme: string;
  status: string;
  storage_location: string;
  graduation_year: string;
}

export default function InventoryRecordsPage() {
  const { user, hasAnyPermission } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCerts, setFilteredCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [filters, setFilters] = useState({ search: "", status: "", year: "", course: "" });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [issueData, setIssueData] = useState({ collector_name: "", collector_id: "", relationship: "self", notes: "" });

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await registryApi.getCertificates({});
      setCertificates(res.data || []);
      setFilteredCerts(res.data || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    let filtered = [...certificates];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(c => c.certificate_number.toLowerCase().includes(s) || c.programme.toLowerCase().includes(s));
    }
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);
    if (filters.year) filtered = filtered.filter(c => c.graduation_year === filters.year);
    if (filters.course) filtered = filtered.filter(c => c.programme.toLowerCase().includes(filters.course.toLowerCase()));
    setFilteredCerts(filtered);
  }, [filters, certificates]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        const importData = json.map((row: any) => ({
          identifier: String(row['Identifier'] || row['identifier'] || ""),
          series: String(row['Series'] || row['series'] || ""),
          year: String(row['Year'] || row['year'] || ""),
          student_name: String(row['Student Name'] || row['student_name'] || ""),
          course: String(row['Course'] || row['course'] || ""),
          certificate_no: String(row['Certificate No'] || row['certificate_no'] || "")
        })).filter(item => item.certificate_no !== "");
        if (importData.length === 0) { alert("No valid data found."); setIsUploading(false); return; }
        const res = await storageApi.bulkImportCertificates(importData);
        setUploadResult(res.data);
        fetchCertificates();
      } catch (error) { console.error("Upload failed:", error); alert("Failed to import."); } 
      finally { setIsUploading(false); e.target.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [{ "Identifier": "REG", "Series": "A", "Year": "2024", "Student Name": "John Doe", "Course": "Computer Science", "Certificate No": "CERT-2024-001" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");
    XLSX.writeFile(wb, "Certificate_Upload_Template.xlsx");
  };

  const handleIssue = async () => {
    if (!selectedCert) return;
    if (!issueData.collector_name || !issueData.collector_id) { alert("Please fill in collector details"); return; }
    try {
      await collectionApi.collect({
        certificate_id: selectedCert.id, student_id: selectedCert.student_id,
        collection_method: issueData.relationship === "self" ? "in_person" : "authorized_representative",
        identification_document: "National ID", identification_number: issueData.collector_id,
        recipient_name: issueData.collector_name, notes: issueData.notes
      });
      setShowIssueModal(false); setSelectedCert(null);
      setIssueData({ collector_name: "", collector_id: "", relationship: "self", notes: "" });
      fetchCertificates(); alert("Certificate issued successfully!");
    } catch (error: any) { alert(error.response?.data?.detail || "Failed to issue certificate"); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_clearance": return "bg-yellow-100 text-yellow-700";
      case "ready_for_collection": return "bg-green-100 text-green-700";
      case "collected": return "bg-blue-100 text-blue-700";
      case "on_hold": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const uniqueYears = Array.from(new Set(certificates.map(c => c.graduation_year).filter(Boolean)));
  const canIssue = hasAnyPermission([Permission.REGISTRY_RECORD_COLLECTION, Permission.EXAM_APPROVE]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="h-6 w-6 text-purple-600" /> Inventory Records Management</h1>
              <p className="text-sm text-gray-500 mt-1">Upload certificates, track storage, and issue to students</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"><Download className="h-4 w-4" /> Template</button>
              <label className={`flex items-center gap-2 px-4 py-2 ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg cursor-pointer text-sm`}>
                <Upload className="h-4 w-4" /> {isUploading ? "Uploading..." : "Upload Excel"}
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" disabled={isUploading} />
              </label>
              <button onClick={fetchCertificates} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
            </div>
          </div>

          {uploadResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-blue-600" /><p className="text-blue-800 font-medium">Import Complete: {uploadResult.created} created, {uploadResult.skipped} skipped.</p></div>
                <button onClick={() => setUploadResult(null)} className="text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{certificates.length}</p></div>
            <div className="bg-white rounded-lg shadow-sm border p-4"><p className="text-xs text-gray-500">Ready</p><p className="text-2xl font-bold text-green-600">{certificates.filter(c => c.status === 'ready_for_collection').length}</p></div>
            <div className="bg-white rounded-lg shadow-sm border p-4"><p className="text-xs text-gray-500">Issued</p><p className="text-2xl font-bold text-blue-600">{certificates.filter(c => c.status === 'collected').length}</p></div>
            <div className="bg-white rounded-lg shadow-sm border p-4"><p className="text-xs text-gray-500">Filtered</p><p className="text-2xl font-bold text-purple-600">{filteredCerts.length}</p></div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium"><Filter className="h-4 w-4" /> Filters</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2"><input type="text" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} placeholder="Search..." className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">All Status</option><option value="awaiting_clearance">Awaiting</option><option value="ready_for_collection">Ready</option><option value="collected">Issued</option>
              </select>
              <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">All Years</option>{uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCerts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No certificates found</td></tr>
                ) : (
                  filteredCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900">{cert.certificate_number}</td>
                      <td className="px-4 py-3 text-gray-600">{cert.programme}</td>
                      <td className="px-4 py-3 text-gray-600">{cert.graduation_year || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-600"><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{cert.storage_location || "Unassigned"}</div></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(cert.status)}`}>{cert.status.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3">
                        {cert.status === "ready_for_collection" && canIssue && (
                          <button onClick={() => { setSelectedCert(cert); setShowIssueModal(true); }} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Issue</button>
                        )}
                        {cert.status === "collected" && <span className="text-xs text-blue-600 font-medium">✓ Issued</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showIssueModal && selectedCert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Issue Certificate</h2><button onClick={() => setShowIssueModal(false)}><X className="h-5 w-5" /></button></div>
                <p className="text-sm text-gray-600 mb-4">Certificate: <span className="font-bold">{selectedCert.certificate_number}</span></p>
                <div className="space-y-4">
                  <input type="text" value={issueData.collector_name} onChange={(e) => setIssueData({...issueData, collector_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Collector Name *" />
                  <input type="text" value={issueData.collector_id} onChange={(e) => setIssueData({...issueData, collector_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="ID Number *" />
                  <select value={issueData.relationship} onChange={(e) => setIssueData({...issueData, relationship: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="self">Student (Self)</option><option value="representative">Representative</option>
                  </select>
                  <textarea value={issueData.notes} onChange={(e) => setIssueData({...issueData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Notes" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleIssue} className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700">Issue</button>
                  <button onClick={() => setShowIssueModal(false)} className="flex-1 py-2 px-4 bg-gray-200 rounded-lg">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
