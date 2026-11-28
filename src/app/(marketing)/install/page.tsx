"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Trash2,
  UserCheck,
} from "lucide-react";

type CheckItem = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export default function InstallWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [locked, setLocked] = useState(false);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [serverPath, setServerPath] = useState("/home/webinf/dash.webservicers.com");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: MariaDB form
  const [dbType, setDbType] = useState("MariaDB");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [cronSecret, setCronSecret] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setAppUrl(window.location.origin);
      setAdminEmail(`admin@${window.location.hostname || "yourdomain.com"}`);
    }
  }, []);

  // Step 3: Super Admin form
  const [adminName, setAdminName] = useState("System Administrator");
  const [adminEmail, setAdminEmail] = useState("admin@webservicers.com");
  const [adminPassword, setAdminPassword] = useState("");

  // Step 4: Finalize
  const [deleteInstallerFiles, setDeleteInstallerFiles] = useState(true);
  const [finalized, setFinalized] = useState(false);

  const runChecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/install/check");
      const data = await res.json();
      setLocked(Boolean(data.locked));
      setChecks(data.checks || []);
      setAllPassed(Boolean(data.allPassed));
      if (data.serverPath) setServerPath(data.serverPath);
    } catch {
      setError("Failed to run server requirement checks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const handleDatabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/install/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbType, host, port, database, username, password, appUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ? `${data.error} (${data.detail})` : data.error || "Database setup failed.");
        return;
      }
      if (data.cronSecret) setCronSecret(data.cronSecret);
      setStep(3);
    } catch {
      setError("Network error while configuring database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/install/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: adminName, email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ? `${data.error} (${data.detail})` : data.error || "Failed to create Super Admin.");
        return;
      }
      setStep(4);
    } catch {
      setError("Network error while creating Super Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/install/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, domain: appUrl, deleteInstallerFiles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to finalize installation.");
        return;
      }
      setFinalized(true);
      setLocked(true);
    } catch {
      setError("Network error while finalizing installation.");
    } finally {
      setSubmitting(false);
    }
  };

  const cronCliCommand = `/usr/local/bin/node ${serverPath}/scripts/cpanel-cron.mjs >/dev/null 2>&1`;
  const cronCurlCommand = `curl -s -X POST "${appUrl}/api/cron/tick${cronSecret ? `?secret=${cronSecret}` : ""}" >/dev/null 2>&1`;

  if (!loading && locked && !finalized) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="surface-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef0ff] text-[#5b62d4]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="display-title text-2xl text-[#14232b]">Installer is Locked</h1>
          <p className="mt-2 text-sm text-[#535862]">
            WebServicers is already installed and locked on this server. To re-run the installer, remove{" "}
            <code className="rounded bg-[#f3f2ee] px-1.5 py-0.5 text-xs">storage/.install-locked</code> via cPanel File Manager or Terminal.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full bg-[#181c1f] px-6 text-sm font-semibold text-white"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full border border-[#ddd3c5] bg-white px-6 text-sm font-semibold text-[#14232b]"
            >
              Visit Homepage
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <span className="font-mono-label inline-flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3 py-1 text-[#5b62d4]">
          <Server className="h-3.5 w-3.5" /> cPanel Auto-Installer
        </span>
        <h1 className="display-title mt-3 text-3xl text-[#14232b] sm:text-4xl">
          WebServicers Setup Wizard
        </h1>
        <p className="mt-2 text-sm text-[#535862]">
          Configure MariaDB, push tables, create your Super Admin, and set up cPanel Cron Jobs.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 grid grid-cols-4 gap-2">
        {[
          { n: 1, label: "Requirements" },
          { n: 2, label: "MariaDB Setup" },
          { n: 3, label: "Super Admin" },
          { n: 4, label: "Cron & Finish" },
        ].map((item) => (
          <div
            key={item.n}
            className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
              step === item.n
                ? "border-[#5b62d4] bg-[#eef0ff] text-[#4b58b5]"
                : step > item.n
                  ? "border-[#c8ecdf] bg-[#ecfcf6] text-[#087858]"
                  : "border-[#ddd3c5]/70 bg-white/70 text-[#535862]"
            }`}
          >
            {item.n}. {item.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: REQUIREMENTS */}
      {step === 1 && (
        <div className="surface-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-[#ddd3c5]/60 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#14232b]">1. Server Environment Check</h2>
              <p className="text-xs text-[#535862]">Path: {serverPath}</p>
            </div>
            <button
              type="button"
              onClick={runChecks}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd3c5] bg-white px-3 py-1.5 text-xs font-semibold text-[#14232b] hover:bg-[#f7f7f9]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-check
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {checks.map((chk) => (
              <div
                key={chk.id}
                className="flex items-center justify-between rounded-xl border border-[#ddd3c5]/60 bg-white/80 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {chk.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#087858]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[#14232b]">{chk.label}</div>
                    <div className="text-xs text-[#535862]">{chk.detail}</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    chk.passed ? "bg-[#e8fbf4] text-[#087858]" : "bg-red-100 text-red-700"
                  }`}
                >
                  {chk.passed ? "Passed" : "Action Needed"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={!allPassed || loading}
              onClick={() => setStep(2)}
              className="inline-flex h-11 items-center rounded-full bg-[#181c1f] px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continue to MariaDB Setup →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MARIADB */}
      {step === 2 && (
        <form onSubmit={handleDatabaseSubmit} className="surface-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-[#ddd3c5]/60 pb-4">
            <Database className="h-5 w-5 text-[#5b62d4]" />
            <div>
              <h2 className="text-lg font-semibold text-[#14232b]">2. MariaDB / MySQL Configuration</h2>
              <p className="text-xs text-[#535862]">
                Create a database & user in cPanel → MySQL® Databases, then enter them below.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Database Server Type</label>
              <select
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              >
                <option value="MariaDB">MariaDB 10.6+ (cPanel Default)</option>
                <option value="MySQL">MySQL 8.0+</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Live Domain URL</label>
              <input
                type="url"
                required
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Database Host</label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Port</label>
              <input
                type="text"
                required
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Database Name</label>
              <input
                type="text"
                required
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="webinf_webservicers"
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Database Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="webinf_dbuser"
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Database Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your cPanel database user password"
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-[#ddd3c5] bg-white px-5 py-2.5 text-sm font-semibold text-[#14232b]"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center rounded-full bg-[#181c1f] px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Connecting & Pushing Schema..." : "Test Connection & Install Tables →"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUPER ADMIN */}
      {step === 3 && (
        <form onSubmit={handleAdminSubmit} className="surface-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-[#ddd3c5]/60 pb-4">
            <UserCheck className="h-5 w-5 text-[#5b62d4]" />
            <div>
              <h2 className="text-lg font-semibold text-[#14232b]">3. Create Super Admin Account</h2>
              <p className="text-xs text-[#535862]">
                This account will have full Super Admin access to {appUrl}/admin.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Full Name</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Super Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14232b]">Password (min. 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full rounded-xl border border-[#ddd3c5] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-[#ddd3c5] bg-white px-5 py-2.5 text-sm font-semibold text-[#14232b]"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center rounded-full bg-[#181c1f] px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Creating Super Admin..." : "Save Super Admin & Continue →"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: CRON, CLEANUP & FINALIZE */}
      {step === 4 && (
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#ddd3c5]/60 pb-4">
            <Clock className="h-5 w-5 text-[#087858]" />
            <div>
              <h2 className="text-lg font-semibold text-[#14232b]">4. Cron Jobs, Cleanup & Go Live</h2>
              <p className="text-xs text-[#535862]">
                Add one of these cron commands in cPanel → Cron Jobs (Every Minute: <code className="font-mono">* * * * *</code>).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#ddd3c5]/70 bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#14232b]">
                <Terminal className="h-4 w-4 text-[#5b62d4]" />
                Option A — cPanel Node CLI Cron (Recommended)
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[#181c1f] p-3 font-mono text-xs text-[#85ecce]">
                {cronCliCommand}
              </pre>
            </div>

            <div className="rounded-xl border border-[#ddd3c5]/70 bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#14232b]">
                <Clock className="h-4 w-4 text-[#5b62d4]" />
                Option B — cPanel HTTP Cron (curl)
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[#181c1f] p-3 font-mono text-xs text-[#bec2ff]">
                {cronCurlCommand}
              </pre>
            </div>

            <div className="rounded-xl border border-[#ddd3c5]/70 bg-[#fcfbf7] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#14232b]">
                <Trash2 className="h-4 w-4 text-amber-600" />
                Optional Terminal Cleanup Command
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[#181c1f] p-3 font-mono text-xs text-white/90">
                {`rm -f ${serverPath}/Cpanel_dash_Webservicers_NextZen.zip ${serverPath}/CPANEL_INSTALL_GUIDE.md`}
              </pre>
            </div>
          </div>

          {!finalized ? (
            <>
              <label className="flex items-center gap-2.5 text-sm text-[#14232b]">
                <input
                  type="checkbox"
                  checked={deleteInstallerFiles}
                  onChange={(e) => setDeleteInstallerFiles(e.target.checked)}
                  className="h-4 w-4 rounded border-[#ddd3c5]"
                />
                Automatically delete uploaded deployment ZIP & guide files from server on finish
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalize}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#087858] px-7 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {submitting ? "Locking Installer..." : "Lock Installer & Launch Website"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[#c8ecdf] bg-[#ecfcf6] p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#087858]" />
              <h3 className="mt-2 text-base font-semibold text-[#087858]">
                Installation Complete & Locked!
              </h3>
              <p className="mt-1 text-xs text-[#087858]/90">
                Restart your Node.js App once in cPanel so it loads the new `.env`, then sign in with{" "}
                <strong>{adminEmail}</strong>.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-full bg-[#181c1f] px-6 text-xs font-semibold text-white"
                >
                  Sign In to Admin →
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-10 items-center rounded-full border border-[#087858]/30 bg-white px-6 text-xs font-semibold text-[#087858]"
                >
                  Open Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
