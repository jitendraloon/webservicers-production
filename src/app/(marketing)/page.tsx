"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Layers,
  MessageSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SERVICES, type ServiceSlug } from "@/data/services";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";

const TRUST_STATS = [
  { label: "Integrated Channels", value: "14", note: "Presence, Promote & Analytics" },
  { label: "Average Launch", value: "7 Days", note: "From kickoff to live" },
  { label: "Avg. Paid ROAS", value: "4.2x", note: "Across managed ad accounts" },
  { label: "Monthly Billing", value: "1 Invoice", note: "No agency retainers or lock-in" },
];

type DiagnosticGoalId = "foundation" | "search" | "social" | "attribution";

const DIAGNOSTIC_GOALS: {
  id: DiagnosticGoalId;
  label: string;
  summary: string;
  recommendedSlugs: ServiceSlug[];
}[] = [
  {
    id: "foundation",
    label: "Launch & modernize my web presence",
    summary:
      "Start with a fast, conversion-focused website, rock-solid hosting, and local Google Maps visibility.",
    recommendedSlugs: ["website-design", "website", "google-my-business"],
  },
  {
    id: "search",
    label: "Capture high-intent search buyers",
    summary:
      "Pair compounding organic SEO with immediate Google Search & Shopping capture.",
    recommendedSlugs: ["seo", "google-search-ads", "google-shopping-ads"],
  },
  {
    id: "social",
    label: "Scale demand across social & video",
    summary:
      "Deploy thumb-stopping creative across Meta, TikTok, YouTube, and LinkedIn.",
    recommendedSlugs: ["facebook-ads", "instagram-ads", "tiktok-marketing", "linkedin-marketing"],
  },
  {
    id: "attribution",
    label: "Fix tracking & prove marketing ROI",
    summary:
      "Unify GA4, server-side CAPI, and cross-channel ROAS into one executive view.",
    recommendedSlugs: ["marketing-analytics", "seo", "google-search-ads"],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Replacing three separate freelancers with WebServicers cut our monthly overhead by 40% and doubled our qualified demo pipeline in 90 days.",
    author: "Elena Rostova",
    role: "VP of Growth, Northstar Logistics",
    metric: "+118% SQLs",
  },
  {
    quote:
      "Their Google Shopping feed cleanup and Search Ads restructuring took us from a 2.1x blended ROAS to 4.9x before Q4 even started.",
    author: "Marcus Vance",
    role: "Founder, Kanso Home Goods",
    metric: "4.9x ROAS",
  },
  {
    quote:
      "Having our website, Google Business Profile, and GA4 attribution managed under one roof finally gave us clarity on what drives phone calls.",
    author: "Dr. Priya Nair",
    role: "Managing Partner, ClearView Dental",
    metric: "+64% Calls",
  },
];

const BLOG_POSTS = [
  {
    category: "Presence & SEO",
    title: "The 7-Day Website & Technical SEO Launch Checklist",
    excerpt:
      "How to ship a fast Core Web Vitals site with clean schema, redirects, and GA4 events from day one.",
    readTime: "5 min read",
  },
  {
    category: "Paid Acquisition",
    title: "Stopping Performance Max Waste with Margin-Segmented Feeds",
    excerpt:
      "Why grouping SKUs by contribution margin and negative keyword sculpting unlocks 4x+ Shopping ROAS.",
    readTime: "6 min read",
  },
  {
    category: "Analytics",
    title: "Server-Side CAPI & GA4: Recovering Lost Attribution Signals",
    excerpt:
      "A practical guide to reconciling Meta, Google, and CRM revenue in one source of truth.",
    readTime: "4 min read",
  },
];

