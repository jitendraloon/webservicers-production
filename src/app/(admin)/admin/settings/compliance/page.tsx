'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, FileCheck, Shield } from 'lucide-react';

export default function AdminSettingsCompliancePage() {
  const [cookieConsentEnabled, setCookieConsentEnabled] = React.useState(true);
  const [cookieBannerText, setCookieBannerText] = React.useState(
    'We use essential and analytics cookies to optimize performance, remember preferences, and analyze traffic under GDPR & CCPA.'
  );
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = React.useState('/privacy');
  const [termsOfServiceUrl, setTermsOfServiceUrl] = React.useState('/terms');
  const [gdprDataExport, setGdprDataExport] = React.useState(true);
  const [gdprAccountDeletion, setGdprAccountDeletion] = React.useState(true);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = React.useState('365');
  const [dpoContactEmail, setDpoContactEmail] = React.useState('');

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const hostDomain = typeof window !== 'undefined' ? window.location.hostname : 'webservicers.com';
    if (hostOrigin) {
      setPrivacyPolicyUrl(`${hostOrigin}/privacy`);
      setTermsOfServiceUrl(`${hostOrigin}/terms`);
      setDpoContactEmail(`dpo@${hostDomain}`);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=compliance');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.cookieConsentEnabled !== undefined) setCookieConsentEnabled(d.cookieConsentEnabled);
            if (d.cookieBannerText) setCookieBannerText(d.cookieBannerText);
            if (d.privacyPolicyUrl) setPrivacyPolicyUrl(d.privacyPolicyUrl);
            if (d.termsOfServiceUrl) setTermsOfServiceUrl(d.termsOfServiceUrl);
            if (d.gdprDataExport !== undefined) setGdprDataExport(d.gdprDataExport);
            if (d.gdprAccountDeletion !== undefined) setGdprAccountDeletion(d.gdprAccountDeletion);
            if (d.auditLogRetentionDays) setAuditLogRetentionDays(d.auditLogRetentionDays);
            if (d.dpoContactEmail) setDpoContactEmail(d.dpoContactEmail);
          }
        }
      } catch (_) {}
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        cookieConsentEnabled,
        cookieBannerText,
        privacyPolicyUrl,
        termsOfServiceUrl,
        gdprDataExport,
        gdprAccountDeletion,
        auditLogRetentionDays,
        dpoContactEmail,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'compliance', data: payload }),
      });
      if (res.ok) {
        setToast('Compliance & GDPR settings saved successfully.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (_) {
      setToast('Failed to save settings.');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            <span>10. Compliance & GDPR Governance</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure EU GDPR cookie consent banners, customer data export requests, privacy policy links, and audit log retention.
          </p>
        </div>
      </div>

      {toast && (
        <div className="px-4 py-2.5 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="p-4 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--foreground)]">GDPR Cookie Consent Banner</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cookieConsentEnabled}
                onChange={(e) => setCookieConsentEnabled(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable Consent Banner</span>
            </label>
          </div>
          <Textarea
            label="Banner Notice Text"
            value={cookieBannerText}
            onChange={(e) => setCookieBannerText(e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Privacy Policy Page URL"
            value={privacyPolicyUrl}
            onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
            required
          />
          <Input
            label="Terms of Service Page URL"
            value={termsOfServiceUrl}
            onChange={(e) => setTermsOfServiceUrl(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Designated Data Protection Officer (DPO) Email"
            type="email"
            value={dpoContactEmail}
            onChange={(e) => setDpoContactEmail(e.target.value)}
          />
          <Input
            label="Immutable Audit Log Retention (Days)"
            type="number"
            value={auditLogRetentionDays}
            onChange={(e) => setAuditLogRetentionDays(e.target.value)}
          />
        </div>

        <div className="p-3 bg-[var(--card)] rounded-lg space-y-2 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Customer Self-Service Rights</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprDataExport}
                onChange={(e) => setGdprDataExport(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[var(--foreground)]">Enable One-Click JSON Data Export (Right of Access)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprAccountDeletion}
                onChange={(e) => setGdprAccountDeletion(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[var(--foreground)]">Enable Self-Service Account Erasure (Right to be Forgotten)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Compliance & GDPR Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
