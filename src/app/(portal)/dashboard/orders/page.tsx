"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate, formatMoney } from "@/lib/formatters";
import { usePortalStore, type OrderStatus, type PortalOrder } from "../_data/portal-store";
import { StatusBadge } from "../_components/StatusBadge";

const ORDER_TABS: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function PortalOrdersPage() {
  const { state } = usePortalStore();
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.orders.filter((ord) => {
      if (statusFilter !== "ALL" && ord.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ord.reference.toLowerCase().includes(q) ||
        ord.serviceName.toLowerCase().includes(q) ||
        ord.tierName.toLowerCase().includes(q)
      );
    });
  }, [state.orders, statusFilter, query]);

  const columns: Column<PortalOrder>[] = [
    {
      key: "reference",
      header: "Order Ref",
      render: (row) => (
        <Link
          href={`/dashboard/orders/${row.id}`}
          className="font-mono text-xs font-semibold text-[var(--primary-text)] hover:underline"
        >
          {row.reference}
        </Link>
      ),
    },
    {
      key: "serviceName",
      header: "Service & Package",
      render: (row) => (
        <div>
          <div className="text-xs font-medium text-[var(--foreground)]">
            {row.serviceName}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {row.tierName} Tier · {row.billingCycle}
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
      key: "deliverables",
      header: "Deliverables",
      render: (row) => (
        <span className="text-xs text-[var(--muted-foreground)]">
          {row.deliverables.length} file{row.deliverables.length === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "totalCents",
      header: "Total",
      render: (row) => (
        <span className="font-mono text-xs font-medium">
          {formatMoney(row.totalCents, row.currency)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
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
        <Link href={`/dashboard/orders/${row.id}`}>
          <Button variant="outline" size="xs">
            Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Track and manage your agency service orders, project briefs, and deliverables."
        actions={
          <Link href="/dashboard/plans">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Order Service
            </Button>
          </Link>
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Total Orders</span>
            <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {state.orders.length}
            </div>
          </div>
          <ShoppingBag className="h-5 w-5 text-[var(--primary-text)]" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">In Progress</span>
            <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {state.orders.filter((o) => o.status === "IN_PROGRESS").length}
            </div>
          </div>
          <StatusBadge status="IN_PROGRESS" size="sm" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Completed</span>
            <div className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {state.orders.filter((o) => o.status === "COMPLETED").length}
            </div>
          </div>
          <StatusBadge status="COMPLETED" size="sm" />
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ALL" | OrderStatus)}
          >
            <TabsList className="flex-wrap">
              {ORDER_TABS.map((tab) => (
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
              placeholder="Search reference or service..."
              className="pl-8"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          rowKey={(row) => row.id}
          emptyMessage="No orders match your current filter."
        />
      </Card>
    </div>
  );
}
