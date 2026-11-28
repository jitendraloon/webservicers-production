"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Link2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminProduct, PaymentLinkItem } from "@/lib/admin-types";

export default function AdminPaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [title, setTitle] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [amountUsd, setAmountUsd] = useState("499");
  const [currency, setCurrency] = useState("USD");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setLinks(json.paymentLinks);
          setProducts(json.products);
        }
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/admin/commerce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "payment_link",
        title,
        customerEmail,
        productName: productName || undefined,
        amountUsd: Number(amountUsd),
        currency,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setLinks((prev) => [json.paymentLink, ...prev]);
      setTitle("");
      setCustomerEmail("");
    }
  };

  const copyUrl = (link: PaymentLinkItem) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link.url);
    }
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id: string) => {
    const res = await fetch(`/api/admin/commerce?kind=payment_link&id=${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Link Generator"
        subtitle="Create instant hosted checkout links for custom retainers and one-off quotes."
        actions={
          <Link href="/admin/payments/transactions" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Transactions
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="cpki-card p-5 h-fit space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-[var(--primary-text)]" />
            Generate Payment Link
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Link Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Custom SEO Audit Retainer"
              className="cpki-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Customer Email (optional)</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="client@company.com"
              className="cpki-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Linked Service (optional)</label>
            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="cpki-select"
            >
              <option value="">Custom Quote</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Amount</label>
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
              <label className="text-xs font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="cpki-select"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
          <button type="submit" className="cpki-btn cpki-btn-primary w-full">
            <Plus className="h-3.5 w-3.5" />
            Create Hosted Link
          </button>
        </form>

        <div className="lg:col-span-2 cpki-card overflow-hidden">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Title & URL</th>
                <th>Amount</th>
                <th>Clicks</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>
                    <div className="text-xs font-semibold">{link.title}</div>
                    <div className="font-mono text-[11px] text-[var(--primary-text)] truncate max-w-xs">
                      {link.url}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {link.customerEmail || "Open link"} · {formatDate(link.createdAt)}
                    </div>
                  </td>
                  <td className="text-xs font-semibold tabular-nums">
                    {formatMoney(link.amountCents, link.currency)}
                  </td>
                  <td className="text-xs tabular-nums">{link.clicks}</td>
                  <td>
                    <Badge tone={link.status === "PAID" ? "success" : "primary"} variant="sm">
                      {link.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyUrl(link)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3 w-3 text-[var(--success)]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedId === link.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(link.id)}
                        className="cpki-btn cpki-btn-ghost cpki-btn-xs text-[var(--destructive)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
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
