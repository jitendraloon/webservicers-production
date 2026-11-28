"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  CURRENCY_RATES,
  formatServicePrice,
  SERVICE_FILTER_CATEGORIES,
  SERVICES,
  type CurrencyCode,
  type ServiceFilterCategory,
} from "@/data/services";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";

const CURRENCIES = Object.keys(CURRENCY_RATES) as CurrencyCode[];

export default function MarketingPricingPage() {
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [category, setCategory] = useState<ServiceFilterCategory>("All");

  const filtered = useMemo(() => {
    if (category === "All") return SERVICES;
    return SERVICES.filter((s) => s.category === category);
  }, [category]);

  return (
    <div className="pb-20">
      {/* Header & Controls */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10 lg:pt-20">
        <div className="max-w-3xl">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Pricing Matrix
          </span>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Transparent pricing across{" "}
            <span className="hero-emphasis">all 14 services.</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--ws-text-secondary)] leading-relaxed">
            Every plan includes portal access, transparent reporting, and zero
            long-term lock-in. Switch to annual billing to save 20%.
          </p>
        </div>

        <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {SERVICE_FILTER_CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--ws-foreground)] text-white"
                      : "glass-pill text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Billing + Currency Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ws-border-color)] bg-white/85 p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  !annual
                    ? "bg-[var(--ws-foreground)] text-white"
                    : "text-[var(--ws-text-secondary)]"
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
                    : "text-[var(--ws-text-secondary)]"
                }`}
              >
                Annual
                <span className="rounded-full bg-[var(--ws-brand-mint)]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#087858]">
                  -20%
                </span>
              </button>
            </div>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              aria-label="Select currency"
              className="rounded-full border border-[var(--ws-border-color)] bg-white/90 px-4 py-2 text-xs font-medium text-[var(--ws-text-primary)] focus:outline-none focus:border-[var(--ws-brand-lilac-deep)] cursor-pointer"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_RATES[code].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Matrix Table */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="surface-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--ws-border-color)] bg-[#fcfbf7]/90">
                  <th className="py-4 px-6 font-mono-label text-[var(--ws-text-secondary)]">
                    Service
                  </th>
                  <th className="py-4 px-5 font-mono-label text-[var(--ws-text-secondary)]">
                    Standard
                  </th>
                  <th className="py-4 px-5 font-mono-label text-[var(--ws-brand-lilac-deep)]">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Growth (Popular)
                    </span>
                  </th>
                  <th className="py-4 px-5 font-mono-label text-[var(--ws-text-secondary)]">
                    Enterprise
                  </th>
                  <th className="py-4 px-6 font-mono-label text-right text-[var(--ws-text-secondary)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ws-border-color)]">
                {filtered.map((service) => {
                  const [std, growth, ent] = service.tiers;
                  return (
                    <tr
                      key={service.slug}
                      className="hover:bg-white/70 transition-colors"
                    >
                      <td className="py-5 px-6 align-top min-w-[240px]">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                            <ServiceIcon
                              name={service.iconName}
                              className="h-4 w-4"
                            />
                          </span>
                          <div>
                            <Link
                              href={service.href}
                              className="text-sm font-semibold text-[var(--ws-text-primary)] hover:text-[var(--ws-brand-lilac-deep)] transition-colors"
                            >
                              {service.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-[var(--ws-text-secondary)]">
                              {service.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-5 align-top min-w-[160px]">
                        <p className="text-base font-semibold text-[var(--ws-text-primary)] tabular-nums">
                          {formatServicePrice(std.priceUsd, currency, annual)}
                          <span className="text-xs font-normal text-[var(--ws-text-secondary)]">
                            /mo
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[var(--ws-text-secondary)] line-clamp-2">
                          {std.features[0]}
                        </p>
                      </td>

                      <td className="py-5 px-5 align-top min-w-[175px] bg-[var(--ws-brand-lilac-soft)]/25">
                        <p className="text-base font-semibold text-[var(--ws-brand-lilac-deep)] tabular-nums">
                          {formatServicePrice(growth.priceUsd, currency, annual)}
                          <span className="text-xs font-normal text-[var(--ws-text-secondary)]">
                            /mo
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[var(--ws-text-primary)] flex items-start gap-1">
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#087858]" />
                          <span className="line-clamp-2">{growth.features[0]}</span>
                        </p>
                      </td>

                      <td className="py-5 px-5 align-top min-w-[160px]">
                        <p className="text-base font-semibold text-[var(--ws-text-primary)] tabular-nums">
                          {formatServicePrice(ent.priceUsd, currency, annual)}
                          <span className="text-xs font-normal text-[var(--ws-text-secondary)]">
                            /mo
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[var(--ws-text-secondary)] line-clamp-2">
                          {ent.features[0]}
                        </p>
                      </td>

                      <td className="py-5 px-6 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={service.href}
                            className="rounded-full border border-[var(--ws-border-color)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors"
                          >
                            Details
                          </Link>
                          <Link
                            href={`/register?service=${service.slug}&tier=growth&billing=${annual ? "annual" : "monthly"}`}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--ws-foreground)] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
                          >
                            Start
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Bundle CTA */}
        <div className="mt-10 bg-dark-enterprise rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-mono-label text-[var(--ws-brand-mint)]">
              Multi-Channel Bundles
            </span>
            <h2 className="display-title mt-2 text-2xl sm:text-3xl text-white">
              Combining 3+ services? Get a custom growth bundle.
            </h2>
            <p className="mt-2 text-sm text-white/75 max-w-xl">
              Speak with our team to bundle Website, SEO, Paid Ads, and
              Analytics with consolidated reporting and dedicated strategist hours.
            </p>
          </div>
          <Link
            href="/talk-to-an-expert?ref=pricing"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-brand-mint)] px-6 py-3 text-sm font-semibold text-[#0a091c] hover:opacity-90 transition-opacity shrink-0"
          >
            Talk to an Expert
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
