import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Presence",
    links: [
      { label: "Website Design & Dev", href: "/services/website-design" },
      { label: "SEO & Organic Growth", href: "/services/seo" },
      { label: "Local Listings & Maps", href: "/services/local-listings" },
      { label: "Analytics & Attribution", href: "/services/analytics" },
      { label: "Conversion Optimization", href: "/services/cro" },
    ],
  },
  {
    title: "Promote",
    links: [
      { label: "Google & Search Ads", href: "/services/search-ads" },
      { label: "Meta & Social Ads", href: "/services/social-ads" },
      { label: "LinkedIn B2B Campaigns", href: "/services/linkedin-ads" },
      { label: "YouTube & Video Ads", href: "/services/video-ads" },
      { label: "Programmatic & Display", href: "/services/display-ads" },
      { label: "Email & Lifecycle", href: "/services/email-marketing" },
      { label: "Content & Copywriting", href: "/services/content-marketing" },
      { label: "Reputation & Reviews", href: "/services/reputation" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "All 14 Channels", href: "/services" },
      { label: "Pricing", href: "/pricing" },
      { label: "Free Tools", href: "/tools" },
      { label: "Blog", href: "/blog" },
      { label: "Get help", href: "/help" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookie Preferences", href: "/cookies" },
  { label: "Sitemap", href: "/sitemap" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--ws-border-color)] bg-white/70 backdrop-blur-md text-[var(--ws-text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Left: Brand Summary & CTAs */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <span className="h-8 w-8 rounded-xl bg-[var(--ws-foreground)] text-white flex items-center justify-center font-semibold text-sm tracking-tight group-hover:bg-[var(--ws-brand-lilac-deep)] transition-colors">
                  W
                </span>
                <span className="font-semibold text-base tracking-tight text-[var(--ws-text-primary)]">
                  WebServicers
                </span>
              </Link>

              <p className="mt-4 text-sm leading-relaxed text-[var(--ws-text-secondary)] max-w-sm">
                Thirteen services, one team, one monthly invoice. Websites, SEO,
                local listings, analytics, and managed paid growth engineered to
                compound together.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/talk-to-an-expert?ref=footer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shadow-sm"
                >
                  Talk to an Expert
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-full border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-[var(--ws-text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--ws-brand-lilac-deep)] shrink-0" />
              <span>Launch in 7 days with transparent monthly reporting.</span>
            </div>
          </div>

          {/* Right: 4-Column Navigation Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono-label text-[var(--ws-text-primary)] mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--ws-border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--ws-text-secondary)]">
          <p>© {new Date().getFullYear()} WebServicers. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[var(--ws-text-primary)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
