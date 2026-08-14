"use client";

import { useState } from "react";
import {
  X, User, Mail, Phone, GraduationCap, Calendar, Hash, MapPin,
  CheckCircle2, Circle, AlertCircle, Fingerprint
} from "lucide-react";
import CertificateVerificationPanel from "./CertificateVerificationPanel";

interface StudentRegistryProfileProps {
  studentId: number | null;
  onClose: () => void;
}

// Mock data for the deep dive
const mockStudentDetails = {
  id: 1,
  fullName: "John Kamau",
  admissionNo: "KNP/2022/001",
  nationalId: "34567890",
  email: "john.kamau@student.knp.ac.ke",
  phone: "+254 712 345 678",
  programme: "Diploma in Information Communication Technology",
  department: "Computing & Informatics",
  academicYear: "Year 3",
  graduationCohort: "Class of 2024",
  status: "Graduated / Awaiting Collection",
  clearanceSteps: [
    { dept: "Finance", status: "cleared", details: "Fee balance settled. Cleared by J. Doe on 12 Oct." },
    { dept: "Examinations", status: "cleared", details: "All transcripts verified. Cleared by M. Smith on 14 Oct." },
    { dept: "Dean of Students", status: "cleared", details: "No disciplinary records. Cleared by Dr. N. on 15 Oct." },
    { dept: "Accommodation", status: "cleared", details: "Keys returned, room cleared." },
    { dept: "Registry", status: "current", details: "Awaiting identity verification and certificate release." },
  ]
};

export default function StudentRegistryProfile({ studentId, onClose }: StudentRegistryProfileProps) {
  const [showVerification, setShowVerification] = useState(false);

  if (!studentId) return null;

  const student = mockStudentDetails; // In reality, fetch by studentId

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.fullName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{student.admissionNo} • {student.status}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: Student Information */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5" /> Personal Details
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={Hash} label="National ID" value={student.nationalId} />
                  <InfoRow icon={Mail} label="Email" value={student.email} />
                  <InfoRow icon={Phone} label="Phone" value={student.phone} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5" /> Academic Details
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={GraduationCap} label="Programme" value={student.programme} />
                  <InfoRow icon={MapPin} label="Department" value={student.department} />
                  <InfoRow icon={Calendar} label="Academic Year" value={student.academicYear} />
                  <InfoRow icon={Calendar} label="Cohort" value={student.graduationCohort} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Clearance Workflow Tracker */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Departmental Clearance Tracker
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 mb-6">
                ⚠️ Registry must not assume clearance. All prior departments must show "Cleared" before proceeding.
              </p>

              <div className="relative space-y-0">
                {student.clearanceSteps.map((step, index) => {
                  const isLast = index === student.clearanceSteps.length - 1;
                  const isCleared = step.status === "cleared";
                  const isCurrent = step.status === "current";

                  return (
                    <div key={step.dept} className="flex gap-4 pb-8 relative">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-24px)] ${isCleared ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}

                      {/* Icon Node */}
                      <div className="relative z-10 flex-shrink-0">
                        {isCleared ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
                            <Circle className="h-4 w-4 text-white fill-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Circle className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-bold ${isCleared ? 'text-slate-900 dark:text-white' : isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {step.dept}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCleared ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            isCurrent ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {isCleared ? 'Cleared' : isCurrent ? 'Current Stage' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Close Record
          </button>
          <button 
            onClick={() => setShowVerification(true)}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
          >
            Proceed to Verification
          </button>
        </div>
      </div>

      {/* Render the Verification Panel */}
      <CertificateVerificationPanel 
        isOpen={showVerification} 
        onClose={() => setShowVerification(false)} 
      />
    </div>
  );
}

// Helper component for info rows
function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
