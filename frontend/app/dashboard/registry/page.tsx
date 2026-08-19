"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, Permission } from "../../context/AuthContext";

import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import CollectionQueueTable from "../../components/registry/CollectionQueueTable";
import VerifyStudentModal from "../../components/registry/VerifyStudentModal";
import ScheduleCollectionModal from "../../components/registry/ScheduleCollectionModal";
import ExcelImportModal from "../../components/registry/ExcelImportModal";
import {
  Users, Award, Clock, AlertTriangle
} from "lucide-react";

export default function RegistryDashboardPage() {
  const { hasPermission, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const filter = searchParams.get("filter");

  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Security Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Handle Sidebar Actions
  useEffect(() => {
    if (action === "verify") {
      setShowVerifyModal(true);
    } else if (action === "schedule") {
      setShowScheduleModal(true);
    }
  }, [action]);

  // Handle Filter Parameter
  useEffect(() => {
    if (filter === "pending") {
      // This will be handled by the CollectionQueueTable component
      // We can pass it as a prop or use a global state
      console.log("Filter set to pending");
    }
  }, [filter]);

  // Close modals and clean URL
  const closeModal = (setter: (value: boolean) => void) => {
    setter(false);
    // Clean the URL by removing the action parameter
    router.replace("/dashboard/registry");
  };

  // Handle Excel Import
  const handleImportStudents = async (data: any[]) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Import failed");
      }

      return await response.json();
    } catch (error: any) {
      throw error;
    }
  };

  if (authLoading || !isAuthenticated || (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* Clean Header */}
            <header className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Registry
                  </p>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Registry Dashboard
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Clearance → Verification → Certificate Ready → Appointment → Identity Verification → Release → Audit
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Students
                </button>
              </div>
            </header>

            {/* 4 Clean KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard
                title="Cleared Students"
                value={0}
                subtitle="Students who completed clearance"
                icon={Users}
                color="blue"
              />
              <KpiCard
                title="Certificates Ready"
                value={0}
                subtitle="Available for collection"
                icon={Award}
                color="emerald"
              />
              <KpiCard
                title="Awaiting Collection"
                value={0}
                subtitle="Ready but not yet collected"
                icon={Clock}
                color="amber"
              />
              <KpiCard
                title="On Hold"
                value={0}
                subtitle="Records blocked due to an issue"
                icon={AlertTriangle}
                color="red"
              />
            </div>

            {/* Collection Queue - Main Workspace */}
            <CollectionQueueTable initialFilter={filter} />

          </div>
        </main>
      </div>

      {/* Sidebar Triggered Modals */}
      <VerifyStudentModal
        isOpen={showVerifyModal}
        onClose={() => closeModal(setShowVerifyModal)}
      />
      <ScheduleCollectionModal
        isOpen={showScheduleModal}
        onClose={() => closeModal(setShowScheduleModal)}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportStudents}
      />
    </div>
  );
}

// Clean KPI Card Component
function KpiCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorClasses: Record<string, { bg: string, text: string, iconBg: string }> = {
    blue: {
      bg: "bg-white dark:bg-slate-900",
      text: "text-slate-900 dark:text-white",
      iconBg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    emerald: {
      bg: "bg-white dark:bg-slate-900",
      text: "text-slate-900 dark:text-white",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    amber: {
      bg: "bg-white dark:bg-slate-900",
      text: "text-slate-900 dark:text-white",
      iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    red: {
      bg: "bg-white dark:bg-slate-900",
      text: "text-slate-900 dark:text-white",
      iconBg: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${classes.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={`text-3xl font-extrabold ${classes.text} mb-1`}>
        {value}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
