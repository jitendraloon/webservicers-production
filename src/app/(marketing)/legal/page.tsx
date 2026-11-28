import React from "react";
import Link from "next/link";
import { Scale, FileText, ShieldAlert, ArrowRight, Lock, Globe, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Legal & Compliance Center — WebServicers",
  description: "WebServicers master legal terms, agreements, compliance statements, and data processing terms.",
};

const LEGAL_DOCUMENTS = [
  {
    title: "Terms of Service",
    href: "/terms",
    desc: "Master customer agreement covering account usage, billing subscriptions, service deliverables, and rights.",
    icon: FileText,
  },
  {
    title: "Privacy Policy",
    href: "/privacy",
    desc: "How we collect, encrypt, process, and safeguard your personal information and company marketing data.",
    icon: Lock,
  },
  {
    title: "Cookie Policy & Preferences",
    href: "/cookies",
    desc: "Detailed breakdown of tracking technologies, cookies, and consent management across our web properties.",
    icon: Globe,
  },
  {
    title: "Data Processing Addendum (GDPR)",
    href: "/privacy#gdpr",
    desc: "Contractual commitments regarding EU/UK General Data Protection Regulation compliance and data processor obligations.",
    icon: Scale,
  },
];

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-[var(--ws-bg)] text-[var(--ws-text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--ws-border-color)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] shadow-xs">
            <Scale className="h-3.5 w-3.5" />
            <span>Compliance & Governance</span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ws-text-primary)]">
            Legal & Compliance Center
          </h1>
          <p className="mt-2 text-sm text-[var(--ws-text-secondary)] max-w-xl mx-auto">
            Review our public legal policies, regulatory compliance standards, client service agreements, and security commitments.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEGAL_DOCUMENTS.map((doc, idx) => {
            const Icon = doc.icon;
            return (
              <Link
                key={idx}
                href={doc.href}
                className="group rounded-3xl border border-[var(--ws-border-color)] bg-white dark:bg-zinc-900 p-6 shadow-xs hover:border-[var(--ws-brand-lilac)] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-[var(--ws-brand-lilac-deep)] dark:bg-violet-950/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--ws-text-secondary)] group-hover:translate-x-1 group-hover:text-[var(--ws-brand-lilac-deep)] transition-all" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[var(--ws-text-primary)] group-hover:text-[var(--ws-brand-lilac-deep)] transition-colors">
                    {doc.title}
                  </h2>
                  <p className="mt-2 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
                    {doc.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--ws-border-color)] text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
                  Read Policy →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Commitment box */}
        <div className="mt-12 rounded-3xl border border-[var(--ws-border-color)] bg-zinc-50 dark:bg-zinc-900/60 p-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-[var(--ws-brand-lilac-deep)] shrink-0" />
            <h3 className="text-base font-bold text-[var(--ws-text-primary)]">Enterprise Security & SLA Commitment</h3>
          </div>
          <p className="mt-3 text-xs text-[var(--ws-text-secondary)] leading-relaxed">
            All customer records, API tokens, marketing databases, and billing credentials stored within WebServicers are encrypted using AES-256-GCM. We never sell customer marketing data or share client campaign analytics with third-party data brokers.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-[var(--ws-text-secondary)]">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 99.9% Uptime Guarantee</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated Daily Backups</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> PCI-DSS Compliant Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
