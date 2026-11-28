import React from "react";
import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Services & Scope",
    body: "WebServicers provides website design, search engine optimization, analytics implementation, and managed digital advertising services as specified in your selected plan or statement of work. Deliverables, timelines, and billing cycles are displayed transparently in your Client Portal.",
  },
  {
    title: "2. Client Responsibilities & Access",
    body: "To launch and optimize campaigns within our 7-day target window, you agree to provide accurate business information, timely feedback, and necessary administrative access to relevant domains, analytics properties, and ad accounts.",
  },
  {
    title: "3. Billing, Renewals & Cancellations",
    body: "Recurring plans are billed monthly or annually in advance in your chosen currency. You may cancel or pause a recurring service with at least 14 days' notice prior to your next billing date from your Client Portal. Ad spend paid directly to third-party networks (Google, Meta, LinkedIn) is governed by their respective terms.",
  },
  {
    title: "4. Intellectual Property",
    body: "Upon full payment of applicable fees, you retain full ownership of custom website code, creative assets, and copy produced specifically for your brand. WebServicers retains ownership of its proprietary internal tooling, templates, and reporting software.",
  },
  {
    title: "5. Limitation of Liability",
    body: "While we apply industry best practices to grow organic rankings and paid media return on ad spend, search engine algorithms and ad auction dynamics are controlled by third parties and cannot be guaranteed. To the maximum extent permitted by law, WebServicers' liability is limited to the fees paid in the preceding three months.",
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 sm:py-20 space-y-8">
      <div className="space-y-3">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Legal
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--ws-text-secondary)]">
          Effective Date: November 1, 2026 • Last Updated: November 26, 2026
        </p>
      </div>

      <div className="surface-card rounded-2xl p-6 sm:p-10 space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              {s.title}
            </h2>
            <p className="text-sm text-[var(--ws-text-secondary)] leading-relaxed">
              {s.body}
            </p>
          </div>
        ))}

        <div className="pt-4 border-t border-[var(--ws-border-color)] text-xs text-[var(--ws-text-secondary)]">
          Questions regarding these Terms? Contact{" "}
          <Link
            href="/contact"
            className="font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            legal@webservicers.com
          </Link>
          .
        </div>
      </div>
    </section>
  );
}
