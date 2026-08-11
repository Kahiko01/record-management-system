"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
const WARNING_WINDOW = 30; // 30 second countdown

export default function SessionGuard() {
  const { user, logout } = useAuth();
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_WINDOW);
  const lastActivity = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    if (!user) return;
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const markActive = () => { lastActivity.current = Date.now(); };
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActive));
  }, [user]);

  // Check for inactivity every 5 seconds
  useEffect(() => {
    if (!user) return;
    const check = setInterval(() => {
      if (!warning && Date.now() - lastActivity.current >= INACTIVITY_LIMIT) {
        setWarning(true);
        setCountdown(WARNING_WINDOW);
      }
    }, 5000);
    return () => clearInterval(check);
  }, [user, warning]);

  // Countdown during warning
  useEffect(() => {
    if (!warning) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          logout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [warning, logout]);

  if (!user || !warning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Are you still there?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          For your security, you will be logged out due to inactivity.
        </p>
        <div className="text-4xl font-black text-amber-600 dark:text-amber-400 mb-6 tabular-nums">
          {countdown}s
        </div>
        <div className="flex gap-3">
          <button onClick={logout} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
          <button onClick={() => { lastActivity.current = Date.now(); setWarning(false); }} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4" /> Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
