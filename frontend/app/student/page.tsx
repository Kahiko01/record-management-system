"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clearanceApi, studentApi, notificationApi } from "../lib/api";
import { ClearanceRequest, NotificationResponse, Student } from "../types";
import {
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Calendar,
  Award,
  CreditCard,
  BookOpen,
  GraduationCap,
  User
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [clearance, setClearance] = useState<ClearanceRequest | null>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      // Get student profile
      const studentRes = await studentApi.getAll({ search: user?.email || "" });
      const studentData = studentRes.data[0];
      setStudent(studentData);

      if (studentData) {
        // Get clearance status
        try {
          const clearanceRes = await clearanceApi.getMyStatus();
          setClearance(clearanceRes.data);
        } catch (e: any) {
          if (e.response?.status === 403) {
            console.log("User is not a student");
          }
          setClearance(null);
        }

        // Get notifications
        const notifRes = await notificationApi.getMyNotifications();
        setNotifications(notifRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch student data:", error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared":
        return "border-green-500 bg-green-50";
      case "pending":
        return "border-yellow-500 bg-yellow-50";
      case "not_cleared":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-500 bg-gray-50";
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-white/90">Welcome, {student?.first_name} {student?.last_name}</p>
              <p className="text-white/80 text-sm">Student ID: {student?.student_id}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-4 py-2 rounded-lg text-center">
                <p className="text-xs text-white/80">Clearance Status</p>
                <p className="font-bold">
                  {clearance?.overall_status === "cleared" ? "✅ Cleared" :
                   clearance?.overall_status === "pending" ? "⏳ Pending" :
                   clearance?.overall_status === "rejected" ? "❌ Rejected" :
                   "📝 Not Applied"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Clearance Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clearance Status Cards */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Clearance Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Finance Status */}
                <div className={`border-2 rounded-lg p-4 ${getStatusColor(clearance?.finance_clearance?.status || "pending")}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Finance</p>
                      <p className="text-lg font-bold">
                        {getStatusBadge(clearance?.finance_clearance?.status || "pending")}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  {clearance?.finance_clearance?.remarks && (
                    <p className="text-xs text-gray-500 mt-2">{clearance.finance_clearance.remarks}</p>
                  )}
                </div>

                {/* Examination Status */}
                <div className={`border-2 rounded-lg p-4 ${getStatusColor(clearance?.examination_clearance?.status || "pending")}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Examination</p>
                      <p className="text-lg font-bold">
                        {getStatusBadge(clearance?.examination_clearance?.status || "pending")}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  {clearance?.examination_clearance?.remarks && (
                    <p className="text-xs text-gray-500 mt-2">{clearance.examination_clearance.remarks}</p>
                  )}
                </div>

                {/* Overall Status */}
                <div className="md:col-span-2 border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overall Clearance</p>
                      <p className="text-lg font-bold">
                        {clearance?.overall_status === "cleared" ? (
                          <span className="text-green-600">✅ Fully Cleared</span>
                        ) : clearance?.overall_status === "rejected" ? (
                          <span className="text-red-600">❌ Not Cleared</span>
                        ) : clearance?.overall_status === "in_progress" ? (
                          <span className="text-yellow-600">⏳ In Progress</span>
                        ) : (
                          <span className="text-gray-500">📝 Not Started</span>
                        )}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-gray-400" />
                  </div>
                  {clearance?.collection_eligible && (
                    <p className="text-green-600 text-sm font-medium mt-2">
                      🎯 Eligible for certificate collection!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Request Clearance Button */}
            {!clearance && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-gray-600 mb-4">You haven't applied for clearance yet</p>
                <button
                  onClick={async () => {
                    if (student) {
                      try {
                        await clearanceApi.requestClearance(student.id);
                        fetchStudentData();
                      } catch (error) {
                        console.error("Failed to request clearance:", error);
                      }
                    }
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply for Clearance
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Notifications & Actions */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-3 rounded-lg border ${notif.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
                  <Calendar className="h-4 w-4" />
                  Book Collection Appointment
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm">
                  <Award className="h-4 w-4" />
                  View Certificates
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm">
                  <User className="h-4 w-4" />
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
