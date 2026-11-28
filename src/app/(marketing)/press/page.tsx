import React from "react";
import Link from "next/link";
import { ArrowRight, Download, Mail, Newspaper } from "lucide-react";

const PRESS_RELEASES = [
  {
    date: "November 2026",
    title: "WebServicers Launches Unified 13-Channel Client Portal & SEO Workspace",
    summary:
      "Businesses can now manage website builds, technical SEO, and multi-channel paid ads from one real-time dashboard.",
  },
  {
    date: "September 2026",
    title: "WebServicers Expands Server-Side Analytics & GA4 Attribution Practice",
    summary:
      "New first-party tracking pipelines help B2B and eCommerce brands recover up to 28% of dark-funnel conversion signals.",
  },
  {
    date: "June 2026",
    title: "Annual Digital Growth Benchmark Report Released",
    summary:
      "Analysis of 400+ mid-market campaigns reveals how combining technical SEO with paid search lowers blended CAC by 22%.",
  },
];

export default function PressPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-12">
      <div className="max-w-3xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Press &amp; Media Kit
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Newsroom &amp;{" "}
          <span className="hero-emphasis">Brand Resources</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
          Official announcements, leadership commentary, and brand assets for
          journalists, analysts, and event partners.
        </p>
      </div>

      {/* Media Contact & Brand Kit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
            Media Inquiries
          </h2>
          <p className="text-sm text-[var(--ws-text-secondary)]">
            For interviews, commentary on SEO/paid media trends, or speaking
            requests, contact our communications desk at{" "}
            <span className="font-semibold text-[var(--ws-text-primary)]">
              press@webservicers.com
            </span>
            .
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            Contact Communications Team
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center">
            <Download className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
            Official Brand Kit
          </h2>
          <p className="text-sm text-[var(--ws-text-secondary)]">
            Includes vector SVG wordmarks, dark/light icon badges, executive
            headshots, and product UI screenshots for editorial use.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            View Company Fact Sheet
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
          Recent Announcements
        </h2>
        <div className="space-y-4">
          {PRESS_RELEASES.map((item) => (
            <div key={item.title} className="surface-card rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--ws-brand-lilac-deep)]">
                <Newspaper className="h-3.5 w-3.5" />
                <span>{item.date}</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--ws-text-secondary)]">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
