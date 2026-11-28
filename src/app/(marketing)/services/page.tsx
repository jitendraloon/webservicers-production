"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Search } from "lucide-react";
import {
  SERVICE_FILTER_CATEGORIES,
  SERVICES,
  type ServiceFilterCategory,
} from "@/data/services";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";

export default function MarketingServicesPage() {
  const [category, setCategory] = useState<ServiceFilterCategory>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((service) => {
      const matchesCategory =
        category === "All" || service.category === category;
      const matchesQuery =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.tagline.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10 lg:pt-20">
        <div className="max-w-3xl">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            All 14 Services
          </span>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Every channel you need to{" "}
            <span className="hero-emphasis">build, promote &amp; measure.</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--ws-text-secondary)] leading-relaxed">
            Activate individual services or combine Presence, Promote, and
            Analytics into one unified growth engine.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {SERVICE_FILTER_CATEGORIES.map((cat) => {
              const count =
                cat === "All"
                  ? SERVICES.length
                  : SERVICES.filter((s) => s.category === cat).length;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    active
                      ? "bg-[var(--ws-foreground)] text-white"
                      : "glass-pill text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services..."
              aria-label="Search services"
              className="w-full rounded-full border border-[var(--ws-border-color)] bg-white/85 pl-10 pr-4 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-secondary)] focus:outline-none focus:border-[var(--ws-brand-lilac-deep)]"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {filtered.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center">
            <p className="text-base font-medium text-[var(--ws-text-primary)]">
              No services matched &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("All");
                setQuery("");
              }}
              className="mt-4 rounded-full bg-[var(--ws-foreground)] px-5 py-2 text-xs font-medium text-white cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => (
              <div
                key={service.slug}
                className="surface-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]">
                      <ServiceIcon name={service.iconName} className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-[#fcfbf7] border border-[var(--ws-border-color)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ws-text-secondary)]">
                        {service.category}
                      </span>
                      <p className="mt-1.5 text-lg font-semibold text-[var(--ws-text-primary)] tabular-nums">
                        ${service.priceUsd}
                        <span className="text-xs font-normal text-[var(--ws-text-secondary)]">
                          /{service.period}
                        </span>
                      </p>
                    </div>
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-[var(--ws-text-primary)]">
                    {service.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ws-text-secondary)] leading-relaxed">
                    {service.tagline}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-[var(--ws-border-color)] pt-4">
                    {service.highlights.slice(0, 3).map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-[var(--ws-text-primary)]"
                      >
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#087858]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--ws-border-color)] flex items-center justify-between gap-3">
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
                  >
                    Explore Service
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/register?service=${service.slug}`}
                    className="text-xs font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
