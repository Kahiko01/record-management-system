"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Check, Download, Trash2 } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface AdvancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onBulkAction?: (selectedIds: any[], action: string) => void;
  bulkActions?: { label: string; value: string; icon?: any; color?: string }[];
  emptyMessage?: string;
  className?: string;
}

export default function AdvancedTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onBulkAction,
  bulkActions = [],
  emptyMessage = "No data found",
  className = "",
}: AdvancedTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key as keyof T];
    const bVal = b[sortConfig.key as keyof T];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item[keyField])));
    }
  };

  const toggleSelect = (id: any) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected = selectedIds.size === data.length && data.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && onBulkAction && (
        <div className="flex items-center justify-between px-6 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/50 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.value}
                onClick={() => {
                  onBulkAction(Array.from(selectedIds), action.value);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  action.color === "rose"
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {action.icon && <action.icon className="h-3 w-3" />}
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {onBulkAction && (
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className={`px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.sortable ? "cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key as string)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onBulkAction ? 1 : 0)} className="px-6 py-16 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              sortedData.map((item) => {
                const id = item[keyField];
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={`transition-colors ${isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                  >
                    {onBulkAction && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key as string} className="px-6 py-4 text-sm">
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
