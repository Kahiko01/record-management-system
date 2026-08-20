"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { clearanceApi } from "../../lib/api";
import {
  Shield, AlertTriangle, Activity, Users, Database, Clock,
  TrendingUp, Eye, Lock, Unlock, Server, Cpu, HardDrive,
  Wifi, CheckCircle2, XCircle, RefreshCw
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useWebSocket, WebSocketMessage } from "../../hooks/useWebSocket";

export default function MonitoringPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, hasPermission } = useAuth();

  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [authSurveillance, setAuthSurveillance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasPermission("admin:view_monitoring"))) {
      router.replace("/unauthorized");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("admin:view_monitoring")) {
      fetchMonitoringData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, hasPermission]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);

      const [securityRes, activeRes, healthRes, surveillanceRes] = await Promise.all([
        clearanceApi.getSecurityEvents(),
        clearanceApi.getActiveUsers(),
        clearanceApi.getSystemHealth(),
        clearanceApi.getAuthSurveillance()
      ]);

      setSecurityEvents(securityRes.data.items || []);
      setActiveUsers(activeRes.data || []);
      setSystemHealth(healthRes.data);
      setAuthSurveillance(surveillanceRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "SECURITY_EVENT") {
      // Add to top of security events with animation flag
      setSecurityEvents(prev => [{
        ...message.data,
        user: message.data.subject_username || "Unknown",
        _isNew: true
      }, ...prev].slice(0, 50)); // Keep max 50 events
    }
  }, []);

  const { isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    autoReconnect: true,
    reconnectInterval: 5000
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "text-red-600 dark:text-red-400";
      case "high": return "text-orange-600 dark:text-orange-400";
      case "warning": return "text-amber-600 dark:text-amber-400";
      case "operational": return "text-emerald-600 dark:text-emerald-400";
      default: return "text-slate-600 dark:text-slate-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      case "high": return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800";
      case "warning": return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
      case "operational": return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";
      default: return "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Shield className="h-8 w-8 text-emerald-600" />
                  Operations Center
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Real-time system monitoring and security surveillance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isConnected ? "LIVE" : "DISCONNECTED"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <button
                  onClick={fetchMonitoringData}
                  disabled={loading}
                  className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* System Health Overview */}
            {systemHealth && (
              <div className={`rounded-2xl border-2 p-6 ${getStatusBg(systemHealth.overall_status)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Health
                  </h2>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${getStatusColor(systemHealth.overall_status)} bg-white dark:bg-slate-900`}>
                    {systemHealth.overall_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <HealthMetric
                    icon={Database}
                    label="Database"
                    value={systemHealth.database.status}
                    subValue={`${systemHealth.database.response_time_ms}ms`}
                    status={systemHealth.database.status === "operational" ? "operational" : "critical"}
                  />
                  <HealthMetric
                    icon={Cpu}
                    label="CPU Usage"
                    value={`${systemHealth.system.cpu_percent}%`}
                    status={systemHealth.system.cpu_percent > 80 ? "warning" : "operational"}
                  />
                  <HealthMetric
                    icon={Activity}
                    label="Memory"
                    value={`${systemHealth.system.memory_percent}%`}
                    status={systemHealth.system.memory_percent > 85 ? "warning" : "operational"}
                  />
                  <HealthMetric
                    icon={HardDrive}
                    label="Disk"
                    value={`${systemHealth.system.disk_percent}%`}
                    status={systemHealth.system.disk_percent > 85 ? "warning" : "operational"}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Security Events Feed */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Security Events
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                    {securityEvents.length} events
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {securityEvents.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                      No security events recorded
                    </p>
                  ) : (
                    securityEvents.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all duration-500 ${
                          event._isNew ? "animate-in slide-in-from-left-4 bg-emerald-50 dark:bg-emerald-950/20" : ""
                        }`}
                        onAnimationEnd={() => {
                          // Remove the _isNew flag after animation
                          if (event._isNew) {
                            setSecurityEvents(prev => prev.map(e => 
                              e.id === event.id ? { ...e, _isNew: false } : e
                            ));
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            event.severity === "critical" ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" :
                            event.severity === "high" ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400" :
                            "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                          }`}>
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {event.action}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {event.details}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Users className="h-3 w-3" />
                          <span>{event.user}</span>
                          {event.ip_address && (
                            <>
                              <span>•</span>
                              <Wifi className="h-3 w-3" />
                              <span>{event.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Active Users
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                    {activeUsers.length} online
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                      No active users
                    </p>
                  ) : (
                    activeUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {user.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user.role}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {user.minutes_ago === 0 ? "Just now" : `${user.minutes_ago}m ago`}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Active</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Authentication Surveillance */}
            {authSurveillance && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Authentication Surveillance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {authSurveillance.total_threats}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">Total Threats</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {authSurveillance.blocked_ips?.length || 0}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">Blocked IPs</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {authSurveillance.recent_threats?.length || 0}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Recent Events</p>
                  </div>
                </div>

                {authSurveillance.blocked_ips && authSurveillance.blocked_ips.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Blocked IP Addresses
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {authSurveillance.blocked_ips.map((ip: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-xs font-mono bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        >
                          <Lock className="h-3 w-3 inline mr-1" />
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

function HealthMetric({ icon: Icon, label, value, subValue, status }: any) {
  const colorMap = {
    operational: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400"
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colorMap[status]}`} />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${colorMap[status]}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subValue}</p>
      )}
    </div>
  );
}
