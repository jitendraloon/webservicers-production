"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Search } from "lucide-react";
import {
  BLOG_ARTICLES,
  BLOG_CATEGORIES,
  type BlogCategory,
} from "@/lib/blog-data";

export default function MarketingBlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | BlogCategory
  >("All");
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOG_ARTICLES.filter((article) => {
      const matchesCat =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, query]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Growth Playbooks &amp; Insights
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          The WebServicers{" "}
          <span className="hero-emphasis">Marketing Journal</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
          Field-tested playbooks on technical SEO, paid search ROAS, conversion
          design, and full-funnel attribution from our practitioners.
        </p>
      </div>

      {/* Category Filters + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--ws-brand-lilac-deep)] bg-[var(--ws-foreground)] text-white"
                    : "border-[var(--ws-border-color)] bg-white text-[var(--ws-text-secondary)] hover:border-[var(--ws-brand-lilac)] hover:text-[var(--ws-text-primary)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search playbooks..."
            className="w-full rounded-full border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-[var(--ws-brand-lilac-deep)] mx-auto" />
          <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
            No matching playbooks found
          </h2>
          <p className="text-sm text-[var(--ws-text-secondary)]">
            Try clearing your search filter or switching to All categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <article
              key={article.slug}
              className="surface-card rounded-2xl p-6 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-[var(--ws-brand-lilac-soft)] px-3 py-1 font-semibold text-[var(--ws-brand-lilac-deep)]">
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--ws-text-secondary)]">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-semibold text-[var(--ws-text-primary)] leading-snug">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="hover:text-[var(--ws-brand-lilac-deep)] transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>

                <p className="mt-2.5 text-sm text-[var(--ws-text-secondary)] leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--ws-border-color)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--ws-text-primary)]">
                    {article.author.name}
                  </p>
                  <p className="text-[11px] text-[var(--ws-text-secondary)]">
                    {article.publishedAt}
                  </p>
                </div>

                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
                >
                  Read Playbook
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
