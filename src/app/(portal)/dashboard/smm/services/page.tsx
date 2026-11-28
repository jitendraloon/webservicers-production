"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { usePortalStore, type PortalSmmService } from "../../_data/portal-store";

export default function PortalSmmServicesPage() {
  const { state } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(state.smmServices.map((s) => s.category)));
    return ["All", ...unique];
  }, [state.smmServices]);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.smmServices.filter((svc) => {
      if (selectedCategory !== "All" && svc.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.category.toLowerCase().includes(q) ||
        svc.externalId.toLowerCase().includes(q)
      );
    });
  }, [state.smmServices, selectedCategory, query]);

  const columns: Column<PortalSmmService>[] = [
    {
      key: "externalId",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[var(--muted-foreground)]">
          #{row.externalId}
        </span>
      ),
    },
    {
      key: "name",
      header: "Service",
      render: (row) => (
        <div className="max-w-md">
          <div className="text-xs font-medium text-[var(--foreground)]">
            {row.name}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
            {row.description}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <Badge tone="neutral" variant="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      key: "ratePerThousand",
      header: "Rate / 1,000",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[var(--primary-text)]">
          ${row.ratePerThousand.toFixed(2)}
        </span>
      ),
    },
    {
      key: "limits",
      header: "Min / Max",
      render: (row) => (
        <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
          {row.minQty.toLocaleString()} – {row.maxQty.toLocaleString()}
        </span>
      ),
    },
    {
      key: "avgTime",
      header: "Avg. Time",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--muted-foreground)]">{row.avgTime}</span>
          {row.refillSupported ? (
            <span
              title="Refill Supported"
              className="inline-flex items-center gap-0.5 rounded bg-[var(--success-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--success)]"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Refill
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <Link href={`/dashboard/smm/new-order?serviceId=${row.id}`}>
          <Button variant="primary" size="xs">
            Quick Order
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMM Services Catalog"
        subtitle="Browse imported social media marketing services by category with live rate per 1,000 and min/max limits."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/smm/orders">
              <Button variant="outline" size="sm">
                Order History
              </Button>
            </Link>
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
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service or ID..."
              className="pl-8"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredServices}
          rowKey={(row) => row.id}
          emptyMessage="No SMM services match your search."
        />
      </Card>
    </div>
  );
}
