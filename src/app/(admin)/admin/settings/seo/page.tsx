'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, Search } from 'lucide-react';

export default function AdminSettingsSeoPage() {
  const [metaTitle, setMetaTitle] = React.useState('WebServicers — Unified Commerce OS & SEO Suite');
  const [metaDescription, setMetaDescription] = React.useState(
    'Leading digital commerce platform, enterprise SEO intelligence suite, and real-time social growth fulfillment engine.'
  );
  const [metaKeywords, setMetaKeywords] = React.useState('seo suite, smm panel, commerce os, digital marketing, serp tracking, api automation');
  const [canonicalBase, setCanonicalBase] = React.useState('');
  const [ogImageUrl, setOgImageUrl] = React.useState('/brand/og-cover.png');
  const [twitterCard, setTwitterCard] = React.useState('summary_large_image');
  const [googleVerificationTag, setGoogleVerificationTag] = React.useState('google-site-verification=GSC_9921849104');
  const [robotsTxt, setRobotsTxt] = React.useState('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml');
  const [autoGenerateSitemap, setAutoGenerateSitemap] = React.useState(true);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (hostOrigin) {
      setCanonicalBase(hostOrigin);
      setOgImageUrl(`${hostOrigin}/brand/og-cover.png`);
      setRobotsTxt(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${hostOrigin}/sitemap.xml`);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=seo');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.metaTitle) setMetaTitle(d.metaTitle);
            if (d.metaDescription) setMetaDescription(d.metaDescription);
            if (d.metaKeywords) setMetaKeywords(d.metaKeywords);
            if (d.canonicalBase) setCanonicalBase(d.canonicalBase);
            if (d.ogImageUrl) setOgImageUrl(d.ogImageUrl);
            if (d.twitterCard) setTwitterCard(d.twitterCard);
            if (d.googleVerificationTag) setGoogleVerificationTag(d.googleVerificationTag);
            if (d.robotsTxt) setRobotsTxt(d.robotsTxt);
            if (d.autoGenerateSitemap !== undefined) setAutoGenerateSitemap(d.autoGenerateSitemap);
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
        metaTitle,
        metaDescription,
        metaKeywords,
        canonicalBase,
        ogImageUrl,
        twitterCard,
        googleVerificationTag,
        robotsTxt,
        autoGenerateSitemap,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'seo', data: payload }),
      });
      if (res.ok) {
        setToast('SEO & Metadata settings saved successfully.');
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
            <Search className="w-4 h-4 text-primary" />
            <span>7. SEO & Metadata Engine</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure global search engine meta tags, OpenGraph previews, robots.txt indexing rules, and Google Search Console tags.
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
          label="Default Meta Title (Browser & Search Snippet)"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          required
        />

        <Textarea
          label="Default Meta Description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          required
        />

        <Input
          label="Global Meta Keywords"
          value={metaKeywords}
          onChange={(e) => setMetaKeywords(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Canonical Base Domain URL"
            value={canonicalBase}
            onChange={(e) => setCanonicalBase(e.target.value)}
          />
          <Input
            label="OpenGraph Social Cover Image URL (1200x630)"
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Twitter Card Type"
            value={twitterCard}
            onChange={(e) => setTwitterCard(e.target.value)}
          >
            <option value="summary_large_image">summary_large_image (High-impact banner)</option>
            <option value="summary">summary (Compact thumbnail)</option>
          </Select>

          <Input
            label="Google Search Console Verification Tag"
            value={googleVerificationTag}
            onChange={(e) => setGoogleVerificationTag(e.target.value)}
          />
        </div>

        <Textarea
          label="Robots.txt Content Rules"
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          rows={3}
          className="font-mono text-xs"
        />

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={autoGenerateSitemap}
            onChange={(e) => setAutoGenerateSitemap(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-[var(--foreground)]">Auto-Generate XML Sitemap (`/sitemap.xml`)</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Automatically updates with all active public services, articles, and landing pages</div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save SEO & Metadata Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
