"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

export default function FinanceDepartment() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/clearance/workflow/department/finance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (studentId: number, action: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/clearance/finance/${studentId}`,
        { status: action === "approve" ? "cleared" : "not_cleared", remarks: action === "approve" ? "Cleared by Finance" : "Not cleared by Finance" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPending();
    } catch (error) {
      console.error("Failed to update:", error);
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
            <h1 className="text-2xl font-bold text-gray-900">💰 Finance Department</h1>
            <p className="text-sm text-gray-500">Review and approve student clearance requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              {students.length} Pending
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              👤 {user?.full_name}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {students.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">No pending finance clearances</p>
              <p className="text-sm text-gray-400">All students have been cleared</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.student_number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.program}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Level {student.level}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                        ⏳ Pending
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAction(student.student_id, "approve")}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm mr-2"
                      >
                         Approve
                      </button>
                      <button
                        onClick={() => handleAction(student.student_id, "reject")}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                         Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
