"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

type SsoProvider = "google" | "microsoft" | "github";

export default function MarketingRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoNotice, setSsoNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSsoNotice(null);

    if (name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard");
      }, 900);
    } catch {
      setError("Unable to reach registration server. Please try again.");
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
      `${label} SSO sign-up will be active once OAuth credentials are configured in Admin Settings.`
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: Onboarding Highlights */}
        <div className="lg:col-span-5 space-y-6">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Get Started
          </span>
          <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Create your{" "}
            <span className="hero-emphasis">WebServicers</span> account
          </h1>
          <p className="text-base sm:text-lg text-[var(--ws-text-secondary)] leading-relaxed">
            Launch your unified marketing workspace in under a minute. Order
            services, track live campaign metrics, and collaborate with your
            dedicated growth strategist.
          </p>

          <ul className="space-y-3 text-sm text-[var(--ws-text-secondary)]">
            {[
              "Transparent project milestones & live deliverables",
              "Real-time SEO rank tracking & site health audits",
              "Unified billing, multi-currency wallet & invoices",
              "Direct messaging with your assigned specialists",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--ws-brand-lilac-deep)] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Registration Card */}
        <div className="lg:col-span-7">
          <div className="surface-card rounded-2xl p-6 sm:p-10">
            {success ? (
              <div className="py-10 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
                  Workspace Ready!
                </h2>
                <p className="text-sm text-[var(--ws-text-secondary)] max-w-sm mx-auto">
                  Your WebServicers account has been created. Redirecting you to
                  your client dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
                    Start your workspace
                  </h2>
                  <p className="text-sm text-[var(--ws-text-secondary)] mt-1">
                    Sign up with SSO or your work email address.
                  </p>
                </div>

                {/* OAuth SSO Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSsoClick("google")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] hover:bg-[var(--ws-background-warm)] transition-colors cursor-pointer"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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
                    or register with email
                  </span>
                  <div className="h-px flex-1 bg-[var(--ws-border-color)]" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-10 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
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

                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-confirm-password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-[var(--ws-text-secondary)] cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)] focus:ring-[var(--ws-brand-lilac-deep)]"
                    />
                    <span>
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="font-medium text-[var(--ws-brand-lilac-deep)] hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium text-[var(--ws-brand-lilac-deep)] hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? "Creating workspace..." : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--ws-text-secondary)]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
