'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { CheckCircle2, Save, DollarSign } from 'lucide-react';

export default function AdminSettingsLocalizationPage() {
  const [currency, setCurrency] = React.useState('USD');
  const [currencySymbol, setCurrencySymbol] = React.useState('$');
  const [currencyPosition, setCurrencyPosition] = React.useState<'before' | 'after'>('before');
  const [timezone, setTimezone] = React.useState('UTC');
  const [dateFormat, setDateFormat] = React.useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = React.useState('24h');
  const [defaultLanguage, setDefaultLanguage] = React.useState('en');
  const [multiCurrency, setMultiCurrency] = React.useState(true);
  const [autoDetectVisitorCurrency, setAutoDetectVisitorCurrency] = React.useState(true);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=localization');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.currency) setCurrency(d.currency);
            if (d.currencySymbol) setCurrencySymbol(d.currencySymbol);
            if (d.currencyPosition) setCurrencyPosition(d.currencyPosition);
            if (d.timezone) setTimezone(d.timezone);
            if (d.dateFormat) setDateFormat(d.dateFormat);
            if (d.timeFormat) setTimeFormat(d.timeFormat);
            if (d.defaultLanguage) setDefaultLanguage(d.defaultLanguage);
            if (d.multiCurrency !== undefined) setMultiCurrency(d.multiCurrency);
            if (d.autoDetectVisitorCurrency !== undefined) setAutoDetectVisitorCurrency(d.autoDetectVisitorCurrency);
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
        currency,
        currencySymbol,
        currencyPosition,
        timezone,
        dateFormat,
        timeFormat,
        defaultLanguage,
        multiCurrency,
        autoDetectVisitorCurrency,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'localization', data: payload }),
      });
      if (res.ok) {
        setToast('Localization & Currency settings saved successfully.');
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
            <DollarSign className="w-4 h-4 text-primary" />
            <span>2. Localization & Currency Settings</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure default base accounting currency, timezone, localized date stamps, and multi-currency exchange handling.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Base System Currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              if (e.target.value === 'USD') setCurrencySymbol('$');
              else if (e.target.value === 'EUR') setCurrencySymbol('€');
              else if (e.target.value === 'GBP') setCurrencySymbol('£');
              else if (e.target.value === 'INR') setCurrencySymbol('₹');
              else if (e.target.value === 'CAD') setCurrencySymbol('C$');
              else if (e.target.value === 'AUD') setCurrencySymbol('A$');
            }}
          >
            <option value="USD">USD ($) - US Dollar</option>
            <option value="EUR">EUR (€) - Euro</option>
            <option value="GBP">GBP (£) - British Pound</option>
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="CAD">CAD (C$) - Canadian Dollar</option>
            <option value="AUD">AUD (A$) - Australian Dollar</option>
          </Select>

          <Input
            label="Currency Symbol Display"
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
          />

          <Select
            label="Symbol Position"
            value={currencyPosition}
            onChange={(e) => setCurrencyPosition(e.target.value as any)}
          >
            <option value="before">Before Amount ($100.00)</option>
            <option value="after">After Amount (100.00$)</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Default System Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="UTC">UTC (Universal Coordinated Time)</option>
            <option value="America/New_York">America/New_York (EST / EDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
            <option value="Europe/London">Europe/London (GMT / BST)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET / CEST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
          </Select>

          <Select
            label="Date Formatting"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-28)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (28/11/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (11/28/2026)</option>
            <option value="DD MMM YYYY">DD MMM YYYY (28 Nov 2026)</option>
          </Select>

          <Select
            label="Time Standard"
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
          >
            <option value="24h">24-hour (14:30:00)</option>
            <option value="12h">12-hour AM/PM (02:30:00 PM)</option>
          </Select>
        </div>

        <div className="p-3 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Multi-Currency & Regional Visitor Detection</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multiCurrency}
                onChange={(e) => setMultiCurrency(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <div>
                <div className="font-medium text-[var(--foreground)]">Enable Multi-Currency Storefront</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Allow users to view prices and deposit in EUR, GBP, INR, USD</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDetectVisitorCurrency}
                onChange={(e) => setAutoDetectVisitorCurrency(e.target.checked)}
                className="rounded border-[var(--border)] text-primary focus:ring-primary"
              />
              <div>
                <div className="font-medium text-[var(--foreground)]">Auto-Detect Visitor Geo-IP Currency</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Automatically select local currency based on IP address</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Localization Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
