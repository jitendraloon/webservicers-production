'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';

interface SeoLog {
  id: string;
  provider: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  costUsd: number;
  timestamp: string;
}

const LOGS: SeoLog[] = [
  { id: 'LOG-991', provider: 'Serper.dev', endpoint: '/search?q=cloud+hosting', status: 200, latencyMs: 79, costUsd: 0.001, timestamp: '18:10:42' },
  { id: 'LOG-990', provider: 'DataForSEO', endpoint: '/v3/keywords_data/google_ads', status: 200, latencyMs: 144, costUsd: 0.015, timestamp: '18:10:19' },
  { id: 'LOG-989', provider: 'SE Ranking', endpoint: '/v1/domain/overview', status: 429, latencyMs: 312, costUsd: 0.0, timestamp: '18:09:51' },
  { id: 'LOG-988', provider: 'OpenAI GPT-4o', endpoint: '/v1/chat/completions', status: 200, latencyMs: 418, costUsd: 0.024, timestamp: '18:08:11' },
];

export default function AdminSeoHealthPage() {
  const columns: Column<SeoLog>[] = [
    { key: 'timestamp', header: 'Time', render: (r) => <span className="font-mono text-xs">{r.timestamp}</span> },
    { key: 'provider', header: 'Provider' },
    { key: 'endpoint', header: 'Endpoint', render: (r) => <span className="font-mono text-xs">{r.endpoint}</span> },
    {
      key: 'status',
      header: 'HTTP',
      render: (r) => {
        const tone: BadgeTone = r.status < 300 ? 'success' : r.status === 429 ? 'warning' : 'danger';
        return <Badge tone={tone} variant="sm">{r.status}</Badge>;
      },
    },
    { key: 'latencyMs', header: 'Latency', render: (r) => <span className="font-mono text-xs">{r.latencyMs}ms</span> },
    { key: 'costUsd', header: 'Cost', render: (r) => <span className="font-mono text-xs">${r.costUsd.toFixed(3)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Health & Usage Logs"
        subtitle="Real-time upstream API telemetry, HTTP status codes, latency distribution, and per-call cost."
      />
      <Card className="p-0 overflow-hidden">
        <DataTable columns={columns} data={LOGS} rowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
