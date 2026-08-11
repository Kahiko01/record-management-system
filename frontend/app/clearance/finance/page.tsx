"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import AdvancedTable from "../../components/AdvancedTable";
import { DollarSign, Search, RefreshCw, CheckCircle2, XCircle, Download, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function FinanceClearancePage() {
  const { user, hasTask } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", course: "", level: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await clearanceApi.getFinancePending(filters);
      setRequests(response.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (selectedIds: number[], action: string) => {
    const loadingToast = toast.loading(`Processing ${selectedIds.length} requests...`);
    try {
      for (const id of selectedIds) {
        await clearanceApi.updateFinanceClearance(id, { status: action === "approve" ? "cleared" : "not_cleared" });
      }
      toast.success(` ${selectedIds.length} requests ${action === "approve" ? "approved" : "rejected"}!`, { id: loadingToast });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to process requests.", { id: loadingToast });
    }
  };

  const handleSingleAction = async (id: number, status: string) => {
    const loadingToast = toast.loading("Processing...");
    try {
      await clearanceApi.updateFinanceClearance(id, { status });
      toast.success(status === "cleared" ? " Clearance approved!" : " Clearance rejected.", { id: loadingToast });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update.", { id: loadingToast });
    }
  };

  const exportCSV = () => {
    const headers = ["Student", "ADM No", "Program", "Amount Due", "Amount Paid", "Balance", "Status"];
    const rows = requests.map((r: any) => [
      `${r.student?.first_name || ""} ${r.student?.last_name || ""}`,
      r.student?.student_id || "",
      r.student?.program || "",
      r.amount_due || 0,
      r.amount_paid || 0,
      (r.amount_due || 0) - (r.amount_paid || 0),
      r.status || "pending",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance_clearance_report.csv";
    a.click();
    toast.success(" CSV exported successfully!");
  };

  const columns = [
    {
      key: "student",
      label: "Student",
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
            {item.student?.first_name?.charAt(0)}{item.student?.last_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{item.student?.first_name} {item.student?.last_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.student?.student_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "program",
      label: "Program",
      sortable: true,
      render: (item: any) => <span className="text-slate-700 dark:text-slate-300">{item.student?.program}</span>,
    },
    {
      key: "amount_due",
      label: "Amount Due",
      sortable: true,
      render: (item: any) => <span className="font-semibold text-slate-900 dark:text-white">₦{(item.amount_due || 0).toLocaleString()}</span>,
    },
    {
      key: "amount_paid",
      label: "Amount Paid",
      sortable: true,
      render: (item: any) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">₦{(item.amount_paid || 0).toLocaleString()}</span>,
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (item: any) => {
        const balance = (item.amount_due || 0) - (item.amount_paid || 0);
        return (
          <span className={`font-bold ${balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            ₦{balance.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: any) => {
        const status = item.status || "pending";
        const styles: any = {
          cleared: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          not_cleared: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          pending: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
            {status === "cleared" ? <CheckCircle2 className="h-3 w-3" /> : status === "not_cleared" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: any) => {
        const canAct = hasTask("finance_approve") || hasTask("finance:approve");
        if (!canAct) return <span className="text-xs text-slate-400 italic">View Only</span>;
        return (
          <div className="flex gap-2">
            <button onClick={() => handleSingleAction(item.id, "cleared")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approve
            </button>
            <button onClick={() => handleSingleAction(item.id, "not_cleared")} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <TopBar />
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 min-h-screen p-6 lg:p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance Clearance Queue</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review and approve student fee settlements</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Search Name / ADM No</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={filters.search} 
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                    onKeyPress={(e) => e.key === "Enter" && fetchData()} 
                    placeholder="e.g. John or ADM/2024/001" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50" 
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Program</label>
                <input 
                  type="text" 
                  value={filters.course} 
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })} 
                  placeholder="e.g. Computer Science" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50" 
                />
              </div>
              <button onClick={fetchData} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-amber-900/20 flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
              <button onClick={() => { setFilters({ search: "", course: "", level: "" }); setTimeout(fetchData, 100); }} className="px-4 py-2.5 text-sm font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Advanced Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-amber-600"></div>
            </div>
          ) : (
            <AdvancedTable
              data={requests}
              columns={columns}
              keyField="id"
              onBulkAction={handleBulkAction}
              bulkActions={[
                { label: "Approve Selected", value: "approve", icon: CheckCircle2, color: "emerald" },
                { label: "Reject Selected", value: "reject", icon: XCircle, color: "rose" },
              ]}
              emptyMessage="No pending finance clearances found"
            />
          )}

        </main>
      </div>
    </div>
  );
}
