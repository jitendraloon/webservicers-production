"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Receipt, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/formatters";
import type { AdminCustomer, AdminInvoice } from "@/lib/admin-types";

interface LineItemDraft {
  description: string;
  quantity: number;
  unitPriceUsd: number;
}

export default function AdminNewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [formalization, setFormalization] = useState<AdminInvoice["formalization"]>("STANDARD");
  const [taxRatePct, setTaxRatePct] = useState("0");
  const [taxId, setTaxId] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const [items, setItems] = useState<LineItemDraft[]>([
    { description: "Managed SEO Retainer — Growth", quantity: 1, unitPriceUsd: 999 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setCustomers(json.customers);
          if (json.customers[0]) setCustomerId(json.customers[0].id);
        }
      });
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPriceUsd: 199 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<LineItemDraft>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const subtotalCents = items.reduce(
    (s, it) => s + Math.round(it.unitPriceUsd * 100) * it.quantity,
    0
  );
  const taxCents = Math.round((subtotalCents * Number(taxRatePct || 0)) / 100);
  const totalCents = subtotalCents + taxCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "invoice",
          customerId,
          currency,
          formalization,
          taxRatePct: Number(taxRatePct || 0),
          taxId,
          markPaid,
          items,
        }),
      });
      const json = await res.json();
      if (json.ok) router.push("/admin/billing/invoices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        subtitle="Issue a custom or formalized invoice with itemized line items."
        actions={
          <Link href="/admin/billing/invoices" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Invoices
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 cpki-card p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="cpki-select"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="cpki-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Formalization</label>
              <select
                value={formalization}
                onChange={(e) => setFormalization(e.target.value as AdminInvoice["formalization"])}
                className="cpki-select"
              >
                <option value="STANDARD">Standard Invoice</option>
                <option value="VAT_EINVOICE">VAT E-Invoice</option>
                <option value="GST_TAX_INVOICE">GST Tax Invoice</option>
                <option value="PROFORMA">Proforma</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tax / VAT Rate (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
                className="cpki-input"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Line Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="cpki-btn cpki-btn-outline cpki-btn-xs"
              >
                <Plus className="h-3 w-3" />
                Add Line
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  required
                  type="text"
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Service description"
                  className="cpki-input col-span-6"
                />
                <input
                  required
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  className="cpki-input col-span-2"
                />
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.unitPriceUsd}
                  onChange={(e) => updateItem(idx, { unitPriceUsd: Number(e.target.value) })}
                  className="cpki-input col-span-3"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="cpki-btn cpki-btn-ghost cpki-btn-xs col-span-1 text-[var(--destructive)] disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cpki-card p-5 h-fit space-y-4">
          <h2 className="text-sm font-semibold">Invoice Summary</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Customer Tax ID (optional)</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="VAT / GST / EIN"
              className="cpki-input"
            />
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
            />
            <span>Mark as Paid immediately</span>
          </label>

          <div className="rounded-lg bg-[var(--muted)] p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotalCents, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Tax ({taxRatePct || 0}%)</span>
              <span className="tabular-nums">{formatMoney(taxCents, currency)}</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(totalCents, currency)}</span>
            </div>
          </div>

          <button type="submit" disabled={saving} className="cpki-btn cpki-btn-primary w-full">
            <Receipt className="h-4 w-4" />
            {saving ? "Issuing..." : "Issue Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
