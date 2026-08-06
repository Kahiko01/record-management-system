"use client";

import { useState, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { monitoringApi } from "../../lib/api";
import { Shield, Activity, AlertTriangle, Users, Database, Cpu, HardDrive, MemoryStick, RefreshCw, CheckCircle, XCircle, Lock, Zap, Wifi, Server } from "lucide-react";

export default function SystemMonitorPage() {
  const [health, setHealth] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [security, setSecurity] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [authSurveillance, setAuthSurveillance] = useState<any>(null);
  const [dbTopography, setDbTopography] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [lockdownMode, setLockdownMode] = useState(false);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [healthRes, activityRes, securityRes, usersRes, authRes, dbRes] = await Promise.all([
        monitoringApi.getHealth(),
        monitoringApi.getActivity(50),
        monitoringApi.getSecurity(),
        monitoringApi.getActiveUsers(),
        monitoringApi.getAuthSurveillance(),
        monitoringApi.getDatabaseTopography(),
      ]);
      setHealth(healthRes.data);
      setActivity(activityRes.data || []);
      setSecurity(securityRes.data || []);
      setActiveUsers(usersRes.data || []);
      setAuthSurveillance(authRes.data);
      setDbTopography(dbRes.data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLockdown = async () => {
    if (!confirm("⚠️ WARNING: Initiate System Lockdown Protocol? This will flag all active sessions for termination.")) return;
    try {
      await monitoringApi.initiateLockdown();
      setLockdownMode(true);
      setTimeout(() => setLockdownMode(false), 5000); // Flash red for 5 seconds
      fetchAllData();
    } catch (error) {
      alert("Failed to initiate lockdown.");
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => status === "operational" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-rose-400";
  const getProgressBarColor = (percent: number) => percent >= 90 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500";

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-slate-800 border-t-emerald-500"></div></div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${lockdownMode ? 'bg-rose-950' : 'bg-gray-50 dark:bg-slate-950'} text-gray-900 dark:text-slate-200`}>
      <TopBar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* === HEADER === */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-gray-200 dark:border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <Shield className={`h-8 w-8 ${lockdownMode ? 'text-rose-500 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider font-mono">SYSTEM SURVEILLANCE & MONITOR</h1>
                <p className="text-[10px] text-gray-500 dark:text-slate-500 font-mono tracking-widest">UNIVERSITY CLEARANCE // COMMAND CENTER</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest font-mono">LIVE FEED</span>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm text-gray-900 dark:text-white">{currentTime}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-500">Sync: {lastRefresh}</p>
              </div>
              <button onClick={fetchAllData} className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"><RefreshCw className="h-4 w-4 text-gray-600 dark:text-slate-400" /></button>
              <button onClick={handleLockdown} className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors border border-rose-500 shadow-lg shadow-rose-900/50">
                <Lock className="h-3.5 w-3.5" /> INITIATE LOCKDOWN
              </button>
            </div>
          </div>

          {lockdownMode && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 rounded-xl text-center">
              <p className="text-rose-300 font-bold font-mono animate-pulse">⚠️ LOCKDOWN PROTOCOL ACTIVE // ALL SESSIONS FLAGGED FOR TERMINATION ⚠️</p>
            </div>
          )}

          {/* === SYSTEM HEALTH CARDS === */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider font-mono">System Status</span>
                <Server className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </div>
              <p className={`text-lg font-bold uppercase font-mono ${getStatusColor(health?.overall_status)}`}>{health?.overall_status}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 font-mono">Uptime: {formatUptime(health?.uptime_seconds || 0)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider font-mono">Database</span>
                <Database className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="flex items-center gap-2">
                {health?.database?.status === "operational" ? <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="h-5 w-5 text-rose-400" />}
                <p className={`text-lg font-bold font-mono ${health?.database?.status === "operational" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-400"}`}>{health?.database?.response_time_ms}ms</p>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 font-mono">Latency: Nominal</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider font-mono">Memory</span><MemoryStick className="h-4 w-4 text-gray-400 dark:text-slate-500" /></div>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{health?.system?.memory_percent}%</p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2"><div className={`h-1.5 rounded-full ${getProgressBarColor(health?.system?.memory_percent)}`} style={{ width: `${health?.system?.memory_percent}%` }}></div></div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider font-mono">Disk I/O</span><HardDrive className="h-4 w-4 text-gray-400 dark:text-slate-500" /></div>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{health?.system?.disk_percent}%</p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2"><div className={`h-1.5 rounded-full ${getProgressBarColor(health?.system?.disk_percent)}`} style={{ width: `${health?.system?.disk_percent}%` }}></div></div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider font-mono">CPU Load</span><Cpu className="h-4 w-4 text-gray-400 dark:text-slate-500" /></div>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{health?.system?.cpu_percent}%</p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2"><div className={`h-1.5 rounded-full ${getProgressBarColor(health?.system?.cpu_percent)}`} style={{ width: `${health?.system?.cpu_percent}%` }}></div></div>
            </div>
          </div>

          {/* === SURVEILLANCE GRID === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* AUTH SURVEILLANCE (Brute Force Tracker) */}
            <div className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-500/5">
                <Zap className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest font-mono">Auth Surveillance</h2>
                <span className="ml-auto text-[10px] text-rose-600 dark:text-rose-400 font-mono">{authSurveillance?.total_threats || 0} Threats</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                <div className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 font-mono uppercase mb-2">Blocked IPs (Simulated)</p>
                  <div className="flex flex-wrap gap-2">
                    {authSurveillance?.blocked_ips?.slice(0, 4).map((ip: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded text-[10px] font-mono text-rose-600 dark:text-rose-400">{ip}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {authSurveillance?.recent_threats?.slice(0, 5).map((threat: any) => (
                    <div key={threat.id} className="p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-[10px] font-mono">
                      <p className="text-rose-600 dark:text-rose-400 font-bold">{threat.event_type}</p>
                      <p className="text-gray-700 dark:text-slate-400 truncate">{threat.details}</p>
                      <p className="text-gray-500 dark:text-slate-600 mt-1">Target: {threat.target_user}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DATABASE TOPOGRAPHY */}
            <div className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-500/5">
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest font-mono">DB Topography</h2>
                <span className="ml-auto text-[10px] text-blue-600 dark:text-blue-400 font-mono">{dbTopography?.total_records || 0} Records</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                {dbTopography?.tables && Object.entries(dbTopography.tables).map(([table, count]: any) => (
                  <div key={table} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl">
                    <span className="text-xs text-gray-700 dark:text-slate-300 font-mono">{table}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((count / (dbTopography.total_records || 1)) * 100, 100)}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-mono w-12 text-right">{count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-center">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase">Integrity Status</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1">NOMINAL</p>
                </div>
              </div>
            </div>

            {/* ACTIVE SESSIONS */}
            <div className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-500/5">
                <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest font-mono">Active Sessions</h2>
                <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{activeUsers.length} Online</span>
              </div>
              <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-80">
                {activeUsers.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-500 text-center mt-8 font-mono">No active nodes detected</p>
                ) : (
                  activeUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-white font-bold text-[10px] font-mono">{user.username?.charAt(0).toUpperCase()}</div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white font-mono truncate">{user.username}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 font-mono uppercase">{user.role}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-slate-600 font-mono">{user.minutes_ago}m ago</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* === LIVE ACTIVITY TERMINAL === */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest font-mono">Live System Telemetry</h2>
            </div>
            <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 font-mono text-[11px] text-gray-700 dark:text-slate-300">
              {activity.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-600 text-center">Awaiting telemetry...</p>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="flex flex-wrap gap-1 md:gap-3 mb-1 hover:bg-gray-100 dark:hover:bg-slate-900 px-2 py-0.5 rounded">
                    <span className="text-gray-500 dark:text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-emerald-600 dark:text-emerald-400 shrink-0">[{log.user_role?.toUpperCase()}]</span>
                    <span className="text-blue-600 dark:text-blue-400 shrink-0">{log.user}</span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0">-&gt; {log.action}</span>
                    <span className="text-gray-600 dark:text-slate-400 truncate">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
