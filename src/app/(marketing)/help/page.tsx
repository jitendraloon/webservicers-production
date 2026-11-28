"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, HelpCircle, LifeBuoy, Search } from "lucide-react";

const FAQS = [
  {
    category: "Onboarding",
    q: "How fast can WebServicers launch my website or campaign?",
    a: "Most standard website builds and managed search/social campaigns launch within 7 business days after kickoff and brief completion.",
  },
  {
    category: "Billing",
    q: "Are ad spend budgets included in the monthly service fee?",
    a: "Your media budget is paid directly to Google, Meta, or LinkedIn (or billed transparently with zero hidden markup) while our retainer covers strategy, creative, optimization, and reporting.",
  },
  {
    category: "Account & SSO",
    q: "How do I reset my password or enable 2FA?",
    a: "You can enable TOTP two-factor authentication inside your Client Dashboard security settings. For password resets, use the Contact desk or ask your workspace admin.",
  },
  {
    category: "Contracts",
    q: "Am I locked into a 12-month contract?",
    a: "No. All standard monthly growth plans operate month-to-month with a simple 14-day cancellation or pause notice.",
  },
  {
    category: "Reporting",
    q: "What metrics are included in my client portal?",
    a: "Your portal tracks keyword rankings, site health scores, ad spend, conversions, CPA/ROAS, open deliverables, and itemized invoices in real time.",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20 space-y-10">
      <div className="max-w-2xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Help Center
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          How can we{" "}
          <span className="hero-emphasis">help you today?</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
          Answers on onboarding, billing, client portal access, and campaign
          reporting.
        </p>

        <div className="relative pt-2">
          <Search className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-4 top-1/2 -translate-y-1/2 mt-1" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles (e.g. billing, 2FA, launch)..."
            className="w-full rounded-full border border-[var(--ws-border-color)] bg-white pl-11 pr-5 py-3 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
          />
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="surface-card rounded-2xl p-8 text-center space-y-2">
            <HelpCircle className="h-7 w-7 text-[var(--ws-brand-lilac-deep)] mx-auto" />
            <p className="text-sm font-medium text-[var(--ws-text-primary)]">
              No matching help topics found.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={faq.q} className="surface-card rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--ws-brand-lilac-deep)]">
                      {faq.category}
                    </span>
                    <h2 className="text-base font-semibold text-[var(--ws-text-primary)] mt-0.5">
                      {faq.q}
                    </h2>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--ws-text-secondary)] shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[var(--ws-text-secondary)] leading-relaxed border-t border-[var(--ws-border-color)] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support CTA */}
      <div className="surface-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--ws-text-primary)]">
              Still need a hand?
            </h3>
            <p className="text-sm text-[var(--ws-text-secondary)]">
              Open a ticket in your client portal or send a message to our
              support desk.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
          >
            Contact Support
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
