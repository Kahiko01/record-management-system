"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import { ClearanceRequest, ClearanceStatus } from "../../types";
import { CheckCircle, XCircle, Clock, GraduationCap, Search, X } from "lucide-react";

export default function DeanClearancePage() {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });

  const [deanCheck, setDeanCheck] = useState({
    academic_records_verified: false,
    faculty_requirements_met: false,
    no_disciplinary_actions: false,
    graduation_eligibility_confirmed: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await clearanceApi.getDeanPending(filters);
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: ClearanceStatus) => {
    if (!selectedRequest) return;
    try {
      await clearanceApi.updateDeanClearance(selectedRequest.id, {
        status: status,
        remarks: remarks || undefined,
        ...deanCheck,
      });
      setSelectedRequest(null);
      setRemarks("");
      setAction(null);
      setDeanCheck({ academic_records_verified: false, faculty_requirements_met: false, no_disciplinary_actions: false, graduation_eligibility_confirmed: false });
      fetchData();
    } catch (error) {
      console.error("Failed to update clearance:", error);
      alert("Failed to update.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      case "not_cleared": return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      default: return "bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-400 border-gray-200 dark:border-slate-500/30";
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

  const allChecked = Object.values(deanCheck).every(v => v === true);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-emerald-500" /> Dean Clearance Review
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Verify academic eligibility and approve clearance requests</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-full text-xs font-bold">
              {requests.length} PENDING REVIEWS
            </span>
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Level / Year</label>
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Request Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500 dark:text-slate-500">
                        <GraduationCap className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" />
                        <p className="font-medium">No pending reviews found</p>
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-gray-900 dark:text-white">{request.student?.first_name} {request.student?.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">{request.student?.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-gray-700 dark:text-slate-300">{request.student?.program}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">Year {request.student?.year_of_study}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(request.overall_status || "pending")}`}>
                            {getStatusLabel(request.overall_status || "pending")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                          {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {hasPermission(Permission.DEAN_APPROVE) ? (
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedRequest(request); setAction("approve"); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">Approve</button>
                              <button onClick={() => { setSelectedRequest(request); setAction("reject"); }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors">Reject</button>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-slate-500 text-xs italic">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRequest && action && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {action === "approve" ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                    {action === "approve" ? "Approve Dean Clearance" : "Reject Dean Clearance"}
                  </h2>
                  <button onClick={() => { setSelectedRequest(null); setAction(null); }} className="text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-4 mb-5">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Student</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedRequest.student?.first_name} {selectedRequest.student?.last_name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">{selectedRequest.student?.student_id} • {selectedRequest.student?.program}</p>
                </div>

                {action === "approve" && (
                  <div className="mb-5 space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Mandatory Verification</h3>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={deanCheck.academic_records_verified} onChange={(e) => setDeanCheck({ ...deanCheck, academic_records_verified: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Academic records verified</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={deanCheck.faculty_requirements_met} onChange={(e) => setDeanCheck({ ...deanCheck, faculty_requirements_met: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Faculty requirements met</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={deanCheck.no_disciplinary_actions} onChange={(e) => setDeanCheck({ ...deanCheck, no_disciplinary_actions: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">No disciplinary actions pending</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={deanCheck.graduation_eligibility_confirmed} onChange={(e) => setDeanCheck({ ...deanCheck, graduation_eligibility_confirmed: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">Graduation eligibility confirmed</span>
                    </label>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Remarks</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" rows={3} placeholder={action === "approve" ? "Optional remarks..." : "Reason for rejection (required)"} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAction(action === "approve" ? "cleared" : "not_cleared")} disabled={action === "approve" && !allChecked} className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-colors ${action === "approve" ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 dark:disabled:text-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>
                    Confirm {action === "approve" ? "Approval" : "Rejection"}
                  </button>
                  <button onClick={() => { setSelectedRequest(null); setAction(null); setRemarks(""); setDeanCheck({ academic_records_verified: false, faculty_requirements_met: false, no_disciplinary_actions: false, graduation_eligibility_confirmed: false }); }} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
