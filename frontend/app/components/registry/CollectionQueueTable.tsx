"use client";

import { useState } from "react";
import { 
  Eye, UserCheck, Calendar, CheckCircle, PackageCheck, 
  PauseCircle, History, MoreVertical, Search, SlidersHorizontal, ChevronDown, X 
} from "lucide-react";
import StudentRegistryProfile from "./StudentRegistryProfile";
import HoldExceptionModal from "./HoldExceptionModal";

// Enhanced Mock Data for Filtering
const mockQueue = [
  {
    id: 1,
    studentName: "John Kamau",
    admissionNo: "KNP/2022/001",
    programme: "ICT",
    graduationYear: "2024",
    clearance: "Complete",
    certificate: "CERT-2024-001",
    appointment: "Today 10:30",
    status: "Ready",
    collectionStatus: "Awaiting Collection",
  },
  {
    id: 2,
    studentName: "Mary Wanjiku",
    admissionNo: "KNP/2021/043",
    programme: "Business Admin",
    graduationYear: "2023",
    clearance: "Complete",
    certificate: "CERT-2023-089",
    appointment: "Today 11:00",
    status: "Ready",
    collectionStatus: "Awaiting Collection",
  },
  {
    id: 3,
    studentName: "Peter Mwangi",
    admissionNo: "KNP/2022/087",
    programme: "Electrical",
    graduationYear: "2024",
    clearance: "Complete",
    certificate: "CERT-2024-012",
    appointment: "None",
    status: "Hold",
    collectionStatus: "Blocked",
  },
  {
    id: 4,
    studentName: "Jane Njeri",
    admissionNo: "KNP/2022/101",
    programme: "Nursing",
    graduationYear: "2024",
    clearance: "Complete",
    certificate: "CERT-2024-045",
    appointment: "Tomorrow 09:00",
    status: "Scheduled",
    collectionStatus: "Scheduled",
  },
];

const statusColors: Record<string, string> = {
  Ready: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Hold: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  Scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Pending: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
};

export default function CollectionQueueTable() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  
  // Advanced Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    programme: "All",
    year: "All",
    collection: "All",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "All", programme: "All", year: "All", collection: "All" });
  };

  // Powerful Filtering Logic
  const filteredQueue = mockQueue.filter((item) => {
    // 1. Search Text (Name, ADM No, Cert No)
    const searchMatch = 
      item.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.admissionNo.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.certificate.toLowerCase().includes(filters.search.toLowerCase());

    // 2. Dropdown Filters
    const statusMatch = filters.status === "All" || item.status === filters.status;
    const programmeMatch = filters.programme === "All" || item.programme === filters.programme;
    const yearMatch = filters.year === "All" || item.graduationYear === filters.year;
    const collectionMatch = filters.collection === "All" || item.collectionStatus === filters.collection;

    return searchMatch && statusMatch && programmeMatch && yearMatch && collectionMatch;
  });

  const hasActiveFilters = filters.search !== "" || filters.status !== "All" || filters.programme !== "All" || filters.year !== "All" || filters.collection !== "All";

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header & Advanced Filters */}
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
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
            colSpan="md:col-span-2"
            value={filters.status} 
            onChange={(v) => handleFilterChange("status", v)} 
            options={["All", "Ready", "Scheduled", "Hold", "Pending"]} 
            label="Status" 
          />

          {/* Programme Filter */}
          <FilterSelect 
            colSpan="md:col-span-2"
            value={filters.programme} 
            onChange={(v) => handleFilterChange("programme", v)} 
            options={["All", "ICT", "Business Admin", "Electrical", "Nursing", "Engineering"]} 
            label="Programme" 
          />

          {/* Year Filter */}
          <FilterSelect 
            colSpan="md:col-span-2"
            value={filters.year} 
            onChange={(v) => handleFilterChange("year", v)} 
            options={["All", "2022", "2023", "2024"]} 
            label="Year" 
          />

          {/* Collection Status Filter */}
          <FilterSelect 
            colSpan="md:col-span-2"
            value={filters.collection} 
            onChange={(v) => handleFilterChange("collection", v)} 
            options={["All", "Awaiting Collection", "Scheduled", "Blocked", "Collected"]} 
            label="Collection" 
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            <tr>
              <th className="px-6 py-3 font-semibold">Student</th>
              <th className="px-6 py-3 font-semibold">Admission No.</th>
              <th className="px-6 py-3 font-semibold">Programme</th>
              <th className="px-6 py-3 font-semibold">Year</th>
              <th className="px-6 py-3 font-semibold">Certificate</th>
              <th className="px-6 py-3 font-semibold">Appointment</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <SlidersHorizontal className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium">No students match your advanced filters.</p>
                    <button onClick={clearFilters} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline mt-1">
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredQueue.map((item) => (
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
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.graduationYear}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {item.certificate}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {item.appointment}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[item.status] || statusColors.Pending}`}>
                      {item.status}
                    </span>
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
                        <MenuItem icon={PackageCheck} label="Release Certificate" highlight />
                        <MenuItem icon={PauseCircle} label="Put On Hold" danger onClick={() => setShowHoldModal(true)} />
                        <MenuItem icon={History} label="View History" />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </section>
  );
}

// Helper: Custom Dropdown Select
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
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

// Helper: Dropdown Menu Item
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
