"use client";

import { useState } from "react";
import { 
  X, PauseCircle, AlertTriangle, ChevronDown, Save 
} from "lucide-react";

interface HoldExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const holdReasons = [
  "Clearance incomplete",
  "Identity mismatch",
  "Certificate information mismatch",
  "Certificate unavailable",
  "Damaged certificate",
  "Duplicate record",
  "Investigation required",
  "Unauthorized representative",
  "Other"
];

export default function HoldExceptionModal({ isOpen, onClose }: HoldExceptionModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePlaceHold = () => {
    if (!reason) return;
    setIsSubmitting(true);
    // In a real app, this triggers an API call to update the DB and log the audit event
    setTimeout(() => {
      setIsSubmitting(false);
      alert(`Record placed on hold.\nReason: ${reason}\nNotes: ${notes || "None"}`);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-red-50 dark:bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <PauseCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Place Record On Hold</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">This will block certificate release.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Hold Consequences</p>
              <ul className="text-xs text-red-600 dark:text-red-300 space-y-1 list-disc pl-4">
                <li>The student's status changes to <span className="font-semibold">On Hold</span>.</li>
                <li>Release buttons will be disabled.</li>
                <li>An audit event is logged with this reason.</li>
                <li>The student may receive a notification.</li>
              </ul>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Reason for Hold <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a reason...</option>
                {holdReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Additional Notes {reason === "Other" && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Provide specific details about the discrepancy or issue..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handlePlaceHold}
            disabled={!reason || (reason === "Other" && !notes.trim()) || isSubmitting}
            className="px-6 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Hold...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Place on Hold
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
