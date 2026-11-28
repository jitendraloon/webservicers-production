import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Globe, Layers, ShieldCheck, Users } from "lucide-react";

const METRICS = [
  { label: "Active Growth Channels", value: "13+" },
  { label: "Average Launch Window", value: "7 Days" },
  { label: "Client Retention Rate", value: "94%" },
  { label: "Countries Served", value: "28" },
];

const PRINCIPLES = [
  {
    icon: Layers,
    title: "One Unified Team",
    description:
      "Instead of coordinating separate web developers, SEO agencies, and media buyers, you get one integrated pod working from a shared revenue roadmap.",
  },
  {
    icon: BarChart3,
    title: "Revenue-First Attribution",
    description:
      "We measure success by qualified pipeline, lower blended CAC, and compounding organic traffic—never vanity impressions.",
  },
  {
    icon: ShieldCheck,
    title: "Radical Transparency",
    description:
      "Every deliverable, ad spend dollar, keyword movement, and invoice lives inside your live client portal with zero lock-in.",
  },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-14">
      {/* Hero */}
      <div className="max-w-3xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          About WebServicers
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Engineering digital growth that{" "}
          <span className="hero-emphasis">compounds together</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)] leading-relaxed">
          WebServicers was founded to replace fragmented agency retainers with
          a single, software-enabled growth platform. We combine senior web
          engineering, technical SEO, and performance media under one roof.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="surface-card rounded-2xl p-6">
            <span className="display-title text-3xl sm:text-4xl text-[var(--ws-brand-lilac-deep)]">
              {m.value}
            </span>
            <p className="mt-2 text-xs font-medium text-[var(--ws-text-secondary)]">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Principles */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
          How we operate
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRINCIPLES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="surface-card rounded-2xl p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--ws-text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="surface-card rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
            <Globe className="h-4 w-4" />
            <span>Global Remote-First Team</span>
            <span>•</span>
            <Users className="h-4 w-4" />
            <span>Dedicated Pods</span>
          </div>
          <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
            Ready to consolidate your growth stack?
          </h2>
          <p className="text-sm text-[var(--ws-text-secondary)]">
            Explore our transparent service packages or schedule a 30-minute
            architecture review with a strategist.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/talk-to-an-expert?ref=about"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
          >
            Talk to an Expert
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center rounded-full border border-[var(--ws-border-color)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
          >
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}
