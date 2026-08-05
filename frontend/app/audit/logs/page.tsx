"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { auditApi } from "../../lib/api";
import { Shield, Clock, User, FileText, Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  details: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getLogs();
      setLogs(response.data || []);
      setFilteredLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.details.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.entity_type.toLowerCase().includes(search)
      );
    }
    
    if (departmentFilter) {
      filtered = filtered.filter(log => log.entity_type === departmentFilter);
    }
    
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, departmentFilter, logs]);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: string) => {
    if (action.includes("UPDATED") || action.includes("APPROVED")) return "bg-green-100 text-green-700";
    if (action.includes("REJECTED") || action.includes("NOT_CLEARED")) return "bg-red-100 text-red-700";
    if (action.includes("REQUESTED")) return "bg-yellow-100 text-yellow-700";
    if (action.includes("COLLECTED")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case "finance": return "bg-yellow-100 text-yellow-700";
      case "examination": return "bg-blue-100 text-blue-700";
      case "dean": return "bg-purple-100 text-purple-700";
      case "registry": return "bg-green-100 text-green-700";
      case "student": return "bg-indigo-100 text-indigo-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Audit Logs & Clearance History
              </h1>
              <p className="text-sm text-gray-500 mt-1">View all actions, remarks, and checklists submitted by departments</p>
            </div>
            <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search Logs</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by remarks, action, or details..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="finance">Finance</option>
                  <option value="examination">Examinations</option>
                  <option value="dean">Dean</option>
                  <option value="registry">Registry</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <button
                onClick={() => { setSearchTerm(""); setDepartmentFilter(""); }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Total Log Entries</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Filtered Results</p>
              <p className="text-2xl font-bold text-blue-600">{filteredLogs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">Departments Tracked</p>
              <p className="text-2xl font-bold text-green-600">5</p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details / Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expand</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isExpanded = expandedRows.has(log.id);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${getDepartmentColor(log.entity_type)}`}>
                              {log.entity_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {isExpanded ? (
                              <div className="whitespace-pre-wrap">{log.details}</div>
                            ) : (
                              <div className="truncate max-w-md">{log.details}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleRow(log.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
