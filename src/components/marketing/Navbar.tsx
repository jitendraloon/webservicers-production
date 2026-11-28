"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  ChevronDown,
  Globe,
  HelpCircle,
  Layers,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MousePointerClick,
  Newspaper,
  PenTool,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  Tv,
  Users,
  Video,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRESENCE_LINKS: NavItem[] = [
  {
    label: "Website Design & Dev",
    href: "/services/website-design",
    description: "High-converting sites built for speed and clarity.",
    icon: Globe,
  },
  {
    label: "SEO & Organic Growth",
    href: "/services/seo",
    description: "Technical SEO, content architecture, and authority.",
    icon: Search,
  },
  {
    label: "Local Listings & Maps",
    href: "/services/local-listings",
    description: "Dominate local pack rankings and citation accuracy.",
    icon: MapPin,
  },
  {
    label: "Analytics & Attribution",
    href: "/services/analytics",
    description: "Clean tracking, GA4 pipelines, and revenue clarity.",
    icon: BarChart3,
  },
  {
    label: "Conversion Optimization",
    href: "/services/cro",
    description: "A/B testing and funnel refinements that lift ROI.",
    icon: MousePointerClick,
  },
];

const PROMOTE_LINKS: NavItem[] = [
  {
    label: "Google & Search Ads",
    href: "/services/search-ads",
    description: "High-intent search capture with tight ROAS guardrails.",
    icon: Target,
  },
  {
    label: "Meta & Social Ads",
    href: "/services/social-ads",
    description: "Thumb-stopping creative across Instagram and Facebook.",
    icon: Share2,
  },
  {
    label: "LinkedIn B2B Campaigns",
    href: "/services/linkedin-ads",
    description: "Account-based targeting for decision-makers.",
    icon: Briefcase,
  },
  {
    label: "YouTube & Video Ads",
    href: "/services/video-ads",
    description: "Full-funnel video storytelling and demand generation.",
    icon: Video,
  },
  {
    label: "Programmatic & Display",
    href: "/services/display-ads",
    description: "Retargeting and brand reach across premium inventory.",
    icon: Tv,
  },
  {
    label: "Email & Lifecycle",
    href: "/services/email-marketing",
    description: "Automated flows and campaigns that retain customers.",
    icon: Mail,
  },
  {
    label: "Content & Copywriting",
    href: "/services/content-marketing",
    description: "Editorial, landing pages, and conversion copy.",
    icon: PenTool,
  },
  {
    label: "Reputation & Reviews",
    href: "/services/reputation",
    description: "Automated review generation and brand trust.",
    icon: Star,
  },
];

const COMPANY_LINKS: NavItem[] = [
  {
    label: "About",
    href: "/about",
    description: "Our mission, model, and operating principles.",
    icon: Building2,
  },
  {
    label: "Careers",
    href: "/careers",
    description: "Join our multidisciplinary growth and engineering team.",
    icon: Users,
  },
  {
    label: "Press",
    href: "/press",
    description: "Brand assets, announcements, and media inquiries.",
    icon: Newspaper,
  },
  {
    label: "Get help",
    href: "/help",
    description: "Documentation, onboarding guides, and support.",
    icon: HelpCircle,
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Reach our team directly for partnerships or questions.",
    icon: Megaphone,
  },
];

