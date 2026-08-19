"use client";

import { useState } from "react";
import { 
  X, CalendarClock, User, Clock, CheckCircle2, Search, ChevronDown 
} from "lucide-react";

interface ScheduleCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock list of cleared students ready for scheduling
const clearedStudents = [
  { id: 1, name: "John Kamau", admissionNo: "KNP/2022/001", programme: "ICT" },
  { id: 2, name: "Mary Wanjiku", admissionNo: "KNP/2021/043", programme: "Business Admin" },
  { id: 3, name: "Peter Mwangi", admissionNo: "KNP/2022/087", programme: "Electrical" },
  { id: 4, name: "Jane Njeri", admissionNo: "KNP/2022/101", programme: "Nursing" },
  { id: 5, name: "David Ochieng", admissionNo: "KNP/2020/012", programme: "Engineering" },
];

export default function ScheduleCollectionModal({ isOpen, onClose }: ScheduleCollectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter students based on search
  const filteredStudents = clearedStudents.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowDropdown(false);
  };

  const handleSchedule = () => {
    if (!selectedStudent || !date || !time) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert(`Appointment scheduled for ${selectedStudent.name} (${selectedStudent.admissionNo}) on ${date} at ${time}`);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Collection Appointment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Book a time slot for certificate pickup.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Student Selection with Search */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      if (!e.target.value) setSelectedStudent(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name or admission number..."
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Dropdown List */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                      No students found
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{student.admissionNo}</p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {student.programme}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Student Display */}
          {selectedStudent && (
            <div className="border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-500/5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedStudent.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedStudent.admissionNo} • {selectedStudent.programme}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The student will receive an email/SMS notification with their appointment details.
            </p>
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
            onClick={handleSchedule}
            disabled={!selectedStudent || !date || !time || isSubmitting}
            className="px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarClock className="h-4 w-4" /> Schedule Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
