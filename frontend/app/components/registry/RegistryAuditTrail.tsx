"use client";

import { 
  ShieldCheck, Eye, UserCheck, PackageCheck, PauseCircle, CalendarClock, 
  Lock 
} from "lucide-react";

// Mock Audit Logs
const mockAuditLogs = [
  {
    id: 1,
    timestamp: "Today, 10:45 AM",
    user: "registry_officer",
    action: "Certificate Released",
    details: "Certificate CERT-2024-00421 released to John Kamau (KNP/2022/001). Identity verified via National ID.",
    type: "release"
  },
  {
    id: 2,
    timestamp: "Today, 10:42 AM",
    user: "registry_officer",
    action: "Identity Verification Completed",
    details: "John Kamau (KNP/2022/001) identity matched against National ID 34567890.",
    type: "verify"
  },
  {
    id: 3,
    timestamp: "Today, 10:15 AM",
    user: "registry_officer",
    action: "Record Placed On Hold",
    details: "Peter Mwangi (KNP/2022/087) placed on hold. Reason: Identity mismatch. Additional notes: Photo on ID does not match student record.",
    type: "hold"
  },
  {
    id: 4,
    timestamp: "Today, 09:30 AM",
    user: "registry_officer",
    action: "Appointment Scheduled",
    details: "Collection appointment scheduled for Jane Njeri (KNP/2022/101) on Tomorrow at 09:00 AM.",
    type: "schedule"
  },
  {
    id: 5,
    timestamp: "Yesterday, 02:15 PM",
    user: "registry_officer",
    action: "Record Viewed",
    details: "Accessed full student profile and clearance tracker for Mary Wanjiku (KNP/2021/043).",
    type: "view"
  }
];

const actionConfig: Record<string, { icon: any, color: string, bg: string }> = {
  release: { icon: PackageCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  verify: { icon: UserCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  hold: { icon: PauseCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
  schedule: { icon: CalendarClock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
  view: { icon: Eye, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" },
};

export default function RegistryAuditTrail() {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-500" />
            Registry Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-400" />
            Immutable record of all sensitive Registry actions. Read-only.
          </p>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {mockAuditLogs.map((log) => {
          const config = actionConfig[log.type];
          const Icon = config.icon;

          return (
            <div key={log.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex gap-4">
              {/* Icon Node */}
              <div className={`p-3 rounded-xl border flex-shrink-0 h-fit ${config.bg}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <h3 className={`text-sm font-bold ${config.color}`}>{log.action}</h3>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 flex-shrink-0">{log.timestamp}</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                  {log.details}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Performed by:</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {log.user}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
          End of Audit Log • Records cannot be edited or deleted
        </p>
      </div>
    </section>
  );
}
