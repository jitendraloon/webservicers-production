'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { Search, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface InboxThread {
  id: string;
  customer: string;
  email: string;
  channel: 'Live Chat' | 'Email' | 'WhatsApp';
  subject: string;
  unread: boolean;
  updatedAt: string;
  messages: { sender: 'customer' | 'agent'; text: string; time: string }[];
}

const INITIAL_THREADS: InboxThread[] = [
  {
    id: 'INB-210',
    customer: 'Aisha Patel',
    email: 'aisha@brightstack.dev',
    channel: 'Live Chat',
    subject: 'SSL cert renewal on staging domain',
    unread: true,
    updatedAt: '4m ago',
    messages: [
      { sender: 'customer', text: 'Hi, our wildcard SSL on staging.brightstack.dev shows pending verification.', time: '18:02' },
      { sender: 'agent', text: 'Checking your DNS TXT record propagation right now.', time: '18:04' },
      { sender: 'customer', text: 'Thanks! Let me know if we need to re-issue.', time: '18:06' },
    ],
  },
  {
    id: 'INB-209',
    customer: 'David Thorne',
    email: 'd.thorne@oakridge.uk',
    channel: 'Email',
    subject: 'Additional VAT invoice copy for Q3',
    unread: false,
    updatedAt: '1h ago',
    messages: [
      { sender: 'customer', text: 'Could you resend INV-2026-0918 with our updated UK VAT number?', time: '16:50' },
    ],
  },
  {
    id: 'INB-208',
    customer: 'Elena Rostova',
    email: 'elena@nordiccloud.io',
    channel: 'WhatsApp',
    subject: 'Custom SEO API rate limit inquiry',
    unread: false,
    updatedAt: '3h ago',
    messages: [
      { sender: 'customer', text: 'Can we burst up to 500 req/min on the DataForSEO waterfall?', time: '15:10' },
    ],
  },
];

export default function AdminSupportInboxPage() {
  const [threads, setThreads] = React.useState<InboxThread[]>(INITIAL_THREADS);
  const [selectedId, setSelectedId] = React.useState<string>(INITIAL_THREADS[0].id);
  const [search, setSearch] = React.useState('');
  const [draft, setDraft] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const selected = threads.find((t) => t.id === selectedId) ?? threads[0];

  const filtered = threads.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.customer.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected) return;
    const text = draft.trim();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              updatedAt: 'Just now',
              messages: [...t.messages, { sender: 'agent', text, time: 'Now' }],
            }
          : t
      )
    );
    setDraft('');
    setToast(`Reply sent to ${selected.customer}`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Inbox"
        subtitle="Unified omnichannel inbox for Live Chat, Email, and WhatsApp customer conversations."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
        <Card className="lg:col-span-4 p-3 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="space-y-1.5 overflow-y-auto">
            {filtered.map((t) => {
              const active = t.id === selected?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={`w-full text-left rounded-[var(--radius-control)] p-3 border transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--accent)]'
                      : 'border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                      {t.unread && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                      {t.customer}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{t.updatedAt}</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--foreground)] truncate">{t.subject}</div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge tone="neutral" variant="sm">{t.channel}</Badge>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{t.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-8 p-4 flex flex-col justify-between">
          {selected ? (
            <>
              <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{selected.subject}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {selected.customer} ({selected.email}) · {selected.channel}
                  </p>
                </div>
                <Badge tone="primary" variant="sm">{selected.id}</Badge>
              </div>

              <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[340px]">
                {selected.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-[var(--radius-control)] px-3.5 py-2 text-xs ${
                        m.sender === 'agent'
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                      {m.sender === 'agent' ? 'You' : selected.customer} · {m.time}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="pt-3 border-t border-[var(--border)] flex gap-2 items-end">
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a reply..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button type="submit" size="sm">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--muted-foreground)]">
              <MessageSquare className="w-6 h-6 mb-2" />
              Select a conversation to view messages.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
