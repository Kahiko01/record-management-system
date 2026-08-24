"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, User, Eye, EyeOff, Minimize2, Maximize2 } from "lucide-react";

const DEPARTMENT_CREDENTIALS = [
  { username: "admin", password: "admin123", role: "Super Admin", icon: "👑" },
  { username: "finance_officer", password: "finance123", role: "Finance", icon: "💰" },
  { username: "exam_officer", password: "exam123", role: "Examinations", icon: "📝" },
  { username: "registry_officer", password: "registry123", role: "Registry", icon: "📋" },
  { username: "dean", password: "dean123", role: "Dean", icon: "🎓" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMinimized, setIsMinimized] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <main className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-8" style={{ backgroundImage: "url('/login-bg.webp')" }}>
      <div className="absolute inset-0 bg-slate-900/30" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <section className={`relative w-full rounded-2xl border border-white/25 bg-white/90 shadow-xl shadow-black/15 backdrop-blur-md transition-all duration-500 ease-in-out ${isMinimized ? "p-6 max-w-sm" : "p-6 sm:p-8"}`}>

          {/* Minimize/Expand Toggle Button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition z-10"
            title={isMinimized ? "Expand login form" : "Minimize to see background"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>

          {isMinimized ? (
            /* --- MINIMIZED VIEW --- */
            <div className="text-center space-y-6 pt-4">
              <div className="mb-4 flex justify-center">
                <img src="/knp-logo.png" alt="KNP Logo" className="h-20 w-auto object-contain drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">KNP Record Management</h1>
                <p className="mt-1 text-sm text-slate-500">Secure institutional portal</p>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsMinimized(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <User className="h-4 w-4" /> Sign In
                </button>
                <Link
                  href="/verify"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ShieldCheck className="h-4 w-4" /> Verify a Certificate
                </Link>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span suppressHydrationWarning>{currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="text-slate-300">·</span>
                <span className="tabular-nums text-slate-700" suppressHydrationWarning>{formatTime(currentTime)}</span>
              </div>
            </div>
          ) : (
            /* --- FULL LOGIN FORM VIEW --- */
            <>
              {/* Header */}
              <div className="mb-2 text-center">
                {/* Negative margin pulls the logo up to touch the top edge without expanding the card */}
                <div className="flex justify-center -mt-8 mb-1">
                  <img src="/knp-logo.png" alt="KNP Logo" className="h-20 w-auto object-contain drop-shadow-md" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  KNP Record Management System
                </h1>
                <p className="mt-1 text-sm text-slate-500">Sign in with your credentials</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span suppressHydrationWarning>
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums text-slate-700" suppressHydrationWarning>
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                    <p className="font-medium">Unable to sign in</p>
                    <p className="mt-0.5 text-xs text-rose-600">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400" aria-hidden="true">
                        <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block h-11 w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-slate-700 focus:ring-slate-300" />
                    <span className="text-xs">Remember me</span>
                  </label>
                  <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in...</>
                  ) : "Sign in"}
                </button>

                <Link href="/verify" className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <ShieldCheck className="h-4 w-4" /> Verify a Certificate
                </Link>

                <div className="pt-1">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">Quick login</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {DEPARTMENT_CREDENTIALS.map((dept) => {
                      const isActive = username === dept.username;
                      return (
                        <button
                          key={dept.username}
                          type="button"
                          onClick={() => fillCredentials(dept.username, dept.password)}
                          className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition ${isActive ? "border-slate-400 bg-slate-100 text-slate-900" : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                        >
                          <span className="text-sm leading-none opacity-80">{dept.icon}</span>
                          <span className="truncate font-medium">{dept.role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="pt-3 text-center text-[10px] text-slate-400">© 2026 KNP · Record Management System v2.0</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
