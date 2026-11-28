"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  HeadphonesIcon,
  Layers,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardInsight } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/formatters";
import { usePortalStore, type PortalOrder } from "./_data/portal-store";
import { StatusBadge } from "./_components/StatusBadge";

const WORKSPACE_SHORTCUTS = [
  {
    title: "SEO Suite Workspace",
    description: "Run technical audits, track keyword rankings & AI citations.",
    href: "/dashboard/seo/workspace/dashboard",
    icon: BarChart3,
    badge: "Live",
  },
  {
    title: "SMM Order Panel",
    description: "Launch social growth campaigns from your wallet balance.",
    href: "/dashboard/smm/new-order",
    icon: Sparkles,
    badge: "Instant",
  },
  {
    title: "Browse Agency Plans",
    description: "Configure 14 managed services across 3 flexible tiers.",
    href: "/dashboard/plans",
    icon: Layers,
    badge: "14 Services",
  },
  {
    title: "Add Wallet Funds",
    description: "Top up via Stripe, PayPal, Razorpay, Crypto, or Bank Wire.",
    href: "/dashboard/balance",
    icon: Wallet,
    badge: "7 Gateways",
  },
];

const USAGE_METRICS = [
  {
    label: "SEO Crawl Credits",
    used: 14200,
    limit: 25000,
    unit: "pages",
    color: "bg-[var(--primary)]",
  },
  {
    label: "Tracked Keywords",
    used: 380,
    limit: 500,
    unit: "keywords",
    color: "bg-[var(--brand-mint)]",
  },
  {
    label: "AI Visibility Prompts",
    used: 64,
    limit: 100,
    unit: "prompts",
    color: "bg-[var(--brand-lilac)]",
  },
];

