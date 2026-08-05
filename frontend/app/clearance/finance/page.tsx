"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth, Permission } from "../../context/AuthContext";
import { clearanceApi, studentApi } from "../../lib/api";
import { ClearanceRequest, ClearanceStatus, Student } from "../../types";
import { CheckCircle, XCircle, Clock, DollarSign, List, Search, X } from "lucide-react";

export default function FinanceClearancePage() {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });

  const [financeCheck, setFinanceCheck] = useState({
    fees_paid: false,
    no_outstanding_balances: false,
    library_fines_cleared: false,
    accommodation_fees_cleared: false,
  });

  useEffect(() => { fetchData(); }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'pending') {
        const response = await clearanceApi.getFinancePending(filters);
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
    if (!selectedRequest || !selectedRequest.finance_clearance) return;
    try {
      await clearanceApi.updateFinanceClearance(selectedRequest.id, {
        status: status,
        remarks: remarks || undefined,
        ...financeCheck,
      });
      setSelectedRequest(null); setRemarks(""); setAction(null);
      setFinanceCheck({ fees_paid: false, no_outstanding_balances: false, library_fines_cleared: false, accommodation_fees_cleared: false });
      fetchData();
    } catch (error) { alert("Failed to update clearance."); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "not_cleared": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
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

  const allChecked = Object.values(financeCheck).every(v => v === true);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="h-6 w-6 text-emerald-500" /> Finance Clearance Queue</h1>
              <p className="text-sm text-slate-400 mt-1">Audit student fee settlements and approve financial clearances</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button onClick={() => setViewMode('pending')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Clock className="h-4 w-4" /> Pending</button>
                <button onClick={() => setViewMode('all')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><List className="h-4 w-4" /> All Students</button>
              </div>
              {viewMode === 'pending' && <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold">{requests.length} PENDING</span>}
              {viewMode === 'all' && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">{allStudents.length} TOTAL</span>}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. John or ADM/123" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Course / Program</label>
                <input type="text" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} onKeyPress={(e) => e.key === "Enter" && fetchData()} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Level</label>
                <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                  <option value="">All</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20">Search</button>
              <button onClick={() => { setFilters({ search: "", course: "", level: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">Clear</button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    {viewMode === 'pending' && <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Request Date</th>}
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(viewMode === 'pending' ? requests : allStudents).length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500"><CheckCircle className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" /><p className="font-medium">No records found</p></td></tr>
                  ) : (
                    (viewMode === 'pending' ? requests : allStudents).map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-white">{item.student?.first_name || item.first_name} {item.student?.last_name || item.last_name}</p>
                          <p className="text-xs text-slate-500">{item.student?.student_id || item.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-slate-300">{item.student?.program || item.program}</p>
                          <p className="text-xs text-slate-500">Year {item.student?.year_of_study || item.year_of_study}</p>
                        </td>
                        <td className="px-6 py-4">
                          {viewMode === 'pending' ? (
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(item.finance_clearance?.status || "pending")}`}>{getStatusLabel(item.finance_clearance?.status || "pending")}</span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full border bg-slate-800 text-slate-400 border-slate-700">View Details</span>
                          )}
                        </td>
                        {viewMode === 'pending' && <td className="px-6 py-4 text-sm text-slate-400">{item.request_date ? new Date(item.request_date).toLocaleDateString() : 'N/A'}</td>}
                        <td className="px-6 py-4">
                          {viewMode === 'pending' && hasPermission(Permission.FINANCE_APPROVE) ? (
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedRequest(item); setAction("approve"); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">Approve</button>
                              <button onClick={() => { setSelectedRequest(item); setAction("reject"); }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors">Reject</button>
                            </div>
                          ) : <span className="text-slate-500 text-xs italic">View Only</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRequest && action && viewMode === 'pending' && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {action === "approve" ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                    {action === "approve" ? "Approve Finance Clearance" : "Reject Finance Clearance"}
                  </h2>
                  <button onClick={() => { setSelectedRequest(null); setAction(null); }} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5">
                  <p className="text-sm text-slate-400">Student</p>
                  <p className="text-base font-bold text-white">{selectedRequest.student?.first_name} {selectedRequest.student?.last_name}</p>
                  <p className="text-xs text-slate-500">{selectedRequest.student?.student_id} • {selectedRequest.student?.program}</p>
                </div>

                {action === "approve" && (
                  <div className="mb-5 space-y-3">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Financial Verification Checklist</h3>
                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={financeCheck.fees_paid} onChange={(e) => setFinanceCheck({ ...financeCheck, fees_paid: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-slate-300">Tuition fees fully paid</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={financeCheck.no_outstanding_balances} onChange={(e) => setFinanceCheck({ ...financeCheck, no_outstanding_balances: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-slate-300">No outstanding balances</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={financeCheck.library_fines_cleared} onChange={(e) => setFinanceCheck({ ...financeCheck, library_fines_cleared: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-slate-300">Library fines cleared</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={financeCheck.accommodation_fees_cleared} onChange={(e) => setFinanceCheck({ ...financeCheck, accommodation_fees_cleared: e.target.checked })} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-slate-300">Accommodation fees cleared</span>
                    </label>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider mb-1.5">Remarks</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" rows={3} placeholder={action === "approve" ? "Optional remarks..." : "Reason for rejection (required)"} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAction(action === "approve" ? "cleared" : "not_cleared")} disabled={action === "approve" && !allChecked} className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-colors ${action === "approve" ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>Confirm {action === "approve" ? "Approval" : "Rejection"}</button>
                  <button onClick={() => { setSelectedRequest(null); setAction(null); setRemarks(""); setFinanceCheck({ fees_paid: false, no_outstanding_balances: false, library_fines_cleared: false, accommodation_fees_cleared: false }); }} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
