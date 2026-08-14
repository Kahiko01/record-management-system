"use client";

import { 
  Package, PackageCheck, PackageX, AlertTriangle, Archive, 
  TrendingUp, TrendingDown, Box, MapPin 
} from "lucide-react";

// Mock inventory data
const inventoryStats = [
  { label: "Total Received", value: 1250, icon: Package, tone: "slate", trend: "+45 this week" },
  { label: "Successfully Issued", value: 1087, icon: PackageCheck, tone: "emerald", trend: "86% collection rate" },
  { label: "Available in Vault", value: 163, icon: Archive, tone: "blue", trend: "Ready for dispatch" },
  { label: "Unclaimed (> 1 Year)", value: 42, icon: PackageX, tone: "amber", trend: "Action required" },
  { label: "On Hold / Investigation", value: 11, icon: AlertTriangle, tone: "red", trend: "Discrepancies" },
];

const storageLocations = [
  { name: "Main Vault - Room 101", capacity: 1000, used: 850, status: "Optimal" },
  { name: "Cabinet A (A-M)", capacity: 200, used: 195, status: "Near Full" },
  { name: "Cabinet B (N-Z)", capacity: 200, used: 120, status: "Optimal" },
  { name: "Temporary Holding", capacity: 50, used: 12, status: "Optimal" },
];

const toneClasses: Record<string, { bg: string, text: string, iconBg: string }> = {
  slate: { bg: "bg-white dark:bg-slate-900", text: "text-slate-900 dark:text-white", iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-900 dark:text-emerald-300", iconBg: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-900 dark:text-blue-300", iconBg: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-900 dark:text-amber-300", iconBg: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" },
  red: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-900 dark:text-red-300", iconBg: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400" },
};

export default function CertificateInventory() {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="h-5 w-5 text-blue-500" />
            Certificate Inventory Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track physical certificate lifecycle and storage capacity.
          </p>
        </div>
        <button className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> Log Damaged/Misprinted
        </button>
      </div>

      {/* Inventory KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {inventoryStats.map((stat) => {
          const Icon = stat.icon;
          const classes = toneClasses[stat.tone];
          return (
            <div key={stat.label} className={`${classes.bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${classes.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${classes.text}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                {stat.label}
              </p>
              <p className={`text-[10px] font-semibold mt-2 flex items-center gap-1 ${
                stat.tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 
                stat.tone === 'red' || stat.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 
                'text-slate-500 dark:text-slate-400'
              }`}>
                {stat.tone === 'emerald' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Storage Locations Capacity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          Physical Storage Capacity
        </h3>
        <div className="space-y-5">
          {storageLocations.map((loc) => {
            const percentage = Math.round((loc.used / loc.capacity) * 100);
            const isFull = percentage > 90;
            
            return (
              <div key={loc.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{loc.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isFull ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    }`}>
                      {loc.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {loc.used} / {loc.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
