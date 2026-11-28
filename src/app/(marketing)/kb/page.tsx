import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  FileQuestion,
  CreditCard,
  Settings,
  Share2,
} from "lucide-react";

export const metadata = {
  title: "Knowledge Base & Docs — WebServicers",
  description: "Explore tutorials, guides, API documentation, and help articles for WebServicers platforms and tools.",
};

const KB_CATEGORIES = [
  {
    title: "Getting Started",
    icon: Sparkles,
    articles: [
      { title: "Client Onboarding & Project Setup", slug: "onboarding" },
      { title: "Navigating Your Unified Client Portal", slug: "portal-overview" },
      { title: "Connecting Google Search Console & GA4", slug: "integrations-gsc-ga4" },
    ],
  },
  {
    title: "SEO Suite & AI Visibility",
    icon: Layers,
    articles: [
      { title: "Understanding Your SEO Health Score", slug: "health-score-guide" },
      { title: "Tracking AI Mentions & Citation Share", slug: "ai-visibility-tracking" },
      { title: "Using the Keyword Intelligence Explorer", slug: "keyword-explorer-tutorial" },
      { title: "Generating Technical Site Audits", slug: "site-audits-troubleshooting" },
    ],
  },
  {
    title: "Billing & Subscriptions",
    icon: CreditCard,
    articles: [
      { title: "Managing Payment Methods & Gateways", slug: "payment-methods" },
      { title: "Downloading Invoices & Tax Statements", slug: "invoices-receipts" },
      { title: "Adding Funds to Your Client Wallet", slug: "wallet-topup" },
    ],
  },
  {
    title: "SMM & Campaign Delivery",
    icon: Share2,
    articles: [
      { title: "Placing Automated Social Orders", slug: "smm-orders" },
      { title: "Understanding Order Statuses & Refills", slug: "smm-statuses" },
      { title: "Custom API Keys & Developer Webhooks", slug: "api-keys-guide" },
    ],
  },
];

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-[var(--ws-bg)] text-[var(--ws-text-primary)]">
      {/* Hero Section */}
      <div className="border-b border-[var(--ws-border-color)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] shadow-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Help Center & Documentation</span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ws-text-primary)]">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm text-[var(--ws-text-secondary)] max-w-lg mx-auto">
            Search our library of platform walkthroughs, technical guides, API documentation, and FAQs.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search guides, SEO metrics, billing FAQs, API keys..."
              className="w-full pl-12 pr-4 py-3.5 rounded-full border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {KB_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                className="rounded-3xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xs"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-[var(--ws-brand-lilac-deep)] dark:bg-violet-950/40">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--ws-text-primary)]">{cat.title}</h2>
                </div>

                <ul className="space-y-3">
                  {cat.articles.map((art, aIdx) => (
                    <li key={aIdx}>
                      <Link
                        href={`/help`}
                        className="group flex items-center justify-between text-xs sm:text-sm text-[var(--ws-text-secondary)] hover:text-[var(--ws-brand-lilac-deep)] py-1.5 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileQuestion className="h-4 w-4 text-zinc-400 group-hover:text-[var(--ws-brand-lilac-deep)] transition-colors" />
                          {art.title}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--ws-brand-lilac-deep)]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Can't find answer? */}
        <div className="mt-14 rounded-3xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-8 text-center sm:flex sm:items-center sm:justify-between shadow-xs">
          <div className="text-left">
            <h3 className="text-base font-bold text-[var(--ws-text-primary)]">Can&apos;t find what you&apos;re looking for?</h3>
            <p className="mt-1 text-xs text-[var(--ws-text-secondary)]">Our technical support specialists are available 24/7 to assist you.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3 shrink-0">
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ws-foreground)] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
            >
              Open Support Ticket
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/talk-to-an-expert"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
            >
              Talk to an Expert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
