"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { studentApi } from "../../lib/api";
import { Users, Upload, Download, Search, RefreshCw, UserPlus, X, CheckCircle, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  year_of_study: number;
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [importResult, setImportResult] = useState<{created: number, skipped: number, errors: string[]} | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    student_id: "", first_name: "", last_name: "", email: "", program: "", year_of_study: 1
  });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getAll({ limit: 1000 });
      setStudents(res.data || []);
      setFilteredStudents(res.data || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    let filtered = [...students];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(st => 
        st.first_name.toLowerCase().includes(s) || st.last_name.toLowerCase().includes(s) ||
        st.student_id.toLowerCase().includes(s) || st.program.toLowerCase().includes(s)
      );
    }
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  // === EXCEL IMPORT LOGIC ===
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to our API format
        const importData = json.map((row: any) => ({
          student_id: row['ADM No'] || row['Student ID'] || row['student_id'] || "",
          first_name: row['First Name'] || row['first_name'] || "",
          last_name: row['Last Name'] || row['last_name'] || "",
          email: row['Email'] || row['email'] || "",
          program: row['Program'] || row['Course'] || row['program'] || "",
          year_of_study: parseInt(row['Year'] || row['Level'] || row['year_of_study'] || 1)
        })).filter(item => item.student_id !== "");

        if (importData.length === 0) {
          alert("No valid data found in the Excel file. Ensure columns match: ADM No, First Name, Last Name, Email, Program, Year");
          setIsImporting(false);
          return;
        }

        const res = await studentApi.bulkImport(importData);
        setImportResult(res.data);
        fetchStudents();
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import file. Please check the format.");
      } finally {
        setIsImporting(false);
        e.target.value = ""; // Reset input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      { "ADM No": "STU-001", "First Name": "John", "Last Name": "Doe", "Email": "john@student.edu", "Program": "Computer Science", "Year": 4 },
      { "ADM No": "STU-002", "First Name": "Jane", "Last Name": "Smith", "Email": "jane@student.edu", "Program": "Business Admin", "Year": 3 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleManualAdd = async () => {
    try {
      await studentApi.create(formData);
      setShowAddModal(false);
      setFormData({ student_id: "", first_name: "", last_name: "", email: "", program: "", year_of_study: 1 });
      fetchStudents();
      alert("Student added successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to add student");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

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
                <Users className="h-6 w-6 text-blue-600" /> Student Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Total Students: {students.length}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                <Download className="h-4 w-4" /> Template
              </button>
              <label className={`flex items-center gap-2 px-4 py-2 ${isImporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg cursor-pointer text-sm`}>
                <Upload className="h-4 w-4" /> {isImporting ? "Importing..." : "Import Excel"}
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" disabled={isImporting} />
              </label>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <UserPlus className="h-4 w-4" /> Add Student
              </button>
            </div>
          </div>

          {/* Import Result Alert */}
          {importResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-blue-800 font-medium">
                    Import Complete: {importResult.created} created, {importResult.skipped} skipped.
                  </p>
                </div>
                <button onClick={() => setImportResult(null)} className="text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Errors:</p>
                  <ul className="list-disc list-inside max-h-20 overflow-y-auto">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, ADM No, or program..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ADM No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-3 font-medium text-gray-900">{student.first_name} {student.last_name}</td>
                        <td className="px-4 py-3 text-gray-600">{student.student_id}</td>
                        <td className="px-4 py-3 text-gray-600">{student.email}</td>
                        <td className="px-4 py-3 text-gray-600">{student.program}</td>
                        <td className="px-4 py-3 text-gray-600">Year {student.year_of_study}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Student Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Add New Student</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">ADM No *</label><input type="text" value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><select value={formData.year_of_study} onChange={(e) => setFormData({...formData, year_of_study: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value={1}>Year 1</option><option value={2}>Year 2</option><option value={3}>Year 3</option><option value={4}>Year 4</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label><input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Program *</label><input type="text" value={formData.program} onChange={(e) => setFormData({...formData, program: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">Note: A user account will be created automatically. Username = ADM No, Password = student123</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleManualAdd} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Student</button>
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
