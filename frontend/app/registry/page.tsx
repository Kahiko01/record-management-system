"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, FileText, Printer, CheckCircle, Clock, GraduationCap, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegistryDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, printed: 0, pending: 0, collected: 0 });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";

  // 🔐 ZERO TRUST: Enforce role-based access
  useEffect(() => {
    const allowedRoles = ["admin", "super_admin", "super admin", "registry_officer", "dean"];
    if (user && !allowedRoles.includes(user.role)) {
      alert("🚫 Access Denied: You do not have Zero Trust clearance for the Registry.");
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token) return;

    // Fetch stats
    fetch("http://127.0.0.1:8000/certificates/stats", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats error:", err));

    // Fetch certificates
    fetch("http://127.0.0.1:8000/certificates", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCertificates(Array.isArray(data) ? data : (data.items || [])))
      .catch(err => console.error("List error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredCerts = certificates.filter((cert: any) => 
    (cert.student_name || cert.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === "" || cert.status === statusFilter)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> Certificate Registry
        </h1>
        <p className="text-gray-500 mt-1">Manage and track student certificates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <FileText className="text-blue-500 w-10 h-10 bg-blue-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Printed</p>
              <p className="text-2xl font-bold text-green-600">{stats.printed}</p>
            </div>
            <Printer className="text-green-500 w-10 h-10 bg-green-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-500 w-10 h-10 bg-yellow-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-2xl font-bold text-purple-600">{stats.collected}</p>
            </div>
            <CheckCircle className="text-purple-500 w-10 h-10 bg-purple-50 p-2 rounded-lg" />
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
              placeholder="Search by student name or admission number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="Pending">Pending</option>
              <option value="Printed">Printed</option>
              <option value="Collected">Collected</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading certificates...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Issued</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCerts.length > 0 ? (
                filteredCerts.map((cert: any, index: number) => (
                  <tr key={cert.id || index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cert.student_name || cert.full_name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{cert.admission_number || cert.student_id || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.programme || cert.program || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.type || "Diploma"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${cert.status === 'Collected' ? 'bg-green-100 text-green-800' : 
                          cert.status === 'Printed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {cert.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.date_issued || cert.created_at?.split('T')[0] || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 font-medium">View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No certificates found. Try adjusting your search or filters.
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
