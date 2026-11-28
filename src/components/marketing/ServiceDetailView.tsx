"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getServiceBySlug } from "@/data/services";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";

interface ServiceDetailViewProps {
  slug: string;
}

export function ServiceDetailView({ slug }: ServiceDetailViewProps) {
  const service = getServiceBySlug(slug);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [annual, setAnnual] = useState(false);

  if (!service) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="surface-card rounded-3xl p-12">
          <p className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Service Not Found
          </p>
          <h1 className="display-title mt-3 text-3xl text-[var(--ws-text-primary)]">
            We couldn&apos;t locate that service
          </h1>
          <Link
            href="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
          >
            Browse All 14 Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="pb-20">
      {/* ───── Hero ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-12 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 glass-pill rounded-full px-4 py-1.5 text-xs font-medium text-[var(--ws-text-primary)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                <ServiceIcon name={service.iconName} className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
                {service.category}
              </span>
              <span className="text-[var(--ws-text-secondary)]">•</span>
              <span>Starting at ${service.priceUsd}/{service.period}</span>
            </div>

            <h1 className="display-title mt-5 text-4xl sm:text-5xl lg:text-6xl text-[var(--ws-text-primary)]">
              {service.name}{" "}
              <span className="hero-emphasis">engineered to scale.</span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl font-medium text-[var(--ws-text-primary)] max-w-2xl">
              {service.tagline}
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--ws-text-secondary)] max-w-2xl">
              {service.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
              >
                View Plans &amp; Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={`/talk-to-an-expert?service=${service.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ws-border-color)] bg-white/80 px-6 py-3.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-[var(--ws-brand-lilac-deep)]" />
                Talk to an Expert
              </Link>
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="lg:col-span-5">
            <div className="surface-card rounded-3xl p-7 sm:p-8">
              <div className="flex items-center justify-between pb-5 border-b border-[var(--ws-border-color)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                    <ServiceIcon name={service.iconName} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-mono-label text-[var(--ws-text-secondary)]">
                      Included Highlights
                    </p>
                    <p className="text-sm font-semibold text-[var(--ws-text-primary)]">
                      {service.shortName}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#e8fbf4] px-3 py-1 text-xs font-semibold text-[#087858]">
                  Launch in 7d
                </span>
              </div>

              <ul className="mt-6 space-y-3.5">
                {service.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8fbf4] text-[#087858]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--ws-text-primary)]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-5 border-t border-[var(--ws-border-color)] flex items-center justify-between text-xs text-[var(--ws-text-secondary)]">
                <span>One monthly invoice • No lock-in</span>
                <Link
                  href="/pricing"
                  className="font-medium text-[var(--ws-brand-lilac-deep)] hover:underline"
                >
                  Compare all 14 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Metrics Strip ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {service.metrics.map((metric) => (
            <div
              key={metric.label}
              className="surface-card rounded-2xl p-5 sm:p-6 transition-all"
            >
              <p className="font-mono-label text-[var(--ws-text-secondary)]">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ws-text-primary)] tabular-nums">
                {metric.value}
              </p>
              {metric.note && (
                <p className="mt-1 text-xs text-[var(--ws-text-secondary)]">
                  {metric.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───── 3-Tier Pricing Cards ───── */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              Transparent Plans
            </span>
            <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
              Choose your {service.shortName} tier
            </h2>
            <p className="mt-2 text-base text-[var(--ws-text-secondary)] max-w-xl">
              Start with what you need today and scale up or add channels anytime
              from your client portal.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ws-border-color)] bg-white/80 p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                !annual
                  ? "bg-[var(--ws-foreground)] text-white"
                  : "text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                annual
                  ? "bg-[var(--ws-foreground)] text-white"
                  : "text-[var(--ws-text-secondary)] hover:text-[var(--ws-text-primary)]"
              }`}
            >
              Annual
              <span className="rounded-full bg-[var(--ws-brand-mint)]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#087858]">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {service.tiers.map((tier) => {
            const displayPrice = annual
              ? Math.round(tier.priceUsd * 0.8)
              : tier.priceUsd;
            const isPopular = Boolean(tier.popular);

            return (
              <div
                key={tier.name}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all ${
                  isPopular
                    ? "bg-white border-2 border-[var(--ws-brand-lilac-deep)] shadow-[0_20px_50px_rgba(91,98,212,0.14)] relative"
                    : "surface-card"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
                      {tier.name}
                    </h3>
                    {isPopular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ws-brand-lilac-soft)] px-3 py-1 text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-[var(--ws-text-secondary)] min-h-[40px]">
                    {tier.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight text-[var(--ws-text-primary)] tabular-nums">
                      ${displayPrice}
                    </span>
                    <span className="text-sm text-[var(--ws-text-secondary)]">
                      /{tier.period}
                    </span>
                    {annual && (
                      <span className="ml-2 text-xs text-[var(--ws-text-secondary)] line-through tabular-nums">
                        ${tier.priceUsd}
                      </span>
                    )}
                  </div>

                  <ul className="mt-7 space-y-3 border-t border-[var(--ws-border-color)] pt-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e8fbf4] text-[#087858]">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm text-[var(--ws-text-primary)]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/register?service=${service.slug}&tier=${tier.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                    isPopular
                      ? "bg-[var(--ws-brand-lilac-deep)] text-white hover:bg-[var(--ws-foreground)] shadow-sm"
                      : "bg-[var(--ws-foreground)] text-white hover:bg-[var(--ws-brand-lilac-deep)]"
                  }`}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── Deliverables Grid ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-10">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            What&apos;s Included
          </span>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
            Core deliverables every month
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {service.deliverables.map((item) => (
            <div
              key={item.title}
              className="surface-card rounded-2xl p-6 sm:p-7 flex items-start gap-4 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--ws-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ws-text-secondary)]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 4-Step Process Timeline ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-10">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            How It Works
          </span>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
            From kickoff to compounding results
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {service.process.map((step) => (
            <div
              key={step.step}
              className="surface-card rounded-2xl p-6 relative flex flex-col justify-between"
            >
              <div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ws-foreground)] text-xs font-mono font-semibold text-white">
                  {step.step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[var(--ws-text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ws-text-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FAQ Accordion ───── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="text-center mb-10">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            FAQ
          </span>
          <h2 className="display-title mt-2 text-3xl sm:text-4xl text-[var(--ws-text-primary)]">
            Common questions about {service.shortName}
          </h2>
        </div>

        <div className="space-y-3">
          {service.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.question}
                className="surface-card rounded-2xl overflow-hidden transition-all"
              >
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

      {/* ───── Talk to an Expert CTA ───── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="bg-dark-enterprise rounded-3xl p-8 sm:p-12 lg:p-14 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="font-mono-label text-[var(--ws-brand-mint)]">
              Dedicated Growth Team
            </span>
            <h2 className="display-title mt-3 text-3xl sm:text-4xl text-white">
              Want a custom {service.shortName} roadmap?
            </h2>
            <p className="mt-3 text-base text-white/75 leading-relaxed">
              Book a free 20-minute strategy session. We&apos;ll audit your
              current setup, map expected ROI, and recommend the right tier.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <Link
              href={`/talk-to-an-expert?service=${service.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-brand-mint)] px-6 py-3.5 text-sm font-semibold text-[#0a091c] hover:opacity-90 transition-opacity"
            >
              Talk to an Expert
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
            >
              Explore All 14 Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
