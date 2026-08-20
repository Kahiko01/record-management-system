"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { studentApi, clearanceApi } from "../../lib/api";
import {
  Users, CheckCircle, XCircle, Clock,
  Filter, Search, ChevronDown, ChevronUp
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";

interface StudentWithStatus {
  student_id: number;
  student_number: string;
  name: string;
  program: string;
  level: number;
  finance_status: string;
  examination_status: string;
  overall_status: string;
  has_certificate: boolean;
}

export default function ClearanceDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      // Get all students
      const response = await studentApi.getAll({ limit: 1000 });
      const studentsData = response.data || [];

      // Get clearance status for each student
      const studentsWithStatus = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const clearanceRes = await clearanceApi.getMyStatus();
            // This won't work for admin, we need a different approach
            return {
              student_id: student.id,
              student_number: student.student_id,
              name: `${student.first_name} ${student.last_name}`,
              program: student.program,
              level: student.year_of_study,
              finance_status: "pending",
              examination_status: "pending",
              overall_status: "pending",
              has_certificate: false
            };
          } catch (e) {
            return {
              student_id: student.id,
              student_number: student.student_id,
              name: `${student.first_name} ${student.last_name}`,
              program: student.program,
              level: student.year_of_study,
              finance_status: "pending",
              examination_status: "pending",
              overall_status: "pending",
              has_certificate: false
            };
          }
        })
      );

      setStudents(studentsWithStatus);
      setFilteredStudents(studentsWithStatus);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cleared":
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">✅ Cleared</span>;
      case "pending":
        return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">⏳ Pending</span>;
      case "not_cleared":
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">❌ Not Cleared</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clearance Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">View all students and their clearance status</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Total: {filteredStudents.length} students
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg shadow-sm border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm text-green-600 dark:text-green-400">Fully Cleared</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {students.filter(s => s.overall_status === "cleared").length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800 p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {students.filter(s => s.overall_status === "pending" || s.overall_status === "in_progress").length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">Not Cleared</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {students.filter(s => s.overall_status === "rejected" || s.overall_status === "not_cleared").length}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by name or student number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="in_progress">In Progress</option>
                </select>

                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                  <option value="6">Level 6</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Program</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Finance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Examination</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Overall</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{student.student_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{student.program}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">Level {student.level}</td>
                          <td className="px-4 py-3">{getStatusBadge(student.finance_status)}</td>
                          <td className="px-4 py-3">{getStatusBadge(student.examination_status)}</td>
                          <td className="px-4 py-3">{getStatusBadge(student.overall_status)}</td>
                          <td className="px-4 py-3">
                            {student.has_certificate ? (
                              <span className="text-green-600 dark:text-green-400">✅ Yes</span>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500">❌ No</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
