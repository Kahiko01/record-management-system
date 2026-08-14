"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, User } from "lucide-react";

// Department credentials with an added color for each role
const DEPARTMENT_CREDENTIALS = [
  {
    username: "admin",
    password: "admin123",
    role: "Super Admin",
    desc: "Full system access",
    icon: "👑",
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50 border-red-200",
    hover: "hover:border-red-300 hover:bg-red-100",
    active: "border-red-500 bg-red-100 text-red-700",
  },
  {
    username: "finance_officer",
    password: "finance123",
    role: "Finance",
    desc: "Fee & payment records",
    icon: "💰",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-200",
    hover: "hover:border-emerald-300 hover:bg-emerald-100",
    active: "border-emerald-500 bg-emerald-100 text-emerald-700",
  },
  {
    username: "exam_officer",
    password: "exam123",
    role: "Examinations",
    desc: "Grades & transcripts",
    icon: "📝",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-200",
    hover: "hover:border-blue-300 hover:bg-blue-100",
    active: "border-blue-500 bg-blue-100 text-blue-700",
  },
  {
    username: "registry_officer",
    password: "registry123",
    role: "Registry",
    desc: "Student records",
    icon: "📋",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 border-purple-200",
    hover: "hover:border-purple-300 hover:bg-purple-100",
    active: "border-purple-500 bg-purple-100 text-purple-700",
  },
  {
    username: "dean",
    password: "dean123",
    role: "Dean",
    desc: "Faculty oversight",
    icon: "🎓",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 border-amber-200",
    hover: "hover:border-amber-300 hover:bg-amber-100",
    active: "border-amber-500 bg-amber-100 text-amber-700",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Login failed. Please verify your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSelectedUserInfo = () => {
    if (!username) return null;
    const found = DEPARTMENT_CREDENTIALS.find(
      (dept) => dept.username === username
    );
    return found || null;
  };

  const selectedUser = getSelectedUserInfo();

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 px-4 py-8 sm:px-6 lg:px-8">
      {/* Animated floating orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-300/30 to-purple-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tl from-amber-300/20 to-rose-300/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left Panel - now with a rich gradient and colorful accents */}
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div
              className="pointer-events-none absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Decorative glowing circles */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
            <div className="pointer-events-none absolute right-10 top-1/2 h-48 w-48 rounded-full bg-pink-400/10 blur-2xl" />

            <div className="relative">
              <div className="mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 shadow-xl shadow-black/20 backdrop-blur-sm">
                  <span className="font-serif text-xl font-bold tracking-wider text-amber-300">
                    KNP
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-wide text-white">
                    Kabete National Polytechnic
                  </p>
                  <p className="mt-0.5 text-xs text-indigo-200/70">
                    Digital Records Office
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                    Secure institutional portal
                  </span>
                </div>

                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.035em]">
                  Record management,
                  <span className="block bg-gradient-to-r from-amber-200 to-pink-300 bg-clip-text text-transparent">
                    without the paper maze.
                  </span>
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100/70">
                  Access clearance records, certificate collection workflows,
                  academic information, financial approvals and audit activity
                  through one controlled workspace.
                </p>
              </div>

              {/* Active User Display - now with gradient border and colorful background */}
              {selectedUser && (
                <div className="mt-8 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-sm shadow-lg shadow-black/10 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-pink-400/30 text-3xl shadow-lg shadow-black/20">
                      {selectedUser.icon || "👤"}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-200/70">
                        Active Session
                      </p>
                      <p className="text-lg font-bold text-white">
                        {selectedUser.role}
                      </p>
                      <p className="text-sm text-indigo-200/60">
                        @{selectedUser.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ready to sign in</span>
                  </div>
                </div>
              )}

              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition hover:bg-white/10">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-amber-300"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3 5 6v5c0 4.6 2.9 8.8 7 10 4.1-1.2 7-5.4 7-10V6l-7-3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m9 12 2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-semibold">Role-based access</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-100/60">
                    Controlled permissions for every department.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition hover:bg-white/10">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-amber-300"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 18V9m5 9V5m5 13v-7m5 7V3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-semibold">Complete audit trail</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-100/60">
                    Track approvals, changes and user activity.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-indigo-200/60">
              <span>Record Management System v2.0</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
                Systems operational
              </span>
            </div>
          </aside>

          {/* Right Panel - Login form with colorful accents */}
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            {/* Mobile branding */}
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-950/15">
                  <span className="font-serif text-sm font-bold tracking-wider text-amber-300">
                    KNP
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Record Management System
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Secure institutional portal
                  </p>
                </div>
              </div>

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="mb-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                    Authorized access
                  </p>

                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your account credentials to continue.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-[11px] text-slate-500 backdrop-blur-sm shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span suppressHydrationWarning>
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <span className="text-slate-300">•</span>

                  <span
                    className="font-medium tabular-nums text-slate-700"
                    suppressHydrationWarning
                  >
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 backdrop-blur-sm px-4 py-3.5 text-sm text-rose-700"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <span className="text-xs font-bold">!</span>
                  </div>

                  <div>
                    <p className="font-semibold">Unable to sign in</p>
                    <p className="mt-0.5 text-xs leading-5 text-rose-600">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                  </div>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block h-12 w-full rounded-xl border border-slate-300 bg-white/70 py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 backdrop-blur-sm"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block h-12 w-full rounded-xl border border-slate-300 bg-white/70 py-3 pl-12 pr-16 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Remember and forgot password */}
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2.5 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-1"
                  />
                  <span>Remember me</span>
                </label>

                <a
                  href="#"
                  className="font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline hover:underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit button - now with gradient and colorful hover */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12h14m-5-5 5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Public Certificate Verification Link - now with gradient and more colorful */}
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <p className="text-xs text-slate-500 text-center mb-3">
                  Need to verify a certificate?
                </p>
                <Link
                  href="/verify"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 text-indigo-700 font-semibold text-sm hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify a Certificate
                </Link>
              </div>

              {/* Quick Login Section - now with colored buttons per department */}
              <div className="pt-2">
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/60" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-white/70 backdrop-blur-sm px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Quick login
                    </span>
                  </div>
                </div>

                <div className="mb-3 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Select a department
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Click to autofill test credentials
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENT_CREDENTIALS.map((dept) => (
                    <button
                      key={dept.username}
                      type="button"
                      onClick={() =>
                        fillCredentials(dept.username, dept.password)
                      }
                      className={`group rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:translate-y-0 ${
                        username === dept.username
                          ? `${dept.active} shadow-md`
                          : `border-slate-200 bg-white/50 text-slate-700 backdrop-blur-sm ${dept.hover}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{dept.icon}</span>
                        <span>{dept.role}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] font-normal leading-4 text-slate-400 transition-colors group-hover:text-slate-500">
                        {dept.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <footer className="pt-3 text-center">
                <p className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-3.5 w-3.5 text-indigo-500"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Protected institutional access
                </p>

                <p className="mt-1.5 text-[10px] text-slate-400">
                  © 2026 KNP Institution · Record Management System v2.0
                </p>
              </footer>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
