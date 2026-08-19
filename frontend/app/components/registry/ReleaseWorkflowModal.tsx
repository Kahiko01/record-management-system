"use client";

import { useState } from "react";
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  User, ShieldCheck, FileText, UserCheck, PackageCheck, Lock,
  Fingerprint, CalendarCheck, ArrowRight
} from "lucide-react";

interface ReleaseWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: {
    id: number;
    studentName: string;
    admissionNo: string;
    nationalId: string;
    programme: string;
    certificateNumber: string;
  } | null;
}

const steps = [
  { id: 1, title: "Identity Verification", icon: Fingerprint, desc: "Verify student ID/Passport" },
  { id: 2, title: "Clearance Confirmation", icon: ShieldCheck, desc: "Ensure all departments cleared" },
  { id: 3, title: "Certificate Matching", icon: FileText, desc: "Match physical cert to record" },
  { id: 4, title: "Recipient Confirmation", icon: UserCheck, desc: "Confirm who is collecting" },
  { id: 5, title: "Final Release", icon: PackageCheck, desc: "Release & record audit event" },
];

export default function ReleaseWorkflowModal({ isOpen, onClose, studentData }: ReleaseWorkflowModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isReleased, setIsReleased] = useState(false);
  const [recipientType, setRecipientType] = useState("student");
  const [repName, setRepName] = useState("");
  const [repId, setRepId] = useState("");
  const [repAuthRef, setRepAuthRef] = useState("");

  if (!isOpen || !studentData) return null;

  // Use the dynamic student data passed from the queue
  const releaseData = {
    studentName: studentData.studentName,
    admissionNo: studentData.admissionNo,
    nationalId: studentData.nationalId || "N/A",
    programme: studentData.programme,
    certificateNumber: studentData.certificateNumber || `CERT-${studentData.admissionNo}`,
    clearanceStatus: "100% Cleared",
    recipientType: "Student",
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleFinalRelease = () => {
    setIsReleased(true);
    // In a real app, this would trigger an API call to update the DB and log the audit event
  };

  if (isReleased) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Certificate Released!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {releaseData.certificateNumber} has been successfully handed over to {releaseData.studentName}.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Event Created</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Action:</span> Certificate Released<br/>
              <span className="font-semibold">By:</span> registry_officer<br/>
              <span className="font-semibold">Time:</span> {new Date().toLocaleString()}<br/>
              <span className="font-semibold">IP/Device:</span> 192.168.1.45 / Chrome
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-500" />
              Certificate Release Workflow
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Controlled release for {releaseData.studentName} ({releaseData.admissionNo})
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                      isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider text-center hidden md:block ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. Identity Verification</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Physically verify the student's identification document before proceeding.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                <DetailRow label="Student Name" value={releaseData.studentName} />
                <DetailRow label="Admission Number" value={releaseData.admissionNo} mono />
                <DetailRow label="National ID / Passport" value={releaseData.nationalId} mono />
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Ask the student to present their physical ID and confirm the photo matches.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Clearance Confirmation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Registry must confirm that all departmental clearances are complete.
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{releaseData.clearanceStatus}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">Finance • Examinations • Dean • Accommodation • Discipline</p>
                  </div>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Do not assume clearance. Verify the digital tracker matches the physical file.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. Certificate Matching</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Retrieve the physical certificate and match the serial numbers.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                <DetailRow label="Certificate Number" value={releaseData.certificateNumber} mono />
                <DetailRow label="Programme" value={releaseData.programme} />
                <DetailRow label="Status" value="Ready for Collection" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  Ensure the printed certificate number exactly matches the system record.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">4. Recipient Confirmation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Confirm who is physically receiving the certificate.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setRecipientType("student")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                    recipientType === "student"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <User className={`h-6 w-6 mb-3 ${recipientType === "student" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  <p className={`font-bold mb-1 ${recipientType === "student" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                    Student (Self)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Collecting in person with valid ID.</p>
                </button>

                <button
                  onClick={() => setRecipientType("representative")}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                    recipientType === "representative"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <UserCheck className={`h-6 w-6 mb-3 ${recipientType === "representative" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                  <p className={`font-bold mb-1 ${recipientType === "representative" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                    Authorized Representative
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Requires authorization letter verification.</p>
                </button>
              </div>

              {/* Representative Details - Shows only when representative is selected */}
              {recipientType === "representative" && (
                <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Representative Verification Required
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        Representative Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="Enter representative's full name"
                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                          repName.trim()
                            ? "border-emerald-300 dark:border-emerald-500/30 focus:ring-emerald-500/50"
                            : "border-red-300 dark:border-red-500/30 focus:ring-red-500/50"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        Representative ID Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={repId}
                        onChange={(e) => setRepId(e.target.value)}
                        placeholder="Enter representative's National ID"
                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                          repId.trim()
                            ? "border-emerald-300 dark:border-emerald-500/30 focus:ring-emerald-500/50"
                            : "border-red-300 dark:border-red-500/30 focus:ring-red-500/50"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        Authorization Letter Reference <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={repAuthRef}
                        onChange={(e) => setRepAuthRef(e.target.value)}
                        placeholder="e.g., AUTH/2024/0042"
                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                          repAuthRef.trim()
                            ? "border-emerald-300 dark:border-emerald-500/30 focus:ring-emerald-500/50"
                            : "border-red-300 dark:border-red-500/30 focus:ring-red-500/50"
                        }`}
                      />
                    </div>
                  </div>
                  {(!repName.trim() || !repId.trim() || !repAuthRef.trim()) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                        All representative fields are required before proceeding.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ⚠️ Ensure the authorization letter is signed by the student and includes a copy of the student's ID.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">5. Final Release Confirmation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review the summary before permanently releasing the certificate.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                <DetailRow label="Student" value={releaseData.studentName} />
                <DetailRow label="Admission No" value={releaseData.admissionNo} mono />
                <DetailRow label="Certificate" value={releaseData.certificateNumber} mono />
                <DetailRow label="Recipient" value={recipientType === "student" ? "Student (Self)" : "Authorized Representative"} />
                <DetailRow label="Clearance" value={releaseData.clearanceStatus} />
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  This action is permanent. An audit event will be created and the certificate status will change to "Collected".
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 4 && recipientType === "representative" && (!repName.trim() || !repId.trim() || !repAuthRef.trim())}
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalRelease}
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <PackageCheck className="h-4 w-4" /> Release Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-sm font-bold text-slate-900 dark:text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
