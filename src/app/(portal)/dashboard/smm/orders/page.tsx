"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate, formatMoney } from "@/lib/formatters";
import {
  usePortalStore,
  type PortalSmmOrder,
  type SmmOrderStatus,
} from "../../_data/portal-store";
import { StatusBadge } from "../../_components/StatusBadge";

const SMM_TABS: Array<{ value: "ALL" | SmmOrderStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PARTIAL", label: "Partial" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function PortalSmmOrdersPage() {
  const { state, refreshSmmOrder } = usePortalStore();
  const [statusFilter, setStatusFilter] = useState<"ALL" | SmmOrderStatus>("ALL");
  const [query, setQuery] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.smmOrders.filter((ord) => {
      if (statusFilter !== "ALL" && ord.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.serviceName.toLowerCase().includes(q) ||
        ord.link.toLowerCase().includes(q)
      );
    });
  }, [state.smmOrders, statusFilter, query]);

  const handleRefresh = (id?: string) => {
    setRefreshingId(id ?? "ALL");
    setTimeout(() => {
      refreshSmmOrder(id);
      setRefreshingId(null);
    }, 250);
  };

  const columns: Column<PortalSmmOrder>[] = [
    {
      key: "id",
      header: "Order ID",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[var(--primary-text)]">
          {row.id}
        </span>
      ),
    },
    {
      key: "serviceName",
      header: "Service & Target",
      render: (row) => (
        <div className="max-w-xs">
          <div className="text-xs font-medium text-[var(--foreground)] truncate">
            {row.serviceName}
          </div>
          <a
            href={row.link}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] hover:text-[var(--primary-text)] truncate max-w-full"
          >
            <span className="truncate">{row.link}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          </a>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      render: (row) => (
        <span className="font-mono text-xs">{row.quantity.toLocaleString()}</span>
      ),
    },
    {
      key: "chargeCents",
      header: "Charge",
      render: (row) => (
        <span className="font-mono text-xs font-medium">
          {formatMoney(row.chargeCents, row.currency)}
        </span>
      ),
    },
    {
      key: "startCount",
      header: "Start Count",
      render: (row) => (
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {row.startCount !== null ? row.startCount.toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "remains",
      header: "Remains",
      render: (row) => (
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {row.remains !== null ? row.remains.toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
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
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => handleRefresh(row.id)}
          disabled={refreshingId === row.id}
          title="Refresh order status"
        >
          <RefreshCw
            className={`h-3 w-3 ${refreshingId === row.id ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Order History"
        subtitle="Monitor real-time delivery status, start counts, and remaining quantities across your SMM orders."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefresh()}
              disabled={refreshingId === "ALL"}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshingId === "ALL" ? "animate-spin" : ""}`}
              />
              Refresh All
            </Button>
            <Link href="/dashboard/smm/new-order">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New SMM Order
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | SmmOrderStatus)}
          >
            <TabsList className="flex-wrap">
              {SMM_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID or link..."
              className="pl-8"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          rowKey={(row) => row.id}
          emptyMessage="No SMM orders placed yet."
        />
      </Card>
    </div>
  );
}
