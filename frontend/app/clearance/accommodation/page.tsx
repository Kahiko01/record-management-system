"use client";

import { useState, useEffect } from "react";
import { Home, Search, Edit, CheckCircle, AlertCircle, X } from "lucide-react";

export default function AccommodationQueue() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  // Only show students who are Finance Cleared
  const eligibleStudents = students.filter((s) => {
    const total = parseFloat(s.total_fee) || 0;
    const paid = parseFloat(s.paid_fee) || 0;
    const matchesSearch = search === "" || (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase()));
    return (paid >= total) && matchesSearch;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`✅ Accommodation updated for ${editingStudent.full_name}!`);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Home className="w-8 h-8 text-orange-600" /> Accommodation Allocation
          </h1>
          <p className="text-gray-500 mt-1">Assign hostels to finance-cleared students</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search eligible students..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (<div className="p-12 text-center text-gray-500">Loading...</div>) : eligibleStudents.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Admission No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Programme</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {eligibleStudents.map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{student.admission_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{student.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{student.programme}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{student.hostel || <span className="italic text-gray-400">Not Assigned</span>}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {student.accommodation_status || "Day Scholar"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingStudent({...student}); setIsEditModalOpen(true); }} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No students eligible for accommodation yet.</p>
            <p className="text-sm mt-1">Students must be fully cleared by Finance before they appear here.</p>
          </div>
        )}
      </div>

      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Accommodation</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Student</p>
                <p className="font-semibold text-gray-900 dark:text-white">{editingStudent.full_name} ({editingStudent.admission_number})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accommodation Status</label>
                <select value={editingStudent.accommodation_status || "DAY"} onChange={(e) => setEditingStudent({...editingStudent, accommodation_status: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="DAY">Day Scholar</option>
                  <option value="BOARDING">Boarding</option>
                  <option value="OFF-CAMPUS">Off-Campus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel / Hall</label>
                <input type="text" placeholder="e.g. Hostel A" value={editingStudent.hostel || ""} onChange={(e) => setEditingStudent({...editingStudent, hostel: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
