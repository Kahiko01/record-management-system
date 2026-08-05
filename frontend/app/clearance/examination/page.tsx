"use client";

import { useState, useEffect } from "react";
import { useAuth, Permission } from "../../context/AuthContext";
import { clearanceApi, studentApi } from "../../lib/api";
import { ClearanceRequest, ClearanceStatus, Student } from "../../types";
import { CheckCircle, XCircle, Clock, BookOpen, GraduationCap, List, Search, Filter } from "lucide-react";

export default function ExaminationClearancePage() {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');

  // === NEW: FILTERS STATE ===
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });

  const [academicCheck, setAcademicCheck] = useState({
    results_released: false,
    program_completed: false,
    graduation_approved: false,
    no_missing_grades: false,
    credits_completed: false,
  });

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'pending') {
        // Pass filters to the backend!
        const response = await clearanceApi.getExaminationPending(filters);
        setRequests(response.data || []);
      } else {
        const studentsRes = await studentApi.getAll({ ...filters, limit: 1000 });
        setAllStudents(studentsRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      if (viewMode === 'pending') setRequests([]);
      else setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: ClearanceStatus) => {
    if (!selectedRequest || !selectedRequest.examination_clearance) return;
    try {
      await clearanceApi.updateExaminationClearance(selectedRequest.id, {
        status: status,
        remarks: remarks || undefined,
        ...academicCheck,
      });
      setSelectedRequest(null);
      setRemarks("");
      setAction(null);
      setAcademicCheck({ results_released: false, program_completed: false, graduation_approved: false, no_missing_grades: false, credits_completed: false });
      fetchData();
    } catch (error) {
      console.error("Failed to update clearance:", error);
      alert("Failed to update clearance.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "not_cleared": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "cleared": return "✅ Cleared";
      case "pending": return "⏳ Pending";
      case "not_cleared": return "❌ Not Cleared";
      default: return "❓ Unknown";
    }
  };

  const allChecked = Object.values(academicCheck).every(v => v === true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Examination Clearance</h1>
            <p className="text-sm text-gray-500">Verify academic completion and approve clearance</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200 rounded-lg p-1 mr-4">
              <button onClick={() => setViewMode('pending')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <Clock className="h-4 w-4" /> Pending
              </button>
              <button onClick={() => setViewMode('all')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <List className="h-4 w-4" /> All Students
              </button>
            </div>
            {viewMode === 'pending' && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">{requests.length} Pending</span>}
            {viewMode === 'all' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{allStudents.length} Total</span>}
          </div>
        </div>

        {/* === NEW: SEARCH & FILTER BAR === */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search Name / ADM No</label>
              <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. John or ADM/123" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Course / Program</label>
              <input type="text" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Computer Science" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-700 mb-1">Level / Year</label>
              <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
                <option value="6">Level 6</option>
              </select>
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Search</button>
            <button onClick={() => { setFilters({ search: "", course: "", level: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Clear</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Status</th>
                {viewMode === 'pending' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viewMode === 'pending' ? (
                requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      No pending examination clearances found!
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {request.student?.first_name} {request.student?.last_name}
                        <br />
                        <span className="text-xs text-gray-500">{request.student?.student_id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {request.student?.program}
                        <br />
                        <span className="text-xs text-gray-500">Year {request.student?.year_of_study}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs text-white rounded-full ${getStatusColor(request.examination_clearance?.status || "pending")}`}>
                          {getStatusLabel(request.examination_clearance?.status || "pending")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(request.request_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {hasPermission(Permission.EXAM_APPROVE) ? (
                          <>
                            <button onClick={() => { setSelectedRequest(request); setAction("approve"); }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm mr-2">Approve</button>
                            <button onClick={() => { setSelectedRequest(request); setAction("reject"); }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Reject</button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                allStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found matching your search.</td>
                  </tr>
                ) : (
                  allStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {student.first_name} {student.last_name}
                        <br />
                        <span className="text-xs text-gray-500">{student.student_id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.program}
                        <br />
                        <span className="text-xs text-gray-500">Year {student.year_of_study}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs text-white rounded-full bg-gray-400">❓ Check Details</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => alert(`View details for ${student.student_id}`)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">View Details</button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {selectedRequest && action && viewMode === 'pending' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {action === "approve" ? "Approve Examination Clearance" : "Reject Examination Clearance"}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Student: {selectedRequest.student?.first_name} {selectedRequest.student?.last_name}
                <br />
                Student ID: {selectedRequest.student?.student_id}
                <br />
                Program: {selectedRequest.student?.program}
              </p>

              {action === "approve" && (
                <div className="mb-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Academic Verification</h3>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={academicCheck.results_released} onChange={(e) => setAcademicCheck({ ...academicCheck, results_released: e.target.checked })} className="rounded" /><span className="text-sm">Results Released</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={academicCheck.program_completed} onChange={(e) => setAcademicCheck({ ...academicCheck, program_completed: e.target.checked })} className="rounded" /><span className="text-sm">Program Completed</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={academicCheck.graduation_approved} onChange={(e) => setAcademicCheck({ ...academicCheck, graduation_approved: e.target.checked })} className="rounded" /><span className="text-sm">Graduation Approved</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={academicCheck.no_missing_grades} onChange={(e) => setAcademicCheck({ ...academicCheck, no_missing_grades: e.target.checked })} className="rounded" /><span className="text-sm">No Missing Grades</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={academicCheck.credits_completed} onChange={(e) => setAcademicCheck({ ...academicCheck, credits_completed: e.target.checked })} className="rounded" /><span className="text-sm">Required Credits Completed</span></label>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder={action === "approve" ? "Optional remarks..." : "Reason for rejection (required)"} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleAction(action === "approve" ? "cleared" : "not_cleared")} disabled={action === "approve" && !allChecked} className={`flex-1 py-2 px-4 rounded-lg text-white ${action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  Confirm {action === "approve" ? "Approve" : "Reject"}
                </button>
                <button onClick={() => { setSelectedRequest(null); setAction(null); setRemarks(""); setAcademicCheck({ results_released: false, program_completed: false, graduation_approved: false, no_missing_grades: false, credits_completed: false }); }} className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
