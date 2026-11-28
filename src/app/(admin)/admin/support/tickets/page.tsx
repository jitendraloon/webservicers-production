'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Select, Textarea } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, UserCheck, Send } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  department: 'Technical' | 'Billing' | 'Abuse & Security';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Waiting' | 'Resolved';
  assignee: string | null;
  updatedAt: string;
  thread: { author: string; body: string; time: string }[];
}

const PREDEFINED_REPLIES = [
  { label: 'DNS Propagation Check', body: 'We have verified your DNS records. Please allow up to 30 minutes for global edge propagation and let us know if the issue persists.' },
  { label: 'Billing Invoice Re-issued', body: 'Your updated invoice with corrected tax details has been generated and sent to your billing email.' },
  { label: 'Escalated to L3 Infra', body: 'We have escalated this ticket to our L3 Infrastructure team for deeper packet-level inspection. We will update you shortly.' },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-9421',
    subject: 'API Gateway returning 502 on EU-Central',
    customer: 'Oakridge Financial (AC-8812)',
    department: 'Technical',
    priority: 'Urgent',
    status: 'Open',
    assignee: null,
    updatedAt: '8 mins ago',
    thread: [
      { author: 'David Thorne', body: 'Seeing intermittent 502 Bad Gateway responses from eu-central-1 since 17:45 UTC.', time: '17:52' },
    ],
  },
  {
    id: 'TKT-9419',
    subject: 'Refund request for duplicate SMM order',
    customer: 'BrightStack Studio (AC-8809)',
    department: 'Billing',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'Sarah Jenkins',
    updatedAt: '34 mins ago',
    thread: [
      { author: 'Aisha Patel', body: 'Order #SMM-5501 was submitted twice due to a browser refresh. Can we credit #SMM-5502 back to wallet?', time: '17:10' },
    ],
  },
  {
    id: 'TKT-9414',
    subject: 'Upgrade workspace to 50 SEO seats',
    customer: 'Lumina AI (AC-8798)',
    department: 'Billing',
    priority: 'Low',
    status: 'Waiting',
    assignee: 'Alex Rivera',
    updatedAt: '3 hours ago',
    thread: [
      { author: 'Hannah Kim', body: 'Please enable 50 seats on our Enterprise workspace and prorate the difference.', time: '14:20' },
    ],
  },
];

const PRIORITY_TONE: Record<Ticket['priority'], BadgeTone> = {
  Low: 'neutral',
  Medium: 'primary',
  High: 'warning',
  Urgent: 'danger',
};

const STATUS_TONE: Record<Ticket['status'], BadgeTone> = {
  Open: 'danger',
  'In Progress': 'primary',
  Waiting: 'warning',
  Resolved: 'success',
};

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>(INITIAL_TICKETS);
  const [active, setActive] = React.useState<Ticket | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const takeOwnership = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, assignee: 'You (Admin)', status: t.status === 'Open' ? 'In Progress' : t.status } : t))
    );
    setActive((prev) =>
      prev && prev.id === id ? { ...prev, assignee: 'You (Admin)', status: prev.status === 'Open' ? 'In Progress' : prev.status } : prev
    );
    notify(`You took ownership of ${id}`);
  };

  const updateField = <K extends keyof Ticket>(id: string, key: K, val: Ticket[K]) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, [key]: val } : t)));
    setActive((prev) => (prev && prev.id === id ? { ...prev, [key]: val } : prev));
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !replyText.trim()) return;
    const msg = { author: 'You (Admin)', body: replyText.trim(), time: 'Just now' };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, updatedAt: 'Just now', thread: [...t.thread, msg] } : t
      )
    );
    setActive((prev) => (prev ? { ...prev, updatedAt: 'Just now', thread: [...prev.thread, msg] } : null));
    setReplyText('');
    notify(`Reply posted to ${active.id}`);
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'Ticket',
      render: (r) => (
        <div>
          <div className="font-medium text-[var(--foreground)]">{r.subject}</div>
          <div className="text-[11px] text-[var(--muted-foreground)]">{r.id} · {r.customer}</div>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <Badge tone={PRIORITY_TONE[r.priority]} variant="sm">{r.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'assignee',
      header: 'Owner',
      render: (r) => r.assignee ?? <span className="text-[var(--muted-foreground)] italic">Unassigned</span>,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!r.assignee && (
            <Button size="xs" variant="outline" onClick={() => takeOwnership(r.id)}>
              Take Ownership
            </Button>
          )}
          <Button size="xs" onClick={() => setActive(r)}>Open</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        subtitle="Triage customer tickets, take ownership, apply predefined replies, and manage SLA priorities."
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={tickets} rowKey={(r) => r.id} onRowClick={(r) => setActive(r)} />
      </Card>

      <Modal
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `${active.id} · ${active.subject}` : 'Ticket'}
        maxWidth="660px"
      >
        {active && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Select
                  value={active.status}
                  onChange={(e) => updateField(active.id, 'status', e.target.value as Ticket['status'])}
                  className="w-36"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Resolved">Resolved</option>
                </Select>
                <Select
                  value={active.priority}
                  onChange={(e) => updateField(active.id, 'priority', e.target.value as Ticket['priority'])}
                  className="w-32"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </Select>
              </div>
              <Button size="xs" variant="outline" onClick={() => takeOwnership(active.id)}>
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                {active.assignee ? `Owner: ${active.assignee}` : 'Take Ownership'}
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {active.thread.map((m, i) => (
                <div key={i} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)] p-3 text-xs">
                  <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] mb-1">
                    <span className="font-semibold text-[var(--foreground)]">{m.author}</span>
                    <span>{m.time}</span>
                  </div>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendReply} className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">Insert Predefined Reply:</span>
                <Select
                  value=""
                  onChange={(e) => {
                    const found = PREDEFINED_REPLIES.find((p) => p.label === e.target.value);
                    if (found) setReplyText(found.body);
                  }}
                  className="w-64"
                >
                  <option value="">Choose macro...</option>
                  {PREDEFINED_REPLIES.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </Select>
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                <Button type="submit" size="sm">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send Reply
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
