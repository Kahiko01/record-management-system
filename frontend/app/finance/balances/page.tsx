"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { feeApi } from "../../lib/api";
import { DollarSign, Search, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Download, FileText, Clock, XCircle } from "lucide-react";

interface FeeBalance {
  student_id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  program: string;
  year_of_study: number;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  finance_status: string;
  overall_status: string;
}

interface FeeSummary {
  total_due: number;
  total_paid: number;
  total_outstanding: number;
  uncleared_outstanding: number;
  cleared_count: number;
  pending_count: number;
  not_cleared_count: number;
  total_students_with_requests: number;
}

export default function FeeBalancesPage() {
  const { user, isFinance, isAdmin, isAuditor } = useAuth();
  const [balances, setBalances] = useState<FeeBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<FeeBalance[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", course: "", level: "", status: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balancesRes, summaryRes] = await Promise.all([
        feeApi.getBalances(),
        feeApi.getSummary().catch(() => null)
      ]);
      setBalances(balancesRes.data || []);
      setFilteredBalances(balancesRes.data || []);
      if (summaryRes) setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to fetch fee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...balances];
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.first_name.toLowerCase().includes(search) ||
        b.last_name.toLowerCase().includes(search) ||
        b.student_number.toLowerCase().includes(search)
      );
    }
    if (filters.course) {
      filtered = filtered.filter(b => b.program.toLowerCase().includes(filters.course.toLowerCase()));
    }
    if (filters.level) {
      filtered = filtered.filter(b => b.year_of_study === parseInt(filters.level));
    }
    if (filters.status) {
      filtered = filtered.filter(b => b.finance_status === filters.status);
    }
    setFilteredBalances(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, balances]);

  // Calculate combined totals for filtered results
  const filteredTotals = filteredBalances.reduce((acc, b) => ({
    due: acc.due + (b.amount_due || 0),
    paid: acc.paid + (b.amount_paid || 0),
    outstanding: acc.outstanding + (b.outstanding_balance || 0),
  }), { due: 0, paid: 0, outstanding: 0 });

  // Status counts for filtered results
  const statusCounts = {
    cleared: filteredBalances.filter(b => b.finance_status === "cleared").length,
    pending: filteredBalances.filter(b => b.finance_status === "pending").length,
    not_cleared: filteredBalances.filter(b => b.finance_status === "not_cleared").length,
    no_request: filteredBalances.filter(b => b.finance_status === "no_request").length,
  };

  // Download CSV Report
  const downloadReport = () => {
    const headers = ["Student Number", "First Name", "Last Name", "Program", "Year", "Amount Due", "Amount Paid", "Outstanding Balance", "Finance Status", "Overall Status"];
    const rows = filteredBalances.map(b => [
      b.student_number, b.first_name, b.last_name, b.program, b.year_of_study,
      b.amount_due, b.amount_paid, b.outstanding_balance, b.finance_status, b.overall_status
    ]);
    
    // Add totals row
    rows.push(["TOTALS", "", "", "", "", filteredTotals.due, filteredTotals.paid, filteredTotals.outstanding, "", ""]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fee_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "not_cleared": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const canViewFullReports = isFinance() || isAdmin() || isAuditor();

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
                <DollarSign className="h-6 w-6 text-green-600" />
                Fee Balances & Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Complete view of student fee balances across all circumstances</p>
            </div>
            <div className="flex gap-3">
              {canViewFullReports && (
                <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Download className="h-4 w-4" /> Download Report
                </button>
              )}
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Summary Cards - Only for Finance, Super Admin, and Auditor */}
          {canViewFullReports && summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount Due</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.total_due)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="h-6 w-6 text-blue-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_paid)}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Outstanding</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_outstanding)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Uncleared Certificates Balance</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(summary.uncleared_outstanding)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg"><TrendingUp className="h-6 w-6 text-red-700" /></div>
                  </div>
                </div>
              </div>

              {/* Status Report Cards */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Complete Circumstances Report
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700">Cleared Students</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{summary.cleared_count}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-700">Pending Students</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{summary.pending_count}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <p className="text-sm font-medium text-red-700">Not Cleared Students</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{summary.not_cleared_count}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">Total Requests</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{summary.total_students_with_requests}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search Name / ADM No</label>
                <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="e.g. John or ADM/123" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Course / Program</label>
                <input type="text" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} placeholder="e.g. Computer Science" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">All</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                  <option value="6">Level 6</option>
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-gray-700 mb-1">Fee Status</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">All Status</option>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                  <option value="not_cleared">Not Cleared</option>
                  <option value="no_request">No Request</option>
                </select>
              </div>
              <button onClick={() => { setFilters({ search: "", course: "", level: "", status: "" }); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Clear</button>
            </div>
          </div>

          {/* Filtered Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <p className="text-xs text-gray-500">Cleared</p>
              <p className="text-xl font-bold text-green-600">{statusCounts.cleared}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <p className="text-xs text-gray-500">Not Cleared</p>
              <p className="text-xl font-bold text-red-600">{statusCounts.not_cleared}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
              <p className="text-xs text-gray-500">No Request</p>
              <p className="text-xl font-bold text-gray-600">{statusCounts.no_request}</p>
            </div>
          </div>

          {/* Fee Balances Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finance Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        No fee records found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredBalances.map((balance) => (
                      <tr key={balance.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {balance.first_name} {balance.last_name}
                          <br />
                          <span className="text-xs text-gray-500">{balance.student_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {balance.program}
                          <br />
                          <span className="text-xs text-gray-500">Year {balance.year_of_study}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{formatCurrency(balance.amount_due)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(balance.amount_paid)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-red-600">{formatCurrency(balance.outstanding_balance)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(balance.finance_status)}`}>
                            {balance.finance_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(balance.overall_status)}`}>
                            {balance.overall_status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Combined Totals Footer */}
                {filteredBalances.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan={2}>
                        COMBINED TOTALS ({filteredBalances.length} students)
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700">{formatCurrency(filteredTotals.due)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">{formatCurrency(filteredTotals.paid)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-700">{formatCurrency(filteredTotals.outstanding)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