export function Navbar() {
  const [openMenu, setOpenMenu] = useState<"services" | "company" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<
    "presence" | "promote" | "company" | null
  >("presence");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[var(--ws-dark-surface)] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-[13px]">
          <span className="font-mono-label inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-[var(--ws-brand-mint)]">
            <Sparkles className="h-3 w-3" />
            Ready to grow
          </span>
          <span className="text-white/80">
            Thirteen services, one team, one monthly invoice.
          </span>
          <Link
            href="/talk-to-an-expert?ref=banner"
            className="inline-flex items-center gap-1 font-medium text-[var(--ws-brand-mint)] hover:text-white transition-colors"
          >
            Launch in 7 days
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Floating Sticky Glassmorphic Pill Header */}
      <header
        ref={navRef}
        className="sticky top-3 z-50 px-3 sm:px-6 pt-3 pointer-events-none"
      >
        <div className="max-w-7xl mx-auto pointer-events-auto relative">
          <div className="glass-pill rounded-full px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link
              href="/"
              onClick={closeAll}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <span className="h-8 w-8 rounded-xl bg-[var(--ws-foreground)] text-white flex items-center justify-center font-semibold text-sm tracking-tight shadow-sm group-hover:bg-[var(--ws-brand-lilac-deep)] transition-colors">
                W
              </span>
              <span className="font-semibold text-[15px] sm:text-base tracking-tight text-[var(--ws-text-primary)]">
                WebServicers
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label="Primary"
              className="hidden lg:flex items-center gap-1"
            >
              {/* Services Mega-Menu Trigger */}
              <button
                type="button"
                aria-expanded={openMenu === "services"}
                aria-haspopup="true"
                onClick={() =>
                  setOpenMenu((prev) =>
                    prev === "services" ? null : "services"
                  )
                }
                onMouseEnter={() => setOpenMenu("services")}
                className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  openMenu === "services"
                    ? "bg-[var(--ws-foreground)]/8 text-[var(--ws-text-primary)]"
                    : "text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5"
                }`}
              >
                Services
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    openMenu === "services" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <Link
                href="/pricing"
                onClick={closeAll}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5 transition-colors"
              >
                Pricing
              </Link>

              <Link
                href="/tools"
                onClick={closeAll}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5 transition-colors"
              >
                Free Tools
              </Link>

              <Link
                href="/blog"
                onClick={closeAll}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5 transition-colors"
              >
                Blog
              </Link>

              {/* Company Dropdown Trigger */}
              <button
                type="button"
                aria-expanded={openMenu === "company"}
                aria-haspopup="true"
                onClick={() =>
                  setOpenMenu((prev) => (prev === "company" ? null : "company"))
                }
                onMouseEnter={() => setOpenMenu("company")}
                className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  openMenu === "company"
                    ? "bg-[var(--ws-foreground)]/8 text-[var(--ws-text-primary)]"
                    : "text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5"
                }`}
              >
                Company
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    openMenu === "company" ? "rotate-180" : ""
                  }`}
                />
              </button>
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                onClick={closeAll}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/talk-to-an-expert?ref=nav"
                onClick={closeAll}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shadow-sm"
              >
                Talk to an Expert
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-[var(--ws-text-primary)] hover:bg-[var(--ws-foreground)]/5 transition-colors cursor-pointer"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Desktop Services Mega-Menu */}
          {openMenu === "services" && (
            <div
              onMouseLeave={() => setOpenMenu(null)}
              className="hidden lg:block absolute left-0 right-0 top-full mt-2.5 rounded-3xl bg-white/95 backdrop-blur-xl border border-[var(--ws-border-color)] shadow-2xl p-6"
            >
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Presence & Analytics (5 links) */}
                <div className="col-span-4 border-r border-[var(--ws-border-color)] pr-6">
                  <div className="font-mono-label text-[var(--ws-brand-lilac-deep)] mb-3 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    Presence &amp; Analytics
                  </div>
                  <div className="space-y-1">
                    {PRESENCE_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[var(--ws-background-warm)] transition-colors group"
                        >
                          <span className="mt-0.5 h-8 w-8 rounded-lg bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center shrink-0 group-hover:bg-[var(--ws-brand-lilac-deep)] group-hover:text-white transition-colors">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-medium text-[var(--ws-text-primary)]">
                              {item.label}
                            </div>
                            {item.description && (
                              <p className="text-xs text-[var(--ws-text-secondary)] line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Promote & Paid Growth (8 links) */}
                <div className="col-span-5 pr-2">
                  <div className="font-mono-label text-[var(--ws-brand-lilac-deep)] mb-3 flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5" />
                    Promote &amp; Paid Growth
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PROMOTE_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-[var(--ws-background-warm)] transition-colors group"
                        >
                          <span className="mt-0.5 h-7 w-7 rounded-lg bg-[var(--ws-brand-mint)]/25 text-[var(--ws-text-primary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--ws-brand-mint)] transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--ws-text-primary)] truncate">
                              {item.label}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-[var(--ws-text-secondary)] line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Dark "All 14 Channels" CTA Card */}
                <div className="col-span-3">
                  <div className="bg-dark-enterprise rounded-2xl p-5 text-white h-full flex flex-col justify-between border border-white/10">
                    <div>
                      <span className="font-mono-label inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-[var(--ws-brand-mint)]">
                        <LayoutGrid className="h-3 w-3" />
                        Unified Stack
                      </span>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight">
                        All 14 Channels
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/75">
                        One cohesive strategy across web, organic, local, and
                        paid acquisition—without juggling multiple agencies.
                      </p>
                    </div>
                    <Link
                      href="/services"
                      onClick={closeAll}
                      className="mt-5 inline-flex items-center justify-between rounded-xl bg-[var(--ws-brand-mint)] text-[var(--ws-foreground)] px-3.5 py-2.5 text-xs font-semibold hover:bg-white transition-colors"
                    >
                      Explore all channels
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Company Dropdown */}
          {openMenu === "company" && (
            <div
              onMouseLeave={() => setOpenMenu(null)}
              className="hidden lg:block absolute right-36 top-full mt-2.5 w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-[var(--ws-border-color)] shadow-2xl p-3"
            >
              <div className="font-mono-label text-[var(--ws-text-secondary)] px-2.5 py-1.5">
                Company
              </div>
              <div className="space-y-1 mt-1">
                {COMPANY_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAll}
                      className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[var(--ws-background-warm)] transition-colors group"
                    >
                      <span className="mt-0.5 h-8 w-8 rounded-lg bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center shrink-0 group-hover:bg-[var(--ws-brand-lilac-deep)] group-hover:text-white transition-colors">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-[var(--ws-text-primary)]">
                          {item.label}
                        </div>
                        {item.description && (
                          <p className="text-xs text-[var(--ws-text-secondary)] mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="lg:hidden mt-2.5 rounded-3xl bg-white/95 backdrop-blur-xl border border-[var(--ws-border-color)] shadow-2xl p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
              {/* Collapsible Accordions */}
              <div className="divide-y divide-[var(--ws-border-color)]">
                {/* Presence Accordion */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileAccordion((prev) =>
                        prev === "presence" ? null : "presence"
                      )
                    }
                    className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[var(--ws-text-primary)] cursor-pointer"
                  >
                    <span>Presence &amp; Analytics</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--ws-text-secondary)] transition-transform ${
                        mobileAccordion === "presence" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileAccordion === "presence" && (
                    <div className="pb-2 space-y-1">
                      {PRESENCE_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                          >
                            <Icon className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Promote Accordion */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileAccordion((prev) =>
                        prev === "promote" ? null : "promote"
                      )
                    }
                    className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[var(--ws-text-primary)] cursor-pointer"
                  >
                    <span>Promote &amp; Paid Growth</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--ws-text-secondary)] transition-transform ${
                        mobileAccordion === "promote" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileAccordion === "promote" && (
                    <div className="pb-2 space-y-1">
                      {PROMOTE_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                          >
                            <Icon className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                      <Link
                        href="/services"
                        onClick={closeAll}
                        className="mt-1 flex items-center justify-between rounded-xl bg-[var(--ws-dark-surface)] text-white px-3 py-2.5 text-xs font-semibold"
                      >
                        <span>Explore All 14 Channels</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[var(--ws-brand-mint)]" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Company Accordion */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileAccordion((prev) =>
                        prev === "company" ? null : "company"
                      )
                    }
                    className="w-full flex items-center justify-between py-2 text-sm font-semibold text-[var(--ws-text-primary)] cursor-pointer"
                  >
                    <span>Company</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--ws-text-secondary)] transition-transform ${
                        mobileAccordion === "company" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileAccordion === "company" && (
                    <div className="pb-2 space-y-1">
                      {COMPANY_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                          >
                            <Icon className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-3 pt-3 border-t border-[var(--ws-border-color)] grid grid-cols-3 gap-2">
                <Link
                  href="/pricing"
                  onClick={closeAll}
                  className="rounded-xl border border-[var(--ws-border-color)] px-3 py-2 text-center text-xs font-medium text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                >
                  Pricing
                </Link>
                <Link
                  href="/tools"
                  onClick={closeAll}
                  className="rounded-xl border border-[var(--ws-border-color)] px-3 py-2 text-center text-xs font-medium text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                >
                  Free Tools
                </Link>
                <Link
                  href="/blog"
                  onClick={closeAll}
                  className="rounded-xl border border-[var(--ws-border-color)] px-3 py-2 text-center text-xs font-medium text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)]"
                >
                  Blog
                </Link>
              </div>

              {/* Bottom CTAs */}
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/talk-to-an-expert?ref=nav"
                  onClick={closeAll}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--ws-foreground)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
                >
                  Talk to an Expert
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  onClick={closeAll}
                  className="w-full inline-flex items-center justify-center rounded-full border border-[var(--ws-border-color)] px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:bg-[var(--ws-background-warm)] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
