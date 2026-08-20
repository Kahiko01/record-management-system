"use client";

import { useState } from "react";
import { Filter, X, Save } from "lucide-react";

interface ReportFilters {
  start_date: string;
  end_date: string;
  actions: string[];
  modules: string[];
  severities: string[];
  username: string;
}

interface Props {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onSave?: (name: string) => void;
  savedReports?: { name: string; filters: ReportFilters }[];
  onLoadReport?: (filters: ReportFilters) => void;
}

export default function ReportFilterPanel({ filters, onChange, onSave, savedReports = [], onLoadReport }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportName, setReportName] = useState("");

  const availableActions = [
    "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGIN_RATE_LIMITED",
    "PERMISSION_DENIED", "TASK_DENIED", "ROLE_DENIED", "OWNERSHIP_VIOLATION",
    "CERTIFICATE_MARKED_READY", "CERTIFICATE_COLLECTED",
    "DEAN_CLEARANCE_UPDATED", "FINANCE_CLEARANCE_UPDATED",
    "EXAM_CLEARANCE_UPDATED", "USER_CREATED", "USER_UPDATED"
  ];

  const availableModules = [
    "auth", "registry", "dean", "finance", "examination", "system"
  ];

  const availableSeverities = [
    "info", "low", "medium", "high", "critical"
  ];

  const toggleFilter = (type: keyof ReportFilters, value: string) => {
    const current = filters[type] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [type]: updated });
  };

  const clearFilters = () => {
    onChange({
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      actions: [],
      modules: [],
      severities: [],
      username: ""
    });
  };

  const handleSave = () => {
    if (reportName && onSave) {
      onSave(reportName);
      setReportName("");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-slate-400" />
          <span className="font-semibold">Custom Filters</span>
          {(filters.actions.length > 0 || filters.modules.length > 0 || filters.severities.length > 0 || filters.username) && (
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-800">
          
          {/* Date Range */}
          <div className="pt-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Date Range
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => onChange({ ...filters, start_date: e.target.value })}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm flex-1"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => onChange({ ...filters, end_date: e.target.value })}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm flex-1"
              />
            </div>
          </div>

          {/* Action Types */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Action Types
            </label>
            <div className="flex flex-wrap gap-2">
              {availableActions.map(action => (
                <button
                  key={action}
                  onClick={() => toggleFilter("actions", action)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.actions.includes(action)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Modules
            </label>
            <div className="flex flex-wrap gap-2">
              {availableModules.map(module => (
                <button
                  key={module}
                  onClick={() => toggleFilter("modules", module)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.modules.includes(module)
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {module}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Severity Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSeverities.map(severity => (
                <button
                  key={severity}
                  onClick={() => toggleFilter("severities", severity)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.severities.includes(severity)
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {severity.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Specific User
            </label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => onChange({ ...filters, username: e.target.value })}
              placeholder="Enter username..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
            
            {onSave && (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
                <button
                  onClick={handleSave}
                  disabled={!reportName}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Saved Reports */}
          {savedReports.length > 0 && onLoadReport && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Saved Reports
              </label>
              <div className="flex flex-wrap gap-2">
                {savedReports.map((report, idx) => (
                  <button
                    key={idx}
                    onClick={() => onLoadReport(report.filters)}
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-950/50 transition-colors"
                  >
                    {report.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
