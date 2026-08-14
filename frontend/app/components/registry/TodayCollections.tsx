"use client";

import { useState } from "react";
import { 
  Clock, UserCheck, UserX, CalendarCheck, CheckCircle2, 
  XCircle, MoreVertical, Calendar, AlertCircle 
} from "lucide-react";

// Mock appointments for today
const mockAppointments = [
  {
    id: 1,
    time: "10:00 AM",
    studentName: "John Kamau",
    admissionNo: "KNP/2022/001",
    status: "Confirmed",
    program: "ICT"
  },
  {
    id: 2,
    time: "10:30 AM",
    studentName: "Mary Wanjiku",
    admissionNo: "KNP/2021/043",
    status: "Waiting",
    program: "Business Admin"
  },
  {
    id: 3,
    time: "11:00 AM",
    studentName: "Peter Mwangi",
    admissionNo: "KNP/2022/087",
    status: "Arrived",
    program: "Electrical"
  },
  {
    id: 4,
    time: "11:30 AM",
    studentName: "Jane Njeri",
    admissionNo: "KNP/2022/101",
    status: "No-Show",
    program: "Nursing"
  },
  {
    id: 5,
    time: "02:00 PM",
    studentName: "David Ochieng",
    admissionNo: "KNP/2020/012",
    status: "Collected",
    program: "Engineering"
  }
];

const statusConfig: Record<string, { color: string, bg: string, icon: any }> = {
  Confirmed: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", icon: CalendarCheck },
  Waiting: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", icon: Clock },
  Arrived: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", icon: UserCheck },
  "No-Show": { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20", icon: UserX },
  Collected: { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700", icon: CheckCircle2 },
};

export default function TodayCollections() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Today's Collections
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live queue of students scheduled for certificate pickup today.
          </p>
        </div>
        <button className="px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" /> Schedule New
        </button>
      </div>

      {/* Timeline List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {mockAppointments.map((apt) => {
          const config = statusConfig[apt.status];
          const Icon = config.icon;

          return (
            <div key={apt.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center gap-4">
              
              {/* Time Column */}
              <div className="w-20 flex-shrink-0 text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{apt.time}</p>
              </div>

              {/* Status Icon Node */}
              <div className={`p-2.5 rounded-xl border ${config.bg} flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{apt.studentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{apt.admissionNo}</p>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{apt.program}</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.bg} ${config.color} hidden sm:inline-block`}>
                {apt.status}
              </span>

              {/* Action Menu */}
              <div className="relative flex-shrink-0">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === apt.id ? null : apt.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {openMenuId === apt.id && (
                  <div className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
                    <MenuItem label="Confirm Appointment" icon={CalendarCheck} />
                    <MenuItem label="Mark Arrived" icon={UserCheck} />
                    <MenuItem label="Mark Collected" icon={CheckCircle2} highlight />
                    <MenuItem label="Mark No-Show" icon={UserX} danger />
                    <MenuItem label="Reschedule" icon={Clock} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MenuItem({ icon: Icon, label, highlight, danger }: any) {
  let colorClass = "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";
  if (highlight) colorClass = "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-semibold";
  if (danger) colorClass = "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10";

  return (
    <button
      onClick={() => alert(`Action: ${label}`)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${colorClass}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
