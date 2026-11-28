"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Cookie, ShieldCheck } from "lucide-react";

export default function CookieSettingsPage() {
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  function savePreferences(allAccepted?: boolean) {
    if (allAccepted) {
      setAnalytics(true);
      setFunctional(true);
      setMarketing(true);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 sm:py-20 space-y-8">
      <div className="space-y-3">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Privacy Controls
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Cookie Settings
        </h1>
        <p className="text-base text-[var(--ws-text-secondary)]">
          Control how WebServicers uses cookies and local storage to power your
          session and measure site performance.
        </p>
      </div>

      <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Essential */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--ws-border-color)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
                Strictly Necessary Cookies
              </h2>
            </div>
            <p className="text-xs text-[var(--ws-text-secondary)] leading-relaxed">
              Required for authentication, CSRF protection, and core portal
              navigation. Cannot be disabled.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shrink-0">
            Always Active
          </span>
        </div>

        {/* Functional */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--ws-border-color)]">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
              Functional Preferences
            </h2>
            <p className="text-xs text-[var(--ws-text-secondary)] leading-relaxed">
              Remembers your preferred currency, language, and SEO tool inputs
              between visits.
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={functional}
              onChange={(e) => setFunctional(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)]"
            />
          </label>
        </div>

        {/* Analytics */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--ws-border-color)]">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
              Performance &amp; Analytics
            </h2>
            <p className="text-xs text-[var(--ws-text-secondary)] leading-relaxed">
              Helps us understand which marketing playbooks and free SEO tools
              are most useful.
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)]"
            />
          </label>
        </div>

        {/* Marketing */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
              Advertising &amp; Attribution
            </h2>
            <p className="text-xs text-[var(--ws-text-secondary)] leading-relaxed">
              Used to measure campaign effectiveness and avoid showing irrelevant
              ads.
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--ws-border-color)] text-[var(--ws-brand-lilac-deep)]"
            />
          </label>
        </div>

        {savedNotice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            Your cookie preferences have been saved.
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => savePreferences(false)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors cursor-pointer"
            >
              <Cookie className="h-4 w-4" />
              Save Preferences
            </button>
            <button
              type="button"
              onClick={() => savePreferences(true)}
              className="inline-flex items-center rounded-full border border-[var(--ws-border-color)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors cursor-pointer"
            >
              Accept All
            </button>
          </div>
          <Link
            href="/privacy"
            className="text-xs font-medium text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
