"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin-types";

const STATUS_TABS: { key: "ALL" | AdminOrderStatus; label: string }[] = [
  { key: "ALL", label: "All Orders" },
  { key: "PENDING", label: "Pending" },
  { key: "AWAITING_BRIEF", label: "Awaiting Brief" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_TONE: Record<AdminOrderStatus, BadgeTone> = {
  PENDING: "neutral",
  AWAITING_BRIEF: "warning",
  IN_PROGRESS: "primary",
  IN_REVIEW: "lilac",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminOrderStatus>("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [editStatus, setEditStatus] = useState<AdminOrderStatus>("PENDING");
  const [editBriefNotes, setEditBriefNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrders = async () => {
    const res = await fetch("/api/admin/orders");
    const json = await res.json();
    if (json.ok) setOrders(json.orders);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter !== "ALL" && ord.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${ord.reference} ${ord.customerName} ${ord.customerEmail} ${ord.items
          .map((i) => i.productName)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const openModal = (ord: AdminOrder) => {
    setSelectedOrder(ord);
    setEditStatus(ord.status);
    setEditBriefNotes(ord.brief.notes ?? "");
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: editStatus,
          brief: { notes: editBriefNotes },
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setOrders((prev) => prev.map((o) => (o.id === json.order.id ? json.order : o)));
        setSelectedOrder(json.order);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        subtitle="Review, fulfill, and manage all customer orders."
        actions={
          <>
            <Link
              href="/admin/orders/cancellations"
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />
              Cancellation Requests
            </Link>
            <Link
              href="/admin/orders/abandoned-checkouts"
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Abandoned Checkouts
            </Link>
            <Link href="/admin/orders/create" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Create Order
            </Link>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="cpki-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === tab.key).length;
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`cpki-btn cpki-btn-xs ${
                    active ? "cpki-btn-primary" : "cpki-btn-outline"
                  }`}
                >
                  {tab.label}
                  <span className="opacity-75 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, customer, service..."
              className="cpki-input !pl-8"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Created</th>
                <th className="text-right">Total</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[var(--muted-foreground)]">
                    No orders match your current filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="font-mono text-xs font-semibold text-[var(--primary-text)] hover:underline"
                      >
                        {ord.reference}
                      </Link>
                    </td>
                    <td>
                      <div className="text-xs font-medium">{ord.customerName}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {ord.customerEmail}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">{ord.items[0]?.productName}</div>
                      {ord.items.length > 1 && (
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          +{ord.items.length - 1} more item
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[ord.status]} variant="sm">
                        {ord.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={ord.paymentStatus === "PAID" ? "success" : "warning"}
                        variant="sm"
                      >
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {formatMoney(ord.totalCents, ord.currency)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          <Eye className="h-3 w-3" />
                          Manage Order
                        </Link>
                        <button
                          type="button"
                          onClick={() => openModal(ord)}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                          title="Quick edit notes & status"
                        >
                          Quick Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Edit Order Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder ? (
            <div className="flex items-center gap-2">
              <span className="font-mono">{selectedOrder.reference}</span>
              <Badge tone={STATUS_TONE[selectedOrder.status]} variant="sm">
                {selectedOrder.status.replace(/_/g, " ")}
              </Badge>
            </div>
          ) : (
            "Order Details"
          )
        }
        maxWidth="680px"
      >
        {selectedOrder && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items ({selectedOrder.items.length})</TabsTrigger>
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="text-[var(--muted-foreground)]">Customer</div>
                  <div className="mt-1 font-semibold">{selectedOrder.customerName}</div>
                  <div className="text-[var(--muted-foreground)]">{selectedOrder.customerEmail}</div>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="text-[var(--muted-foreground)]">Payment & Total</div>
                  <div className="mt-1 font-semibold tabular-nums">
                    {formatMoney(selectedOrder.totalCents, selectedOrder.currency)}
                  </div>
                  <div className="text-[var(--muted-foreground)]">
                    {selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)]">
                  Update Fulfillment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdminOrderStatus)}
                  className="cpki-select"
                >
                  {STATUS_TABS.filter((t) => t.key !== "ALL").map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>

            <TabsContent value="items">
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="cpki-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Package</th>
                      <th>Cycle</th>
                      <th className="text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="text-xs font-medium">{item.productName}</td>
                        <td className="text-xs">{item.packageName}</td>
                        <td className="text-xs capitalize">{item.billingCycle}</td>
                        <td className="text-right text-xs font-semibold tabular-nums">
                          {formatMoney(item.unitPriceCents, selectedOrder.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="brief" className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="text-[var(--muted-foreground)]">Target Domain</div>
                  <div className="mt-1 font-medium">{selectedOrder.brief.domain || "—"}</div>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="text-[var(--muted-foreground)]">Target Market</div>
                  <div className="mt-1 font-medium">{selectedOrder.brief.targetMarket || "—"}</div>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="text-[var(--muted-foreground)]">Campaign Goals</div>
                <div className="mt-1">{selectedOrder.brief.goals || "No goals specified."}</div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Internal Fulfillment Notes</label>
                <textarea
                  rows={3}
                  value={editBriefNotes}
                  onChange={(e) => setEditBriefNotes(e.target.value)}
                  className="cpki-textarea"
                  placeholder="Add onboarding or QA notes..."
                />
              </div>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-3 text-xs">
              <div className="rounded-lg border border-[var(--border)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--primary-text)]" />
                  <div>
                    <div className="font-mono font-semibold">
                      {selectedOrder.invoiceNumber ?? "No invoice linked"}
                    </div>
                    <div className="text-[var(--muted-foreground)]">
                      Status: {selectedOrder.paymentStatus} · Total{" "}
                      {formatMoney(selectedOrder.totalCents, selectedOrder.currency)}
                    </div>
                  </div>
                </div>
                <Link
                  href="/admin/billing/invoices"
                  className="cpki-btn cpki-btn-outline cpki-btn-xs"
                >
                  Open Billing
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-2">
              {selectedOrder.lifecycle.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--border)] p-2.5 text-xs"
                >
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary-text)]" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--foreground)]">{ev.action}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {ev.actor} · {formatDate(ev.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={saving}
                className="cpki-btn cpki-btn-primary cpki-btn-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
