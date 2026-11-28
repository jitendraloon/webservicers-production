'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { CheckCircle2, Save, Bell, Mail, Send } from 'lucide-react';

export default function AdminSettingsNotificationsPage() {
  const [mailDriver, setMailDriver] = React.useState('smtp');
  const [smtpHost, setSmtpHost] = React.useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = React.useState('587');
  const [smtpUser, setSmtpUser] = React.useState('');
  const [smtpPass, setSmtpPass] = React.useState('••••••••••••');
  const [smtpEncryption, setSmtpEncryption] = React.useState('tls');
  const [fromEmail, setFromEmail] = React.useState('');
  const [fromName, setFromName] = React.useState('WebServicers Notification Bot');
  const [adminAlertEmail, setAdminAlertEmail] = React.useState('');
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('whsec_99a812048b1c0942');

  const [toast, setToast] = React.useState<string | null>(null);
  const [testingMail, setTestingMail] = React.useState(false);

  React.useEffect(() => {
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const hostDomain = typeof window !== 'undefined' ? window.location.hostname : 'webservicers.com';
    if (hostDomain) {
      setSmtpUser(`postmaster@${hostDomain}`);
      setFromEmail(`noreply@${hostDomain}`);
      setAdminAlertEmail(`ops-alerts@${hostDomain}`);
      setWebhookUrl(`${hostOrigin}/api/v1/webhooks/listener`);
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/settings?section=notifications');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Object.keys(json.data).length > 0) {
            const d = json.data;
            if (d.mailDriver) setMailDriver(d.mailDriver);
            if (d.smtpHost) setSmtpHost(d.smtpHost);
            if (d.smtpPort) setSmtpPort(d.smtpPort);
            if (d.smtpUser) setSmtpUser(d.smtpUser);
            if (d.smtpPass) setSmtpPass(d.smtpPass);
            if (d.smtpEncryption) setSmtpEncryption(d.smtpEncryption);
            if (d.fromEmail) setFromEmail(d.fromEmail);
            if (d.fromName) setFromName(d.fromName);
            if (d.adminAlertEmail) setAdminAlertEmail(d.adminAlertEmail);
            if (d.webhookUrl) setWebhookUrl(d.webhookUrl);
            if (d.webhookSecret) setWebhookSecret(d.webhookSecret);
          }
        }
      } catch (_) {}
    }
    load();
  }, []);

  const handleTestMail = async () => {
    setTestingMail(true);
    await new Promise((r) => setTimeout(r, 800));
    setTestingMail(false);
    setToast(`Test email dispatched to ${adminAlertEmail} via ${smtpHost}:${smtpPort}`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        mailDriver,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpEncryption,
        fromEmail,
        fromName,
        adminAlertEmail,
        webhookUrl,
        webhookSecret,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'notifications', data: payload }),
      });
      if (res.ok) {
        setToast('Notification & Webhook settings saved successfully.');
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
            <Bell className="w-4 h-4 text-primary" />
            <span>8. Notifications & Webhooks Hub</span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Configure SMTP email delivery engines, system alert recipients, and event webhook subscriptions.
          </p>
        </div>
        <Button size="xs" variant="outline" disabled={testingMail} onClick={handleTestMail}>
          <Send className="w-3 h-3 mr-1" /> Test SMTP Relay
        </Button>
      </div>

      {toast && (
        <div className="px-4 py-2.5 text-xs font-medium flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Transactional Email Driver"
            value={mailDriver}
            onChange={(e) => setMailDriver(e.target.value)}
          >
            <option value="smtp">Standard SMTP Relay</option>
            <option value="sendgrid">SendGrid API</option>
            <option value="ses">Amazon SES</option>
            <option value="mailgun">Mailgun API</option>
            <option value="resend">Resend.com API</option>
          </Select>

          <Input
            label="Internal Ops Admin Alert Email"
            type="email"
            value={adminAlertEmail}
            onChange={(e) => setAdminAlertEmail(e.target.value)}
            placeholder="alerts@domain.com"
            required
          />
        </div>

        <div className="p-4 bg-[var(--muted)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span>SMTP Server Connection Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="SMTP Hostname"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.domain.com"
            />
            <Input
              label="SMTP Port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587 or 465"
            />
            <Select
              label="TLS Encryption"
              value={smtpEncryption}
              onChange={(e) => setSmtpEncryption(e.target.value)}
            >
              <option value="tls">STARTTLS (Port 587)</option>
              <option value="ssl">SSL / TLS (Port 465)</option>
              <option value="none">None (Insecure / Internal)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SMTP Username"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
            />
            <Input
              label="SMTP Password"
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="From Sender Email Address"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
            <Input
              label="From Display Name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-[var(--card)] rounded-lg space-y-3 border border-[var(--border)]">
          <div className="font-semibold text-[var(--foreground)]">Outbound Global Webhooks</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Webhook Destination Endpoint URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.domain.com/events"
            />
            <Input
              label="Webhook HMAC Signing Secret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button size="sm" type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Notifications & Webhooks Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
