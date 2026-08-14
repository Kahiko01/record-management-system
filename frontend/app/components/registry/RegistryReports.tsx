"use client";

import { useState } from "react";
import { 
  FileText, Download, TrendingUp, Users, Award, AlertTriangle, 
  Calendar, BarChart3, Activity, CheckCircle2, XCircle, PackageX 
} from "lucide-react";

type ReportTab = "collection" | "graduation" | "exceptions";

export default function RegistryReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("collection");

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header & Tabs */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Registry Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Operational metrics for collection, graduation cohorts, and exceptions.
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <TabButton 
            active={activeTab === "collection"} 
            onClick={() => setActiveTab("collection")}
            icon={Activity}
            label="Collection" 
          />
          <TabButton 
            active={activeTab === "graduation"} 
            onClick={() => setActiveTab("graduation")}
            icon={Award}
            label="Graduation" 
          />
          <TabButton 
            active={activeTab === "exceptions"} 
            onClick={() => setActiveTab("exceptions")}
            icon={AlertTriangle}
            label="Exceptions" 
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        
        {/* COLLECTION REPORTS */}
        {activeTab === "collection" && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <ReportCard title="Issued Today" value="12" icon={CheckCircle2} tone="emerald" />
              <ReportCard title="Issued This Week" value="45" icon={TrendingUp} tone="blue" />
              <ReportCard title="Issued This Month" value="184" icon={FileText} tone="purple" />
              <ReportCard title="Uncollected" value="42" icon={Calendar} tone="amber" />
              <ReportCard title="No-Show Appointments" value="3" icon={XCircle} tone="red" />
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Collection Report
              </button>
            </div>
          </div>
        )}

        {/* GRADUATION REPORTS */}
        {activeTab === "graduation" && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cohort Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cohort Progress</h3>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Graduation Year</th>
                      <th className="px-5 py-3 font-semibold">Received</th>
                      <th className="px-5 py-3 font-semibold">Issued</th>
                      <th className="px-5 py-3 font-semibold">Outstanding</th>
                      <th className="px-5 py-3 font-semibold">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">2022</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">1,200</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-medium">1,150</td>
                      <td className="px-5 py-3 text-amber-600 dark:text-amber-400">50</td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">95%</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">2023</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">1,450</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-medium">1,210</td>
                      <td className="px-5 py-3 text-amber-600 dark:text-amber-400">240</td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">83%</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">2024</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">1,310</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-medium">980</td>
                      <td className="px-5 py-3 text-amber-600 dark:text-amber-400">330</td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">74%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4">
                <ReportCard title="Total Certificates Received" value="3,960" icon={PackageX} tone="blue" />
                <ReportCard title="Total Certificates Issued" value="3,340" icon={Award} tone="emerald" />
                <ReportCard title="Overall Collection Rate" value="84.3%" icon={TrendingUp} tone="purple" />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Graduation Report
              </button>
            </div>
          </div>
        )}

        {/* EXCEPTION REPORTS */}
        {activeTab === "exceptions" && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportCard title="Certificates On Hold" value="11" icon={AlertTriangle} tone="red" />
              <ReportCard title="Damaged Certificates" value="2" icon={XCircle} tone="amber" />
              <ReportCard title="Missing Certificates" value="0" icon={FileText} tone="slate" />
              <ReportCard title="ID Verification Failures" value="4" icon={Users} tone="purple" />
            </div>
            
            {/* Exception Details Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-red-50 dark:bg-red-500/5 border-b border-red-100 dark:border-red-500/20">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Active Exceptions Requiring Attention</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/30 text-xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Certificate No.</th>
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Exception Type</th>
                    <th className="px-5 py-3 font-semibold">Reported By</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">CERT-2024-012</td>
                    <td className="px-5 py-3 text-slate-900 dark:text-white">Peter Mwangi</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">Hold: Identity Mismatch</span></td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">registry_officer</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">Today, 10:15 AM</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">CERT-2023-099</td>
                    <td className="px-5 py-3 text-slate-900 dark:text-white">Sarah Atieno</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Damaged Certificate</span></td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">registry_officer</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">Yesterday, 2:30 PM</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Exception Report
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Helper: Tab Button
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
      {label}
    </button>
  );
}

// Helper: Report Card
function ReportCard({ title, value, icon: Icon, tone }: any) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-500/20",
    slate: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700",
  };

  return (
    <div className={`rounded-2xl p-5 border shadow-sm flex flex-col ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
    </div>
  );
}
