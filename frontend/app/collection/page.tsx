"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { clearanceApi, registryApi, collectionApi } from "../lib/api";
import { RegistryInventory, ClearanceRequest } from "../types";
import { 
  CheckCircle, 
  XCircle, 
  Award, 
  User, 
  FileText,
  Calendar,
  Clock
} from "lucide-react";

export default function CertificateCollection() {
  const { user } = useAuth();
  const [clearance, setClearance] = useState<ClearanceRequest | null>(null);
  const [certificates, setCertificates] = useState<RegistryInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<RegistryInventory | null>(null);
  const [collectionMethod, setCollectionMethod] = useState<"physical" | "authorized_representative">("physical");
  const [identificationDocument, setIdentificationDocument] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionSuccess, setCollectionSuccess] = useState(false);

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

  const handleCollectCertificate = async () => {
    if (!selectedCertificate) return;

    try {
      await collectionApi.collect({
        certificate_id: selectedCertificate.id,
        student_id: clearance?.student_id || 0,
        collection_method: collectionMethod,
        identification_document: identificationDocument,
        identification_number: identificationNumber,
        recipient_name: recipientName || user?.full_name || "",
        notes: notes || undefined,
      });
      setCollectionSuccess(true);
      setTimeout(() => {
        setCollectionSuccess(false);
        setSelectedCertificate(null);
        setIdentificationDocument("");
        setIdentificationNumber("");
        setRecipientName("");
        setNotes("");
        fetchData();
      }, 3000);
    } catch (error) {
      console.error("Failed to collect certificate:", error);
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
            <h1 className="text-2xl font-bold text-gray-900">Certificate Collection</h1>
            <p className="text-sm text-gray-500">Collect your certificate from the Registry</p>
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
                  You need to complete all clearance requirements before collecting your certificate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collection Form */}
        {clearance?.collection_eligible && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">Ready for Collection!</p>
                  <p className="text-sm text-green-600">
                    Your clearance is complete. You can now collect your certificate.
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
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{cert.certificate_number}</p>
                            <p className="text-sm text-gray-600">{cert.programme}</p>
                          </div>
                          <Award className={`h-6 w-6 ${selectedCertificate?.id === cert.id ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Received: {new Date(cert.date_received).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection Form */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />
                      Collection Method
                    </label>
                    <select
                      value={collectionMethod}
                      onChange={(e) => setCollectionMethod(e.target.value as "physical" | "authorized_representative")}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="physical">Physical Collection</option>
                      <option value="authorized_representative">Authorized Representative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Identification Document
                    </label>
                    <select
                      value={identificationDocument}
                      onChange={(e) => setIdentificationDocument(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select document type</option>
                      <option value="student_id">Student ID</option>
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identification Number
                    </label>
                    <input
                      type="text"
                      value={identificationNumber}
                      onChange={(e) => setIdentificationNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter ID number"
                    />
                  </div>

                  {collectionMethod === "authorized_representative" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Representative Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name of representative"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Any additional information"
                    />
                  </div>

                  <button
                    onClick={handleCollectCertificate}
                    disabled={!selectedCertificate || !identificationDocument || !identificationNumber}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Collect Certificate
                  </button>

                  {collectionSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-sm font-medium">
                        ✅ Certificate collected successfully!
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
