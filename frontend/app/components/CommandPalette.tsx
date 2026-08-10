"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, DollarSign,
  BookOpen, ShieldCheck, Award, FileText, Search, LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { logout, isAdmin, isFinance, isExamination, isDean, isRegistry, isAuditor } = useAuth();

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* The Command Box */}
          <Command className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
              <Search className="mr-2 h-5 w-5 text-slate-400" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white"
              />
              <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400 ml-auto">ESC</kbd>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

              <Command.Group heading="Navigation" className="mb-2">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>

                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard"))}
                  className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950/40 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-300 transition-colors"
                >
                  <LayoutDashboard className="mr-3 h-4 w-4 text-slate-500" /> Dashboard
                </Command.Item>

                {(isAdmin() || isAuditor()) && (
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/admin/users"))}
                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950/40 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-300 transition-colors"
                  >
                    <Users className="mr-3 h-4 w-4 text-slate-500" /> Manage Users
                  </Command.Item>
                )}

                {(isAdmin() || isFinance()) && (
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/clearance/finance"))}
                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950/40 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-300 transition-colors"
                  >
                    <DollarSign className="mr-3 h-4 w-4 text-slate-500" /> Finance Queue
                  </Command.Item>
                )}

                {(isAdmin() || isExamination()) && (
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/clearance/examination"))}
                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950/40 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-300 transition-colors"
                  >
                    <BookOpen className="mr-3 h-4 w-4 text-slate-500" /> Examination Queue
                  </Command.Item>
                )}

                {(isAdmin() || isRegistry()) && (
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/registry"))}
                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950/40 aria-selected:text-emerald-700 dark:aria-selected:text-emerald-300 transition-colors"
                  >
                    <Award className="mr-3 h-4 w-4 text-slate-500" /> Registry & Certificates
                  </Command.Item>
                )}
              </Command.Group>

              <Command.Group heading="Actions" className="mt-2">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</p>
                <Command.Item
                  onSelect={() => runCommand(() => logout())}
                  className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 aria-selected:bg-rose-50 dark:aria-selected:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" /> Log out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}
