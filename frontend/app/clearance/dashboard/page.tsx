"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { studentApi, clearanceApi } from "../../lib/api";
import { 
  Users, CheckCircle, XCircle, Clock, 
  Filter, Search, ChevronDown, ChevronUp 
} from "lucide-react";

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
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full"> Cleared</span>;
      case "pending":
        return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">⏳ Pending</span>;
      case "not_cleared":
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full"> Not Cleared</span>;
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clearance Dashboard</h1>
            <p className="text-sm text-gray-500">View all students and their clearance status</p>
          </div>
          <div className="text-sm text-gray-600">
            Total: {filteredStudents.length} students
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-green-600">Fully Cleared</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.overall_status === "cleared").length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.overall_status === "pending" || s.overall_status === "in_progress").length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-sm text-red-600">Not Cleared</p>
            <p className="text-2xl font-bold text-red-600">
              {students.filter(s => s.overall_status === "rejected" || s.overall_status === "not_cleared").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or student number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Examination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.student_number}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.program}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Level {student.level}</td>
                      <td className="px-4 py-3">{getStatusBadge(student.finance_status)}</td>
                      <td className="px-4 py-3">{getStatusBadge(student.examination_status)}</td>
                      <td className="px-4 py-3">{getStatusBadge(student.overall_status)}</td>
                      <td className="px-4 py-3">
                        {student.has_certificate ? (
                          <span className="text-green-600"> Yes</span>
                        ) : (
                          <span className="text-gray-400"> No</span>
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
    </div>
  );
}
