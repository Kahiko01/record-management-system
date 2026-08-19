"use client";

import { useState } from "react";
import {
  Eye, UserCheck, Calendar, CheckCircle, PackageCheck,
  PauseCircle, History, MoreVertical, Search, SlidersHorizontal, X
} from "lucide-react";
import StudentRegistryProfile from "./StudentRegistryProfile";
import HoldExceptionModal from "./HoldExceptionModal";
import ReleaseWorkflowModal from "./ReleaseWorkflowModal";

export default function CollectionQueueTable({ initialFilter, onImportClick }: { initialFilter?: string | null; onImportClick?: () => void }) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentForRelease, setSelectedStudentForRelease] = useState<any>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showReleaseWorkflow, setShowReleaseWorkflow] = useState(false);

  // Empty queue state (no mock data)
  const [queue, setQueue] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: initialFilter === "pending" ? "Pending" : "All",
    programme: "All",
    year: "All",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "All", programme: "All", year: "All" });
  };

  const hasActiveFilters = filters.search !== "" || filters.status !== "All" || filters.programme !== "All" || filters.year !== "All";

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* Header & Filters */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-500" />
              Certificate Collection Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Main workspace for releasing certificates to cleared students.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, ADM no, or cert no..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <FilterSelect
            colSpan="md:col-span-1"
            value={filters.status}
            onChange={(v) => handleFilterChange("status", v)}
            options={["All", "Ready", "Scheduled", "Hold", "Pending"]}
            label="Status"
          />

          {/* Programme Filter */}
          <FilterSelect
            colSpan="md:col-span-1"
            value={filters.programme}
            onChange={(v) => handleFilterChange("programme", v)}
            options={["All", "ICT", "Business Admin", "Electrical", "Nursing", "Engineering"]}
            label="Programme"
          />

          {/* Year Filter */}
          <FilterSelect
            colSpan="md:col-span-1"
            value={filters.year}
            onChange={(v) => handleFilterChange("year", v)}
            options={["All", "2022", "2023", "2024"]}
            label="Year"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      <div className="overflow-x-auto">
        {queue.length === 0 ? (
          /* Empty State */
          <div className="px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <PackageCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No certificates in queue</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  When students complete their departmental clearance, they will appear here ready for certificate collection.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={onImportClick}
                  className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
                >
                  Import Cleared Students
                </button>
                <button className="px-4 py-2.5 text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Table with Data */
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Student</th>
                <th className="px-6 py-3 font-semibold">Admission No.</th>
                <th className="px-6 py-3 font-semibold">Programme</th>
                <th className="px-6 py-3 font-semibold">Certificate</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {item.studentName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {item.admissionNo}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.programme}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {item.certificateNumber}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === item.id && (
                      <div className="absolute right-6 top-10 z-20 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
                        <MenuItem icon={Eye} label="View Record" onClick={() => setSelectedStudentId(item.id)} />
                        <MenuItem icon={UserCheck} label="Verify Identity" />
                        <MenuItem icon={Calendar} label="Schedule Collection" />
                        <MenuItem icon={CheckCircle} label="Mark Ready" />
                        <MenuItem
                          icon={PackageCheck}
                          label="Release Certificate"
                          highlight
                          onClick={() => {
                            setSelectedStudentForRelease(item);
                            setShowReleaseWorkflow(true);
                          }}
                        />
                        <MenuItem icon={PauseCircle} label="Put On Hold" danger onClick={() => setShowHoldModal(true)} />
                        <MenuItem icon={History} label="View History" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <StudentRegistryProfile
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
      <HoldExceptionModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
      />
      <ReleaseWorkflowModal
        isOpen={showReleaseWorkflow}
        onClose={() => {
          setShowReleaseWorkflow(false);
          setSelectedStudentForRelease(null);
        }}
        studentData={selectedStudentForRelease}
      />
    </section>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    Ready: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Hold: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    Scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    Pending: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[status] || statusColors.Pending}`}>
      {status}
    </span>
  );
}

// Filter Select Component
function FilterSelect({ colSpan, value, onChange, options, label }: any) {
  return (
    <div className={`relative ${colSpan}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt === "All" ? `${label}: All` : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// Menu Item Component
function MenuItem({ icon: Icon, label, highlight, danger, onClick }: any) {
  let colorClass = "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";
  if (highlight) colorClass = "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-semibold";
  if (danger) colorClass = "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10";

  return (
    <button
      onClick={onClick || (() => alert(`Action: ${label}`))}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${colorClass}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
