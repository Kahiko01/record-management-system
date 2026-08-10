"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { 
  GraduationCap, CheckCircle2, Clock, XCircle, AlertCircle, 
  Search, Filter, RefreshCw, User, Calendar, BookOpen,
  ChevronRight, ShieldCheck, FileCheck, X
} from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year_of_study: number;
  email?: string;
}

interface ClearanceRequest {
  id: number;
  student_id: number;
  overall_status: string;
  request_date: string;
  student: Student;
}

export default function DeanClearancePage() {
  const { user, hasTask } = useAuth();
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });
  const [deanCheck, setDeanCheck] = useState({
    academic_records_verified: false,
    faculty_requirements_met: false,
    no_disciplinary_actions: false,
    graduation_eligibility_confirmed: false,
  });

  const allChecked = Object.values(deanCheck).every(Boolean);

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

  const handleAction = async (status: string) => {
    if (!selectedRequest) return;
    const loadingToast = toast.loading(action === "approve" ? "Approving clearance..." : "Rejecting clearance...");
    
    try {
      await clearanceApi.updateDeanClearance(selectedRequest.id, {
        status: status,
        remarks: remarks || undefined,
        ...deanCheck,
      });
      
      toast.success(
        action === "approve" 
          ? `✅ ${selectedRequest.student.first_name}'s clearance approved!` 
          : `❌ ${selectedRequest.student.first_name}'s clearance rejected.`,
        { id: loadingToast }
      );
      
      setSelectedRequest(null);
      setRemarks("");
      setAction(null);
      setDeanCheck({ academic_records_verified: false, faculty_requirements_met: false, no_disciplinary_actions: false, graduation_eligibility_confirmed: false });
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.detail || "Failed to update clearance.";
      toast.error(message, { id: loadingToast });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", icon: Clock },
      in_progress: { bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", icon: RefreshCw },
      cleared: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
      not_cleared: { bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", icon: XCircle },
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
      </span>
    );
  };

  const groupedRequests = {
    pending: requests.filter(r => r.overall_status === "pending"),
    in_progress: requests.filter(r => r.overall_status === "in_progress"),
    cleared: requests.filter(r => r.overall_status === "cleared"),
    not_cleared: requests.filter(r => r.overall_status === "not_cleared"),
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 min-h-screen p-6 lg:p-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dean's Clearance Review</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Verify academic completion and approve final clearance</p>
                </div>
              </div>
              <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Pending Review", count: groupedRequests.pending.length, color: "amber", icon: Clock },
              { label: "In Progress", count: groupedRequests.in_progress.length, color: "blue", icon: RefreshCw },
              { label: "Cleared", count: groupedRequests.cleared.length, color: "emerald", icon: CheckCircle2 },
              { label: "Not Cleared", count: groupedRequests.not_cleared.length, color: "rose", icon: XCircle },
            ].map((stat) => {
              const Icon = stat.icon;
              const colorMap: any = {
                amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
                blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60",
                emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
                rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
              };
              return (
                <div key={stat.label} className={`rounded-2xl p-5 border ${colorMap[stat.color]} transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                      <p className="text-3xl font-black mt-1">{stat.count}</p>
                    </div>
                    <Icon className="h-8 w-8 opacity-30" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={filters.search} 
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                    onKeyPress={(e) => e.key === "Enter" && fetchData()} 
                    placeholder="e.g. John or ADM/2024/001" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50" 
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Program</label>
                <input 
                  type="text" 
                  value={filters.course} 
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })} 
                  placeholder="e.g. Computer Science" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50" 
                />
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
              <button onClick={() => { setFilters({ search: "", course: "", level: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-purple-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center">
              <GraduationCap className="h-16 w-16 text-purple-500/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No clearance requests found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Students will appear here once they reach the Dean review stage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* Pending Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pending Review</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">{groupedRequests.pending.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {groupedRequests.pending.map((request) => (
                    <StudentCard key={request.id} request={request} onApprove={() => { setSelectedRequest(request); setAction("approve"); }} onReject={() => { setSelectedRequest(request); setAction("reject"); }} hasPermission={hasTask("dean_approve") || hasTask("dean:approve")} />
                  ))}
                  {groupedRequests.pending.length === 0 && <EmptyColumn />}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">In Progress</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">{groupedRequests.in_progress.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {groupedRequests.in_progress.map((request) => (
                    <StudentCard key={request.id} request={request} onApprove={() => { setSelectedRequest(request); setAction("approve"); }} onReject={() => { setSelectedRequest(request); setAction("reject"); }} hasPermission={hasTask("dean_approve") || hasTask("dean:approve")} />
                  ))}
                  {groupedRequests.in_progress.length === 0 && <EmptyColumn />}
                </div>
              </div>

              {/* Cleared Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Cleared</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">{groupedRequests.cleared.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {groupedRequests.cleared.map((request) => (
                    <StudentCard key={request.id} request={request} hasPermission={false} />
                  ))}
                  {groupedRequests.cleared.length === 0 && <EmptyColumn />}
                </div>
              </div>

              {/* Not Cleared Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Not Cleared</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">{groupedRequests.not_cleared.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {groupedRequests.not_cleared.map((request) => (
                    <StudentCard key={request.id} request={request} hasPermission={false} />
                  ))}
                  {groupedRequests.not_cleared.length === 0 && <EmptyColumn />}
                </div>
              </div>

            </div>
          )}

          {/* Action Modal */}
          {selectedRequest && action && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setSelectedRequest(null); setAction(null); }} />
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${action === "approve" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" : "bg-rose-100 dark:bg-rose-950/40 text-rose-600"}`}>
                      {action === "approve" ? <ShieldCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {action === "approve" ? "Approve Clearance" : "Reject Clearance"}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedRequest.student.first_name} {selectedRequest.student.last_name}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedRequest(null); setAction(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Student Info */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mb-5 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500 dark:text-slate-400">ADM No:</span> <span className="font-semibold text-slate-900 dark:text-white ml-1">{selectedRequest.student.student_id}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Program:</span> <span className="font-semibold text-slate-900 dark:text-white ml-1">{selectedRequest.student.program}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Year:</span> <span className="font-semibold text-slate-900 dark:text-white ml-1">{selectedRequest.student.year_of_study}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Request Date:</span> <span className="font-semibold text-slate-900 dark:text-white ml-1">{new Date(selectedRequest.request_date).toLocaleDateString()}</span></div>
                  </div>
                </div>

                {/* Approve Checklist */}
                {action === "approve" && (
                  <div className="mb-5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5" /> Mandatory Verification
                    </h4>
                    {[
                      { key: "academic_records_verified", label: "Academic records verified" },
                      { key: "faculty_requirements_met", label: "Faculty requirements met" },
                      { key: "no_disciplinary_actions", label: "No disciplinary actions pending" },
                      { key: "graduation_eligibility_confirmed", label: "Graduation eligibility confirmed" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-500/50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={(deanCheck as any)[item.key]} 
                          onChange={(e) => setDeanCheck({ ...deanCheck, [item.key]: e.target.checked })} 
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-purple-500/50" 
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Reject Remarks */}
                {action === "reject" && (
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Reason for Rejection</label>
                    <textarea 
                      value={remarks} 
                      onChange={(e) => setRemarks(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50" 
                      rows={3} 
                      placeholder="Please provide a reason for rejection..." 
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setSelectedRequest(null); setAction(null); }} 
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAction(action === "approve" ? "cleared" : "not_cleared")} 
                    disabled={action === "approve" && !allChecked} 
                    className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm transition-colors ${
                      action === "approve" 
                        ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500" 
                        : "bg-rose-600 hover:bg-rose-500"
                    }`}
                  >
                    Confirm {action === "approve" ? "Approval" : "Rejection"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Student Card Component
function StudentCard({ request, onApprove, onReject, hasPermission }: { request: ClearanceRequest; onApprove?: () => void; onReject?: () => void; hasPermission: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
            {request.student.first_name.charAt(0)}{request.student.last_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{request.student.first_name} {request.student.last_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{request.student.student_id}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <BookOpen className="h-3 w-3" /> {request.student.program}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="h-3 w-3" /> {new Date(request.request_date).toLocaleDateString()}
        </div>
      </div>

      {hasPermission && onApprove && onReject && (
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onApprove} className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approve
          </button>
          <button onClick={onReject} className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
            <XCircle className="h-3 w-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// Empty Column Placeholder
function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-600">
      <p className="text-xs font-medium">No students</p>
    </div>
  );
}
