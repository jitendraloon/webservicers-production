"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { PaymentTransaction } from "@/lib/admin-types";

const TX_TONE: Record<PaymentTransaction["status"], BadgeTone> = {
  SUCCEEDED: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "lilac",
};

export default function AdminPaymentTransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [gatewayFilter, setGatewayFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setTransactions(json.transactions);
      });
  }, []);

  const gateways = useMemo(
    () => ["ALL", ...Array.from(new Set(transactions.map((t) => t.gateway)))],
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (gatewayFilter !== "ALL" && tx.gateway !== gatewayFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${tx.txRef} ${tx.invoiceNumber} ${tx.customerName}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, gatewayFilter, search]);

  const handleRefund = async (id: string) => {
    const res = await fetch("/api/admin/commerce", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "transaction_refund", id }),
    });
    const json = await res.json();
    if (json.ok) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? json.transaction : t)));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payment Transactions"
        subtitle="Audit gateway charges, processor fees, settlements, and refunds."
        actions={
          <Link href="/admin/payments/payment-links" className="cpki-btn cpki-btn-primary cpki-btn-sm">
            Payment Links
          </Link>
        }
      />

      <div className="cpki-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {gateways.map((gw) => (
            <button
              key={gw}
              type="button"
              onClick={() => setGatewayFilter(gw)}
              className={`cpki-btn cpki-btn-xs ${
                gatewayFilter === gw ? "cpki-btn-primary" : "cpki-btn-outline"
              }`}
            >
              {gw}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tx ref, invoice, client..."
            className="cpki-input !pl-8"
          />
        </div>
      </div>

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Transaction Ref</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Gateway & Method</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Fee</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs font-semibold">{tx.txRef}</td>
                  <td className="font-mono text-xs">{tx.invoiceNumber}</td>
                  <td className="text-xs font-medium">{tx.customerName}</td>
                  <td>
                    <div className="text-xs font-medium">{tx.gateway}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{tx.method}</div>
                  </td>
                  <td>
                    <Badge tone={TX_TONE[tx.status]} variant="sm">
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)]">{formatDate(tx.createdAt)}</td>
                  <td className="text-right text-xs text-[var(--muted-foreground)] tabular-nums">
                    {formatMoney(tx.feeCents, tx.currency)}
                  </td>
                  <td className="text-right text-xs font-semibold tabular-nums">
                    {formatMoney(tx.amountCents, tx.currency)}
                  </td>
                  <td className="text-right">
                    {tx.status === "SUCCEEDED" ? (
                      <button
                        type="button"
                        onClick={() => handleRefund(tx.id)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Refund
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--muted-foreground)]">—</span>
                    )}
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
