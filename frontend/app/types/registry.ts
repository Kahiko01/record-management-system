export type RegistryKpiTone =
  | "emerald"
  | "amber"
  | "red"
  | "slate";

export interface RegistryKpi {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: RegistryKpiTone;
}

export interface RegistryDashboardSummary {
  clearedStudents: number;
  certificatesReady: number;
  awaitingCollection: number;
  collected: number;
  appointmentsToday: number;
  pendingVerification: number;
  onHold: number;
  uncollected: number;
}

export const defaultRegistryDashboardSummary: RegistryDashboardSummary = {
  clearedStudents: 0,
  certificatesReady: 0,
  awaitingCollection: 0,
  collected: 0,
  appointmentsToday: 0,
  pendingVerification: 0,
  onHold: 0,
  uncollected: 0,
};

export function mapRegistryDashboardSummaryToKpis(
  summary: RegistryDashboardSummary
): RegistryKpi[] {
  return [
    {
      id: "cleared-students",
      label: "Cleared Students",
      value: summary.clearedStudents,
      hint: "Students who have completed departmental clearance.",
      tone: "emerald",
    },
    {
      id: "certificates-ready",
      label: "Certificates Ready",
      value: summary.certificatesReady,
      hint: "Certificates available for collection.",
      tone: "emerald",
    },
    {
      id: "awaiting-collection",
      label: "Awaiting Collection",
      value: summary.awaitingCollection,
      hint: "Certificates ready but not yet collected.",
      tone: "amber",
    },
    {
      id: "collected",
      label: "Collected",
      value: summary.collected,
      hint: "Certificates already released.",
      tone: "slate",
    },
    {
      id: "appointments-today",
      label: "Appointments Today",
      value: summary.appointmentsToday,
      hint: "Scheduled collection appointments for today.",
      tone: "amber",
    },
    {
      id: "pending-verification",
      label: "Pending Verification",
      value: summary.pendingVerification,
      hint: "Students requiring Registry verification.",
      tone: "amber",
    },
    {
      id: "on-hold",
      label: "On Hold",
      value: summary.onHold,
      hint: "Records blocked due to an issue.",
      tone: "red",
    },
    {
      id: "uncollected",
      label: "Uncollected",
      value: summary.uncollected,
      hint: "Certificates that have remained uncollected.",
      tone: "amber",
    },
  ];
}
