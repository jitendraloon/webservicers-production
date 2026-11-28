"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminOrder } from "@/lib/admin-types";

export default function AdminOrderCancellationsPage() {
  const [requests, setRequests] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNote, setActionNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchCancellations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/cancellations");
      const json = await res.json();
      if (json.ok) setRequests(json.requests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellations();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const st = r.cancellationStatus || (r.status === "CANCELLED" || r.status === "REFUNDED" ? "APPROVED" : "PENDING");
      if (filter === "ALL") return true;
      return st === filter;
    });
  }, [requests, filter]);

  const pendingCount = requests.filter(
    (r) => (r.cancellationStatus || "PENDING") === "PENDING" && r.status !== "CANCELLED" && r.status !== "REFUNDED"
  ).length;

  const totalRefundExposureCents = requests
    .filter((r) => (r.cancellationStatus || "PENDING") === "PENDING")
    .reduce((s, r) => s + r.totalCents, 0);

  const approvedCount = requests.filter(
    (r) => r.cancellationStatus === "APPROVED" || r.status === "CANCELLED" || r.status === "REFUNDED"
  ).length;

  const handleOpenAction = (order: AdminOrder, type: "approve" | "reject") => {
    setSelectedOrder(order);
    setActionType(type);
    setActionNote(
      type === "approve"
        ? "Cancellation approved. Full refund will be credited to original payment method."
        : "Order is already actively in progress with deliverables being drafted. We cannot approve full cancellation at this stage."
    );
  };

  const handleExecuteAction = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/orders/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: actionType,
          note: actionNote,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setRequests((prev) => prev.map((o) => (o.id === json.order.id ? json.order : o)));
        setToast(
          actionType === "approve"
            ? `Cancellation approved & refund scheduled for ${selectedOrder.reference}`
            : `Cancellation request declined for ${selectedOrder.reference}`
        );
        setSelectedOrder(null);
        setTimeout(() => setToast(null), 3500);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cancellation Requests"
        subtitle="Manage client-initiated order cancellation and refund claims."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/orders" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Orders
            </Link>
            <button
              type="button"
              onClick={fetchCancellations}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
              title="Refresh Queue"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="cpki-card p-4 border-l-4 border-l-[var(--warning)]">
          <div className="text-xs text-[var(--muted-foreground)]">Pending Review</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--warning)]">
            {pendingCount}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Awaiting decision from Ops</p>
        </div>

        <div className="cpki-card p-4 border-l-4 border-l-[var(--danger)]">
          <div className="text-xs text-[var(--muted-foreground)]">Pending Refund Exposure</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(totalRefundExposureCents)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Total value of open requests</p>
        </div>

        <div className="cpki-card p-4 border-l-4 border-l-[var(--success)]">
          <div className="text-xs text-[var(--muted-foreground)]">Resolved / Approved</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--success)]">
            {approvedCount}
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Refunded or cancelled orders</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="cpki-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "ALL", label: `All Requests (${requests.length})` },
              { key: "PENDING", label: `Pending Action (${pendingCount})` },
              { key: "APPROVED", label: `Approved & Refunded (${approvedCount})` },
              { key: "REJECTED", label: `Declined (${requests.filter((r) => r.cancellationStatus === "REJECTED").length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`cpki-btn cpki-btn-xs ${
                filter === t.key ? "cpki-btn-primary" : "cpki-btn-outline"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Client</th>
                <th>Service Ordered</th>
                <th>Cancellation Reason</th>
                <th>Status</th>
                <th className="text-right">Order Value</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[var(--muted-foreground)]">
                    No cancellation requests match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const statusKey = ord.cancellationStatus || (ord.status === "CANCELLED" || ord.status === "REFUNDED" ? "APPROVED" : "PENDING");
                  const tone: BadgeTone =
                    statusKey === "APPROVED" ? "danger" : statusKey === "REJECTED" ? "neutral" : "warning";

                  return (
                    <tr key={ord.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="font-mono text-xs font-semibold text-[var(--primary-text)] hover:underline"
                        >
                          {ord.reference}
                        </Link>
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          {formatDate(ord.cancellationRequestedAt || ord.updatedAt)}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-medium">{ord.customerName}</div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          {ord.customerEmail}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-medium">
                          {ord.items[0]?.productName || "Custom Order"}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          {ord.items[0]?.packageName} Tier
                        </div>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-xs italic text-[var(--foreground)] line-clamp-2">
                          "{ord.cancellationReason || "Customer requested cancellation from client portal."}"
                        </p>
                        {ord.cancellationDecisionNote && (
                          <div className="mt-1 text-[10.5px] text-[var(--muted-foreground)] font-mono">
                            Resolution: {ord.cancellationDecisionNote}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge tone={tone} variant="sm">
                          {statusKey}
                        </Badge>
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {formatMoney(ord.totalCents, ord.currency)}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {statusKey === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(ord, "approve")}
                                className="cpki-btn cpki-btn-danger cpki-btn-xs"
                                title="Approve cancellation & issue refund"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(ord, "reject")}
                                className="cpki-btn cpki-btn-outline cpki-btn-xs"
                                title="Decline request & continue service"
                              >
                                <XCircle className="h-3 w-3" />
                                Decline
                              </button>
                            </>
                          )}
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="cpki-btn cpki-btn-outline cpki-btn-xs"
                          >
                            <Eye className="h-3 w-3" />
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${actionType === "approve" ? "text-[var(--danger)]" : "text-[var(--warning)]"}`} />
              <span>
                {actionType === "approve" ? "Approve Cancellation & Refund" : "Decline Cancellation Request"}
              </span>
            </div>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Order Reference:</span>
                <span className="font-mono font-semibold">{selectedOrder.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Customer:</span>
                <span className="font-semibold">{selectedOrder.customerName} ({selectedOrder.customerEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Order Amount:</span>
                <span className="font-semibold">{formatMoney(selectedOrder.totalCents, selectedOrder.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Customer Reason:</span>
                <span className="italic">"{selectedOrder.cancellationReason || "No detailed reason specified."}"</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                {actionType === "approve" ? "Resolution Note (Sent to Client):" : "Decline Explanation:"}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="cpki-textarea w-full text-xs"
                placeholder="Enter explanation note for the customer..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleExecuteAction}
                className={`cpki-btn cpki-btn-sm ${
                  actionType === "approve" ? "cpki-btn-danger" : "cpki-btn-primary"
                }`}
              >
                {processing
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Confirm Approval & Refund"
                  : "Decline Cancellation"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
