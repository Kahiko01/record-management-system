"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LogOut, Sun, Moon, Bell, Check, X, Inbox, Command as CommandIcon, CheckCircle2, XCircle, Info, Award } from "lucide-react";
import CommandPalette from "./CommandPalette";
import SessionGuard from "./SessionGuard";
import toast from 'react-hot-toast';
import { notificationApi } from "../lib/api";
import { useWebSocket } from "../hooks/useWebSocket";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const wsConnectedRef = useRef(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🚀 Real-time notifications via secure WebSocket (only once)
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (!message || !message.type) return;
      
      const msgData = message.data || {};
      const msgText = msgData.message || msgData.details || "New notification";
      
      if (message.type === "CERTIFICATE_READY") {
        toast.success(`🔔 ${msgText}`, {
          duration: 5000,
          style: { background: '#10b981', color: '#fff' }
        });
        fetchNotifications();
      } else if (message.type === "NOTIFICATION") {
        toast.success(`🔔 ${msgText}`, {
          duration: 5000,
          style: { background: '#3b82f6', color: '#fff' }
        });
        fetchNotifications();
      } else if (message.type === "SECURITY_EVENT") {
        const severity = msgData.severity || "info";
        const icon = severity === "critical" ? "🚨" : severity === "high" ? "⚠️" : "ℹ️";
        toast(`${icon} ${msgData.action || "Security Event"}: ${msgData.subject_username || "System"}`, {
          duration: 6000,
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
        });
      }
      // Ignore other message types (AUDIT_EVENT, CONNECTION_ESTABLISHED, etc.)
    },
    reconnectInterval: 10000,  // Wait 10 seconds before reconnecting
    maxReconnectAttempts: 3    // Only try 3 times
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getNotifications();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setNotifications(data);
    } catch (error) {
      console.log('Notifications not available');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case "clearance_request": return <Bell className="h-5 w-5 text-amber-500" />;
      case "finance_approved": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "finance_rejected": return <XCircle className="h-5 w-5 text-rose-500" />;
      case "examination_approved": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "examination_rejected": return <XCircle className="h-5 w-5 text-rose-500" />;
      case "certificate_available": return <Award className="h-5 w-5 text-blue-500" />;
      case "appointment_confirmed": return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      case "certificate_collected": return <Award className="h-5 w-5 text-purple-500" />;
      case "approval": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "rejection": return <XCircle className="h-5 w-5 text-rose-500" />;
      case "info": return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <>
      {/* 🚀 WEEK 2: Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* 🔒 Session Timeout Guard */}
      <SessionGuard />

      <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm relative z-40">

        {/* LEFT SIDE: Logo & Command Trigger */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="KNP Digital Office Logo"
              className="h-8 w-auto object-contain"
            />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
              KNP Digital Office
            </h2>
          </div>

          {/* ⌘K Button */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-xs font-medium border border-gray-200 dark:border-slate-700 shadow-sm ml-4"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-slate-400 ml-2">⌘K</kbd>
          </button>
        </div>

        {/* RIGHT SIDE: Notifications, Theme, Profile, Logout */}
        <div className="flex items-center gap-4">

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setShowDropdown(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-slate-700 border-t-emerald-500"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-slate-400">
                      <Inbox className="h-10 w-10 mb-2 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`flex items-start gap-3 p-4 border-b border-gray-100 dark:border-slate-800 last:border-b-0 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'}`}>
                        <span className="flex-shrink-0 mt-0.5">{getIconForType(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 uppercase font-semibold">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username || "Guest"}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>
    </>
  );
}
