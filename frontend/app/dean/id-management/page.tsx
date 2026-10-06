"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, Package, CheckCircle2, AlertTriangle, 
  XCircle, Clock, Plus, FileText, Search, ArrowRight 
} from "lucide-react";

export default function DeanDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ 
    total_cards: 0, 
    in_stock: 0, 
    issued: 0, 
    lost: 0, 
    damaged: 0, 
    pending_collection: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/id-management/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) { 
      console.error("Failed to fetch stats:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const statCards = [
    { label: "Total Cards", value: stats.total_cards, icon: CreditCard, color: "blue", route: "/dean/id-management/inventory", desc: "Overall card count" },
    { label: "In Stock", value: stats.in_stock, icon: Package, color: "emerald", route: "/dean/id-management/inventory", desc: "Ready for issuance" },
    { label: "Issued", value: stats.issued, icon: CheckCircle2, color: "purple", route: "/dean/id-management/reports", desc: "Successfully handed out" },
    { label: "Pending Collection", value: stats.pending_collection, icon: Clock, color: "amber", route: "/dean/id-management/collection", desc: "Awaiting student pickup" },
    { label: "Lost", value: stats.lost, icon: AlertTriangle, color: "orange", route: "/dean/id-management/replace", desc: "Reported missing" },
    { label: "Damaged", value: stats.damaged, icon: XCircle, color: "rose", route: "/dean/id-management/replace", desc: "Needs replacement" },
  ];

  const quickActions = [
    { label: "Receive New Batch", icon: Package, route: "/dean/id-management/receive-batch", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Issue ID Card", icon: CreditCard, route: "/dean/id-management/issue", color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Process Replacement", icon: AlertTriangle, route: "/dean/id-management/replace", color: "bg-amber-600 hover:bg-amber-700" },
    { label: "View Full Reports", icon: FileText, route: "/dean/id-management/reports", color: "bg-purple-600 hover:bg-purple-700" },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">ID Management Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor card inventory, issuance, and replacements at a glance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/dean/id-management/inventory')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search Inventory
          </button>
          <button 
            onClick={() => router.push('/dean/id-management/issue')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Issue New ID
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
            emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
            purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800",
            amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800",
            orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800",
            rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800",
          };
          
          return (
            <button
              key={idx}
              onClick={() => router.push(stat.route)}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${colorMap[stat.color]} transition-colors`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </h3>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stat.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => router.push(action.route)}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg hover:scale-[1.02] ${action.color}`}
              >
                <Icon className="w-5 h-5" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
