"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, RefreshCw, CheckCircle, AlertCircle, Plus, Edit, Trash2, X } from "lucide-react";

export default function FinanceClearanceQueue() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [showCleared, setShowCleared] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [newStudent, setNewStudent] = useState({
    admission_number: "", full_name: "", programme: "", total_fee: "", paid_fee: ""
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/students?limit=10000", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = students.filter((s) => {
    const total = parseFloat(s.total_fee) || 0;
    const paid = parseFloat(s.paid_fee) || 0;
    const isPending = paid < total;
    
    const matchesSearch = search === "" || 
      (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.admission_number && s.admission_number.toLowerCase().includes(search.toLowerCase()));
      
    const matchesProgramme = programmeFilter === "" || 
      (s.programme && s.programme.toLowerCase().includes(programmeFilter.toLowerCase()));

    return (showCleared ? !isPending : isPending) && matchesSearch && matchesProgramme;
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/students", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStudent,
          total_fee: parseFloat(newStudent.total_fee) || 0,
          paid_fee: parseFloat(newStudent.paid_fee) || 0,
          registration_year: 1,
          status: "ACTIVE"
        })
      });
      if (res.ok) {
        alert("✅ Student added successfully!");
        setIsAddModalOpen(false);
        setNewStudent({ admission_number: "", full_name: "", programme: "", total_fee: "", paid_fee: "" });
        fetchStudents();
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.detail || "Unknown error"}`);
      }
    } catch (err) { alert("Network error"); }
    finally { setSaving(false); }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/students/modify-record/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          total_fee: parseFloat(editingStudent.total_fee) || 0,
          paid_fee: parseFloat(editingStudent.paid_fee) || 0
        })
      });
      if (res.ok) {
        alert("✅ Fees updated successfully!");
        setIsEditModalOpen(false);
        setEditingStudent(null);
        fetchStudents();
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.detail || "Unknown error"}`);
      }
    } catch (err) { alert("Network error"); }
    finally { setSaving(false); }
  };

  const handleDeleteStudent = async (studentId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/students/${studentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("✅ Student deleted successfully!");
        fetchStudents();
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.detail}`);
      }
    } catch (err) { alert("Network error"); }
  };

  const exportCSV = () => {
    if (filteredStudents.length === 0) { alert("No students to export!"); return; }
    const headers = ["admission_number", "full_name", "programme", "total_fee", "paid_fee", "balance", "status"];
    const csvRows = filteredStudents.map((s: any) => {
      const total = parseFloat(s.total_fee) || 0;
      const paid = parseFloat(s.paid_fee) || 0;
      return headers.map(h => {
        if (h === 'balance') return `"${(total - paid)}"`;
        return `"${(s[h] !== undefined && s[h] !== null ? s[h] : '').toString().replace(/"/g, '""')}"`;
      }).join(",");
    });
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance_clearance_queue_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = students.filter(s => (parseFloat(s.paid_fee) || 0) < (parseFloat(s.total_fee) || 0)).length;
  const clearedCount = students.length - pendingCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Clearance Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review, edit, and approve student fee settlements</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm font-medium">
            <Plus className="w-4 h-4" /> Add Student Record
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-sm font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={fetchStudents} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 shadow-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border cursor-pointer transition ${!showCleared ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 ring-2 ring-red-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`} onClick={() => setShowCleared(false)}>
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Pending Clearance</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{pendingCount}</p>
        </div>
        <div className={`p-4 rounded-xl border cursor-pointer transition ${showCleared ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ring-2 ring-green-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`} onClick={() => setShowCleared(true)}>
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">Finance Cleared</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{clearedCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search Name / ADM No" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Program" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)} />
          </div>
          <button onClick={() => { setSearch(""); setProgrammeFilter(""); }} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Clear</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (<div className="p-12 text-center text-gray-500">Loading queue...</div>) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Admission No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Programme</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Total Fee</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Paid Fee</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student: any) => {
                  const total = parseFloat(student.total_fee) || 0;
                  const paid = parseFloat(student.paid_fee) || 0;
                  const balance = total - paid;
                  const isCleared = balance <= 0;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{student.admission_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{student.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.programme}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">KES {total.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-medium">KES {paid.toLocaleString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        KES {balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingStudent(student); setIsEditModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit Fees">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteStudent(student.id, student.full_name)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete Record">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No pending finance clearances found</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Student Record: Add Student</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Number *</label><input required type="text" value={newStudent.admission_number} onChange={e => setNewStudent({...newStudent, admission_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input required type="text" value={newStudent.full_name} onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme</label><input type="text" value={newStudent.programme} onChange={e => setNewStudent({...newStudent, programme: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Fee (KES)</label><input required type="number" value={newStudent.total_fee} onChange={e => setNewStudent({...newStudent, total_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Fee (KES)</label><input required type="number" value={newStudent.paid_fee} onChange={e => setNewStudent({...newStudent, paid_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition">{saving ? "Saving..." : "Add Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fees Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Fees: {editingStudent.full_name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditStudent} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Number</label><input disabled type="text" value={editingStudent.admission_number} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Fee (KES)</label><input required type="number" value={editingStudent.total_fee} onChange={e => setEditingStudent({...editingStudent, total_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Fee (KES)</label><input required type="number" value={editingStudent.paid_fee} onChange={e => setEditingStudent({...editingStudent, paid_fee: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition">{saving ? "Updating..." : "Update Fees"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
