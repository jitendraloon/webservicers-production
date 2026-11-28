import React from "react";
import Link from "next/link";

const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly when creating an account, submitting a consultation brief, or opening a support ticket (such as your name, work email, phone number, company details, and billing preferences). We also collect minimal technical telemetry required to secure sessions and measure site performance.",
  },
  {
    title: "2. How We Use Your Data",
    body: "Your information is used strictly to deliver contracted web, SEO, and advertising services, process invoices, authenticate workspace sessions, and respond to your inquiries. We never sell personal data to third-party data brokers.",
  },
  {
    title: "3. Security & Encryption",
    body: "All data in transit is encrypted via TLS 1.3. Passwords are hashed using industry-standard adaptive hashing, and workspace sessions use HTTP-only signed tokens with optional TOTP two-factor authentication.",
  },
  {
    title: "4. Your GDPR & CCPA Rights",
    body: "You may request an export or permanent deletion of your personal data at any time through your Client Portal privacy settings or by contacting our Data Protection Officer.",
  },
  {
    title: "5. Cookies & Tracking Preferences",
    body: "We use essential cookies for authentication and security, plus optional analytics cookies when consented. You can update your preferences at any time.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 sm:py-20 space-y-8">
      <div className="space-y-3">
        <span className="font-mono-label text-[var(--ws-brand-lilac-deep)]">
          Legal &amp; Compliance
        </span>
        <h1 className="display-title text-4xl sm:text-5xl text-[var(--ws-text-primary)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--ws-text-secondary)]">
          Effective Date: November 1, 2026 • GDPR &amp; CCPA Compliant
        </p>
      </div>

      <div className="surface-card rounded-2xl p-6 sm:p-10 space-y-8">
        {PRIVACY_SECTIONS.map((s) => (
          <div key={s.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--ws-text-primary)]">
              {s.title}
            </h2>
            <p className="text-sm text-[var(--ws-text-secondary)] leading-relaxed">
              {s.body}
            </p>
          </div>
        ))}

        <div className="pt-4 border-t border-[var(--ws-border-color)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ws-text-secondary)]">
          <span>
            Privacy requests:{" "}
            <Link
              href="/contact"
              className="font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
            >
              privacy@webservicers.com
            </Link>
          </span>
          <Link
            href="/cookie-settings"
            className="font-semibold text-[var(--ws-brand-lilac-deep)] hover:underline"
          >
            Manage Cookie Preferences →
          </Link>
        </div>
      </div>
    </section>
  );
}
