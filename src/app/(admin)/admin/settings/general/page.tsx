'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, Globe, UploadCloud } from 'lucide-react';

export default function AdminSettingsGeneralPage() {
  const [appUrl, setAppUrl] = React.useState('');
  const [siteName, setSiteName] = React.useState('WebServicers NextGen');
  const [tagline, setTagline] = React.useState('Unified Commerce OS, SEO Suite & Growth Operations');
  const [legalName, setLegalName] = React.useState('WebServicers Technologies Inc.');
  const [supportEmail, setSupportEmail] = React.useState('support@webservicers.com');
  const [supportPhone, setSupportPhone] = React.useState('+1 (800) 555-0199');
  const [address, setAddress] = React.useState('100 Montgomery St, Suite 1500, San Francisco, CA 94104');
  const [logoUrl, setLogoUrl] = React.useState('/brand/logo.svg');
  const [faviconUrl, setFaviconUrl] = React.useState('/brand/favicon.ico');
  const [primaryColor, setPrimaryColor] = React.useState('#6366f1');
  const [footerText, setFooterText] = React.useState('© 2026 WebServicers Technologies. All rights reserved.');
  const [announcement, setAnnouncement] = React.useState('🚀 WebServicers v1.0.8 released with automated cloud updates and unified SMM panels.');
  const [announcementEnabled, setAnnouncementEnabled] = React.useState(true);

  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Default dynamically from browser host if available
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const hostDomain = typeof window !== 'undefined' ? window.location.hostname : 'webservicers.com';
    if (hostOrigin) {
      setAppUrl(hostOrigin);
      setLogoUrl(`${hostOrigin}/brand/logo.svg`);
      setFaviconUrl(`${hostOrigin}/brand/favicon.ico`);
      setSupportEmail(`support@${hostDomain}`);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=general');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.appUrl) setAppUrl(d.appUrl);
            if (d.siteName) setSiteName(d.siteName);
            if (d.tagline) setTagline(d.tagline);
            if (d.legalName) setLegalName(d.legalName);
            if (d.supportEmail) setSupportEmail(d.supportEmail);
            if (d.supportPhone) setSupportPhone(d.supportPhone);
            if (d.address) setAddress(d.address);
            if (d.logoUrl) setLogoUrl(d.logoUrl);
            if (d.faviconUrl) setFaviconUrl(d.faviconUrl);
            if (d.primaryColor) setPrimaryColor(d.primaryColor);
            if (d.footerText) setFooterText(d.footerText);
            if (d.announcement) setAnnouncement(d.announcement);
            if (d.announcementEnabled !== undefined) setAnnouncementEnabled(d.announcementEnabled);
          }
        }
      } catch (_) {}
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        appUrl: appUrl.trim().replace(/\/+$/, ''),
        siteName,
        tagline,
        legalName,
        supportEmail,
        supportPhone,
        address,
        logoUrl,
        faviconUrl,
        primaryColor,
        footerText,
        announcement,
        announcementEnabled,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'general', data: payload }),
      });
      if (res.ok) {
        setToast('General & Branding settings saved successfully.');
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
            <Globe className="w-4 h-4 text-primary" />
            <span>1. General & Branding Settings</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure primary platform identity, brand colors, contact channels, and global storefront headers.
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
        <Input
          label="Universal Website / Installed Domain URL"
          value={appUrl}
          onChange={(e) => setAppUrl(e.target.value)}
          placeholder="https://yourdomain.com"
          required
        />
        <p className="text-[11px] text-[var(--muted-foreground)] -mt-2">
          The canonical root domain for all customer portals, API endpoints, payment links, and public storefront pages.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Platform Site Name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />
          <Input
            label="Legal Company / Entity Name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Site Tagline / Headline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Primary Customer Support Email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            required
          />
          <Input
            label="Customer Support Telephone"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
          />
        </div>

        <Input
          label="Physical Business / Corporate Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Brand Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <Input
            label="Favicon URL"
            value={faviconUrl}
            onChange={(e) => setFaviconUrl(e.target.value)}
          />
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Primary Brand Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-2 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--foreground)]">Storefront Announcement Banner</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable Top Banner</span>
            </label>
          </div>
          <Input
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Banner message displayed at the very top of all visitor pages..."
          />
        </div>

        <Textarea
          label="Global Footer Legal Copyright Text"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          rows={2}
        />

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save General & Branding Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
