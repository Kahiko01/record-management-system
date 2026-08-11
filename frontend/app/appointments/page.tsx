"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clearanceApi, registryApi, appointmentApi } from "../lib/api";
import { RegistryInventory, ClearanceRequest } from "../types";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

export default function AppointmentBooking() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<RegistryInventory[]>([]);
  const [clearance, setClearance] = useState<ClearanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<RegistryInventory | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [location, setLocation] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get clearance status
      try {
        const clearanceRes = await clearanceApi.getMyStatus();
        setClearance(clearanceRes.data);
      } catch (e) {
        setClearance(null);
      }

      // Get available certificates
      const certsRes = await registryApi.getCertificates();
      const available = certsRes.data.filter((c: RegistryInventory) => 
        c.status === "ready_for_collection"
      );
      setCertificates(available);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedCertificate || !appointmentDate || !appointmentTime) return;

    try {
      await appointmentApi.create({
        student_id: clearance?.student_id || 0,
        certificate_id: selectedCertificate.id,
        appointment_date: new Date(appointmentDate).toISOString(),
        appointment_time: appointmentTime,
        location: location || undefined,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedCertificate(null);
        setAppointmentDate("");
        setAppointmentTime("");
        setLocation("");
      }, 3000);
    } catch (error) {
      console.error("Failed to book appointment:", error);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Collection Appointment</h1>
            <p className="text-sm text-gray-500">Schedule your certificate collection</p>
          </div>
        </div>

        {/* Eligibility Check */}
        {!clearance?.collection_eligible && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">Not Eligible for Collection</p>
                <p className="text-sm text-red-600">
                  You need to complete all clearance requirements before booking a collection appointment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Certificates */}
        {clearance?.collection_eligible && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">You are eligible for collection!</p>
                  <p className="text-sm text-green-600">
                    Select a certificate below to book your appointment.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificate Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Certificate</h2>
                {certificates.length === 0 ? (
                  <p className="text-gray-500 text-sm">No certificates available for collection</p>
                ) : (
                  <div className="space-y-3">
                    {certificates.map((cert) => (
                      <button
                        key={cert.id}
                        onClick={() => setSelectedCertificate(cert)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          selectedCertificate?.id === cert.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium text-gray-900">{cert.certificate_number}</p>
                        <p className="text-sm text-gray-600">{cert.programme}</p>
                        <p className="text-xs text-gray-500">Received: {new Date(cert.date_received).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Time
                    </label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Registry Office, Room 101"
                    />
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedCertificate || !appointmentDate || !appointmentTime}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Book Appointment
                  </button>

                  {bookingSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-sm font-medium">
                         Appointment booked successfully!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
