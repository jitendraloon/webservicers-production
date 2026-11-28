"use client";

import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Vault } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { CashVaultEntry } from "@/lib/admin-types";

export default function AdminBillingCashPage() {
  const [entries, setEntries] = useState<CashVaultEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<CashVaultEntry["type"]>("INFLOW");
  const [method, setMethod] = useState<CashVaultEntry["method"]>("CASH_COUNTER");
  const [amountUsd, setAmountUsd] = useState("500");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setEntries(json.cashVault);
      });
  }, []);

  const netVaultCents = entries.reduce((s, e) => s + e.amountCents, 0);
  const totalInflows = entries.filter((e) => e.amountCents > 0).reduce((s, e) => s + e.amountCents, 0);
  const totalOutflows = entries.filter((e) => e.amountCents < 0).reduce((s, e) => s + Math.abs(e.amountCents), 0);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "cash_entry",
        type,
        method,
        amountUsd: Number(amountUsd),
        description,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setEntries((prev) => [json.entry, ...prev]);
      setModalOpen(false);
      setDescription("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cash & Vault Ledger"
        subtitle="Track offline cash collections, bank settlements, provider top-ups, and reserves."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="cpki-btn cpki-btn-primary cpki-btn-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Record Entry
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Net Vault Balance</span>
            <Vault className="h-4 w-4 text-[var(--primary-text)]" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">
            {formatMoney(netVaultCents)}
          </div>
        </div>
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Total Inflows</span>
            <ArrowDownLeft className="h-4 w-4 text-[var(--success)]" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[var(--success)]">
            {formatMoney(totalInflows)}
          </div>
        </div>
        <div className="cpki-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Payouts & Reserves</span>
            <ArrowUpRight className="h-4 w-4 text-[var(--warning)]" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">
            {formatMoney(totalOutflows)}
          </div>
        </div>
      </div>

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Method</th>
                <th>Description</th>
                <th>Recorded By</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((ent) => (
                <tr key={ent.id}>
                  <td className="font-mono text-xs font-semibold">{ent.reference}</td>
                  <td>
                    <Badge
                      tone={ent.amountCents >= 0 ? "success" : "warning"}
                      variant="sm"
                    >
                      {ent.type}
                    </Badge>
                  </td>
                  <td className="text-xs">{ent.method.replace(/_/g, " ")}</td>
                  <td className="text-xs">{ent.description}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">{ent.recordedBy}</td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(ent.createdAt)}
                  </td>
                  <td
                    className={`text-right text-xs font-semibold tabular-nums ${
                      ent.amountCents >= 0 ? "text-[var(--success)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {ent.amountCents >= 0 ? "+" : ""}
                    {formatMoney(ent.amountCents, ent.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Cash & Vault Entry"
      >
        <form onSubmit={handleRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Entry Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CashVaultEntry["type"])}
                className="cpki-select"
              >
                <option value="INFLOW">Inflow</option>
                <option value="PAYOUT">Payout</option>
                <option value="RESERVE">Reserve</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as CashVaultEntry["method"])}
                className="cpki-select"
              >
                <option value="CASH_COUNTER">Cash Counter</option>
                <option value="BANK_WIRE">Bank Wire</option>
                <option value="SETTLEMENT">Settlement</option>
                <option value="PETTY_CASH">Petty Cash</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Amount (USD)</label>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="cpki-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <input
              required
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Counter cash receipt for INV-2026-0887"
              className="cpki-input"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
