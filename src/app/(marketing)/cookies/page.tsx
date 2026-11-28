import React from "react";
import Link from "next/link";
import { Cookie, Shield, Check, Info, ArrowLeft, Sliders } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — WebServicers",
  description: "Learn how WebServicers uses cookies and manage your cookie preferences.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--ws-bg)] text-[var(--ws-text-primary)]">
      {/* Top Banner */}
      <div className="border-b border-[var(--ws-border-color)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-[var(--ws-brand-lilac-deep)] dark:bg-violet-950/50">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ws-text-primary)]">
                Cookie Policy & Preferences
              </h1>
              <p className="text-xs text-[var(--ws-text-secondary)]">Last updated: November 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Intro */}
        <section className="prose prose-sm dark:prose-invert max-w-none text-sm text-[var(--ws-text-secondary)] leading-relaxed">
          <p>
            WebServicers (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) uses cookies and similar tracking technologies
            to provide, protect, and improve our services, user portals, and marketing websites. This Cookie Policy explains
            what cookies are, how we use them, and how you can exercise control over them.
          </p>
        </section>

        {/* Categories of Cookies */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--ws-text-primary)] flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[var(--ws-brand-lilac-deep)]" />
            Categories of Cookies We Use
          </h2>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-base text-[var(--ws-text-primary)]">Essential & Strictly Necessary</h3>
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 text-xs font-semibold">
                  Always Active
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
                These cookies are strictly required to provide core website functionality, user authentication, customer session security, CSRF protection, and billing gateway communication.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-base text-[var(--ws-text-primary)]">Analytics & Performance</h3>
                </div>
                <span className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-3 py-1 text-xs font-semibold">
                  Optional
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
                Allow us to analyze visitor journeys, calculate page load performance, track error rates, and optimize our digital growth tooling. Data collected is aggregated and anonymized.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cookie className="h-5 w-5 text-violet-500" />
                  <h3 className="font-semibold text-base text-[var(--ws-text-primary)]">Marketing & Ad Attribution</h3>
                </div>
                <span className="rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 px-3 py-1 text-xs font-semibold">
                  Optional
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
                Used to deliver relevant campaign promotions, measure referral affiliate commissions, and prevent repetitive advertising across external search and social platforms.
              </p>
            </div>
          </div>
        </section>

        {/* Browser Settings */}
        <section className="rounded-2xl border border-[var(--ws-border-color)] bg-zinc-50 dark:bg-zinc-900/50 p-6">
          <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">How to Manage via Browser Settings</h2>
          <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
            You can configure or delete cookies directly within your web browser settings (Chrome, Safari, Firefox, Edge).
            Please note that disabling strictly necessary cookies may prevent access to authenticated customer dashboard areas and checkout workflows.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <Link href="/privacy" className="text-[var(--ws-brand-lilac-deep)] hover:underline font-medium">
              Read our Privacy Policy →
            </Link>
            <Link href="/terms" className="text-[var(--ws-brand-lilac-deep)] hover:underline font-medium">
              Terms of Service →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
