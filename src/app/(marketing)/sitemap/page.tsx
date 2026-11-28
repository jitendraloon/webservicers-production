import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const SITEMAP_GROUPS = [
  {
    title: "Presence & Organic",
    links: [
      { label: "Website Design & Dev", href: "/services/website-design" },
      { label: "SEO & Organic Growth", href: "/services/seo" },
      { label: "Local Listings & Maps", href: "/services/local-listings" },
      { label: "Analytics & Attribution", href: "/services/analytics" },
      { label: "Conversion Optimization", href: "/services/cro" },
    ],
  },
  {
    title: "Promote & Paid Media",
    links: [
      { label: "All 14 Channels", href: "/services" },
      { label: "Google & Search Ads", href: "/services/search-ads" },
      { label: "Meta & Social Ads", href: "/services/social-ads" },
      { label: "LinkedIn B2B Campaigns", href: "/services/linkedin-ads" },
      { label: "YouTube & Video Ads", href: "/services/video-ads" },
    ],
  },
  {
    title: "Tools & Resources",
    links: [
      { label: "Pricing & Plans", href: "/pricing" },
      { label: "Free SEO Tools Hub", href: "/tools" },
      { label: "Marketing Blog & Playbooks", href: "/blog" },
      { label: "Help Center", href: "/help" },
      { label: "Talk to an Expert", href: "/talk-to-an-expert" },
    ],
  },
  {
    title: "Company, Account & Legal",
    links: [
      { label: "About WebServicers", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media Kit", href: "/press" },
      { label: "Contact Us", href: "/contact" },
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Settings", href: "/cookie-settings" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-10">
      <div className="max-w-2xl space-y-3">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Navigation Index
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Site Directory
        </h1>
        <p className="text-base text-[var(--ws-text-secondary)]">
          A complete index of WebServicers services, free tools, marketing
          playbooks, and company pages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SITEMAP_GROUPS.map((group) => (
          <div key={group.title} className="surface-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ws-brand-lilac-deep)]">
              {group.title}
            </h2>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 text-sm text-[var(--ws-text-primary)] hover:text-[var(--ws-brand-lilac-deep)] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
