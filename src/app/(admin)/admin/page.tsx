"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Layers,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminOrder, AdminSmmOrder } from "@/lib/admin-types";

interface OverviewResponse {
  ok: boolean;
  kpis: {
    collectedRevenueCents: number;
    openReceivablesCents: number;
    smmOrdersCount: number;
    agencyWorkspaces: number;
  };
  focusQueues: {
    id: string;
    title: string;
    count: number;
    tone: BadgeTone;
    href: string;
    description: string;
  }[];
  health: {
    overallStatus: string;
    seoQuotaUsedPct: number;
    seoApiLatencyMs: number;
    activeGateways: number;
    totalGateways: number;
    smmProvidersOnline: number;
    smmProvidersTotal: number;
  };
  recentOrders: AdminOrder[];
  recentSmmOrders: AdminSmmOrder[];
}

const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  COMPLETED: "success",
  IN_PROGRESS: "primary",
  IN_REVIEW: "lilac",
  AWAITING_BRIEF: "warning",
  PENDING: "neutral",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

const SHORTCUTS = [
  { label: "Create Order", href: "/admin/orders/create", icon: Plus, desc: "Manual order & invoice" },
  { label: "Products Catalog", href: "/admin/products", icon: Layers, desc: "14 services & tiers" },
  { label: "Active Services", href: "/admin/services", icon: Server, desc: "Suspend, upgrade, transfer" },
  { label: "Invoices & Tax", href: "/admin/billing/invoices", icon: Receipt, desc: "PDF, mark paid, formalize" },
  { label: "Checkout Gateways", href: "/admin/checkout", icon: CreditCard, desc: "8 gateways & ZIP modules" },
  { label: "Payment Links", href: "/admin/payments/payment-links", icon: Zap, desc: "Instant hosted pay links" },
  { label: "Coupons & Promos", href: "/admin/coupons", icon: Tag, desc: "Discount rules & caps" },
  { label: "Pricing Consoles", href: "/admin/pricing", icon: TrendingUp, desc: "FX rates & multipliers" },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (json.ok) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        subtitle="Unified operations console for commerce, fulfillment, and platform health."
        actions={
          <>
            <button
              type="button"
              onClick={loadOverview}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link href="/admin/orders/create" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              <Plus className="h-3.5 w-3.5" />
              New Order
            </Link>
          </>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Collected Revenue</span>
            <DollarSign className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
            {data ? formatMoney(data.kpis.collectedRevenueCents) : "$0.00"}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--success)]">
            <TrendingUp className="h-3 w-3" />
            <span>Settled across paid invoices</span>
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Open Receivables</span>
            <FileText className="h-4 w-4 text-[var(--warning)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
            {data ? formatMoney(data.kpis.openReceivablesCents) : "$0.00"}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Unpaid & overdue client invoices
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>SMM Orders</span>
            <Sparkles className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
            {data ? data.kpis.smmOrdersCount : 0}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Active automated social fulfillment
          </div>
        </div>

        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Agency Workspaces</span>
            <Building2 className="h-4 w-4 text-[var(--lilac-foreground)]" />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
            {data ? data.kpis.agencyWorkspaces : 0}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Multi-tenant client environments
          </div>
        </div>
      </div>

      {/* Where to Focus + Provider & SEO Health */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Where to focus</h2>
            <span className="text-xs text-[var(--muted-foreground)]">Live operational queues</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(data?.focusQueues ?? []).map((q) => (
              <Link
                key={q.id}
                href={q.href}
                className="cpki-card p-4 transition-colors hover:border-[var(--primary)] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{q.title}</span>
                    <Badge tone={q.tone} variant="sm">
                      {q.count}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{q.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Provider & SEO Health Insight Card */}
        <div className="cpki-card-insight p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--insight-foreground)]" />
                <h2 className="text-sm font-semibold text-[var(--insight-foreground)]">
                  Provider & SEO Health
                </h2>
              </div>
              <Badge tone="success" variant="sm">
                <CheckCircle2 className="h-3 w-3" />
                {data?.health.overallStatus ?? "OPERATIONAL"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-[var(--insight-foreground)]/85">
              Real-time telemetry across SEO intelligence APIs, payment gateways, and SMM upstream providers.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--insight-foreground)]">
                  <span>SEO API Quota</span>
                  <span className="tabular-nums">{data?.health.seoQuotaUsedPct ?? 62}% used</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--success)]"
                    style={{ width: `${data?.health.seoQuotaUsedPct ?? 62}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2.5">
                  <div className="text-[11px] text-[var(--muted-foreground)]">Payment Gateways</div>
                  <div className="mt-0.5 font-semibold text-[var(--foreground)] tabular-nums">
                    {data ? `${data.health.activeGateways}/${data.health.totalGateways} Active` : "6/8 Active"}
                  </div>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2.5">
                  <div className="text-[11px] text-[var(--muted-foreground)]">SMM Providers</div>
                  <div className="mt-0.5 font-semibold text-[var(--foreground)] tabular-nums">
                    {data
                      ? `${data.health.smmProvidersOnline}/${data.health.smmProvidersTotal} Online`
                      : "3/3 Online"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--insight-border)] flex items-center justify-between text-xs">
            <span className="text-[var(--insight-foreground)]">
              Avg API Latency: <strong>{data?.health.seoApiLatencyMs ?? 142}ms</strong>
            </span>
            <Link
              href="/admin/checkout"
              className="font-medium text-[var(--insight-foreground)] underline underline-offset-2"
            >
              Manage Gateways
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Recent SMM Orders */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="cpki-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[var(--primary-text)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-medium text-[var(--primary-text)] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders ?? []).map((ord) => (
                  <tr key={ord.id}>
                    <td className="font-mono text-xs font-medium">{ord.reference}</td>
                    <td>
                      <div className="text-xs font-medium">{ord.customerName}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {ord.items[0]?.productName}
                      </div>
                    </td>
                    <td>
                      <Badge tone={ORDER_STATUS_TONE[ord.status] ?? "neutral"} variant="sm">
                        {ord.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {formatMoney(ord.totalCents, ord.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cpki-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--lilac-foreground)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent SMM Orders</h2>
            </div>
            <Link href="/admin/smm/orders" className="text-xs font-medium text-[var(--primary-text)] hover:underline">
              SMM Console
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="text-right">Charge</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentSmmOrders ?? []).map((smm) => (
                  <tr key={smm.id}>
                    <td className="font-mono text-xs font-medium">{smm.reference}</td>
                    <td>
                      <div className="text-xs font-medium">{smm.serviceName}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {smm.customerName} · Qty {smm.quantity.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          smm.status === "COMPLETED"
                            ? "success"
                            : smm.status === "IN_PROGRESS" || smm.status === "PROCESSING"
                              ? "primary"
                              : "warning"
                        }
                        variant="sm"
                      >
                        {smm.status}
                      </Badge>
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {formatMoney(smm.chargeCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Shortcuts Grid */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--primary-text)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Admin Shortcuts</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map((sc) => {
            const Icon = sc.icon;
            return (
              <Link
                key={sc.href}
                href={sc.href}
                className="cpki-card p-3.5 flex items-center gap-3 transition-colors hover:border-[var(--primary)] hover:bg-[var(--muted)]/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary-text)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {sc.label}
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {sc.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
