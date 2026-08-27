"use client";
import { useState, useEffect } from "react";
import {
  FileText, Download, Package, CreditCard, AlertTriangle,
  RefreshCw, BarChart3, Calendar, FileOutput
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function IDReportsPage() {
  const [activeReport, setActiveReport] = useState<"inventory" | "issuances" | "collections" | "lost" | "batches" | "replacements">("inventory");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      let url = `http://127.0.0.1:8000/id-management/reports/${activeReport}`;

      // Add date filters for issuance/collection reports
      if ((activeReport === "issuances" || activeReport === "collections") && (startDate || endDate)) {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', new Date(startDate).toISOString());
        if (endDate) params.append('end_date', new Date(endDate).toISOString());
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (!data) return;

    let csvContent = "";
    const filename = `id_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === "inventory") {
      csvContent = "Metric,Value\n";
      csvContent += `Total Cards,${data.total_cards}\n`;
      csvContent += `Total Received,${data.total_received}\n`;
      csvContent += `Batches,${data.batch_count}\n\n`;
      csvContent += "Status,Count\n";
      if (data.by_status) {
        Object.entries(data.by_status).forEach(([status, count]) => {
          csvContent += `${status},${count}\n`;
        });
      }
    } else if (activeReport === "lost") {
      csvContent = "Type,Card Number,Serial,Student ID,Reported Date,Reason\n";
      if (data.lost) {
        data.lost.forEach((c: any) => {
          csvContent += `LOST,${c.card_number},${c.serial_number},${c.student_id || ""},${c.reported_date || ""},${c.reason || ""}\n`;
        });
      }
      if (data.damaged) {
        data.damaged.forEach((c: any) => {
          csvContent += `DAMAGED,${c.card_number},${c.serial_number},${c.student_id || ""},${c.reported_date || ""},${c.reason || ""}\n`;
        });
      }
    } else if (Array.isArray(data)) {
      if (data.length === 0) {
        alert("No data to export");
        return;
      }
      const headers = Object.keys(data[0]);
      csvContent = headers.join(",") + "\n";
      data.forEach(row => {
        const values = headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return val;
        });
        csvContent += values.join(",") + "\n";
      });
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    
    // Title and Date
    doc.setFontSize(16);
    doc.text(`ID Management Report: ${activeReport.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    if (activeReport === "inventory") {
      doc.text(`Total Cards: ${data.total_cards}`, 14, 40);
      doc.text(`Total Received: ${data.total_received}`, 14, 46);
      doc.text(`Batches: ${data.batch_count}`, 14, 52);
      
      const body = data.by_status ? Object.entries(data.by_status).map(([status, count]) => [status, count]) : [];
      autoTable(doc, {
        startY: 60,
        head: [['Status', 'Count']],
        body: body,
      });
    } else if (activeReport === "lost") {
      const body = [
        ...(data.lost || []).map((c: any) => ["LOST", c.card_number, c.serial_number, c.student_id || "N/A", c.reported_date || "N/A", c.reason || "N/A"]),
        ...(data.damaged || []).map((c: any) => ["DAMAGED", c.card_number, c.serial_number, c.student_id || "N/A", c.reported_date || "N/A", c.reason || "N/A"])
      ];
      autoTable(doc, {
        startY: 35,
        head: [['Type', 'Card Number', 'Serial', 'Student ID', 'Reported Date', 'Reason']],
        body: body,
      });
    } else if (Array.isArray(data)) {
      if (data.length > 0) {
        const headers = Object.keys(data[0]).map(k => k.replace(/_/g, ' ').toUpperCase());
        const body = data.map(row => Object.values(row).map(val => val === null || val === undefined ? "-" : String(val)));
        autoTable(doc, {
          startY: 35,
          head: [headers],
          body: body,
        });
      } else {
        doc.text("No data available for this report.", 14, 40);
      }
    }

    doc.save(`id_report_${activeReport}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const reports = [
    { id: "inventory", label: "Inventory Summary", icon: Package, color: "text-blue-600" },
    { id: "issuances", label: "Issuances", icon: CreditCard, color: "text-emerald-600" },
    { id: "collections", label: "Collections", icon: FileText, color: "text-purple-600" },
    { id: "lost", label: "Lost & Damaged", icon: AlertTriangle, color: "text-red-600" },
    { id: "batches", label: "Batches Received", icon: Package, color: "text-amber-600" },
    { id: "replacements", label: "Replacements", icon: RefreshCw, color: "text-rose-600" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            ID Management Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive analytics and exportable reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            <FileOutput className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={exportToCSV}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                activeReport === report.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className={`w-4 h-4 ${activeReport === report.id ? "text-white" : report.color}`} />
              {report.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter (for issuance/collection reports) */}
      {(activeReport === "issuances" || activeReport === "collections") && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Apply Filter
          </button>
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading report...
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-gray-500">No data available</div>
        ) : (
          <>
            {/* INVENTORY SUMMARY */}
            {activeReport === "inventory" && (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Total Cards</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.total_cards}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Total Received</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{data.total_received}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Batches</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.batch_count}</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${data.reconciled ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                    <p className={`text-xs font-semibold uppercase ${data.reconciled ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>Reconciliation</p>
                    <p className={`text-2xl font-bold ${data.reconciled ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}`}>
                      {data.reconciled ? "✓ Balanced" : `⚠ ${data.discrepancy}`}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Status Breakdown</h3>
                <div className="space-y-2">
                  {data?.by_status && Object.entries(data.by_status).map(([status, count]: [string, any]) => {
                    const percentage = data.total_cards > 0 ? (count / data.total_cards) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">{status}</span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full flex items-center justify-end px-2 text-xs font-medium text-white ${
                              status === "IN_STOCK" ? "bg-emerald-500" :
                              status === "ASSIGNED" ? "bg-amber-500" :
                              status === "ISSUED" ? "bg-blue-500" :
                              status === "LOST" ? "bg-red-500" :
                              status === "DAMAGED" ? "bg-rose-500" :
                              "bg-gray-500"
                            }`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                          >
                            {count > 0 && count}
                          </div>
                        </div>
                        <span className="w-16 text-right text-sm text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABLE REPORTS (Issuances, Collections, Batches, Replacements) */}
            {(activeReport === "issuances" || activeReport === "collections" || activeReport === "batches" || activeReport === "replacements") && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                    <tr>
                      {Array.isArray(data) && data.length > 0 && Object.keys(data[0]).map(key => (
                        <th key={key} className="px-4 py-3 font-medium whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.isArray(data) && data.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No records found</td></tr>
                    ) : (
                      Array.isArray(data) && data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {typeof val === "boolean" ? (val ? "✓ Yes" : "✗ No") :
                               val === null || val === undefined ? "-" :
                               String(val).length > 30 ? String(val).substring(0, 30) + "..." : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* LOST & DAMAGED */}
            {activeReport === "lost" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Lost Cards ({data.total_lost})
                    </h3>
                    {data?.lost?.length === 0 ? (
                      <p className="text-sm text-gray-500">No lost cards reported</p>
                    ) : (
                      <div className="space-y-2">
                        {(data.lost || []).map((c: any) => (
                          <div key={c.id} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="font-mono text-sm font-medium text-red-900 dark:text-red-100">{c.card_number}</p>
                            <p className="text-xs text-red-700 dark:text-red-300">Student: {c.student_id || "N/A"}</p>
                            <p className="text-xs text-red-600 dark:text-red-400">{c.reason || "No reason provided"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Damaged Cards ({data.total_damaged})
                    </h3>
                    {data?.damaged?.length === 0 ? (
                      <p className="text-sm text-gray-500">No damaged cards reported</p>
                    ) : (
                      <div className="space-y-2">
                        {(data.damaged || []).map((c: any) => (
                          <div key={c.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="font-mono text-sm font-medium text-amber-900 dark:text-amber-100">{c.card_number}</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Student: {c.student_id || "N/A"}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">{c.reason || "No reason provided"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
