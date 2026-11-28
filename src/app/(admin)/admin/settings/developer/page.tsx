'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { CheckCircle2, Save, Code2, AlertTriangle, Key, Copy, RefreshCw } from 'lucide-react';

export default function AdminSettingsDeveloperPage() {
  const [publicApiEnabled, setPublicApiEnabled] = React.useState(true);
  const [apiBaseUrl, setApiBaseUrl] = React.useState('/api/v1');
  const [masterApiKey, setMasterApiKey] = React.useState('ws_live_992104810248102948190248');
  const [developerDocsUrl, setDeveloperDocsUrl] = React.useState('/help');
  const [sandboxMode, setSandboxMode] = React.useState(false);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState(
    'Scheduled platform upgrade in progress. Our engineering team is finalizing deployment. We will be back online shortly.'
  );
  const [whitelistedIps, setWhitelistedIps] = React.useState('127.0.0.1\n::1');

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (hostOrigin) {
      setApiBaseUrl(`${hostOrigin}/api/v1`);
      setDeveloperDocsUrl(`${hostOrigin}/help`);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=developer');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.publicApiEnabled !== undefined) setPublicApiEnabled(d.publicApiEnabled);
            if (d.apiBaseUrl) setApiBaseUrl(d.apiBaseUrl);
            if (d.masterApiKey) setMasterApiKey(d.masterApiKey);
            if (d.developerDocsUrl) setDeveloperDocsUrl(d.developerDocsUrl);
            if (d.sandboxMode !== undefined) setSandboxMode(d.sandboxMode);
            if (d.maintenanceMode !== undefined) setMaintenanceMode(d.maintenanceMode);
            if (d.maintenanceMessage) setMaintenanceMessage(d.maintenanceMessage);
            if (d.whitelistedIps) setWhitelistedIps(d.whitelistedIps);
          }
        }
      } catch (_) {}
    }
    load();
  }, []);

  const regenerateKey = () => {
    const newKey = `ws_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setMasterApiKey(newKey);
    setToast('Generated new Master API Key. Remember to click Save.');
    setTimeout(() => setToast(null), 3000);
  };

  const copyKey = () => {
    navigator.clipboard?.writeText(masterApiKey);
    setToast('Master API Key copied to clipboard.');
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        publicApiEnabled,
        apiBaseUrl,
        masterApiKey,
        developerDocsUrl,
        sandboxMode,
        maintenanceMode,
        maintenanceMessage,
        whitelistedIps,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'developer', data: payload }),
      });
      if (res.ok) {
        setToast('Developer & API settings saved successfully.');
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
            <Code2 className="w-4 h-4 text-primary" />
            <span>11. Developer & API Platform Controls</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure public REST API endpoints, master access credentials, global sandbox switches, and live maintenance mode.
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
            <span className="font-semibold text-[var(--foreground)]">Public REST API Gateway</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={publicApiEnabled}
                onChange={(e) => setPublicApiEnabled(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-[var(--foreground)]">Enable Public API</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Public API Root URL"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
            />
            <Input
              label="Developer Documentation Link"
              value={developerDocsUrl}
              onChange={(e) => setDeveloperDocsUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Master Admin API Key
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={masterApiKey}
                onChange={(e) => setMasterApiKey(e.target.value)}
                className="font-mono text-xs"
              />
              <Button size="xs" variant="outline" type="button" onClick={copyKey}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="xs" variant="outline" type="button" onClick={regenerateKey}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Maintenance Mode Engine */}
        <div className="p-4 bg-[var(--card)] rounded-lg space-y-3 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-[var(--foreground)]">System Maintenance Mode</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="rounded border-[var(--border)] text-amber-500 focus:ring-amber-400"
              />
              <span className={`text-[11px] font-semibold ${maintenanceMode ? 'text-amber-400' : 'text-[var(--muted-foreground)]'}`}>
                {maintenanceMode ? 'MAINTENANCE ACTIVE' : 'Disabled (Live)'}
              </span>
            </label>
          </div>

          <Textarea
            label="Maintenance Downtime Customer Notice"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Bypass IP Whitelist (Allowed during maintenance mode, one per line)"
            value={whitelistedIps}
            onChange={(e) => setWhitelistedIps(e.target.value)}
            rows={2}
            className="font-mono text-xs"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={sandboxMode}
            onChange={(e) => setSandboxMode(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium text-[var(--foreground)]">Enable Sandbox / Staging Mode</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Simulates order creation, payment gateways, and provider dispatch without real money transactions</div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Developer & API Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