const HOME_FAQS = [
  {
    question: "How is WebServicers different from a traditional marketing agency?",
    answer:
      "Traditional agencies charge opaque retainers, lock you into 12-month contracts, and fragment your stack across disconnected vendors. WebServicers gives you 14 productized, transparent services on one monthly invoice with a unified client portal.",
  },
  {
    question: "Can I start with one service and add more later?",
    answer:
      "Yes. Most clients start with 1–2 core services (like Website Design + Managed SEO, or Google Search Ads + Analytics) and activate additional channels as they scale.",
  },
  {
    question: "Do I own my website, ad accounts, and analytics data?",
    answer:
      "100%. Every domain, codebase, Google Ads account, Meta Business Manager, and GA4 property stays in your name with full admin ownership.",
  },
  {
    question: "How quickly can my campaigns or website go live?",
    answer:
      "Managed ad campaigns and analytics setups typically launch within 5 business days. Custom websites launch in 7 to 14 days depending on scope.",
  },
  {
    question: "Is ad spend included in the monthly service pricing?",
    answer:
      "No—ad spend is paid directly to Google, Meta, TikTok, or LinkedIn so you have full visibility and zero hidden markups.",
  },
];

export default function MarketingHomePage() {
  const [heroSlug, setHeroSlug] = useState<ServiceSlug>("seo");
  const [activeChannelSlug, setActiveChannelSlug] = useState<ServiceSlug>("website-design");
  const [diagnosticGoal, setDiagnosticGoal] = useState<DiagnosticGoalId>("search");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const heroService = SERVICES.find((s) => s.slug === heroSlug) ?? SERVICES[0];
  const activeChannel =
    SERVICES.find((s) => s.slug === activeChannelSlug) ?? SERVICES[0];
  const activeDiagnostic =
    DIAGNOSTIC_GOALS.find((g) => g.id === diagnosticGoal) ?? DIAGNOSTIC_GOALS[0];
  const recommendedServices = SERVICES.filter((s) =>
    activeDiagnostic.recommendedSlugs.includes(s.slug)
  );

  return (
    <div className="pb-20">
      {/* ───── Hero with Interactive Service Preview ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-1.5 text-xs font-medium text-[var(--ws-text-primary)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--ws-brand-lilac-deep)]" />
              <span>14 Digital Growth Services • One Unified Platform</span>
            </div>

            <h1 className="display-title mt-6 text-4xl sm:text-5xl lg:text-[3.75rem] text-[var(--ws-text-primary)]">
              Websites, SEO &amp; paid growth{" "}
              <span className="hero-emphasis">engineered to compound.</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-[var(--ws-text-secondary)] max-w-2xl">
              Build your online presence, capture high-intent search, scale paid
              social, and track every dollar of ROI—all from one dedicated team
              and one transparent monthly plan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
              >
                Explore All 14 Services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/talk-to-an-expert"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white/85 px-6 py-3.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                Talk to an Expert
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--ws-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#087858]" />
                No long-term lock-in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                Launch in 7 days
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#087858]" />
                100% account ownership
              </span>
            </div>
          </div>

          {/* Interactive Hero Service Preview */}
          <div className="lg:col-span-5">
            <div className="surface-card rounded-3xl p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--ws-border-color)]">
                <span className="font-mono-label text-[var(--ws-text-secondary)]">
                  Interactive Service Preview
                </span>
                <span className="rounded-full bg-[var(--ws-brand-lilac-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ws-brand-lilac-deep)]">
                  {heroService.category}
                </span>
              </div>

              {/* Quick Switcher Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(
                  [
                    "website-design",
                    "seo",
                    "google-search-ads",
                    "facebook-ads",
                    "marketing-analytics",
                  ] as ServiceSlug[]
                ).map((slug) => {
                  const item = SERVICES.find((s) => s.slug === slug);
                  if (!item) return null;
                  const active = heroSlug === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setHeroSlug(slug)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-[var(--ws-foreground)] text-white"
                          : "bg-white border border-[var(--ws-border-color)] text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)]"
                      }`}
                    >
                      {item.shortName}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-white/90 border border-[var(--ws-border-color)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                      <ServiceIcon name={heroService.iconName} className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
                        {heroService.name}
                      </h2>
                      <p className="text-xs text-[var(--ws-text-secondary)]">
                        From ${heroService.priceUsd}/{heroService.period}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-[var(--ws-text-secondary)] leading-relaxed">
                  {heroService.tagline}
                </p>

                <ul className="mt-4 space-y-2">
                  {heroService.highlights.slice(0, 3).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-xs text-[var(--ws-text-primary)]">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#087858]" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 pt-4 border-t border-[var(--ws-border-color)] flex items-center justify-between">
                  <Link
                    href={heroService.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
                  >
                    Explore {heroService.shortName}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-xs font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)]"
                  >
                    See all tiers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust Stats Strip ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="surface-card rounded-2xl p-6">
              <p className="font-mono-label text-[var(--ws-text-secondary)]">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ws-text-primary)] tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[var(--ws-text-secondary)]">
                {stat.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 14-Service Interactive Channel Switcher ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              The Complete Stack
            </span>
            <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
              All 14 channels, ready to activate
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            View full directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 14 Channel Buttons */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[540px] overflow-y-auto pr-1">
            {SERVICES.map((service) => {
              const isSelected = service.slug === activeChannel.slug;
              return (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => setActiveChannelSlug(service.slug)}
                  className={`w-full text-left rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--ws-foreground)] text-white shadow-sm"
                      : "surface-card text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]"
                      }`}
                    >
                      <ServiceIcon name={service.iconName} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {service.name}
                      </p>
                      <p
                        className={`text-[11px] ${
                          isSelected ? "text-white/70" : "text-[var(--ws-text-secondary)]"
                        }`}
                      >
                        {service.category}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums shrink-0 ${
                      isSelected ? "text-[var(--ws-brand-mint)]" : "text-[var(--ws-text-primary)]"
                    }`}
                  >
                    ${service.priceUsd}/mo
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Active Channel Detail Panel */}
          <div className="lg:col-span-7">
            <div className="surface-card rounded-3xl p-7 sm:p-9 h-full flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                      <ServiceIcon name={activeChannel.iconName} className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
                        {activeChannel.category}
                      </span>
                      <h3 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
                        {activeChannel.name}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--ws-text-secondary)]">
                      Starting at
                    </p>
                    <p className="text-2xl font-semibold text-[var(--ws-text-primary)] tabular-nums">
                      ${activeChannel.priceUsd}
                      <span className="text-sm font-normal text-[var(--ws-text-secondary)]">
                        /mo
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-base font-medium text-[var(--ws-text-primary)]">
                  {activeChannel.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ws-text-secondary)]">
                  {activeChannel.description}
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeChannel.highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white/80 border border-[var(--ws-border-color)] p-3.5 flex items-start gap-2.5"
                    >
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#087858]" />
                      <span className="text-xs leading-relaxed text-[var(--ws-text-primary)]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeChannel.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl bg-[#fcfbf7] border border-[var(--ws-border-color)] p-3"
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ws-text-secondary)]">
                        {m.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ws-text-primary)] tabular-nums">
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--ws-border-color)] flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={activeChannel.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
                >
                  Explore {activeChannel.shortName}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/register?service=${activeChannel.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ws-brand-lilac-deep)] hover:underline"
                >
                  Start {activeChannel.shortName} plan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Growth Diagnostic Section ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="surface-card rounded-3xl p-7 sm:p-10 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[var(--ws-border-color)]">
            <div>
              <span className="inline-flex items-center gap-1.5 font-mono-label text-[var(--ws-brand-lilac-deep)]">
                <Compass className="h-3.5 w-3.5" />
                Growth Diagnostic
              </span>
              <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
                Not sure where to start?
              </h2>
              <p className="mt-2 text-base text-[var(--ws-text-secondary)]">
                Select your primary 90-day priority to see the recommended stack.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-2.5">
              {DIAGNOSTIC_GOALS.map((goal) => {
                const selected = goal.id === diagnosticGoal;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setDiagnosticGoal(goal.id)}
                    className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--ws-foreground)] border-[var(--ws-foreground)] text-white"
                        : "bg-white/80 border-[var(--ws-border-color)] text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{goal.label}</p>
                    <p
                      className={`mt-1 text-xs ${
                        selected ? "text-white/75" : "text-[var(--ws-text-secondary)]"
                      }`}
                    >
                      {goal.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              <p className="font-mono-label text-[var(--ws-text-secondary)] mb-4">
                Recommended Stack
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedServices.map((rec) => (
                  <Link
                    key={rec.slug}
                    href={rec.href}
                    className="rounded-2xl bg-white border border-[var(--ws-border-color)] p-5 hover:border-[var(--ws-brand-lilac-deep)] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                        <ServiceIcon name={rec.iconName} className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-[var(--ws-text-primary)] tabular-nums">
                        ${rec.priceUsd}/mo
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[var(--ws-text-primary)] group-hover:text-[var(--ws-brand-lilac-deep)] transition-colors">
                      {rec.name}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--ws-text-secondary)] line-clamp-2">
                      {rec.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Dark Enterprise Section ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="bg-dark-enterprise rounded-3xl p-8 sm:p-12 lg:p-16 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="font-mono-label text-[var(--ws-brand-mint)]">
                Enterprise &amp; Multi-Brand
              </span>
              <h2 className="display-title mt-3 text-3xl sm:text-4xl lg:text-5xl text-white">
                Built for multi-location &amp; scaling teams.
              </h2>
              <p className="mt-4 text-base text-white/75 leading-relaxed max-w-2xl">
                Consolidate regional websites, franchise Google Business Profiles,
                multi-market paid acquisition, and warehouse-grade attribution under
                one dedicated growth squad and SLA.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/talk-to-an-expert?tier=enterprise"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-brand-mint)] px-6 py-3.5 text-sm font-semibold text-[#0a091c] hover:opacity-90 transition-opacity"
                >
                  Book Enterprise Briefing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                >
                  Compare Enterprise Tiers
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Unified Client Portal",
                  desc: "SEO workspace, order tracking, invoices, and live reports in one place.",
                },
                {
                  title: "Dedicated Strategist",
                  desc: "Weekly sprint calls and direct Slack/portal access to your growth lead.",
                },
                {
                  title: "Server-Side Telemetry",
                  desc: "CAPI, Consent Mode v2, and BigQuery/CRM closed-loop revenue sync.",
                },
                {
                  title: "99.98% Uptime SLA",
                  desc: "Edge-cached web infrastructure and proactive 24/7 monitoring.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/12 bg-white/5 p-5"
                >
                  <Layers className="h-5 w-5 text-[var(--ws-brand-mint)]" />
                  <h3 className="mt-3 text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
        <div className="mb-10">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Customer Outcomes
          </span>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
            Trusted by teams focused on measurable ROI
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="surface-card rounded-3xl p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Quote className="h-6 w-6 text-[var(--ws-brand-lilac-deep)]" />
                  <span className="rounded-full bg-[#e8fbf4] px-3 py-1 text-xs font-semibold text-[#087858]">
                    {t.metric}
                  </span>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-[var(--ws-text-primary)]">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-[var(--ws-border-color)]">
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  {t.author}
                </p>
                <p className="text-xs text-[var(--ws-text-secondary)]">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Blog Preview ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              Playbooks &amp; Insights
            </span>
            <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
              Latest from the growth desk
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            Read all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.title}
              href="/blog"
              className="surface-card rounded-2xl p-6 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[var(--ws-text-secondary)]">
                  <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
                    {post.category}
                  </span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[var(--ws-text-primary)] group-hover:text-[var(--ws-brand-lilac-deep)] transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--ws-text-secondary)] leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ws-text-primary)]">
                Read playbook
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── FAQ Accordion ───── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 lg:py-20">
        <div className="text-center mb-10">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            FAQ
          </span>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
            Answers before you launch
          </h2>
        </div>

        <div className="space-y-3">
          {HOME_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.question} className="surface-card rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-base font-medium text-[var(--ws-text-primary)]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[var(--ws-text-secondary)] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-0 text-sm leading-relaxed text-[var(--ws-text-secondary)] border-t border-[var(--ws-border-color)]/60">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="surface-card rounded-3xl p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              Ready to Grow
            </span>
            <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
              Launch your growth stack this week.
            </h2>
            <p className="mt-3 text-base text-[var(--ws-text-secondary)]">
              Pick a single service starting at $49/mo or combine Presence,
              Promote, and Analytics on one predictable monthly invoice.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3.5 text-sm font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white px-6 py-3.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
            >
              Compare Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
