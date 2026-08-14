import Link from "next/link";
import type { RegistryKpi, RegistryKpiTone } from "../../types/registry";

interface RegistryKpiCardsProps {
  kpis: RegistryKpi[];
  loading?: boolean;
}

const containerTones: Record<RegistryKpiTone, string> = {
  emerald: "border-emerald-200 bg-emerald-50",
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
  slate: "border-slate-200 bg-white",
};

const labelTones: Record<RegistryKpiTone, string> = {
  emerald: "text-emerald-900",
  amber: "text-amber-900",
  red: "text-red-900",
  slate: "text-slate-900",
};

const valueTones: Record<RegistryKpiTone, string> = {
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  slate: "text-slate-900",
};

const hintTones: Record<RegistryKpiTone, string> = {
  emerald: "text-emerald-800/80",
  amber: "text-amber-800/80",
  red: "text-red-800/80",
  slate: "text-slate-500",
};

const dotTones: Record<RegistryKpiTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  slate: "bg-slate-400",
};

function KpiCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export default function RegistryKpiCards({
  kpis,
  loading = false,
}: RegistryKpiCardsProps) {
  if (loading) {
    return (
      <section
        aria-label="Registry KPIs"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </section>
    );
  }

  return (
    <section
      aria-label="Registry KPIs"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const formattedValue = new Intl.NumberFormat().format(kpi.value);

        return (
          <Link 
            href={kpi.href} 
            key={kpi.id}
            className={`block rounded-2xl border p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${containerTones[kpi.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-medium ${labelTones[kpi.tone]}`}
                >
                  {kpi.label}
                </p>

                <p
                  className={`mt-2 text-3xl font-semibold tracking-tight ${valueTones[kpi.tone]}`}
                >
                  {formattedValue}
                </p>

                <p className={`mt-2 text-xs ${hintTones[kpi.tone]}`}>
                  {kpi.hint}
                </p>
              </div>

              <span
                aria-hidden="true"
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotTones[kpi.tone]}`}
              />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
