'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gauge,
  Globe,
  Lock,
  Send,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';

type EditPriority = 'Normal' | 'High' | 'Urgent';
type EditStatus = 'Completed' | 'In Review' | 'Queued';

interface EditRequest {
  id: string;
  title: string;
  pageUrl: string;
  priority: EditPriority;
  status: EditStatus;
  submittedAt: string;
}

const INITIAL_EDIT_REQUESTS: EditRequest[] = [
  {
    id: 'REQ-4082',
    title: 'Update hero CTA copy & pricing badge on homepage',
    pageUrl: '/',
    priority: 'High',
    status: 'In Review',
    submittedAt: '2026-11-25',
  },
  {
    id: 'REQ-4079',
    title: 'Add holiday shipping banner to checkout header',
    pageUrl: '/checkout',
    priority: 'Urgent',
    status: 'Completed',
    submittedAt: '2026-11-22',
  },
  {
    id: 'REQ-4071',
    title: 'Compress team headshots and update About Us bio',
    pageUrl: '/about',
    priority: 'Normal',
    status: 'Completed',
    submittedAt: '2026-11-18',
  },
  {
    id: 'REQ-4064',
    title: 'Swap footer privacy policy PDF link',
    pageUrl: '/legal/privacy',
    priority: 'Normal',
    status: 'Completed',
    submittedAt: '2026-11-14',
  },
];

function getStatusTone(status: EditStatus): BadgeTone {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Review':
      return 'primary';
    case 'Queued':
      return 'warning';
  }
}

function getPriorityTone(priority: EditPriority): BadgeTone {
  switch (priority) {
    case 'Urgent':
      return 'danger';
    case 'High':
      return 'warning';
    case 'Normal':
      return 'neutral';
  }
}

export default function WebsiteOverviewPage() {
  const [requests, setRequests] = useState<EditRequest[]>(INITIAL_EDIT_REQUESTS);
  const [title, setTitle] = useState('');
  const [pageUrl, setPageUrl] = useState('/');
  const [priority, setPriority] = useState<EditPriority>('Normal');
  const [details, setDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = pageUrl.trim() || '/';
    if (!trimmedTitle) {
      setFormError('Please enter a short summary for your edit request.');
      return;
    }

    const nextId = `REQ-${4083 + requests.length - INITIAL_EDIT_REQUESTS.length}`;
    const newRequest: EditRequest = {
      id: nextId,
      title: trimmedTitle,
      pageUrl: trimmedUrl,
      priority,
      status: 'Queued',
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    setRequests((prev) => [newRequest, ...prev]);
    setTitle('');
    setPageUrl('/');
    setPriority('Normal');
    setDetails('');
    setFormError(null);
    setSubmitSuccess(
      `Edit request ${nextId} submitted and queued for your managed web team.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Managed Website Overview"
        subtitle="Real-time hosting telemetry, SSL status, performance score, and managed content edit requests."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live • Operational
            </Badge>
            <a
              href="https://acme-commerce.com"
              target="_blank"
              rel="noreferrer"
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Live Site
            </a>
          </div>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Live Site Status
            </span>
            <Globe className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-semibold text-[var(--foreground)]">
              Online
            </span>
            <Badge variant="sm" tone="success">
              HTTP 200
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            acme-commerce.com • Edge CDN active
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              SSL Certificate
            </span>
            <Lock className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-semibold text-[var(--foreground)]">
              Valid
            </span>
            <Badge variant="sm" tone="success">
              TLS 1.3
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Let&apos;s Encrypt • Auto-renews Feb 14, 2027
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              30-Day Uptime
            </span>
            <Activity className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-semibold text-[var(--foreground)]">
              99.98%
            </span>
            <Badge variant="sm" tone="primary">
              142 ms avg
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            0 unplanned outages in the last 30 days
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Page Speed Score
            </span>
            <Gauge className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-semibold text-[var(--foreground)]">
              96 / 100
            </span>
            <Badge variant="sm" tone="success">
              Fast
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Desktop 98 • Mobile 94 (Lighthouse)
          </p>
        </Card>
      </div>

      {/* Main Content: Edit Requests Table + Submit Form */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Recent Edit Requests
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Track copy, layout, and asset updates handled by your managed team.
              </p>
            </div>
            <Badge variant="sm" tone="neutral">
              {requests.length} Requests
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Request Summary</th>
                  <th>Target Page</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="font-mono text-xs font-medium">{req.id}</td>
                    <td className="max-w-xs font-medium">{req.title}</td>
                    <td className="font-mono text-xs text-[var(--muted-foreground)]">
                      {req.pageUrl}
                    </td>
                    <td>
                      <Badge variant="sm" tone={getPriorityTone(req.priority)}>
                        {req.priority}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="sm" tone={getStatusTone(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="text-xs text-[var(--muted-foreground)]">
                      {req.submittedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--muted)]/40 px-5 py-3 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Managed Hosting: US-East &amp; EU-Central Edge
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              Daily automated backups enabled
            </span>
          </div>
        </Card>

        {/* Interactive Submit Website Edit Request Form */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Submit Website Edit Request
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Standard requests are completed within 1 business day.
            </p>
          </div>

          {submitSuccess && (
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--success-subtle)] px-3 py-2 text-xs text-[var(--success)]">
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Edit Summary"
              placeholder="e.g., Update pricing table annual toggle copy"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              error={formError ?? undefined}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Target Page / URL"
                placeholder="/pricing"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
              />

              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as EditPriority)}
              >
                <option value="Normal">Normal (24h SLA)</option>
                <option value="High">High (Same Day)</option>
                <option value="Urgent">Urgent (2h SLA)</option>
              </Select>
            </div>

            <Textarea
              label="Instructions & Assets"
              rows={4}
              placeholder="Describe the exact text, section, or image changes needed..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <Clock className="h-3 w-3" />
                Included in Managed Plan
              </span>
              <Button type="submit" variant="primary" size="sm">
                <Send className="h-3.5 w-3.5" />
                Submit Request
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