export default function DashboardHomePage() {
  const { state, walletBalanceCents } = usePortalStore();

  const activeServicesCount = state.orders.filter(
    (o) => o.status === "IN_PROGRESS" || o.status === "COMPLETED"
  ).length;
  const openOrdersCount = state.orders.filter(
    (o) => o.status === "PENDING" || o.status === "IN_PROGRESS"
  ).length;
  const unreadTicketsCount = state.tickets.filter(
    (t) => t.status === "AWAITING_REPLY" || t.status === "OPEN"
  ).length;

  const recentOrderColumns: Column<PortalOrder>[] = [
    {
      key: "reference",
      header: "Order",
      render: (row) => (
        <Link
          href={`/dashboard/orders/${row.id}`}
          className="font-mono text-xs font-medium text-[var(--primary-text)] hover:underline"
        >
          {row.reference}
        </Link>
      ),
    },
    {
      key: "serviceName",
      header: "Service & Tier",
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--foreground)] text-xs">
            {row.serviceName}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {row.tierName} · {row.billingCycle}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "totalCents",
      header: "Amount",
      render: (row) => (
        <span className="font-mono text-xs font-medium">
          {formatMoney(row.totalCents, row.currency)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => (
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const firstName = state.profile.name.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your active services, orders, wallet balance, and workspace metrics."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/balance">
              <Button variant="outline" size="sm">
                <CreditCard className="h-3.5 w-3.5" />
                Add Funds
              </Button>
            </Link>
            <Link href="/dashboard/plans">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New Service Order
              </Button>
            </Link>
          </div>
        }
      />

      {/* Welcome Banner */}
      <Card className="p-5 bg-gradient-to-r from-[var(--accent)]/70 via-[var(--card)] to-[var(--insight-surface)]/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--primary-text)] mb-2">
              <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
              Workspace Active · {state.profile.company}
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Welcome back, {firstName}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">
              Your SEO &amp; Growth campaigns are running smoothly. Review pending deliverables, manage invoices, or launch new SMM orders from one unified portal.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/smm/new-order">
              <Button variant="outline" size="sm">
                Launch SMM Order
              </Button>
            </Link>
            <Link href="/dashboard/seo/workspace/dashboard">
              <Button variant="primary" size="sm">
                Open SEO Suite
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Active Services
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--primary-text)]">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {activeServicesCount}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Managed agency &amp; SEO retainers
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Open Orders
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--warning-subtle)] text-[var(--warning)]">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {openOrdersCount}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            <Link href="/dashboard/orders" className="text-[var(--primary-text)] hover:underline">
              View order pipeline →
            </Link>
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Wallet Balance
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--success-subtle)] text-[var(--success)]">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight font-mono text-[var(--foreground)]">
            {formatMoney(walletBalanceCents, "USD")}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            <Link href="/dashboard/balance" className="text-[var(--primary-text)] hover:underline">
              Top up or view ledger →
            </Link>
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Unread Tickets
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--lilac-subtle)] text-[var(--lilac-foreground)]">
              <HeadphonesIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {unreadTicketsCount}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            <Link href="/dashboard/support" className="text-[var(--primary-text)] hover:underline">
              Open support desk →
            </Link>
          </p>
        </Card>
      </div>

      {/* Workspace Shortcuts + SEO Suite Insight Card */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Workspace Shortcuts
            </h3>
            <span className="text-xs text-[var(--muted-foreground)]">
              Quick navigation
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WORKSPACE_SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="no-underline">
                  <Card className="p-4 h-full transition-colors hover:border-[var(--primary)]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--secondary)] text-[var(--primary-text)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-text)]">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="mt-3 text-xs font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                      {item.description}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* SEO Suite Insight Card */}
        <CardInsight className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--insight-foreground)]">
                <Activity className="h-4 w-4" />
                SEO Suite Insight
              </span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[var(--insight-foreground)]">
                Health 92/100
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">
              webservicers.io
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Organic visibility increased <strong className="text-[var(--insight-foreground)]">+18.4%</strong> over the last 30 days across 380 tracked keywords.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-[var(--radius-control)] bg-white/75 border border-[var(--insight-border)] p-2.5">
                <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                  <TrendingUp className="h-3 w-3 text-[var(--insight-foreground)]" />
                  Top 3 Ranks
                </div>
                <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
                  47
                </div>
              </div>
              <div className="rounded-[var(--radius-control)] bg-white/75 border border-[var(--insight-border)] p-2.5">
                <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                  <Search className="h-3 w-3 text-[var(--insight-foreground)]" />
                  AI Citations
                </div>
                <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
                  64.2%
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--insight-border)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--insight-foreground)]">
              Last crawl: 2 hours ago
            </span>
            <Link href="/dashboard/seo/workspace/dashboard">
              <Button variant="outline" size="xs">
                Inspect
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardInsight>
      </div>

      {/* Recent Orders Table & Usage Metrics */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Recent Orders
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Latest managed service &amp; retainer orders
              </p>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="xs">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <DataTable
            columns={recentOrderColumns}
            data={state.orders.slice(0, 5)}
            rowKey={(row) => row.id}
            emptyMessage="No orders placed yet."
          />
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Usage Metrics
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Current billing cycle quota consumption
            </p>
          </div>
          <div className="space-y-4">
            {USAGE_METRICS.map((metric) => {
              const pct = Math.min(100, Math.round((metric.used / metric.limit) * 100));
              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[var(--foreground)]">
                      {metric.label}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                      {metric.used.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <div
                      className={`h-full rounded-full ${metric.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-[var(--radius-control)] bg-[var(--muted)] p-3 border border-[var(--border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Active SMM Campaigns</span>
              <span className="font-semibold font-mono text-[var(--foreground)]">
                {state.smmOrders.filter((o) => o.status === "IN_PROGRESS" || o.status === "PENDING").length} running
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Unpaid Invoices</span>
              <span className="font-semibold font-mono text-[var(--foreground)]">
                {state.invoices.filter((i) => i.status === "UNPAID" || i.status === "OVERDUE").length} due
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
