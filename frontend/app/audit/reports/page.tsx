"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { studentApi, feeApi, registryApi } from "../../lib/api";
import { Download, Users, DollarSign, Package, FileSpreadsheet, CheckCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function AuditorReportsPage() {
  const [stats, setStats] = useState({ students: 0, finances: 0, certificates: 0 });
  const [downloading, setDownloading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [studentsRes, financesRes, certsRes] = await Promise.all([
        studentApi.getAll({ limit: 10000 }),
        feeApi.getBalances(),
        registryApi.getCertificates({})
      ]);
      setStats({
        students: studentsRes.data?.length || 0,
        finances: financesRes.data?.length || 0,
        certificates: certsRes.data?.length || 0
      });
    } catch (error) {
      console.error("Failed to fetch counts:", error);
    } finally {
      setLoading(false);
    }
  };

  // === DOWNLOAD FUNCTIONS ===
  const downloadExcel = async (type: string) => {
    setDownloading(type);
    try {
      let data: any[] = [];
      let filename = "";
      let headers: any[] = [];

      if (type === "students") {
        const res = await studentApi.getAll({ limit: 10000 });
        data = res.data.map((s: any) => ({
          "ADM No": s.student_id,
          "First Name": s.first_name,
          "Last Name": s.last_name,
          "Email": s.email,
          "Program": s.program,
          "Year of Study": s.year_of_study
        }));
        filename = `Auditor_Student_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
      } 
      else if (type === "finances") {
        const res = await feeApi.getBalances();
        data = res.data.map((f: any) => ({
          "ADM No": f.student_number,
          "Student Name": `${f.first_name} ${f.last_name}`,
          "Program": f.program,
          "Amount Due": f.amount_due,
          "Amount Paid": f.amount_paid,
          "Outstanding Balance": f.outstanding_balance,
          "Finance Status": f.finance_status
        }));
        filename = `Auditor_Financial_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
      } 
      else if (type === "certificates") {
        const res = await registryApi.getCertificates({});
        data = res.data.map((c: any) => ({
          "Certificate No": c.certificate_number,
          "Program": c.programme,
          "Graduation Year": c.graduation_year,
          "Storage Location": c.storage_location || "Unassigned",
          "Status": c.status
        }));
        filename = `Auditor_Certificate_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              Auditor Export & Reports Hub
            </h1>
            <p className="text-sm text-gray-500 mt-1">Generate and download real-time, comprehensive Excel reports for all university records.</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium text-sm">Live Database Generation</p>
              <p className="text-blue-600 text-xs mt-1">These reports are generated live from the database. They include all bulk uploads AND any manual changes made by staff, ensuring 100% audit accuracy.</p>
            </div>
          </div>

          {/* Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Students Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg"><Users className="h-6 w-6 text-indigo-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Student Records</h2>
                  <p className="text-xs text-gray-500">ADM No, Names, Program, Year</p>
                </div>
              </div>
              <div className="flex-1 mb-6">
                <p className="text-3xl font-bold text-indigo-600">{stats.students}</p>
                <p className="text-sm text-gray-500">Total records found</p>
              </div>
              <button 
                onClick={() => downloadExcel("students")} 
                disabled={downloading === "students"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
              >
                {downloading === "students" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Download className="h-4 w-4" /> Download Excel</>}
              </button>
            </div>

            {/* 2. Finances Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="h-6 w-6 text-green-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Financial Records</h2>
                  <p className="text-xs text-gray-500">Fees, Payments, Balances, Status</p>
                </div>
              </div>
              <div className="flex-1 mb-6">
                <p className="text-3xl font-bold text-green-600">{stats.finances}</p>
                <p className="text-sm text-gray-500">Total records found</p>
              </div>
              <button 
                onClick={() => downloadExcel("finances")} 
                disabled={downloading === "finances"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
              >
                {downloading === "finances" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Download className="h-4 w-4" /> Download Excel</>}
              </button>
            </div>

            {/* 3. Certificates Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg"><Package className="h-6 w-6 text-purple-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Certificate Inventory</h2>
                  <p className="text-xs text-gray-500">Cert No, Storage, Status, Year</p>
                </div>
              </div>
              <div className="flex-1 mb-6">
                <p className="text-3xl font-bold text-purple-600">{stats.certificates}</p>
                <p className="text-sm text-gray-500">Total records found</p>
              </div>
              <button 
                onClick={() => downloadExcel("certificates")} 
                disabled={downloading === "certificates"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 transition-colors"
              >
                {downloading === "certificates" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Download className="h-4 w-4" /> Download Excel</>}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
