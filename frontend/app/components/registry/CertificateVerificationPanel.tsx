"use client";

import { useState } from "react";
import {
  X, Award, FileText, Hash, Calendar, MapPin, CheckCircle2,
  Square, AlertTriangle, ShieldCheck, PackageCheck, CalendarClock
} from "lucide-react";
import ReleaseWorkflowModal from "./ReleaseWorkflowModal";

interface CertificateVerificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockCertificate = {
  type: "National Diploma",
  programme: "Information Communication Technology",
  graduationYear: "2024",
  certificateNumber: "CERT/KNP/2024/00421",
  serialNumber: "SN-9988776655",
  awardClassification: "Credit",
  issueStatus: "Printed & Dispatched to Registry",
  dateReceived: "10 Oct 2024",
  datePrepared: "12 Oct 2024",
  currentLocation: "Main Vault, Shelf 4B",
};

export default function CertificateVerificationPanel({ isOpen, onClose }: CertificateVerificationPanelProps) {
  const [checks, setChecks] = useState({
    received: true,
    cleared: true,
    identity: false,
    matched: false,
  });
  const [showReleaseWorkflow, setShowReleaseWorkflow] = useState(false);

  if (!isOpen) return null;

  const allChecked = Object.values(checks).every(Boolean);

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Certificate Verification</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Match physical document to digital record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <DetailRow icon={Award} label="Certificate Type" value={mockCertificate.type} />
            <DetailRow icon={FileText} label="Programme" value={mockCertificate.programme} />
            <DetailRow icon={Calendar} label="Graduation Year" value={mockCertificate.graduationYear} />
            <DetailRow icon={Hash} label="Certificate Number" value={mockCertificate.certificateNumber} mono />
            <DetailRow icon={Hash} label="Serial Number" value={mockCertificate.serialNumber} mono />
            <DetailRow icon={Award} label="Award Classification" value={mockCertificate.awardClassification} />
            <DetailRow icon={FileText} label="Issue Status" value={mockCertificate.issueStatus} />
            <DetailRow icon={MapPin} label="Current Location" value={mockCertificate.currentLocation} />
            <DetailRow icon={Calendar} label="Date Received" value={mockCertificate.dateReceived} />
            <DetailRow icon={Calendar} label="Date Prepared" value={mockCertificate.datePrepared} />
          </div>

          {/* Verification Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Pre-Release Verification Checklist
            </h3>
            <div className="space-y-3">
              <CheckItem label="Certificate received in Registry" checked={checks.received} onChange={() => toggleCheck('received')} />
              <CheckItem label="Student clearance is 100% complete" checked={checks.cleared} onChange={() => toggleCheck('cleared')} />
              <CheckItem label="Student identity verified (ID/Passport)" checked={checks.identity} onChange={() => toggleCheck('identity')} />
              <CheckItem label="Physical certificate matched to digital record" checked={checks.matched} onChange={() => toggleCheck('matched')} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${allChecked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
            {allChecked ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {allChecked ? "READY FOR RELEASE" : "VERIFICATION INCOMPLETE"}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button disabled={!allChecked} className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <CalendarClock className="h-4 w-4" /> Schedule
            </button>
            <button 
              onClick={() => setShowReleaseWorkflow(true)}
              disabled={!allChecked} 
              className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PackageCheck className="h-4 w-4" /> Release Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Render Release Workflow */}
      <ReleaseWorkflowModal 
        isOpen={showReleaseWorkflow} 
        onClose={() => setShowReleaseWorkflow(false)} 
      />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: any, label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className={`text-sm font-medium text-slate-900 dark:text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${checked ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
      ) : (
        <Square className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
      )}
      <span className={`text-sm font-medium ${checked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
        {label}
      </span>
    </button>
  );
}
