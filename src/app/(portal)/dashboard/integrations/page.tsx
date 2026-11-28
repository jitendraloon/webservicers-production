'use client';

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Link2,
  Plug,
  RefreshCw,
  Search,
  Settings2,
  Unplug,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

type IntegrationId = 'gsc' | 'ga4' | 'cms' | 'slack';

interface IntegrationItem {
  id: IntegrationId;
  name: string;
  category: 'Analytics & Search' | 'CMS & Publishing' | 'Notifications';
  description: string;
  connected: boolean;
  accountLabel: string;
  lastSynced: string;
  configFieldLabel: string;
  configValue: string;
  cmsPlatform?: 'WordPress' | 'Shopify';
}

const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    category: 'Analytics & Search',
    description:
      'Sync search impressions, click-through rates, index coverage, and sitemap health directly into your SEO workspace.',
    connected: true,
    accountLabel: 'sc-domain:acme-commerce.com',
    lastSynced: '12 mins ago',
    configFieldLabel: 'Verified Property URL',
    configValue: 'https://acme-commerce.com/',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: 'Analytics & Search',
    description:
      'Stream organic traffic conversions, landing page engagement, and revenue attribution metrics.',
    connected: true,
    accountLabel: 'GA4 • G-9X4K2M8P1Q',
    lastSynced: '18 mins ago',
    configFieldLabel: 'Measurement ID',
    configValue: 'G-9X4K2M8P1Q',
  },
  {
    id: 'cms',
    name: 'WordPress / Shopify CMS',
    category: 'CMS & Publishing',
    description:
      'Publish approved meta updates, JSON-LD schema snippets, and editorial content drafts straight to your storefront or blog.',
    connected: false,
    accountLabel: 'Not connected',
    lastSynced: 'Never',
    configFieldLabel: 'Store / Site Endpoint',
    configValue: 'https://acme-commerce.myshopify.com',
    cmsPlatform: 'WordPress',
  },
  {
    id: 'slack',
    name: 'Slack Alerts',
    category: 'Notifications',
    description:
      'Receive real-time alerts for downtime incidents, SSL renewals, rank drops, and completed website edit requests.',
    connected: true,
    accountLabel: '#web-ops-alerts',
    lastSynced: 'Real-time webhook',
    configFieldLabel: 'Webhook Channel / URL',
    configValue: 'https://hooks.slack.com/services/T04X9/B08Q2/9kL3mNpQ7r',
  },
];

