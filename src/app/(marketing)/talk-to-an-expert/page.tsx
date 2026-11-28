"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

const SERVICE_OPTIONS = [
  "Website Design & Dev",
  "SEO & Organic Growth",
  "Local Listings & Maps",
  "Google Search & Shopping Ads",
  "Meta & Instagram Ads",
  "LinkedIn B2B Campaigns",
  "YouTube & Video Ads",
  "Analytics & CRO",
];

const BUDGET_OPTIONS = [
  "Under $2,000 / mo",
  "$2,000 – $5,000 / mo",
  "$5,000 – $15,000 / mo",
  "$15,000+ / mo",
];

export default function TalkToAnExpertPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "SEO & Organic Growth",
  ]);
  const [budget, setBudget] = useState(BUDGET_OPTIONS[1]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formattedNotes = [
      company ? `Company: ${company}` : null,
      websiteUrl ? `Website: ${websiteUrl}` : null,
      selectedServices.length > 0
        ? `Services: ${selectedServices.join(", ")}`
        : null,
      `Monthly Budget: ${budget}`,
      notes.trim() ? `Goals: ${notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: "talk-to-an-expert",
          notes: formattedNotes.slice(0, 2000),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Please check your details and try again.");
        setLoading(false);
        return;
      }

      setSubmittedLead({
        id: data.lead?.id || `lead_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
      });
    } catch {
      setError("Network error while submitting your request. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSubmittedLead(null);
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setWebsiteUrl("");
    setSelectedServices(["SEO & Organic Growth"]);
    setBudget(BUDGET_OPTIONS[1]);
    setNotes("");
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Strategy Overview */}
        <div className="lg:col-span-5 space-y-6">
          <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
            Free Growth Consultation
          </span>
          <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
            Talk to a{" "}
            <span className="hero-emphasis">Growth Strategist</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--ws-text-secondary)] leading-relaxed">
            Get a custom channel roadmap, technical SEO audit preview, and
            transparent budget allocation tailored to your revenue targets.
          </p>

          <div className="surface-card rounded-2xl p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <CalendarCheck className="h-5 w-5 text-[var(--ws-brand-lilac-deep)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  30-Minute Actionable Audit
                </h2>
                <p className="text-xs text-[var(--ws-text-secondary)] mt-1 leading-relaxed">
                  No generic sales deck. We review your live site, search
                  visibility, and ad funnel before we even get on the call.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Sparkles className="h-5 w-5 text-[var(--ws-brand-lilac-deep)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  Unified 13-Channel Execution
                </h2>
                <p className="text-xs text-[var(--ws-text-secondary)] mt-1 leading-relaxed">
                  Bundle website design, organic SEO, and paid media under one
                  accountable team and one monthly invoice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--ws-text-primary)]">
                  Zero Lock-In Contracts
                </h2>
                <p className="text-xs text-[var(--ws-text-secondary)] mt-1 leading-relaxed">
                  Launch in 7 days with clear deliverables and month-to-month
                  flexibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lead Capture Form */}
        <div className="lg:col-span-7">
          <div className="surface-card rounded-2xl p-6 sm:p-10">
            {submittedLead ? (
              <div className="py-8 text-center space-y-5">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
                    Request Confirmed
                  </span>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--ws-text-primary)]">
                    Thanks, {submittedLead.name}!
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ws-text-secondary)] max-w-md mx-auto">
                    We&apos;ve logged your growth brief and sent a confirmation
                    to <strong className="text-[var(--ws-text-primary)]">{submittedLead.email}</strong>. A
                    senior strategist will respond within 1 business day.
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-xl border border-[var(--ws-border-color)] bg-[var(--ws-background-warm)] p-4 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--ws-text-secondary)]">
                      Reference ID
                    </span>
                    <span className="font-mono font-medium text-[var(--ws-text-primary)]">
                      {submittedLead.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ws-text-secondary)]">
                      Budget Tier
                    </span>
                    <span className="font-medium text-[var(--ws-text-primary)]">
                      {budget}
                    </span>
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="pt-1 border-t border-[var(--ws-border-color)]">
                      <span className="text-[var(--ws-text-secondary)] block mb-1">
                        Selected Channels
                      </span>
                      <span className="font-medium text-[var(--ws-text-primary)]">
                        {selectedServices.join(" • ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ws-foreground)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors"
                  >
                    Try Free SEO Tools
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center rounded-full border border-[var(--ws-border-color)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors cursor-pointer"
                  >
                    Submit Another Brief
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
                    Tell us about your growth goals
                  </h2>
                  <p className="text-sm text-[var(--ws-text-secondary)] mt-1">
                    Select the channels you want to scale and share your target
                    timeline.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expert-name"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="expert-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jordan Taylor"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="expert-email"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="expert-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@acme.io"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expert-phone"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="expert-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 234-5678"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="expert-company"
                      className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                    >
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="expert-company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expert-website"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="expert-website"
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                    />
                  </div>
                </div>

                {/* Multi-select Service Interest */}
                <div>
                  <span className="block text-sm font-medium text-[var(--ws-text-primary)] mb-2">
                    Services of Interest (select all that apply)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((service) => {
                      const active = selectedServices.includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? "border-[var(--ws-brand-lilac-deep)] bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)]"
                              : "border-[var(--ws-border-color)] bg-white text-[var(--ws-text-secondary)] hover:border-[var(--ws-brand-lilac)]"
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {service}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Budget */}
                <div>
                  <label
                    htmlFor="expert-budget"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Estimated Monthly Marketing Budget
                  </label>
                  <select
                    id="expert-budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  >
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="expert-notes"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Project Notes &amp; Targets
                  </label>
                  <textarea
                    id="expert-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share your current monthly traffic, target CPA/ROAS, launch deadline, or key competitors..."
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Submitting Brief..." : "Request Strategy Call"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
