"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Calendar, Clock, AlertCircle, FileText, User, GraduationCap, Building2, BookOpen, Shield, Home, UserCheck, MessageSquare } from "lucide-react";

export default function ConfirmAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  useEffect(() => {
    validateLink();
  }, [token]);

  const validateLink = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/appointments/validate/${token}`);
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setValid(true);
        setAppointmentData(data);
        setAppointmentDate(data.appointment_date || "");
        setAppointmentTime(data.appointment_time || "");
      } else {
        setError(data.detail || "Invalid or expired link");
      }
    } catch (err) {
      setError("Failed to validate appointment link");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointmentDate || !appointmentTime) {
      alert("Please select both date and time");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/appointments/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setConfirmed(true);
        setConfirmationCode(data.confirmation_code);
      } else {
        setError(data.detail || "Failed to confirm appointment");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating appointment link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Invalid Link</h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <p className="text-sm text-gray-500 text-center">
            Please contact the Registry office if you need a new appointment link.
          </p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Appointment Confirmed!</h1>
          <p className="text-gray-600 text-center mb-6">
            Your appointment has been successfully confirmed.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Confirmation Code:</p>
            <p className="text-2xl font-bold text-green-700 font-mono">{confirmationCode}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Certificate</p>
                <p className="font-semibold text-gray-900">{appointmentData.certificate_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">{appointmentDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold text-gray-900">{appointmentTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please bring your National ID and student card when you come to collect your certificate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Appointment</h1>
            <p className="text-gray-600">Please review and confirm your certificate collection appointment</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <User className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-600">Student Name</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{appointmentData.student_name}</p>
              <p className="text-sm text-gray-600">{appointmentData.admission_number}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-600">Certificate</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{appointmentData.certificate_number}</p>
              <p className="text-sm text-gray-600">{appointmentData.certificate_type}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-gray-600">Programme</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{appointmentData.programme}</p>
            </div>
          </div>

          {/* Professional Clearance Status Report */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Official Clearance Status Report
            </h3>
            
            <div className="space-y-4">
              {appointmentData.clearance_status?.map((item: any, idx: number) => {
                const isCleared = item.status === 'cleared';
                const getIcon = () => {
                  switch(item.department) {
                    case 'Finance': return <Building2 className="h-5 w-5" />;
                    case 'Library': return <BookOpen className="h-5 w-5" />;
                    case 'Examinations': return <GraduationCap className="h-5 w-5" />;
                    case 'Discipline': return <Shield className="h-5 w-5" />;
                    case 'Accommodation': return <Home className="h-5 w-5" />;
                    case 'Dean of Students': return <UserCheck className="h-5 w-5" />;
                    default: return <FileText className="h-5 w-5" />;
                  }
                };

                return (
                  <div key={idx} className={`rounded-xl border p-4 transition-all ${
                    isCleared 
                      ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCleared ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {getIcon()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.department}</h4>
                          {item.department === 'Finance' && (
                            <p className={`text-sm font-medium ${item.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              Balance: KES {Number(item.balance || 0).toLocaleString('en-KE', {minimumFractionDigits: 2})}
                            </p>
                          )}
                        </div>
                      </div>
                      {isCleared ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" /> CLEARED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <XCircle className="h-3.5 w-3.5" /> PENDING
                        </span>
                      )}
                    </div>
                    
                    {item.comment && (
                      <div className="mt-3 pl-11">
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          <p className="italic">"{item.comment}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!appointmentData.overall_cleared && (
              <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Action Required</p>
                  <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                    Please resolve all pending clearances and outstanding balances before your scheduled appointment.
                  </p>
                </div>
              </div>
            )}
          </div>

          {appointmentData.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note from Registry:</strong> {appointmentData.notes}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Appointment Date & Time</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" /> Appointment Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" /> Appointment Time
              </label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={confirming || !appointmentDate || !appointmentTime}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? "Confirming..." : "Confirm Appointment"}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This link expires on {new Date(appointmentData.expires_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
