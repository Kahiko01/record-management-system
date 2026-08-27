"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Permission } from "../../../context/AuthContext";

import CertificateInventory from "../../../components/registry/CertificateInventory";

export default function RegistryInventoryPage() {
  const { hasPermission, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <div className="flex">
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="mx-auto max-w-7xl space-y-6">
            
            {/* Page Header */}
            <header className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Registry
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Certificate Inventory Control
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                Track physical certificate lifecycle, storage capacity, and vault management.
              </p>
            </header>

            {/* Inventory Component */}
            <CertificateInventory />

          </div>
        </main>
      </div>
    </div>
  );
}
