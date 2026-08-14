"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, Permission } from "../../context/AuthContext";

import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import RegistryKpiCards from "../../components/registry/RegistryKpiCards";
import CollectionQueueTable from "../../components/registry/CollectionQueueTable";
import CertificateInventory from "../../components/registry/CertificateInventory";
import TodayCollections from "../../components/registry/TodayCollections";
import RegistryReports from "../../components/registry/RegistryReports";
import RegistryAuditTrail from "../../components/registry/RegistryAuditTrail";
import RegistryQuickActions from "../../components/registry/RegistryQuickActions";
import VerifyStudentModal from "../../components/registry/VerifyStudentModal";
import ScheduleCollectionModal from "../../components/registry/ScheduleCollectionModal";
import ReleaseWorkflowModal from "../../components/registry/ReleaseWorkflowModal";
import {
  defaultRegistryDashboardSummary,
  mapRegistryDashboardSummaryToKpis,
  type RegistryDashboardSummary,
} from "../../types/registry";

async function fetchRegistryDashboardSummary(): Promise<RegistryDashboardSummary> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    clearedStudents: 124,
    certificatesReady: 86,
    awaitingCollection: 42,
    collected: 918,
    appointmentsToday: 12,
    pendingVerification: 7,
    onHold: 5,
    uncollected: 36,
  };
}

export default function RegistryDashboardPage() {
  const { hasPermission, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [summary, setSummary] = useState<RegistryDashboardSummary>(defaultRegistryDashboardSummary);
  const [loading, setLoading] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // 🔒 PROPER SECURITY GUARD
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
        router.replace("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Fetch Data
  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const data = await fetchRegistryDashboardSummary();
        if (active) setSummary(data);
      } catch (error) {
        console.error("Failed to load registry dashboard summary", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  // Handle Sidebar URL parameters
  useEffect(() => {
    if (action === "verify") {
      setShowVerifyModal(true);
    } else if (action === "schedule") {
      setShowScheduleModal(true);
    } else if (action === "release") {
      setShowReleaseModal(true);
    }
  }, [action]);

  // Show loading spinner while checking permissions
  if (authLoading || !isAuthenticated || (!hasPermission(Permission.REGISTRY_VIEW_DASHBOARD) && !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const kpis = mapRegistryDashboardSummaryToKpis(summary);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* Registry Header */}
            <header className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Registry
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Registry Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                Clearance → Verification → Certificate Ready → Appointment → Identity Verification → Release → Audit
              </p>
            </header>

            {/* KPI Cards */}
            <RegistryKpiCards kpis={kpis} loading={loading} />

            {/* Quick Actions */}
            <RegistryQuickActions />

            {/* Collection Queue */}
            <div id="collection-queue">
              <CollectionQueueTable />
            </div>

            {/* Today's Appointments */}
            <div id="today-collections">
              <TodayCollections />
            </div>

            {/* Inventory Control */}
            <div id="certificate-inventory">
              <CertificateInventory />
            </div>

            {/* Reports Hub */}
            <div id="registry-reports">
              <RegistryReports />
            </div>

            {/* Audit Trail */}
            <RegistryAuditTrail />

          </div>
        </main>
      </div>

      {/* Sidebar Triggered Modals */}
      <VerifyStudentModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />
      <ScheduleCollectionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      />
      <ReleaseWorkflowModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
      />
    </div>
  );
}
