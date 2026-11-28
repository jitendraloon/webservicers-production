import React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Globe, HeartHandshake, MapPin, Sparkles } from "lucide-react";

const OPEN_ROLES = [
  {
    title: "Senior Technical SEO Strategist",
    department: "Organic Growth",
    location: "Remote (North America / Europe)",
    type: "Full-time",
  },
  {
    title: "Performance Media Lead (Google & Meta)",
    department: "Paid Acquisition",
    location: "Remote (Global)",
    type: "Full-time",
  },
  {
    title: "Full-Stack Next.js Engineer",
    department: "Platform & Web",
    location: "Remote (Global)",
    type: "Full-time",
  },
  {
    title: "Client Growth Partner",
    department: "Customer Success",
    location: "Remote (US / UK)",
    type: "Full-time",
  },
];

const PERKS = [
  {
    icon: Globe,
    title: "100% Remote-First",
    desc: "Work from anywhere with async-friendly workflows and flexible hours.",
  },
  {
    icon: Sparkles,
    title: "Annual Learning Budget",
    desc: "$2,000/yr for conferences, certifications, and specialized tooling.",
  },
  {
    icon: HeartHandshake,
    title: "Transparent Ownership",
    desc: "Direct impact on client revenue without agency bureaucracy.",
  },
];

export default function CareersPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-12">
      <div className="max-w-3xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Careers at WebServicers
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Build the future of{" "}
          <span className="hero-emphasis">unified digital growth</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
          We&apos;re a distributed team of engineers, SEOs, and performance
          marketers who care deeply about measurable craft.
        </p>
      </div>

      {/* Perks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PERKS.map((perk) => {
          const Icon = perk.icon;
          return (
            <div key={perk.title} className="surface-card rounded-2xl p-6 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-[var(--ws-text-primary)]">
                {perk.title}
              </h2>
              <p className="text-sm text-[var(--ws-text-secondary)]">{perk.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Open Roles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
          Open Positions
        </h2>
        <div className="space-y-3">
          {OPEN_ROLES.map((role) => (
            <div
              key={role.title}
              className="surface-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
                  {role.department}
                </span>
                <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                  {role.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--ws-text-secondary)]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {role.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {role.type}
                  </span>
                </div>
              </div>
              <Link
                href={`/contact?topic=careers&role=${encodeURIComponent(role.title)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shrink-0"
              >
                Apply Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
