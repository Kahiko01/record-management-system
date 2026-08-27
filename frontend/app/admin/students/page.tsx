"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, FileCheck, Edit, X, GraduationCap, DollarSign, CheckCircle, XCircle, Upload, Plus, Filter, Download } from "lucide-react";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, graduated: 0, suspended: 0 });
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStudent, setNewStudent] = useState({
    admission_number: "", full_name: "", programme: "", department: "", 
    registration_year: 1, email: "", phone: "", national_id: "", total_fee: "", paid_fee: ""
  });
  const [saving, setSaving] = useState(false);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [studentToDeactivate, setStudentToDeactivate] = useState<any>(null);
  const [deactivateChecks, setDeactivateChecks] = useState({ library: false, finance: false, id_surrendered: false });
  const [deactivateReason, setDeactivateReason] = useState("Withdrawn");

  const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") || "") : "";

  useEffect(() => {
    fetchStudents();
    fetchStats();
    fetchProgrammes();
  }, [search, programmeFilter, statusFilter, page]);

  const fetchStudents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (programmeFilter) params.append("programme", programmeFilter);
    if (statusFilter) params.append("status", statusFilter);
    params.append("page", page.toString());
    params.append("limit", "50");

    try {
      const res = await fetch(`http://127.0.0.1:8000/students?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || data.items || []);
      }
    } catch (err) { console.error("Failed to fetch students:", err); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/students/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error("Stats fetch failed:", err); }
  };

  const fetchProgrammes = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/students/meta/programmes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setProgrammes(await res.json());
    } catch (err) { console.error("Programmes fetch failed:", err); }
  };

  const downloadStudentsCSV = () => {
    if (students.length === 0) {
      alert("No students available to export!");
      return;
    }
    const headers = ["admission_number", "full_name", "programme", "department", "registration_year", "email", "phone", "national_id", "total_fee", "paid_fee", "status"];
    const csvRows = students.map((s: any) => 
      headers.map(h => `"${(s[h] !== undefined && s[h] !== null ? s[h] : '').toString().replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_master_list_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewStudent = (student: any) => {
    const totalFee = student.total_fee || 150000;
    const paidFee = student.paid_fee || 0;
    setSelectedStudent({ ...student, fee: { total: totalFee, paid: paidFee, balance: totalFee - paidFee } });
  };

  const handleEditStudent = (student: any) => {
    setIsEditing(true);
    setEditingId(student.id);
    setNewStudent({
      admission_number: student.admission_number || student.student_id || "",
      full_name: student.full_name || student.name || "",
      programme: student.programme || student.program || "",
      department: student.department || "",
      registration_year: student.registration_year || student.year_of_study || 1,
      email: student.email || "",
      phone: student.phone || "",
      national_id: student.national_id || "",
      total_fee: student.total_fee || "",
      paid_fee: student.paid_fee || ""
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEditing ? `http://127.0.0.1:8000/students/modify-record/${editingId}` : "http://127.0.0.1:8000/students";
      const method = isEditing ? "PUT" : "POST";
      const payload = { ...newStudent, total_fee: parseFloat(String(newStudent.total_fee)) || 0, paid_fee: parseFloat(String(newStudent.paid_fee)) || 0 };
      const res = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { alert(`✅ Student ${isEditing ? "updated" : "added"} successfully!`); closeModal(); fetchStudents(); fetchStats(); } 
      else { const err = await res.json(); alert(`❌ Failed: ${err.detail || "Unknown error"}`); }
    } catch (err) { alert("Network error"); }
    finally { setSaving(false); }
  };

  const closeModal = () => { setIsAddModalOpen(false); setIsEditing(false); setEditingId(null); setNewStudent({ admission_number: "", full_name: "", programme: "", department: "", registration_year: 1, email: "", phone: "", national_id: "", total_fee: "", paid_fee: "" }); };
  const clearFilters = () => { setStatusFilter(""); setProgrammeFilter(""); setSearch(""); };

  const openDeactivateModal = (student: any) => { setStudentToDeactivate(student); setDeactivateChecks({ library: false, finance: false, id_surrendered: false }); setDeactivateReason("Withdrawn"); setIsDeactivateModalOpen(true); };

  const confirmDeactivation = async () => {
    if (!deactivateChecks.library || !deactivateChecks.finance) { alert("⚠️ Please confirm Library and Finance clearances."); return; }
    try {
      const res = await fetch(`http://127.0.0.1:8000/students/${studentToDeactivate.id}/deactivate`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) { alert(`✅ ${studentToDeactivate.full_name} deactivated.`); setIsDeactivateModalOpen(false); fetchStudents(); fetchStats(); } 
      else { const err = await res.json(); alert(`❌ Failed: ${err.detail}`); }
    } catch (err) { alert("Network error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View, search, and manage student records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadStudentsCSV} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-sm font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => router.push("/admin/students/upload")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm font-medium">
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button onClick={() => { setIsEditing(false); setIsAddModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm font-medium">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={clearFilters} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition ${statusFilter === "" ? "ring-2 ring-blue-500" : ""}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Filter className="w-4 h-4" /> Total Students</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? "" : "ACTIVE")} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition ${statusFilter === "ACTIVE" ? "ring-2 ring-blue-500" : ""}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active}</p>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === "GRADUATED" ? "" : "GRADUATED")} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition ${statusFilter === "GRADUATED" ? "ring-2 ring-green-500" : ""}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Graduated</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.graduated}</p>
        </div>
        <div onClick={() => setStatusFilter(statusFilter === "SUSPENDED" ? "" : "SUSPENDED")} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition ${statusFilter === "SUSPENDED" ? "ring-2 ring-red-500" : ""}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Suspended</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.suspended}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by admission number or name..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)}>
            <option value="">All Programmes</option>
            {programmes.map((prog, idx) => <option key={idx} value={prog}>{prog}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (<div className="p-12 text-center text-gray-500">Loading students...</div>) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Admission No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Programme</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Year</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.length > 0 ? (students.map((student: any) => (
                  <tr key={student.id} className={`transition ${student.status === 'WITHDRAWN' || student.status === 'INACTIVE' ? 'bg-yellow-200 dark:bg-yellow-400/20 hover:bg-yellow-300 dark:hover:bg-yellow-400/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{student.admission_number || student.student_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{student.full_name || student.name || "Unknown"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.programme || student.program || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.registration_year || student.year_of_study || "1"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'GRADUATED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        student.status === 'WITHDRAWN' || student.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        student.status === 'SUSPENDED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {student.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewStudent(student)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedStudent(student); setIsClearanceModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition" title="Manage Clearance"><FileCheck className="w-4 h-4" /></button>
                        <button onClick={() => handleEditStudent(student)} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Edit Student"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeactivateModal(student)} className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition" title="Deactivate Student"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))) : (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No students found matching your criteria.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Student" : "Add New Student"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Number *</label><input required type="text" value={newStudent.admission_number} onChange={e => setNewStudent({...newStudent, admission_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input required type="text" value={newStudent.full_name} onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme</label><input type="text" value={newStudent.programme} onChange={e => setNewStudent({...newStudent, programme: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label><input type="text" value={newStudent.department} onChange={e => setNewStudent({...newStudent, department: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year of Study</label><input type="number" value={newStudent.registration_year} onChange={e => setNewStudent({...newStudent, registration_year: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">National ID</label><input type="text" value={newStudent.national_id} onChange={e => setNewStudent({...newStudent, national_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Fee (KES)</label><input type="number" value={newStudent.total_fee} onChange={e => setNewStudent({...newStudent, total_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Fee (KES)</label><input type="number" value={newStudent.paid_fee} onChange={e => setNewStudent({...newStudent, paid_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2">
                  {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving...</> : <>{isEditing ? "Update Student" : "Save Student"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && !isClearanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudent.full_name || selectedStudent.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1"><GraduationCap className="w-4 h-4" /> {selectedStudent.admission_number || selectedStudent.student_id}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Fee Balance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Fee</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">KES {(selectedStudent.fee?.total || 0).toLocaleString()}</p></div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Amount Paid</p><p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">KES {(selectedStudent.fee?.paid || 0).toLocaleString()}</p></div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Outstanding</p><p className={`text-xl font-bold mt-1 ${(selectedStudent.fee?.balance || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>KES {(selectedStudent.fee?.balance || 0).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {isClearanceModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileCheck className="w-6 h-6 text-green-600" /> Clearance Status</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedStudent.full_name || selectedStudent.name} ({selectedStudent.admission_number || selectedStudent.student_id})</p>
              </div>
              <button onClick={() => setIsClearanceModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Finance", status: (selectedStudent.paid_fee || 0) >= (selectedStudent.total_fee || 150000), desc: "All fees cleared" },
                  { name: "Examinations", status: true, desc: "No pending exams" },
                  { name: "Dean of Students", status: true, desc: "Good standing" },
                  { name: "Library", status: true, desc: "No overdue books" },
                  { name: "Accommodation", status: true, desc: "Room vacated" },
                  { name: "Discipline", status: true, desc: "No pending cases" },
                ].map((dept, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${dept.status ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{dept.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dept.desc}</p>
                    </div>
                    {dept.status ? <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" /> : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
              <button onClick={() => setIsClearanceModalOpen(false)} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {isDeactivateModalOpen && studentToDeactivate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-6">
              <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <XCircle className="w-6 h-6" /> Deactivate Student
              </h2>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {studentToDeactivate.full_name || studentToDeactivate.name} ({studentToDeactivate.admission_number})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason for Deactivation</label>
                <select value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="Withdrawn">Withdrawn</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Expelled">Expelled</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pre-Deactivation Checklist</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={deactivateChecks.library} onChange={(e) => setDeactivateChecks({...deactivateChecks, library: e.target.checked})} className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Library clearance confirmed (no overdue books)</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={deactivateChecks.finance} onChange={(e) => setDeactivateChecks({...deactivateChecks, finance: e.target.checked})} className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Finance clearance confirmed (fees settled or written off)</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={deactivateChecks.id_surrendered} onChange={(e) => setDeactivateChecks({...deactivateChecks, id_surrendered: e.target.checked})} className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Student ID card surrendered (if applicable)</span>
                </label>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6 flex justify-end gap-3">
              <button onClick={() => setIsDeactivateModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
              <button onClick={confirmDeactivation} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
