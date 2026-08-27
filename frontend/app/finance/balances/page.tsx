"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FinanceBalances() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // 🔐 ZERO TRUST: Enforce role-based access
  useEffect(() => {
    const allowedRoles = ["admin", "super_admin", "super admin", "finance_officer", "finance"];
    if (user && !allowedRoles.includes(user.role)) {
      alert("🚫 Access Denied: You do not have Zero Trust clearance for Finance.");
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);

    fetch(`http://127.0.0.1:8000/students/fee-balances?${params.toString()}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStudents(data.items || []))
      .catch(err => console.error("Error fetching balances:", err))
      .finally(() => setLoading(false));
  }, [token, search, statusFilter]);

  const totalArrears = students.reduce((sum, s) => sum + (s.status === "ARREARS" ? s.balance : 0), 0);
  const totalCleared = students.filter(s => s.status === "CLEARED").length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="text-green-600" /> Fee Balances & Clearance
        </h1>
        <p className="text-gray-500 mt-1">Monitor student fee payments and clearance status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students Viewed</p>
              <p className="text-2xl font-bold text-gray-800">{students.length}</p>
            </div>
            <TrendingUp className="text-blue-500 w-10 h-10 bg-blue-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Arrears (KES)</p>
              <p className="text-2xl font-bold text-red-600">{totalArrears.toLocaleString()}</p>
            </div>
            <AlertTriangle className="text-red-500 w-10 h-10 bg-red-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fully Cleared</p>
              <p className="text-2xl font-bold text-green-600">{totalCleared}</p>
            </div>
            <CheckCircle className="text-green-500 w-10 h-10 bg-green-50 p-2 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by admission number or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none outline-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ARREARS">In Arrears</option>
              <option value="CLEARED">Cleared</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading fee balances...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Fee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length > 0 ? (
                students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.admission_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.first_name} {s.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.program} (Yr {s.year_of_study})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{s.total_fee.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">{s.paid_fee.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-bold">{s.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        s.status === "CLEARED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
