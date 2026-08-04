"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { clearanceApi, feeApi } from "../../lib/api";
import { DollarSign, Upload, Download, Search, RefreshCw, CheckCircle, AlertTriangle, X, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface FeeRecord {
  student_id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  program: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  finance_status: string;
}

export default function FinancePaymentsPage() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{updated: number, created: number, errors: string[]} | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await feeApi.getBalances();
      setRecords(res.data || []);
      setFilteredRecords(res.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let filtered = [...records];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.first_name.toLowerCase().includes(s) || r.last_name.toLowerCase().includes(s) ||
        r.student_number.toLowerCase().includes(s)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(r => r.finance_status === statusFilter);
    }
    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, records]);

  // === PAYMENT UPLOAD LOGIC ===
  const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const paymentData = json.map((row: any) => ({
          student_id: String(row['ADM No'] || row['Student ID'] || row['student_id'] || ""),
          amount_due: parseFloat(row['Amount Due'] || row['Total Fees'] || row['amount_due'] || 0),
          amount_paid: parseFloat(row['Amount Paid'] || row['Paid'] || row['amount_paid'] || 0)
        })).filter(item => item.student_id !== "");

        if (paymentData.length === 0) {
          alert("No valid data found. Ensure columns: ADM No, Amount Due, Amount Paid");
          setIsUploading(false);
          return;
        }

        const res = await clearanceApi.uploadPayments(paymentData);
        setUploadResult(res.data);
        fetchRecords();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload payments. Check file format.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadPaymentTemplate = () => {
    const template = [
      { "ADM No": "STU-001", "Amount Due": 5000, "Amount Paid": 3000 },
      { "ADM No": "STU-002", "Amount Due": 4500, "Amount Paid": 4500 }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "Payment_Upload_Template.xlsx");
  };

  // Totals
  const totals = filteredRecords.reduce((acc, r) => ({
    due: acc.due + r.amount_due,
    paid: acc.paid + r.amount_paid,
    outstanding: acc.outstanding + r.outstanding_balance
  }), { due: 0, paid: 0, outstanding: 0 });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "not_cleared": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

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
                <DollarSign className="h-6 w-6 text-green-600" /> Payment Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Upload student payments and track fee balances</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadPaymentTemplate} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                <Download className="h-4 w-4" /> Template
              </button>
              <label className={`flex items-center gap-2 px-4 py-2 ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg cursor-pointer text-sm`}>
                <Upload className="h-4 w-4" /> {isUploading ? "Uploading..." : "Upload Payments"}
                <input type="file" accept=".xlsx, .xls" onChange={handlePaymentUpload} className="hidden" disabled={isUploading} />
              </label>
              <button onClick={fetchRecords} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Upload Result Alert */}
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    Upload Complete: {uploadResult.updated} updated, {uploadResult.created} new records created.
                  </p>
                </div>
                <button onClick={() => setUploadResult(null)} className="text-green-400 hover:text-green-600"><X className="h-4 w-4" /></button>
              </div>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Errors ({uploadResult.errors.length}):</p>
                  <ul className="list-disc list-inside max-h-20 overflow-y-auto">
                    {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Total Amount Due</p><p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totals.due)}</p></div>
                <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="h-6 w-6 text-blue-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Total Paid</p><p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totals.paid)}</p></div>
                <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Total Outstanding</p><p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totals.outstanding)}</p></div>
                <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-700" /></div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or ADM No..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Status</option>
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="not_cleared">Not Cleared</option>
                <option value="no_request">No Request</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500"><FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-2" />No payment records found</td></tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.student_id} className="hover:bg-gray-50 text-sm">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{record.first_name} {record.last_name}</p>
                          <p className="text-xs text-gray-500">{record.student_number}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{record.program}</td>
                        <td className="px-4 py-3 font-medium text-blue-600">{formatCurrency(record.amount_due)}</td>
                        <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(record.amount_paid)}</td>
                        <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(record.outstanding_balance)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(record.finance_status)}`}>
                            {record.finance_status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Combined Totals Footer */}
                {filteredRecords.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan={2}>TOTALS ({filteredRecords.length} students)</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700">{formatCurrency(totals.due)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">{formatCurrency(totals.paid)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-700">{formatCurrency(totals.outstanding)}</td>
                      <td></td>
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
