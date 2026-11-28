"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, Receipt, Search, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate, formatMoney } from "@/lib/formatters";
import {
  usePortalStore,
  type InvoiceStatus,
  type PortalInvoice,
} from "../_data/portal-store";
import { StatusBadge } from "../_components/StatusBadge";

const INVOICE_TABS: Array<{ value: "ALL" | InvoiceStatus; label: string }> = [
  { value: "ALL", label: "All Invoices" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "DRAFT", label: "Draft" },
];

export default function PortalInvoicesPage() {
  const { state, walletBalanceCents } = usePortalStore();
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [query, setQuery] = useState("");

  const totalPaidCents = useMemo(
    () =>
      state.invoices
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.totalCents, 0),
    [state.invoices]
  );

  const outstandingCents = useMemo(
    () =>
      state.invoices
        .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
        .reduce((sum, i) => sum + i.totalCents, 0),
    [state.invoices]
  );

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.orderReference ?? "").toLowerCase().includes(q) ||
        inv.items.some((item) => item.description.toLowerCase().includes(q))
      );
    });
  }, [state.invoices, statusFilter, query]);

  const columns: Column<PortalInvoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      render: (row) => (
        <Link
          href={`/dashboard/invoices/${row.id}`}
          className="font-mono text-xs font-semibold text-[var(--primary-text)] hover:underline"
        >
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      key: "orderReference",
      header: "Order / Description",
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-[var(--foreground)]">
            {row.items[0]?.description ?? "Service Invoice"}
          </div>
          {row.orderReference ? (
            <div className="text-[11px] font-mono text-[var(--muted-foreground)]">
              Order: {row.orderReference}
            </div>
          ) : null}
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
        <span className="font-mono text-xs font-semibold">
          {formatMoney(row.totalCents, row.currency)}
        </span>
      ),
    },
    {
      key: "dueAt",
      header: "Due Date",
      render: (row) => (
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(row.dueAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "UNPAID" || row.status === "OVERDUE" ? (
            <Link href={`/dashboard/invoices/${row.id}?pay=1`}>
              <Button variant="primary" size="xs">
                Pay Now
              </Button>
            </Link>
          ) : null}
          <Link href={`/dashboard/invoices/${row.id}`}>
            <Button variant="outline" size="xs">
              View
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Review invoices, settle balances across payment gateways, and download official receipts."
        actions={
          <Link href="/dashboard/add-funds">
            <Button variant="outline" size="sm">
              <Wallet className="h-3.5 w-3.5" />
              Wallet: {formatMoney(walletBalanceCents, "USD")}
            </Button>
          </Link>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Outstanding Due</span>
            <div className="mt-1 text-xl font-semibold font-mono text-[var(--foreground)]">
              {formatMoney(outstandingCents, "USD")}
            </div>
          </div>
          <CreditCard className="h-5 w-5 text-[var(--warning)]" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Total Paid</span>
            <div className="mt-1 text-xl font-semibold font-mono text-[var(--foreground)]">
              {formatMoney(totalPaidCents, "USD")}
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Total Invoices</span>
            <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {state.invoices.length}
            </div>
          </div>
          <Receipt className="h-5 w-5 text-[var(--primary-text)]" />
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | InvoiceStatus)}
          >
            <TabsList className="flex-wrap">
              {INVOICE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice # or order..."
              className="pl-8"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredInvoices}
          rowKey={(row) => row.id}
          emptyMessage="No invoices match your filter."
        />
      </Card>
    </div>
  );
}
