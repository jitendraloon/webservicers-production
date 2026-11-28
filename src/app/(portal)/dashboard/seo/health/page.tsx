'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Gauge,
  Globe,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface VitalMetric {
  id: 'LCP' | 'INP' | 'CLS';
  name: string;
  value: string;
  target: string;
  status: 'Good' | 'Needs Improvement';
  percent: number;
  detail: string;
}

interface HealthCheckItem {
  id: string;
  label: string;
  category: 'Indexation & Sitemap' | 'HTTPS & Canonical';
  status: 'Passed' | 'Warning';
  detail: string;
}

const CORE_WEB_VITALS: VitalMetric[] = [
  {
    id: 'LCP',
    name: 'Largest Contentful Paint (LCP)',
    value: '1.8s',
    target: '≤ 2.5s',
    status: 'Good',
    percent: 88,
    detail: 'Hero image & above-the-fold typography render cleanly on 4G mobile.',
  },
  {
    id: 'INP',
    name: 'Interaction to Next Paint (INP)',
    value: '112ms',
    target: '≤ 200ms',
    status: 'Good',
    percent: 92,
    detail: 'Main-thread event handlers respond without long-task blocking.',
  },
  {
    id: 'CLS',
    name: 'Cumulative Layout Shift (CLS)',
    value: '0.03',
    target: '≤ 0.10',
    status: 'Good',
    percent: 95,
    detail: 'Explicit image dimensions and font-display swap prevent layout shifts.',
  },
];

const HEALTH_CHECKS: HealthCheckItem[] = [
  {
    id: 'sitemap',
    label: 'XML Sitemap Valid & Submitted',
    category: 'Indexation & Sitemap',
    status: 'Passed',
    detail: '142 canonical URLs listed in /sitemap.xml (last crawled 2h ago).',
  },
  {
    id: 'robots',
    label: 'Robots.txt Directives',
    category: 'Indexation & Sitemap',
    status: 'Passed',
    detail: 'Allow rules verified; /admin and /api routes cleanly disallowed.',
  },
  {
    id: 'index-coverage',
    label: 'Index Coverage Ratio',
    category: 'Indexation & Sitemap',
    status: 'Passed',
    detail: '139 of 142 submitted pages indexed (97.9% coverage, 0 5xx errors).',
  },
  {
    id: 'orphan-check',
    label: 'Soft 404 & Redirect Chains',
    category: 'Indexation & Sitemap',
    status: 'Warning',
    detail: '2 legacy blog URLs use 2-hop redirects; consolidate to single 301.',
  },
  {
    id: 'https-enforce',
    label: 'HTTPS Enforcement & HSTS',
    category: 'HTTPS & Canonical',
    status: 'Passed',
    detail: 'All HTTP requests redirect 301 to HTTPS with max-age=31536000.',
  },
  {
    id: 'canonical-tags',
    label: 'Self-Referencing Canonicals',
    category: 'HTTPS & Canonical',
    status: 'Passed',
    detail: 'Consistent <link rel="canonical"> tags across 100% of product pages.',
  },
  {
    id: 'mixed-content',
    label: 'Mixed Content Scan',
    category: 'HTTPS & Canonical',
    status: 'Passed',
    detail: '0 insecure HTTP scripts, stylesheets, or media assets detected.',
  },
];

function getCheckTone(status: HealthCheckItem['status']): BadgeTone {
  return status === 'Passed' ? 'success' : 'warning';
}

export default function SeoHealthPage() {
  const [lastScanned, setLastScanned] = useState('Today at 20:10 IST');
  const [isScanning, setIsScanning] = useState(false);

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanned('Just now');
    }, 500);
  };

  const indexationChecks = HEALTH_CHECKS.filter(
    (c) => c.category === 'Indexation & Sitemap'
  );
  const httpsChecks = HEALTH_CHECKS.filter(
    (c) => c.category === 'HTTPS & Canonical'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO & Site Health"
        subtitle="Technical health score, Core Web Vitals, indexation checks, and HTTPS/canonical diagnostics."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRescan}
              disabled={isScanning}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`}
              />
              {isScanning ? 'Scanning...' : 'Re-check Health'}
            </Button>
            <Link
              href="/dashboard/seo/workspace/site-audit"
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              Open Site Audit
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      {/* Overall Health Score Banner */}
      <Card className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--success-subtle)] text-[var(--success)]">
              <span className="text-2xl font-bold leading-none">92</span>
              <span className="text-[10px] font-medium">/ 100</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Overall Site Health Score
                </h2>
                <Badge tone="success">Healthy</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                6 of 7 automated technical checks passed • Last verified:{' '}
                <span className="font-medium text-[var(--foreground)]">
                  {lastScanned}
                </span>
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">
                Health Index
              </span>
              <span className="font-semibold text-[var(--foreground)]">92%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all"
                style={{ width: '92%' }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Core Web Vitals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <Zap className="h-4 w-4 text-[var(--primary)]" />
            Core Web Vitals (Field Data)
          </h2>
          <Badge variant="sm" tone="success">
            All Vitals Passing
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CORE_WEB_VITALS.map((vital) => (
            <Card key={vital.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  {vital.id}
                </span>
                <Badge
                  variant="sm"
                  tone={vital.status === 'Good' ? 'success' : 'warning'}
                >
                  {vital.status}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[var(--foreground)]">
                  {vital.value}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Target {vital.target}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-[var(--muted-foreground)]">
                {vital.name}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--success)]"
                  style={{ width: `${vital.percent}%` }}
                />
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                {vital.detail}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Indexation & Sitemap + HTTPS & Canonical */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Indexation &amp; Sitemap Checks
              </h3>
            </div>
            <Badge variant="sm" tone="primary">
              139 / 142 Indexed
            </Badge>
          </div>

          <div className="space-y-3">
            {indexationChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        check.status === 'Passed'
                          ? 'text-[var(--success)]'
                          : 'text-[var(--warning)]'
                      }`}
                    />
                    <span className="text-xs font-medium text-[var(--foreground)]">
                      {check.label}
                    </span>
                  </div>
                  <p className="pl-5 text-[11px] text-[var(--muted-foreground)]">
                    {check.detail}
                  </p>
                </div>
                <Badge variant="sm" tone={getCheckTone(check.status)}>
                  {check.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--success)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  HTTPS &amp; Canonical Status
                </h3>
              </div>
              <Badge variant="sm" tone="success">
                <ShieldCheck className="h-3 w-3" />
                100% Secure
              </Badge>
            </div>

            <div className="space-y-3">
              {httpsChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {check.label}
                      </span>
                    </div>
                    <p className="pl-5 text-[11px] text-[var(--muted-foreground)]">
                      {check.detail}
                    </p>
                  </div>
                  <Badge variant="sm" tone={getCheckTone(check.status)}>
                    {check.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">
                  Need a page-by-page crawl?
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Inspect broken links, meta lengths, and redirect chains in Site Audit.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/seo/workspace/site-audit"
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <Gauge className="h-3.5 w-3.5" />
              Go to Site Audit
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
