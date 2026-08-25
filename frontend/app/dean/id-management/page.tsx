"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Package, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ total_cards: 0, in_stock: 0, issued: 0, lost: 0, damaged: 0, pending_collection: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/id-management/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Define routes for each card
  const statCards = [
    { label: "Total Cards", value: stats.total_cards, icon: CreditCard, color: "bg-blue-500", route: "/dean/id-management/inventory" },
    { label: "In Stock", value: stats.in_stock, icon: Package, color: "bg-emerald-500", route: "/dean/id-management/inventory" },
    { label: "Issued", value: stats.issued, icon: CheckCircle2, color: "bg-purple-500", route: "/dean/id-management/reports" },
    { label: "Pending Collection", value: stats.pending_collection, icon: Clock, color: "bg-amber-500", route: "/dean/id-management/collection" },
    { label: "Lost", value: stats.lost, icon: AlertTriangle, color: "bg-red-500", route: "/dean/id-management/replace" },
    { label: "Damaged", value: stats.damaged, icon: XCircle, color: "bg-rose-500", route: "/dean/id-management/replace" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Overview of ID Card Custody</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <button
              key={idx}
              onClick={() => router.push(stat.route)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition`}>
                  <Icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition flex items-center gap-1">
                  View Details 
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {loading ? "..." : stat.value}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
