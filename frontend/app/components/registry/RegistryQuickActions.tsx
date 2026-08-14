"use client";

import { 
  UserCheck, Search, CalendarClock, PackageCheck, Clock, Archive, BarChart3, Zap 
} from "lucide-react";

export default function RegistryQuickActions() {
  
  // Helper function to smooth-scroll to specific sections on the dashboard
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Registry Quick Actions
        </h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <ActionButton 
          icon={UserCheck} 
          label="Verify Student" 
          color="blue" 
          onClick={() => alert("Verify Student action triggered!")} 
        />
        <ActionButton 
          icon={Search} 
          label="Search Student" 
          color="slate" 
          onClick={() => scrollToSection("collection-queue")} 
        />
        <ActionButton 
          icon={CalendarClock} 
          label="Appointments" 
          color="amber" 
          onClick={() => scrollToSection("today-collections")} 
        />
        <ActionButton 
          icon={PackageCheck} 
          label="Release Cert" 
          color="emerald" 
          onClick={() => alert("Release Certificate workflow triggered!")} 
        />
        <ActionButton 
          icon={Clock} 
          label="View Pending" 
          color="purple" 
          onClick={() => scrollToSection("collection-queue")} 
        />
        <ActionButton 
          icon={Archive} 
          label="Inventory" 
          color="blue" 
          onClick={() => scrollToSection("certificate-inventory")} 
        />
        <ActionButton 
          icon={BarChart3} 
          label="Reports" 
          color="slate" 
          onClick={() => scrollToSection("registry-reports")} 
        />
      </div>
    </section>
  );
}

// Helper: Action Button with Hover Effects
function ActionButton({ icon: Icon, label, color, onClick }: any) {
  const colors: Record<string, string> = {
    blue: "hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 border-blue-200/50 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
    slate: "hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
    amber: "hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border-amber-200/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400",
    emerald: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    purple: "hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 border-purple-200/50 dark:border-purple-500/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${colors[color]}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </button>
  );
}
