import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Globe,
  HelpCircle,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

interface ServiceData {
  title: string;
  badge: string;
  tagline: string;
  description: string;
  startingPrice: string;
  period: string;
  kpis: { label: string; value: string }[];
  deliverables: { title: string; desc: string }[];
  tiers: {
    name: string;
    price: string;
    desc: string;
    highlighted?: boolean;
    features: string[];
  }[];
  faqs: { q: string; a: string }[];
}

const SERVICES_CATALOG: Record<string, ServiceData> = {
  "website-design": {
    title: "Website Design & Development",
    badge: "Web Presence",
    tagline: "High-performance, conversion-engineered websites built to scale.",
    description:
      "From bespoke custom landing pages to enterprise headless web platforms, we build lightning-fast web applications designed for conversion, accessibility, and search dominance.",
    startingPrice: "$999",
    period: "one-time / monthly",
    kpis: [
      { label: "Avg. Lighthouse Score", value: "98+" },
      { label: "Conversion Lift", value: "+45%" },
      { label: "Turnaround Time", value: "7 Days" },
    ],
    deliverables: [
      { title: "Custom UI/UX Architecture", desc: "Tailored Figma design tokens and mobile-first responsive interfaces." },
      { title: "Next.js & React Core", desc: "Ultra-fast server-side rendering, sub-second load times, and dynamic routing." },
      { title: "Technical SEO Built-In", desc: "Structured data, OpenGraph tags, semantic HTML5, and automated XML sitemaps." },
      { title: "CMS & CRM Integration", desc: "Headless CMS, analytics tracking, and automated lead capture workflows." },
    ],
    tiers: [
      {
        name: "Sprint Launch",
        price: "$999",
        desc: "Ideal for high-converting marketing landing pages and brand launches.",
        features: ["Up to 5 Pages", "Figma Design & Build", "Mobile Responsive", "Analytics & Forms", "7-Day Delivery"],
      },
      {
        name: "Growth Platform",
        price: "$2,499",
        highlighted: true,
        desc: "Complete business website with CMS and customer portal integrations.",
        features: ["Up to 15 Pages", "Custom CMS Integration", "SEO & Schema Setup", "Speed Optimization (95+)", "30 Days Support"],
      },
      {
        name: "Enterprise Headless",
        price: "$4,999",
        desc: "Fully custom web application with payment systems and scalable backend.",
        features: ["Unlimited Pages", "Custom Portal & Auth", "Payment Gateways", "Dedicated Engineer", "Priority SLA"],
      },
    ],
    faqs: [
      { q: "How long does a website redesign take?", a: "Standard 5-page launch sprints are delivered within 7 to 10 business days. Complex headless platforms typically take 3 to 4 weeks." },
      { q: "Do you provide hosting and maintenance?", a: "Yes, all sites can be hosted on our high-speed edge infrastructure with daily backups and continuous security patching." },
    ],
  },
  seo: {
    title: "SEO & Organic Growth",
    badge: "Search Authority",
    tagline: "Dominate high-intent search queries and capture compounding organic traffic.",
    description:
      "Data-driven search engine optimization combining deep technical audits, aggressive keyword clustering, authoritative link acquisition, and AI search visibility.",
    startingPrice: "$799",
    period: "/month",
    kpis: [
      { label: "Avg. Organic Lift", value: "+180%" },
      { label: "Keywords in Top 3", value: "4,200+" },
      { label: "Avg. ROI", value: "4.8x" },
    ],
    deliverables: [
      { title: "Technical Health & Crawlability", desc: "Fix indexing blocks, core web vitals, structured schema, and crawl budgets." },
      { title: "Keyword Clustering & Gap Analysis", desc: "Target high-converting commercial intent keywords your competitors missed." },
      { title: "Editorial Backlink Acquisition", desc: "High-authority contextual links from verified, relevant niche publications." },
      { title: "AI Visibility & LLM Mentions", desc: "Optimize your brand for ChatGPT, Claude, Perplexity, and Gemini search answers." },
    ],
    tiers: [
      {
        name: "Local Authority",
        price: "$799",
        desc: "For local and regional businesses looking to capture area searches.",
        features: ["25 Tracked Keywords", "Monthly Technical Audit", "Google Business Profile", "4 Quality Backlinks", "Live KPI Dashboard"],
      },
      {
        name: "National Scale",
        price: "$1,499",
        highlighted: true,
        desc: "For companies targeting national search traffic and high-volume terms.",
        features: ["100 Tracked Keywords", "Bi-Weekly Audits", "Content Gap Strategy", "10 High-DR Backlinks", "AI Search Optimization"],
      },
      {
        name: "Market Leader",
        price: "$2,999",
        desc: "Aggressive organic dominance for competitive verticals.",
        features: ["Unlimited Keywords", "Weekly Strategy Calls", "20+ Editorial Backlinks", "Programmatic SEO Architecture", "Dedicated Lead Strategist"],
      },
    ],
    faqs: [
      { q: "How soon can we see ranking improvements?", a: "Initial technical quick-wins typically show impact within 3-4 weeks. Significant compounding traffic gains generally materialize between months 2 and 4." },
      { q: "Do you guarantee first-page rankings?", a: "While search algorithms constantly evolve, our data-backed methodology guarantees transparent monthly KPIs, deliverables, and ranking milestone tracking." },
    ],
  },
  "local-listings": {
    title: "Local Listings & Google Maps",
    badge: "Local Dominance",
    tagline: "Win the local 3-pack and turn nearby searchers into paying clients.",
    description:
      "Comprehensive Google Business Profile optimization, local citation syndication across 60+ directories, and automated review acceleration.",
    startingPrice: "$399",
    period: "/month",
    kpis: [
      { label: "Maps 3-Pack Rank", value: "#1-#3" },
      { label: "Local Call Volume", value: "+65%" },
      { label: "Citation Accuracy", value: "100%" },
    ],
    deliverables: [
      { title: "Google Business Profile Optimization", desc: "Category selection, geo-tagged photo uploads, product showcase, and service catalog." },
      { title: "60+ Top Directory Sync", desc: "Synchronize NAP consistency across Apple Maps, Bing, Yelp, YellowPages, and industry directories." },
      { title: "Review Velocity Automation", desc: "Automated SMS/Email review request campaigns to build authentic 5-star social proof." },
      { title: "Local Heatmap Tracking", desc: "Grid rank tracking showing exactly where you rank block-by-block across your city." },
    ],
    tiers: [
      {
        name: "Single Location",
        price: "$399",
        desc: "For local storefronts or single service area businesses.",
        features: ["1 Business Location", "GBP Optimization", "40 Directory Citations", "Review Automation", "Monthly Geo-Grid Report"],
      },
      {
        name: "Regional Growth",
        price: "$799",
        highlighted: true,
        desc: "For multi-location or competitive metropolitan service businesses.",
        features: ["Up to 3 Locations", "60+ Top Directories", "Weekly GBP Posts & Photos", "Duplicate Listing Suppression", "Call & Direction Tracking"],
      },
      {
        name: "Franchise Suite",
        price: "$1,499",
        desc: "For brands with 5+ locations requiring unified local management.",
        features: ["Up to 10 Locations", "Centralized Dashboard", "Instant Review Alerts", "Local Landing Pages", "Dedicated Account Manager"],
      },
    ],
    faqs: [
      { q: "Why is NAP consistency important?", a: "Search engines cross-reference Name, Address, and Phone number across dozens of sites. Any discrepancy harms your local trust and map ranking." },
    ],
  },
  analytics: {
    title: "Analytics & Web Attribution",
    badge: "Data Intelligence",
    tagline: "Turn marketing data into clear, actionable revenue attribution.",
    description:
      "Server-side GA4 implementation, Google Tag Manager event tracking, multi-touch attribution modeling, and automated executive dashboards.",
    startingPrice: "$599",
    period: "/month",
    kpis: [
      { label: "Data Accuracy", value: "99.8%" },
      { label: "Attributed Revenue", value: "100%" },
      { label: "Setup Time", value: "48 Hours" },
    ],
    deliverables: [
      { title: "Server-Side GA4 & GTM", desc: "Bypass ad blockers and iOS tracking restrictions for 100% accurate conversion data." },
      { title: "Custom Conversion Events", desc: "Track form submissions, phone clicks, video watches, and multi-step checkouts." },
      { title: "Multi-Channel Attribution", desc: "Understand exactly which paid, organic, or email campaigns generate the final sale." },
      { title: "Live Executive BI Dashboards", desc: "Automated real-time reporting via Looker Studio or our built-in client portal." },
    ],
    tiers: [
      {
        name: "Audit & Setup",
        price: "$599",
        desc: "One-time complete tracking cleanup and event configuration.",
        features: ["GA4 & GTM Setup", "Server-Side Tracking", "Top 10 Event Goals", "Lead Source Tracking", "Data Validation"],
      },
      {
        name: "Continuous Intelligence",
        price: "$999",
        highlighted: true,
        desc: "Monthly tracking maintenance, dashboard updates, and anomaly detection.",
        features: ["Full Attribution Modeling", "Looker Studio Dashboard", "Conversion Funnel Analysis", "Bi-Weekly Data Review", "Dedicated Analyst"],
      },
      {
        name: "Enterprise BI",
        price: "$1,899",
        desc: "Custom data warehouse sync, CRM pipeline integration, and predictive LTV modeling.",
        features: ["BigQuery / Snowflake Sync", "Salesforce/HubSpot CRM Sync", "Custom SQL Models", "Real-Time Anomaly Alerts", "SLA Support"],
      },
    ],
    faqs: [
      { q: "Will this fix missing conversions caused by iOS 14+ / ad-blockers?", a: "Yes, our server-side tagging infrastructure relays events directly from your domain server to analytics endpoints, bypassing browser-side blockers." },
    ],
  },
  "search-ads": {
    title: "Google & Paid Search Advertising",
    badge: "High-Intent PPC",
    tagline: "Capture ready-to-buy customers at the precise moment of intent.",
    description:
      "Engineered Google Search, Performance Max, and Remarketing campaigns structured for maximum ROAS and lowest cost per acquisition.",
    startingPrice: "$699",
    period: "/month + ad spend",
    kpis: [
      { label: "Avg. ROAS", value: "4.2x" },
      { label: "CPA Reduction", value: "-38%" },
      { label: "Managed Spend", value: "$12M+" },
    ],
    deliverables: [
      { title: "Granular Single-Intent Ad Groups", desc: "Tightly grouped keywords matching search queries with laser-relevant ad copy." },
      { title: "Negative Keyword Mining", desc: "Continuous negative keyword expansion to eliminate wasted budget." },
      { title: "Landing Page CRO Alignment", desc: "Ensure your landing pages match ad copy for maximum Quality Scores." },
      { title: "Offline Conversion Tracking", desc: "Feed closed CRM revenue back into Google AI bidding algorithms." },
    ],
    tiers: [
      {
        name: "Starter PPC",
        price: "$699",
        desc: "For ad spends up to $3,000/month.",
        features: ["Up to 2 Campaigns", "Search & Call Ads", "Negative Keyword Suite", "Weekly Optimization", "Live ROI Dashboard"],
      },
      {
        name: "Growth PPC",
        price: "$1,299",
        highlighted: true,
        desc: "For ad spends up to $10,000/month.",
        features: ["Up to 5 Campaigns", "PMax & Search Combo", "A/B Copy Testing", "Landing Page Reviews", "Bi-Weekly Strategy Calls"],
      },
      {
        name: "Scale PPC",
        price: "$2,499",
        desc: "For ad spends over $10,000/month.",
        features: ["Unlimited Campaigns", "Custom Script Automation", "Offline Conversion Sync", "Dedicated PPC Director", "Daily Optimization"],
      },
    ],
    faqs: [
      { q: "Is ad spend included in the fee?", a: "Management fees cover campaign strategy, execution, and optimization. Ad spend is paid directly to Google from your ad account." },
    ],
  },
  "social-ads": {
    title: "Meta & Social Advertising",
    badge: "Social Scale",
    tagline: "Drive predictable acquisition with high-impact creative and algorithmic targeting.",
    description:
      "Full-funnel Meta (Facebook & Instagram), TikTok, and YouTube ad campaigns that combine disruptive creative with deep conversion tracking.",
    startingPrice: "$799",
    period: "/month + ad spend",
    kpis: [
      { label: "Avg. CTR", value: "3.4%" },
      { label: "Conversion Lift", value: "+52%" },
      { label: "Creative Testing", value: "20+/mo" },
    ],
    deliverables: [
      { title: "Creative Concepting & Production", desc: "High-converting UGC videos, kinetic typography, and static carousel assets." },
      { title: "Conversions API (CAPI) Integration", desc: "Server-side event tracking for 100% signal capture despite browser cookie loss." },
      { title: "Full-Funnel Retargeting", desc: "Target top-of-funnel prospects, nurture consideration, and re-engage abandoned carts." },
      { title: "Creative Fatigue Management", desc: "Systematic creative rotation ensuring campaigns never burn out." },
    ],
    tiers: [
      {
        name: "Starter Social",
        price: "$799",
        desc: "For ad spends up to $3,500/month.",
        features: ["Facebook & Instagram", "4 New Creatives/Month", "CAPI Server Integration", "Audience Testing", "Monthly Reporting"],
      },
      {
        name: "Scale Social",
        price: "$1,499",
        highlighted: true,
        desc: "For ad spends up to $12,000/month.",
        features: ["Meta + TikTok Multi-Channel", "12 New Creatives/Month", "UGC Video Briefs", "Weekly Creative Refreshes", "Bi-Weekly Calls"],
      },
      {
        name: "Omnichannel Beast",
        price: "$2,899",
        desc: "For aggressive multi-platform growth over $15,000/mo spend.",
        features: ["All Social Channels", "24+ Creatives/Month", "Influencer Whitelisting", "Dedicated Video Editor", "Daily Bid Adjustments"],
      },
    ],
    faqs: [
      { q: "Who creates the ad graphics and videos?", a: "Our in-house design and copywriting team handles scriptwriting, video editing, graphic design, and ad copy." },
    ],
  },
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = SERVICES_CATALOG[slug] || {
    title: slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    badge: "Service Channel",
    tagline: "Comprehensive managed digital marketing channel engineered for compounding results.",
    description:
      "Accelerate your business with dedicated specialists, transparent monthly pricing, real-time KPI reporting, and verified deliverable milestones.",
    startingPrice: "$699",
    period: "/month",
    kpis: [
      { label: "Typical ROI", value: "3.5x+" },
      { label: "SLA Guarantee", value: "99.9%" },
      { label: "Client Retention", value: "94%" },
    ],
    deliverables: [
      { title: "Strategy & Roadmap", desc: "Custom quarterly growth roadmap built specifically for your niche and target audience." },
      { title: "Execution & Optimization", desc: "Continuous iterative optimization and deliverable execution by domain experts." },
      { title: "Transparent Reporting", desc: "Live client portal dashboard with full visibility into metrics, tasks, and deliverables." },
      { title: "Dedicated Account Lead", desc: "Direct communication with your senior campaign manager." },
    ],
    tiers: [
      {
        name: "Starter",
        price: "$699",
        desc: "Essential channel execution for growing brands.",
        features: ["Core Deliverables", "Monthly Strategy Call", "Live Dashboard Access", "Standard SLA", "Email Support"],
      },
      {
        name: "Growth",
        price: "$1,399",
        highlighted: true,
        desc: "Accelerated execution with aggressive milestone targets.",
        features: ["Full Channel Suite", "Bi-Weekly Strategy Calls", "Priority Queue", "Dedicated Manager", "Phone & Slack Support"],
      },
      {
        name: "Enterprise",
        price: "$2,699",
        desc: "Comprehensive market dominance with custom SLAs.",
        features: ["Unlimited Capacity", "Weekly Strategic Reviews", "Custom API Integrations", "Senior Lead Strategist", "24/7 Priority SLA"],
      },
    ],
    faqs: [
      { q: "How do we get started?", a: "Choose a plan or speak with our team. We onboard new accounts within 48 hours and launch campaigns within 7 days." },
      { q: "Are there long-term contracts?", a: "No. All services are month-to-month with no long-term lock-ins. You can pause or adjust tiers at any time." },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--ws-bg)] text-[var(--ws-text-primary)]">
      {/* Breadcrumb Header */}
      <div className="border-b border-[var(--ws-border-color)] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-xs text-[var(--ws-text-secondary)]">
          <Link href="/" className="hover:text-[var(--ws-text-primary)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/services" className="hover:text-[var(--ws-text-primary)]">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--ws-text-primary)] font-medium">{service.title}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-[var(--ws-border-color)] bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{service.badge}</span>
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--ws-text-primary)] max-w-4xl mx-auto">
            {service.title}
          </h1>

          <p className="mt-4 text-xl font-medium text-[var(--ws-text-secondary)] max-w-2xl mx-auto">
            {service.tagline}
          </p>

          <p className="mt-3 text-base text-[var(--ws-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            {service.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/talk-to-an-expert?service=${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] text-white px-6 py-3.5 text-sm font-semibold hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shadow-md"
            >
              Get Started with {service.title.split(" ")[0]}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
            >
              View Packages from {service.startingPrice}
            </Link>
          </div>

          {/* Key KPI Stats */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {service.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--ws-border-color)] bg-white/80 dark:bg-zinc-900/80 p-5 backdrop-blur-sm shadow-xs"
              >
                <div className="text-3xl font-bold text-[var(--ws-brand-lilac-deep)]">{kpi.value}</div>
                <div className="mt-1 text-xs font-medium text-[var(--ws-text-secondary)]">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 border-b border-[var(--ws-border-color)]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ws-text-primary)]">
            What You Get in Every Engagement
          </h2>
          <p className="mt-2 text-sm text-[var(--ws-text-secondary)]">
            No vague promises. Fully documented deliverables, clear scopes, and measurable monthly outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {service.deliverables.map((del, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 shadow-xs hover:border-[var(--ws-brand-lilac)] transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[var(--ws-brand-lilac-deep)] dark:bg-violet-950/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[var(--ws-text-primary)]">{del.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--ws-text-secondary)] leading-relaxed">{del.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Packages */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 border-b border-[var(--ws-border-color)]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] uppercase tracking-wider">
            Transparent Pricing
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ws-text-primary)]">
            Choose Your Growth Level
          </h2>
          <p className="mt-2 text-sm text-[var(--ws-text-secondary)]">
            Month-to-month flexibility. Upgrade, pause, or switch channels whenever your priorities evolve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {service.tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
                tier.highlighted
                  ? "border-[var(--ws-brand-lilac-deep)] bg-white dark:bg-zinc-900 shadow-xl ring-2 ring-[var(--ws-brand-lilac-deep)]/20 relative"
                  : "border-[var(--ws-border-color)] bg-white dark:bg-zinc-900/50 shadow-xs hover:border-[var(--ws-brand-lilac)]"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ws-brand-lilac-deep)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-[var(--ws-text-primary)]">{tier.name}</h3>
                <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">{tier.desc}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--ws-text-primary)]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-[var(--ws-text-secondary)]">{service.period}</span>
                </div>

                <ul className="mt-8 space-y-3 border-t border-[var(--ws-border-color)] pt-6">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs text-[var(--ws-text-secondary)]">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--ws-border-color)]">
                <Link
                  href={`/checkout?service=${encodeURIComponent(slug)}&plan=${encodeURIComponent(tier.name)}`}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-[var(--ws-brand-lilac-deep)] text-white hover:bg-violet-700 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-[var(--ws-text-primary)] hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 border-b border-[var(--ws-border-color)]">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[var(--ws-text-primary)]">Frequently Asked Questions</h2>
          <p className="mt-2 text-xs text-[var(--ws-text-secondary)]">Everything you need to know about our {service.title} process.</p>
        </div>

        <div className="space-y-4">
          {service.faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-5 shadow-xs"
            >
              <h3 className="text-sm font-semibold text-[var(--ws-text-primary)] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[var(--ws-brand-lilac-deep)] shrink-0" />
                {faq.q}
              </h3>
              <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[var(--ws-foreground)] text-white p-10 sm:p-14 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to Accelerate Your {service.title}?
            </h2>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              Launch with our team in as little as 7 days. Transparent monthly reporting, zero long-term contracts.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/talk-to-an-expert?service=${encodeURIComponent(slug)}`}
                className="inline-flex items-center gap-2 rounded-full bg-white text-[var(--ws-foreground)] px-6 py-3.5 text-sm font-semibold hover:bg-zinc-100 transition-colors shadow-sm"
              >
                Talk to an Expert
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-6 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Explore All 14 Channels
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
