'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, Settings2, Search, ArrowRight, PlugZap } from 'lucide-react';

type IntegrationCategory =
  | 'Payments'
  | 'Auth & SSO'
  | 'SEO Data'
  | 'SEO AI'
  | 'Mail'
  | 'SMS'
  | 'Storage'
  | 'Captcha'
  | 'Analytics'
  | 'Google Services'
  | 'Website AI CopilotKit';

interface IntegrationItem {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  connected: boolean;
  apiKey: string;
  endpointOrId: string;
  lastTested?: string;
}

const CATEGORIES: ('All' | IntegrationCategory)[] = [
  'All',
  'Payments',
  'Auth & SSO',
  'SEO Data',
  'SEO AI',
  'Mail',
  'SMS',
  'Storage',
  'Captcha',
  'Analytics',
  'Google Services',
  'Website AI CopilotKit',
];

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Cards, Apple Pay, SEPA & subscription billing.', connected: true, apiKey: 'sk_live_••••••••42a9', endpointOrId: 'acct_1N9xWebSvc' },
  { id: 'paypal', name: 'PayPal Commerce', category: 'Payments', description: 'Global Express Checkout & payouts.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'sso-google', name: 'Google OAuth 2.0', category: 'Auth & SSO', description: 'Sign in with Google Workspace & personal accounts.', connected: true, apiKey: 'GOCSPX-••••••91m', endpointOrId: '892104-apps.googleusercontent.com' },
  { id: 'sso-ms', name: 'Microsoft Entra ID', category: 'Auth & SSO', description: 'Enterprise SSO for Microsoft 365 tenants.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'sso-github', name: 'GitHub OAuth', category: 'Auth & SSO', description: 'Developer login & org membership sync.', connected: true, apiKey: 'gho_••••••71c', endpointOrId: 'Ov23li99a81b' },
  { id: 'dataforseo', name: 'DataForSEO', category: 'SEO Data', description: 'SERP, keyword volume, and backlink API.', connected: true, apiKey: 'dfs_••••••8821', endpointOrId: 'https://api.dataforseo.com/v3' },
  { id: 'serper', name: 'Serper.dev', category: 'SEO Data', description: 'Ultra-fast real-time Google SERP JSON.', connected: true, apiKey: 'srp_••••••004b', endpointOrId: 'https://google.serper.dev' },
  { id: 'openai-seo', name: 'OpenAI GPT-4o (SEO AI)', category: 'SEO AI', description: 'Automated content briefs, schema & clustering.', connected: true, apiKey: 'sk-proj-••••••9k2', endpointOrId: 'gpt-4o-2026-08' },
  { id: 'smtp', name: 'Custom SMTP Relay', category: 'Mail', description: 'Transactional email via dedicated TLS relay.', connected: true, apiKey: 'smtp_••••••pass', endpointOrId: 'smtp.webservicers.io:587' },
  { id: 'sendgrid', name: 'SendGrid', category: 'Mail', description: 'High-volume transactional & webhook tracking.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'ses', name: 'Amazon SES', category: 'Mail', description: 'AWS Simple Email Service (us-east-1).', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'mailgun', name: 'Mailgun', category: 'Mail', description: 'EU/US transactional mail routing.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Mail', description: 'Marketing audiences & lifecycle sync.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'twilio', name: 'Twilio SMS', category: 'SMS', description: '2FA OTP codes and urgent ticket alerts.', connected: true, apiKey: 'AC99••••••41f', endpointOrId: '+15550192834' },
  { id: 'vonage', name: 'Vonage (Nexmo)', category: 'SMS', description: 'Global SMS fallback gateway.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'r2', name: 'Cloudflare R2', category: 'Storage', description: 'Zero-egress object storage for media & backups.', connected: true, apiKey: 'r2_••••••991a', endpointOrId: 's3://ws-prod-assets' },
  { id: 's3', name: 'Amazon S3', category: 'Storage', description: 'Cross-region archival & encrypted snapshots.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'ftp', name: 'SFTP / FTP Mirror', category: 'Storage', description: 'Legacy off-site backup target.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'local', name: 'Local Volume', category: 'Storage', description: 'Mounted NVMe local storage pool.', connected: true, apiKey: 'local-nvme', endpointOrId: '/var/ws/storage' },
  { id: 'turnstile', name: 'Cloudflare Turnstile', category: 'Captcha', description: 'Privacy-first bot protection on checkout & auth.', connected: true, apiKey: '0x4AAAAAA••••••', endpointOrId: '0x4AAAAAA_sitekey' },
  { id: 'recaptcha', name: 'Google reCAPTCHA v3', category: 'Captcha', description: 'Invisible risk-score challenge.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'hcaptcha', name: 'hCaptcha', category: 'Captcha', description: 'Enterprise bot mitigation.', connected: false, apiKey: '', endpointOrId: '' },
  { id: 'posthog', name: 'PostHog Analytics', category: 'Analytics', description: 'Product funnels, session replay & feature flags.', connected: true, apiKey: 'phc_••••••812', endpointOrId: 'https://us.posthog.com' },
  { id: 'google-svc', name: 'Google Search Console & GA4', category: 'Google Services', description: 'Property verification, indexing API & GA4 sync.', connected: true, apiKey: 'gsc_••••••310', endpointOrId: 'G-WS991204' },
  { id: 'copilotkit', name: 'CopilotKit Runtime', category: 'Website AI CopilotKit', description: 'Powers Loon AI Copilot & storefront chat widgets.', connected: true, apiKey: 'ck_pub_••••••7a1', endpointOrId: 'https://api.copilotkit.ai/v1' },
];

export default function AdminIntegrationsPage() {
  const [items, setItems] = React.useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [category, setCategory] = React.useState<'All' | IntegrationCategory>('All');
  const [search, setSearch] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const filtered = items.filter((item) => {
    const matchCat = category === 'All' || item.category === category;
    const q = search.toLowerCase();
    const matchQ = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const toggleDisconnect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));
    setToast(`Updated status for ${id}`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Hub"
        subtitle="Manage dedicated standalone configurations across 11 platform domains: Payments, Auth/SSO, SEO, Mail, SMS, Storage, Captcha, Analytics, Google Services & CopilotKit."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="p-4 flex flex-col justify-between gap-4 hover:border-primary/50 transition-all group">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{item.category}</span>
                </div>
                <Badge tone={item.connected ? 'success' : 'neutral'} variant="sm">
                  {item.connected ? 'Connected' : 'Inactive'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <Link href={`/admin/integrations/${item.id}`}>
                <Button size="xs" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Settings2 className="w-3.5 h-3.5 mr-1" /> Configure Standalone Page
                </Button>
              </Link>
              {item.connected ? (
                <Button size="xs" variant="ghost" className="text-xs text-[var(--muted-foreground)] hover:text-rose-400" onClick={(e) => toggleDisconnect(item.id, e)}>
                  Disable
                </Button>
              ) : (
                <span className="text-[10px] text-[var(--muted-foreground)]">Not connected</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