function getIntegrationIcon(id: IntegrationId) {
  switch (id) {
    case 'gsc':
      return Search;
    case 'ga4':
      return BarChart3;
    case 'cms':
      return Globe;
    case 'slack':
      return Bell;
  }
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] =
    useState<IntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [editingId, setEditingId] = useState<IntegrationId | null>(null);
  const [filterText, setFilterText] = useState('');
  const [mcpKey, setMcpKey] = useState('ws_mcp_live_7f4c9a2e1d8b3056a4f9e2c1');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const connectedCount = integrations.filter((item) => item.connected).length;

  const filteredIntegrations = integrations.filter((item) => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleToggleConnection = (id: IntegrationId) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextConnected = !item.connected;
        const nextLabel = nextConnected
          ? item.id === 'cms'
            ? `${item.cmsPlatform ?? 'WordPress'} • ${item.configValue.replace(/^https?:\/\//, '')}`
            : item.configValue || 'Connected'
          : 'Not connected';
        setStatusMessage(
          nextConnected
            ? `${item.name} connected successfully.`
            : `${item.name} disconnected.`
        );
        return {
          ...item,
          connected: nextConnected,
          accountLabel: nextLabel,
          lastSynced: nextConnected ? 'Just now' : 'Disconnected',
        };
      })
    );
  };

  const handleConfigChange = (id: IntegrationId, value: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, configValue: value } : item
      )
    );
  };

  const handleCmsPlatformChange = (
    id: IntegrationId,
    platform: 'WordPress' | 'Shopify'
  ) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cmsPlatform: platform } : item
      )
    );
  };

  const handleSaveConfig = (id: IntegrationId) => {
    const target = integrations.find((item) => item.id === id);
    if (!target) return;
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              connected: true,
              accountLabel:
                item.id === 'cms'
                  ? `${item.cmsPlatform ?? 'WordPress'} • ${item.configValue.replace(/^https?:\/\//, '')}`
                  : item.configValue,
              lastSynced: 'Just now',
            }
          : item
      )
    );
    setEditingId(null);
    setStatusMessage(`Saved configuration for ${target.name}.`);
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(mcpKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      setStatusMessage('Clipboard access unavailable in this browser context.');
    }
  };

  const handleRegenerateKey = () => {
    const randomHex = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setMcpKey(`ws_mcp_live_${randomHex}`);
    setShowKey(true);
    setStatusMessage('Generated a new MCP API key. Previous key has been revoked.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations Hub"
        subtitle="Connect your analytics, CMS, alerting channels, and MCP API access in one place."
        actions={
          <Badge tone={connectedCount === integrations.length ? 'success' : 'primary'}>
            <Plug className="h-3.5 w-3.5" />
            {connectedCount} of {integrations.length} Connected
          </Badge>
        }
      />

      {statusMessage && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-2.5 text-xs text-[var(--foreground)]">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[var(--primary)]" />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Summary Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter integrations..."
              aria-label="Filter integrations"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              {connectedCount} Active
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)]" />
              {integrations.length - connectedCount} Disconnected
            </span>
          </div>
        </div>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredIntegrations.map((item) => {
          const Icon = getIntegrationIcon(item.id);
          const isEditing = editingId === item.id;

          return (
            <Card key={item.id} className="flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-[var(--foreground)]">
                          {item.name}
                        </h2>
                        <Badge
                          variant="sm"
                          tone={item.connected ? 'success' : 'neutral'}
                        >
                          {item.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {item.category} • Last synced: {item.lastSynced}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {item.description}
                </p>

                <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/60 px-3 py-2 text-xs">
                  <span className="text-[var(--muted-foreground)]">Target: </span>
                  <span className="font-medium text-[var(--foreground)]">
                    {item.accountLabel}
                  </span>
                </div>

                {isEditing && (
                  <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    {item.id === 'cms' && (
                      <Select
                        label="CMS Platform"
                        value={item.cmsPlatform ?? 'WordPress'}
                        onChange={(e) =>
                          handleCmsPlatformChange(
                            item.id,
                            e.target.value as 'WordPress' | 'Shopify'
                          )
                        }
                      >
                        <option value="WordPress">WordPress (REST API)</option>
                        <option value="Shopify">Shopify (Admin API)</option>
                      </Select>
                    )}
                    <Input
                      label={item.configFieldLabel}
                      value={item.configValue}
                      onChange={(e) =>
                        handleConfigChange(item.id, e.target.value)
                      }
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveConfig(item.id)}
                      >
                        Save & Connect
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(isEditing ? null : item.id)}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {isEditing ? 'Close Config' : 'Configure'}
                </Button>

                <Button
                  variant={item.connected ? 'quiet' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleConnection(item.id)}
                >
                  {item.connected ? (
                    <>
                      <Unplug className="h-3.5 w-3.5" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3.5 w-3.5" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MCP API Key Card */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                MCP API Key
              </h2>
              <Badge variant="sm" tone="lilac">
                Model Context Protocol
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Use this scoped bearer token to connect your AI coding assistant or
              automation runner to your WebServicers SEO &amp; site telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey((prev) => !prev)}
            >
              {showKey ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Reveal
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyKey}>
              {copiedKey ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Key
                </>
              )}
            </Button>
            <Button variant="quiet" size="sm" onClick={handleRegenerateKey}>
              <RefreshCw className="h-3.5 w-3.5" />
              Rotate Key
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Input
            readOnly
            value={
              showKey
                ? mcpKey
                : `${mcpKey.slice(0, 12)}${'•'.repeat(16)}${mcpKey.slice(-4)}`
            }
            aria-label="MCP API Key"
            className="font-mono text-xs"
          />
        </div>
      </Card>
    </div>
  );
}
