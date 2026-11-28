'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Send, CheckCircle2, Users } from 'lucide-react';

interface BroadcastLog {
  id: string;
  subject: string;
  audience: string;
  channel: string;
  recipients: number;
  sentAt: string;
}

export default function AdminSupportBulkNotificationsPage() {
  const [audience, setAudience] = React.useState('All Active Customers (1,420)');
  const [channel, setChannel] = React.useState('Email + In-App Banner');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [history, setHistory] = React.useState<BroadcastLog[]>([
    { id: 'BC-112', subject: 'Scheduled EU-Central Maintenance Window', audience: 'Enterprise & Growth', channel: 'Email + In-App', recipients: 618, sentAt: '2026-11-24 09:00' },
    { id: 'BC-111', subject: 'New SEO DataForSEO Waterfall Engine Live', audience: 'SEO Plan Subscribers', channel: 'In-App Banner', recipients: 492, sentAt: '2026-11-18 14:30' },
  ]);
  const [toast, setToast] = React.useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const countMatch = audience.match(/\((\d[\d,]*)\)/);
    const recipients = countMatch ? Number(countMatch[1].replace(/,/g, '')) : 350;
    setHistory((prev) => [
      { id: `BC-${Math.floor(113 + Math.random() * 800)}`, subject: subject.trim(), audience, channel, recipients, sentAt: 'Just now' },
      ...prev,
    ]);
    setSubject('');
    setMessage('');
    setToast(`Broadcast queued for ${recipients.toLocaleString()} recipients via ${channel}`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Notifications Composer"
        subtitle="Send targeted announcements, maintenance alerts, and billing reminders across customer segments."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-5">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Target Audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="All Active Customers (1,420)">All Active Customers (1,420)</option>
                <option value="Enterprise & Agency (312)">Enterprise & Agency (312)</option>
                <option value="SEO Plan Subscribers (492)">SEO Plan Subscribers (492)</option>
                <option value="Unverified KYC Accounts (44)">Unverified KYC Accounts (44)</option>
              </Select>
              <Select label="Delivery Channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="Email + In-App Banner">Email + In-App Banner</option>
                <option value="Email Only">Email Only</option>
                <option value="In-App Banner Only">In-App Banner Only</option>
                <option value="SMS (Urgent)">SMS (Urgent)</option>
              </Select>
            </div>
            <Input
              label="Notification Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g. Important: API v2.4 Deprecation Notice"
            />
            <Textarea
              label="Message Body (Markdown supported)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Write your announcement..."
            />
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Segment: {audience}
              </span>
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5 mr-1.5" /> Send Broadcast
              </Button>
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-5 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Broadcasts</h3>
          <div className="space-y-2.5">
            {history.map((h) => (
              <div key={h.id} className="rounded-[var(--radius-control)] border border-[var(--border)] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--foreground)]">{h.subject}</span>
                  <Badge tone="success" variant="sm">Sent</Badge>
                </div>
                <div className="text-[var(--muted-foreground)]">
                  {h.audience} · {h.channel}
                </div>
                <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] pt-1">
                  <span>{h.recipients.toLocaleString()} recipients</span>
                  <span>{h.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
