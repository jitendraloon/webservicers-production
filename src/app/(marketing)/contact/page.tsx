"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDynamicEmail } from "@/lib/site-url";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";

const SUPPORT_CARDS = [
  {
    icon: Mail,
    title: "Sales & New Projects",
    detail: "hello@webservicers.com",
    sub: "Typical response within 2 business hours.",
  },
  {
    icon: LifeBuoy,
    title: "Client Support Desk",
    detail: "support@webservicers.com",
    sub: "24/7 ticket triage for active retainers.",
  },
  {
    icon: MapPin,
    title: "Headquarters",
    detail: "548 Market St, San Francisco, CA",
    sub: "Remote-first hubs in London, Toronto & Bengaluru.",
  },
  {
    icon: Clock,
    title: "Operating Hours",
    detail: "Mon – Fri, 8:00 AM – 8:00 PM EST",
    sub: "Dedicated Slack & portal updates included.",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [salesEmail, setSalesEmail] = useState("hello@webservicers.com");
  const [supportEmail, setSupportEmail] = useState("support@webservicers.com");

  useEffect(() => {
    setSalesEmail(getDynamicEmail("hello"));
    setSupportEmail(getDynamicEmail("support"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formattedNotes = `Topic: ${topic}\nMessage: ${message.trim()}`;

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: "contact",
          notes: formattedNotes.slice(0, 2000),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Please verify your details and try again.");
        setLoading(false);
        return;
      }

      setSubmitted({
        id: data.lead?.id || `lead_${Date.now()}`,
        name: name.trim(),
      });
    } catch {
      setError("Network error while sending message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Contact Us
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Let&apos;s build something{" "}
          <span className="hero-emphasis">measurable</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--ws-text-secondary)]">
          Reach our sales, partnerships, or client success teams directly.
          Already an active client? Sign in to your portal for priority SLA
          tickets.
        </p>
      </div>

      {/* Office & Support Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUPPORT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="surface-card rounded-2xl p-5 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-[var(--ws-brand-lilac-soft)] text-[var(--ws-brand-lilac-deep)] flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--ws-text-primary)]">
                {card.title}
              </h2>
              <p className="text-sm font-medium text-[var(--ws-brand-lilac-deep)]">
                {card.title.includes("Sales")
                  ? salesEmail
                  : card.title.includes("Support")
                  ? supportEmail
                  : card.detail}
              </p>
              <p className="text-xs text-[var(--ws-text-secondary)]">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Contact Form + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 surface-card rounded-2xl p-6 sm:p-10">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--ws-text-primary)]">
                Message Received, {submitted.name}
              </h2>
              <p className="text-sm text-[var(--ws-text-secondary)] max-w-md mx-auto">
                Your inquiry (ID:{" "}
                <span className="font-mono font-medium">{submitted.id}</span>)
                has been routed to our team. We&apos;ll reply shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(null);
                  setName("");
                  setEmail("");
                  setPhone("");
                  setMessage("");
                }}
                className="inline-flex items-center rounded-full border border-[var(--ws-border-color)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ws-text-primary)] hover:border-[var(--ws-brand-lilac)] transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-[var(--ws-brand-lilac-deep)]" />
                <h2 className="text-xl font-semibold text-[var(--ws-text-primary)]">
                  Send us a message
                </h2>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Samira Patel"
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samira@company.com"
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-[var(--ws-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                  >
                    Topic
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Custom Enterprise Retainer">
                      Custom Enterprise Retainer
                    </option>
                    <option value="Agency Partnership">
                      Agency / White-Label Partnership
                    </option>
                    <option value="Billing & Invoices">
                      Billing &amp; Invoices
                    </option>
                    <option value="Press & Media">Press &amp; Media</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-[var(--ws-text-primary)] mb-1.5"
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our team help you?"
                  className="w-full rounded-xl border border-[var(--ws-border-color)] bg-white px-4 py-2.5 text-sm text-[var(--ws-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ws-brand-lilac-deep)]/30 focus:border-[var(--ws-brand-lilac-deep)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ws-foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--ws-brand-lilac-deep)] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Message"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Right: Quick Action Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="surface-card rounded-2xl p-6 space-y-3">
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              Looking for a Growth Audit?
            </span>
            <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Book a tailored strategy session
            </h3>
            <p className="text-sm text-[var(--ws-text-secondary)]">
              Need a multi-channel proposal with estimated budgets and launch
              timelines? Use our dedicated project brief form.
            </p>
            <Link
              href="/talk-to-an-expert"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
            >
              Talk to an Expert
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="surface-card rounded-2xl p-6 space-y-3">
            <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
              Existing Clients
            </span>
            <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              Open a priority support ticket
            </h3>
            <p className="text-sm text-[var(--ws-text-secondary)]">
              Sign in to your client workspace to message your campaign manager,
              approve deliverables, or download invoices.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
            >
              Sign In to Client Portal
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
