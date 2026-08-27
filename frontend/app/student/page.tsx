"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clearanceApi, studentApi } from "../lib/api";
import { CheckCircle, Clock, XCircle, GraduationCap, FileText, ArrowRight, Send } from "lucide-react";

export default function StudentPortalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [clearance, setClearance] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Find the student record linked to the logged-in user
      const studentsRes = await studentApi.getAll({ limit: 1000 });
      const myStudent = studentsRes.data?.find((s: any) => s.user_id === user?.id);
      if (myStudent) {
        setStudentId(myStudent.id);
        // Try to fetch clearance status
        try {
          const statusRes = await clearanceApi.getMyStatus();
          setClearance(statusRes.data);
        } catch (err) {
          setClearance(null); // 404 means no clearance requested yet
        }
      }
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!studentId) return;
    setApplying(true);
    try {
      const res = await clearanceApi.requestClearance(studentId);
      setClearance(res.data);
      alert("Clearance request submitted successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to submit request.");
    } finally {
      setApplying(false);
    }
  };

  const getStepStatus = (departmentStatus: string | undefined) => {
    if (!departmentStatus) return "pending";
    if (departmentStatus === "cleared") return "cleared";
    if (departmentStatus === "not_cleared") return "rejected";
    return "pending";
  };

  const StepIcon = ({ status }: { status: string }) => {
    if (status === "cleared") return <CheckCircle className="h-8 w-8 text-emerald-500" />;
    if (status === "rejected") return <XCircle className="h-8 w-8 text-rose-500" />;
    return <Clock className="h-8 w-8 text-amber-500" />;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <div className="flex">
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-emerald-500" /> Student Clearance Portal
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Track your graduation clearance progress in real-time.</p>
          </div>

          {!clearance ? (
            // === NO CLEARANCE REQUESTED YET ===
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center shadow-lg">
              <FileText className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Graduate?</h2>
              <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                You haven't applied for your graduation clearance yet. Click the button below to start the process with all university departments.
              </p>
              <button 
                onClick={handleApply} 
                disabled={applying}
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                <Send className="h-5 w-5" /> {applying ? "Submitting..." : "Apply for Clearance"}
              </button>
            </div>
          ) : (
            // === CLEARANCE PROGRESS TRACKER ===
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div className={`p-6 rounded-2xl border shadow-sm ${
                clearance.overall_status === 'cleared' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                clearance.overall_status === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' :
                'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Overall Status: <span className="capitalize">{clearance.overall_status.replace('_', ' ')}</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                  {clearance.overall_status === 'cleared' ? "Congratulations! You are cleared for graduation." :
                   clearance.overall_status === 'rejected' ? "Your clearance was rejected by a department. Please contact the relevant office." :
                   "Your clearance is currently being reviewed by the university departments."}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Department Approvals</h3>
                
                <div className="space-y-6">
                  {/* Step 1: Finance */}
                  <div className="flex items-start gap-4">
                    <StepIcon status={getStepStatus(clearance.finance_clearance?.status)} />
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">1. Finance Department</h4>
                        <span className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{getStepStatus(clearance.finance_clearance?.status)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Verification of tuition and fee settlements.</p>
                    </div>
                  </div>

                  {/* Step 2: Exams */}
                  <div className="flex items-start gap-4">
                    <StepIcon status={getStepStatus(clearance.examination_clearance?.status)} />
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">2. Examinations Office</h4>
                        <span className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{getStepStatus(clearance.examination_clearance?.status)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Verification of academic records and missing grades.</p>
                    </div>
                  </div>

                  {/* Step 3: Dean */}
                  <div className="flex items-start gap-4">
                    <StepIcon status={getStepStatus(clearance.dean_approval?.status)} />
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">3. Dean's Office</h4>
                        <span className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">{getStepStatus(clearance.dean_approval?.status)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Final faculty approval and disciplinary check.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Status */}
              {clearance.overall_status === 'cleared' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" /> Certificate Collection
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">
                    {clearance.collection_eligible ? 
                      "You are eligible to collect your certificate! Please visit the Registry office or book an appointment." : 
                      "Your certificate is currently being processed by the Registry office. Please check back soon."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
