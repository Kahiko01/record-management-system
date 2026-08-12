"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Permission } from "../../context/AuthContext";

import RegistryKpiCards from "../../components/registry/RegistryKpiCards";
import {
  defaultRegistryDashboardSummary,
  mapRegistryDashboardSummaryToKpis,
  type RegistryDashboardSummary,
} from "../../types/registry";

// TODO: Replace with real API later
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
  // 1. Get Auth tools
  const { hasPermission, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<RegistryDashboardSummary>(
    defaultRegistryDashboardSummary
  );
  const [loading, setLoading] = useState(true);

  // 2. Security Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
        // If they don't have the Registry permission, kick them to their normal dashboard
        router.replace("/dashboard"); 
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // 3. Load Data
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

  // 4. Show loading screen while checking permissions
  if (authLoading || !isAuthenticated || !hasPermission(Permission.DASHBOARD_VIEW_REGISTRY)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-500">Checking permissions...</p>
      </main>
    );
  }

  const kpis = mapRegistryDashboardSummaryToKpis(summary);

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Registry
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Registry Dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Clearance → Verification → Certificate Ready → Appointment →
            Identity Verification → Release → Audit
          </p>
        </header>

        <RegistryKpiCards kpis={kpis} loading={loading} />

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Security Locked 🔒
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            This page is now protected. Only users with the{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-emerald-700">
              registry:view_dashboard
            </code>{" "}
            task can see it.
          </p>
        </section>
      </div>
    </main>
  );
}
