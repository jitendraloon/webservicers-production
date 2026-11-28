import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { BLOG_ARTICLES, getArticleBySlug } from "@/lib/blog-data";

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = BLOG_ARTICLES.filter((a) => a.slug !== article.slug).slice(
    0,
    2
  );

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-14 sm:py-20 space-y-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ws-text-secondary)] hover:text-[var(--ws-brand-lilac-deep)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all playbooks
      </Link>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-[var(--ws-brand-lilac-soft)] px-3 py-1 font-semibold text-[var(--ws-brand-lilac-deep)]">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--ws-text-secondary)]">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
          <span className="text-[var(--ws-text-secondary)]">
            {article.publishedAt}
          </span>
        </div>

        <h1 className="display-title text-3xl sm:text-5xl text-[var(--ws-text-primary)]">
          {article.title}
        </h1>

        <p className="text-lg text-[var(--ws-text-secondary)] leading-relaxed">
          {article.excerpt}
        </p>

        <div className="pt-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--ws-foreground)] text-white flex items-center justify-center text-xs font-semibold">
            {article.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ws-text-primary)]">
              {article.author.name}
            </p>
            <p className="text-xs text-[var(--ws-text-secondary)]">
              {article.author.role}
            </p>
          </div>
        </div>
      </header>

      {/* Key Takeaways */}
      <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ws-brand-lilac-deep)]">
          <Sparkles className="h-4 w-4" />
          Key Takeaways
        </div>
        <ul className="space-y-2.5">
          {article.takeaways.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-[var(--ws-text-primary)]"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Body Sections */}
      <div className="space-y-8">
        {article.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-base leading-relaxed text-[var(--ws-text-secondary)]"
              >
                {p}
              </p>
            ))}
            {section.checklist && (
              <div className="rounded-xl border border-[var(--ws-border-color)] bg-white p-5 space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--ws-brand-lilac-deep)]">
                  Implementation Checklist
                </p>
                <ul className="space-y-2">
                  {section.checklist.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-[var(--ws-text-primary)]"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[var(--ws-brand-lilac-deep)] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA Banner */}
      <div className="surface-card rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold text-[var(--ws-text-primary)]">
            Want our team to execute this playbook for you?
          </h3>
          <p className="text-sm text-[var(--ws-text-secondary)]">
            Get a free 30-minute audit of your website, SEO, and paid media
            funnel.
          </p>
        </div>
        <Link
          href={`/talk-to-an-expert?ref=blog-${article.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors shrink-0"
        >
          Talk to an Expert
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Related Playbooks */}
      <div className="pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
          More Playbooks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/blog/${item.slug}`}
              className="surface-card rounded-2xl p-5 space-y-2 block"
            >
              <span className="text-xs font-semibold text-[var(--ws-brand-lilac-deep)]">
                {item.category} • {item.readTime}
              </span>
              <h4 className="text-base font-semibold text-[var(--ws-text-primary)]">
                {item.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
