"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";

const DEPARTMENT_CREDENTIALS = [
  {
    username: "admin",
    password: "admin123",
    role: "Super Admin",
    desc: "Full system access",
  },
  {
    username: "finance_officer",
    password: "finance123",
    role: "Finance",
    desc: "Fee & payment records",
  },
  {
    username: "exam_officer",
    password: "exam123",
    role: "Examinations",
    desc: "Grades & transcripts",
  },
  {
    username: "registry_officer",
    password: "registry123",
    role: "Registry",
    desc: "Student records",
  },
  {
    username: "academic_officer",
    password: "academic123",
    role: "Academic",
    desc: "Course management",
  },
  {
    username: "dean",
    password: "dean123",
    role: "Dean",
    desc: "Faculty oversight",
  },
  {
    username: "internal_auditor",
    password: "auditor123",
    role: "Auditor",
    desc: "Compliance & audit",
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F6F5] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 61, 46, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 61, 46, 0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-900/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-400/[0.08] blur-3xl" />

      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0E3B2E] via-[#2F765A] to-[#C5A44B]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_-30px_rgba(15,23,42,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
          {/* Institutional information panel */}
          <aside className="relative hidden overflow-hidden bg-[#0E3B2E] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />

            <div className="pointer-events-none absolute -right-28 top-12 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-full bg-gradient-to-t from-black/15 to-transparent" />

            <div className="relative">
              <div className="mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <span className="font-serif text-xl font-bold tracking-wider text-[#E1C46C]">
                    KNP
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-wide text-white">
                    Kabete National Polytechnic
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-100/70">
                    Digital Records Office
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E1C46C]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-50/80">
                    Secure institutional portal
                  </span>
                </div>

                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.035em]">
                  Record management,
                  <span className="block text-[#E1C46C]">without the paper maze.</span>
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/70">
                  Access clearance records, certificate collection workflows,
                  academic information, financial approvals and audit activity
                  through one controlled workspace.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-[#E1C46C]"
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
                  <p className="mt-1 text-xs leading-5 text-emerald-50/60">
                    Controlled permissions for every department.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-[#E1C46C]"
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
                  <p className="mt-1 text-xs leading-5 text-emerald-50/60">
                    Track approvals, changes and user activity.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-emerald-50/60">
              <span>Record Management System v2.0</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
                Systems operational
              </span>
            </div>
          </aside>

          {/* Login panel */}
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            {/* Mobile branding */}
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E3B2E] shadow-md shadow-emerald-950/15">
                  <span className="font-serif text-sm font-bold tracking-wider text-[#E1C46C]">
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
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2F765A]">
                    Authorized access
                  </p>

                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your account credentials to continue.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
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
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <span className="text-xs font-bold">!</span>
                  </div>

                  <div>
                    <p className="font-semibold">Unable to sign in</p>
                    <p className="mt-0.5 text-xs leading-5 text-red-600">
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#2F765A]"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2F765A] focus:ring-4 focus:ring-[#2F765A]/10"
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
                      className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#2F765A]"
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
                    className="block h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-16 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2F765A] focus:ring-4 focus:ring-[#2F765A]/10"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition-colors hover:text-[#0E3B2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F765A] focus-visible:ring-offset-2"
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
                    className="h-4 w-4 rounded border-slate-300 text-[#0E3B2E] focus:ring-2 focus:ring-[#2F765A]/30 focus:ring-offset-1"
                  />
                  <span>Remember me</span>
                </label>

                <a
                  href="#"
                  className="font-semibold text-[#1E5B45] transition-colors hover:text-[#0E3B2E] hover:underline hover:underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F765A] focus-visible:ring-offset-2"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0E3B2E] px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#124A39] hover:shadow-xl hover:shadow-emerald-950/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F765A]/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

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

              {/* Public Certificate Verification Link */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center mb-3">
                  Need to verify a certificate?
                </p>
                <Link 
                  href="/verify" 
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify a Certificate
                </Link>
              </div>

              {/* Quick Login Section */}
              <div className="pt-2">
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Prototype access
                    </span>
                  </div>
                </div>

                <div className="mb-3 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Quick Login
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Select a department to autofill its test credentials.
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
                      className="group rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-[#2F765A]/35 hover:bg-[#F1F8F4] hover:text-[#0E3B2E] hover:shadow-md hover:shadow-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F765A] focus-visible:ring-offset-2 active:translate-y-0"
                    >
                      <div>{dept.role}</div>
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
                    className="h-3.5 w-3.5 text-[#2F765A]"
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
