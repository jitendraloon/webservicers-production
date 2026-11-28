"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PauseCircle, PlayCircle, RefreshCw, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminSubscription } from "@/lib/admin-types";

const SUB_TONE: Record<AdminSubscription["status"], BadgeTone> = {
  ACTIVE: "success",
  PAST_DUE: "danger",
  PAUSED: "warning",
  CANCELLED: "neutral",
};

export default function AdminBillingSubscriptionsPage() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSubs(json.subscriptions);
      });
  }, []);

  const updateSub = async (id: string, status: AdminSubscription["status"]) => {
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "subscription", id, status }),
    });
    const json = await res.json();
    if (json.ok) {
      setSubs((prev) => prev.map((s) => (s.id === id ? json.subscription : s)));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage recurring billing schedules, dunning retries, and cancellations."
        actions={
          <Link href="/admin/billing/invoices" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            View Invoices
          </Link>
        }
      />

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Service & Plan</th>
                <th>Gateway</th>
                <th>Period End</th>
                <th>Status</th>
                <th className="text-right">Recurring</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr key={sub.id}>
                  <td className="font-mono text-xs font-semibold">{sub.subscriptionCode}</td>
                  <td>
                    <div className="text-xs font-medium">{sub.customerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{sub.customerEmail}</div>
                  </td>
                  <td>
                    <div className="text-xs font-medium">{sub.productName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {sub.packageName} · {sub.interval}
                    </div>
                  </td>
                  <td className="text-xs">{sub.gateway}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td>
                    <Badge tone={SUB_TONE[sub.status]} variant="sm">
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="text-right text-xs font-semibold tabular-nums">
                    {formatMoney(sub.amountCents, sub.currency)}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      {sub.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => updateSub(sub.id, "PAUSED")}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                        >
                          <PauseCircle className="h-3 w-3" />
                          Pause
                        </button>
                      ) : sub.status !== "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={() => updateSub(sub.id, "ACTIVE")}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          {sub.status === "PAST_DUE" ? (
                            <RefreshCw className="h-3 w-3" />
                          ) : (
                            <PlayCircle className="h-3 w-3" />
                          )}
                          {sub.status === "PAST_DUE" ? "Retry" : "Resume"}
                        </button>
                      ) : null}
                      {sub.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => updateSub(sub.id, "CANCELLED")}
                          className="cpki-btn cpki-btn-ghost cpki-btn-xs text-[var(--destructive)]"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
