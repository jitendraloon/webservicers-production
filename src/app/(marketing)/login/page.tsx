"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

type SsoProvider = "google" | "microsoft" | "github";

export default function MarketingLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoNotice, setSsoNotice] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSsoNotice(null);

    if (!captchaVerified) {
      setError("Please complete the human verification check below.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          ...(showTotp && totpCode.trim() ? { totpCode: totpCode.trim() } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data.detail ? `${data.error} — ${data.detail}` : (data.error || "Invalid credentials. Please try again.");
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const role = data.user?.role;
      if (role === "ADMIN" || role === "STAFF" || data.redirectTo === "/admin") {
        router.push("/admin");
      } else {
        router.push(data.redirectTo || "/dashboard");
      }
    } catch {
      setError("Unable to reach authentication server. Please try again.");
      setLoading(false);
    }
  }

  function handleSsoClick(provider: SsoProvider) {
    setError(null);
    const label =
      provider === "google"
        ? "Google"
        : provider === "microsoft"
        ? "Microsoft"
        : "GitHub";
    setSsoNotice(
      `${label} SSO is ready to connect once OAuth credentials are configured in Admin Settings.`
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: Value / Trust Panel */}
        <div className="lg:col-span-5 space-y-6">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Client &amp; Workspace SSO
          </span>
          <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Sign in to{" "}
            <span className="hero-emphasis">WebServicers</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--ws-text-secondary)] leading-relaxed">
            Access your active campaigns, live SEO rank tracker, invoices,
            support tickets, and team deliverables in one unified portal.
          </p>

          <div className="surface-card rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--ws-brand-lilac-deep)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  Enterprise-Grade Session Security
                </p>
                <p className="text-xs text-[var(--ws-text-secondary)] mt-1">
                  Protected with HTTP-only signed sessions, optional TOTP 2FA,
                  and role-based workspace access.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  Single Login for All 13+ Channels
                </p>
                <p className="text-xs text-[var(--ws-text-secondary)] mt-1">
                  Manage websites, organic SEO, Google &amp; Meta Ads, and
                  monthly billing without switching tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="lg:col-span-7">
          <div className="surface-card rounded-2xl p-6 sm:p-10">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
                Welcome back
              </h2>
              <p className="text-sm text-[var(--ws-text-secondary)] mt-1">
                Continue with your SSO provider or enter your workspace
                credentials.
              </p>
            </div>

            {/* OAuth SSO Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSsoClick("google")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] hover:bg-[var(--ws-background-warm)] transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSsoClick("microsoft")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] hover:bg-[var(--ws-background-warm)] transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#00A4EF" d="M1 13h10v10H1z" />
                  <path fill="#7FBA00" d="M13 1h10v10H13z" />
                  <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
                Microsoft
              </button>

              <button
                type="button"
                onClick={() => handleSsoClick("github")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] hover:bg-[var(--ws-background-warm)] transition-colors cursor-pointer"
              >
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </button>
            </div>

            {ssoNotice && (
              <div className="mt-4 rounded-xl border border-[var(--ws-brand-lilac)] bg-[var(--ws-brand-lilac-soft)]/50 px-4 py-3 text-xs text-[var(--ws-brand-lilac-deep)]">
                {ssoNotice}
              </div>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--ws-border-color)]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--ws-text-secondary)]">
                or sign in with email
              </span>
              <div className="h-px flex-1 bg-[var(--ws-border-color)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {forgotNotice && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
                  To reset your password, contact{" "}
                  <Link href="/help" className="underline font-semibold">
                    Workspace Support
                  </Link>{" "}
                  or your organization administrator.
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                >
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-[var(--ws-text-primary)]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNotice((prev) => !prev)}
                    className="text-xs font-medium text-[var(--ws-brand-lilac-deep)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-10 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Optional 2FA TOTP */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTotp((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-brand-lilac-deep)] cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {showTotp
                    ? "Hide 2FA authenticator code"
                    : "Have a 2FA authenticator code? (Optional)"}
                </button>

                {showTotp && (
                  <div className="mt-2">
                    <input
                      id="login-totp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) =>
                        setTotpCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="6-digit TOTP code"
                      className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 font-mono text-sm tracking-widest text-[var(--ws-text-primary)] placeholder:tracking-normal placeholder:font-sans placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                    />
                  </div>
                )}
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 text-xs text-[var(--ws-text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)] focus:ring-[var(--ws-brand-lilac-deep)]"
                />
                Keep me signed in on this device for 30 days
              </label>

              {/* Captcha Widget Placeholder */}
              <div className="rounded-xl border border-[var(--ws-border-color)] bg-[var(--ws-background-warm)] px-4 py-3 flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={captchaVerified}
                    onChange={(e) => setCaptchaVerified(e.target.checked)}
                    className="h-5 w-5 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)] focus:ring-[var(--ws-brand-lilac-deep)]"
                  />
                  <span className="text-sm font-medium text-[var(--ws-text-primary)]">
                    Verify you are human
                  </span>
                </label>
                <div className="text-right">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ws-text-secondary)]">
                    Captcha Shield
                  </span>
                  <span className="block text-[10px] text-[var(--ws-text-secondary)]">
                    Turnstile / reCAPTCHA
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign In to Workspace"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--ws-text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
