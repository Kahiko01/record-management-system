"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Clock, Plus, CheckCircle2, AlertCircle } from "lucide-react";

interface Appointment {
  id: number;
  student_name: string;
  certificate_number: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed";
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, student_name: "John Doe", certificate_number: "CERT-2024-001", date: "2026-08-12", time: "09:00 AM", status: "confirmed" },
  { id: 2, student_name: "Jane Smith", certificate_number: "CERT-2024-002", date: "2026-08-12", time: "10:30 AM", status: "confirmed" },
  { id: 3, student_name: "Bob Wilson", certificate_number: "CERT-2024-004", date: "2026-08-13", time: "02:00 PM", status: "pending" },
  { id: 4, student_name: "Carol Davis", certificate_number: "CERT-2024-005", date: "2026-08-14", time: "11:00 AM", status: "confirmed" },
  { id: 5, student_name: "Alice Johnson", certificate_number: "CERT-2024-003", date: "2026-08-15", time: "09:30 AM", status: "pending" },
];

export default function CollectionCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 7, 12)); // Aug 12, 2026
  const [appointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const dayAppointments = appointments.filter(a => a.date === selectedDateStr);

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const count = appointments.filter(a => a.date === dateStr).length;
      if (count > 0) {
        return (
          <div className="flex justify-center mt-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {count}
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const statusStyles = {
    confirmed: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    pending: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    completed: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Calendar (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" /> Collection Calendar
            </h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Slot
            </button>
          </div>
          
          <div className="[&_.react-calendar]:w-full [&_.react-calendar]:border-0 [&_.react-calendar]:bg-transparent [&_.react-calendar]:font-sans [&_.react-calendar__tile--active]:!bg-emerald-600 [&_.react-calendar__tile--active]:!text-white [&_.react-calendar__tile--active]:!rounded-xl [&_.react-calendar__tile--now]:!text-emerald-600 [&_.react-calendar__tile--now]:!font-bold [&_.react-calendar__navigation_button]:!rounded-lg [&_.react-calendar__navigation_button]:hover:!bg-emerald-50 [&_.react-calendar__navigation_button]:dark:hover:!bg-emerald-950/30 [&_.react-calendar__navigation_button]:dark:!text-white [&_.react-calendar__month-view__weekdays_abbreviation]:!text-slate-400 [&_.react-calendar__month-view__weekdays_abbreviation]:!font-semibold [&_.react-calendar__month-view__weekdays_abbreviation]:!uppercase [&_.react-calendar__month-view__weekdays_abbreviation]:!text-[11px] [&_.react-calendar__tile]:!rounded-xl [&_.react-calendar__tile]:!py-4 [&_.react-calendar__tile]:hover:!bg-emerald-50 [&_.react-calendar__tile]:dark:hover:!bg-emerald-950/30 [&_.react-calendar__tile]:dark:!text-slate-300 [&_.react-calendar__tile--hasActive]:!bg-emerald-600 [&_.react-calendar__tile--hasActive]:!text-white">
            <Calendar
              onChange={(val) => setSelectedDate(val as Date)}
              value={selectedDate}
              tileContent={tileContent}
            />
          </div>
        </div>

        {/* Day Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {dayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                <Clock className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No appointments</p>
                <p className="text-xs mt-1">Click a date with a green badge</p>
              </div>
            ) : (
              dayAppointments.map((apt) => (
                <div key={apt.id} className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {apt.student_name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{apt.student_name}</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{apt.certificate_number}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[apt.status]}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-13">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{apt.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" /> New Collection Slot
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Student Name</label>
                <input type="text" placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
                  <input type="time" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Certificate Number</label>
                <input type="text" placeholder="e.g. CERT-2024-001" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
