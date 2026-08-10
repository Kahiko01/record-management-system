   "use client";

   import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

   interface PremiumKPICardProps {
     title: string;
     value: string | number;
     subtitle?: string;
     icon: LucideIcon;
     trend?: {
       value: number; // e.g., 12.5 or -5.2
       label: string; // e.g., "from last week"
     };
     color?: "emerald" | "blue" | "amber" | "rose" | "purple" | "slate";
     className?: string;
   }

   const colorStyles = {
     emerald: {
       bg: "from-emerald-500/10 to-emerald-600/5",
       border: "border-emerald-200/50 dark:border-emerald-800/50",
       icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
       glow: "hover:shadow-emerald-500/20",
     },
     blue: {
       bg: "from-blue-500/10 to-blue-600/5",
       border: "border-blue-200/50 dark:border-blue-800/50",
       icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
       glow: "hover:shadow-blue-500/20",
     },
     amber: {
       bg: "from-amber-500/10 to-amber-600/5",
       border: "border-amber-200/50 dark:border-amber-800/50",
       icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
       glow: "hover:shadow-amber-500/20",
     },
     rose: {
       bg: "from-rose-500/10 to-rose-600/5",
       border: "border-rose-200/50 dark:border-rose-800/50",
       icon: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
       glow: "hover:shadow-rose-500/20",
     },
     purple: {
       bg: "from-purple-500/10 to-purple-600/5",
       border: "border-purple-200/50 dark:border-purple-800/50",
       icon: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
       glow: "hover:shadow-purple-500/20",
     },
     slate: {
       bg: "from-slate-500/10 to-slate-600/5",
       border: "border-slate-200/50 dark:border-slate-800/50",
       icon: "bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400",
       glow: "hover:shadow-slate-500/20",
     },
   };

   export default function PremiumKPICard({
     title,
     value,
     subtitle,
     icon: Icon,
     trend,
     color = "emerald",
     className = "",
   }: PremiumKPICardProps) {
     const styles = colorStyles[color];
     
     const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;
     const trendColor = trend ? (trend.value > 0 ? "text-emerald-600 dark:text-emerald-400" : trend.value < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500") : "";

     return (
       <div className={`group relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.bg} backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.glow} ${className}`}>
         {/* Subtle background pattern */}
         <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
         
         <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${styles.icon} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </div>
            {trend && TrendIcon && (
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20 ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              {title}
            </p>
          </div>

          {/* Footer */}
          {(subtitle || trend) && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
              {trend && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{trend.label}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
   }
