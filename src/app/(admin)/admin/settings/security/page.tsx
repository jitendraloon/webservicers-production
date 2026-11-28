'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, Lock, ShieldAlert } from 'lucide-react';

export default function AdminSettingsSecurityPage() {
  const [globalRateLimit, setGlobalRateLimit] = React.useState('120');
  const [authRateLimit, setAuthRateLimit] = React.useState('10');
  const [maxLoginAttempts, setMaxLoginAttempts] = React.useState('5');
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = React.useState('15');
  const [corsOrigins, setCorsOrigins] = React.useState('');
  const [ipBlacklist, setIpBlacklist] = React.useState('198.51.100.4\n203.0.113.88');
  const [enableTurnstile, setEnableTurnstile] = React.useState(true);
  const [turnstileSiteKey, setTurnstileSiteKey] = React.useState('0x4AAAAAA••••••');
  const [turnstileSecretKey, setTurnstileSecretKey] = React.useState('0x4AAAAAA••••••••••••');
  const [forceHttps, setForceHttps] = React.useState(true);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (hostOrigin) {
      setCorsOrigins(hostOrigin);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=security');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.globalRateLimit) setGlobalRateLimit(d.globalRateLimit);
            if (d.authRateLimit) setAuthRateLimit(d.authRateLimit);
            if (d.maxLoginAttempts) setMaxLoginAttempts(d.maxLoginAttempts);
            if (d.lockoutDurationMinutes) setLockoutDurationMinutes(d.lockoutDurationMinutes);
            if (d.corsOrigins) setCorsOrigins(d.corsOrigins);
            if (d.ipBlacklist) setIpBlacklist(d.ipBlacklist);
            if (d.enableTurnstile !== undefined) setEnableTurnstile(d.enableTurnstile);
            if (d.turnstileSiteKey) setTurnstileSiteKey(d.turnstileSiteKey);
            if (d.turnstileSecretKey) setTurnstileSecretKey(d.turnstileSecretKey);
            if (d.forceHttps !== undefined) setForceHttps(d.forceHttps);
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
        globalRateLimit,
        authRateLimit,
        maxLoginAttempts,
        lockoutDurationMinutes,
        corsOrigins,
        ipBlacklist,
        enableTurnstile,
        turnstileSiteKey,
        turnstileSecretKey,
        forceHttps,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'security', data: payload }),
      });
      if (res.ok) {
        setToast('Security & Rate Limit policies saved successfully.');
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
            <Lock className="w-4 h-4 text-primary" />
            <span>9. Security & Rate Limits</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure application DDoS throttling, Cloudflare Turnstile bot deterrence, IP blacklists, and CORS origins.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Global API Rate Limit (requests / min)"
            type="number"
            value={globalRateLimit}
            onChange={(e) => setGlobalRateLimit(e.target.value)}
          />

          <Input
            label="Auth Endpoint Rate Limit (attempts / min)"
            type="number"
            value={authRateLimit}
            onChange={(e) => setAuthRateLimit(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max Failed Logins Before Account Lockout"
            type="number"
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(e.target.value)}
          />

          <Input
            label="Lockout Duration (Minutes)"
            type="number"
            value={lockoutDurationMinutes}
            onChange={(e) => setLockoutDurationMinutes(e.target.value)}
          />
        </div>

        <div className="p-4 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--foreground)]">Cloudflare Turnstile Bot Protection</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTurnstile}
                onChange={(e) => setEnableTurnstile(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable Turnstile</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Turnstile Site Key"
              value={turnstileSiteKey}
              onChange={(e) => setTurnstileSiteKey(e.target.value)}
            />
            <Input
              label="Turnstile Secret Key"
              type="password"
              value={turnstileSecretKey}
              onChange={(e) => setTurnstileSecretKey(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Allowed CORS Cross-Origin Domains (comma separated)"
          value={corsOrigins}
          onChange={(e) => setCorsOrigins(e.target.value)}
        />

        <Textarea
          label="IP Address Blacklist (One IP or CIDR per line)"
          value={ipBlacklist}
          onChange={(e) => setIpBlacklist(e.target.value)}
          rows={3}
          className="font-mono text-xs"
        />

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={forceHttps}
            onChange={(e) => setForceHttps(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-[var(--foreground)]">Enforce HTTPS & HSTS Preload Headers</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Automatically redirect HTTP traffic to HTTPS with strict transport security</div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Security Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
