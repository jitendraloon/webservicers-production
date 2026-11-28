"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileCheck,
  FileText,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminInvoice } from "@/lib/admin-types";

const INV_TONE: Record<AdminInvoice["status"], BadgeTone> = {
  PAID: "success",
  UNPAID: "warning",
  OVERDUE: "danger",
  CANCELLED: "neutral",
  REFUNDED: "lilac",
};

export default function AdminBillingInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [formalizeTarget, setFormalizeTarget] = useState<AdminInvoice | null>(null);
  const [formalizationType, setFormalizationType] =
    useState<AdminInvoice["formalization"]>("VAT_EINVOICE");
  const [taxId, setTaxId] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<AdminInvoice | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setInvoices(json.invoices);
      });
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${inv.invoiceNumber} ${inv.customerName} ${inv.customerEmail}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, statusFilter, search]);

  const markPaid = async (id: string) => {
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "invoice", id, status: "PAID" }),
    });
    const json = await res.json();
    if (json.ok) {
      setInvoices((prev) => prev.map((i) => (i.id === id ? json.invoice : i)));
    }
  };

  const handleFormalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formalizeTarget) return;
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "invoice",
        id: formalizeTarget.id,
        formalization: formalizationType,
        taxId,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setInvoices((prev) => prev.map((i) => (i.id === json.invoice.id ? json.invoice : i)));
      setFormalizeTarget(null);
    }
  };

  const handlePrintPdf = (inv: AdminInvoice) => {
    setPreviewInvoice(inv);
    setTimeout(() => {
      if (typeof window !== "undefined") window.print();
    }, 150);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        subtitle="Browse issued invoices, mark payments settled, formalize tax documents, and print PDFs."
        actions={
          <Link href="/admin/billing/invoices/new" className="cpki-btn cpki-btn-primary cpki-btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Create Invoice
          </Link>
        }
      />

      <div className="cpki-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PAID", "UNPAID", "OVERDUE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`cpki-btn cpki-btn-xs ${
                statusFilter === st ? "cpki-btn-primary" : "cpki-btn-outline"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or client..."
            className="cpki-input !pl-8"
          />
        </div>
      </div>

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Formalization</th>
                <th>Issued / Due</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs font-semibold">{inv.invoiceNumber}</td>
                  <td>
                    <div className="text-xs font-medium">{inv.customerName}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{inv.customerEmail}</div>
                  </td>
                  <td>
                    <Badge tone="lilac" variant="sm">
                      {inv.formalization.replace(/_/g, " ")}
                    </Badge>
                    {inv.taxId && (
                      <div className="font-mono text-[10px] text-[var(--muted-foreground)] mt-0.5">
                        Tax ID: {inv.taxId}
                      </div>
                    )}
                  </td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    <div>{formatDate(inv.issuedAt)}</div>
                    <div className="text-[11px]">Due {formatDate(inv.dueAt)}</div>
                  </td>
                  <td>
                    <Badge tone={INV_TONE[inv.status]} variant="sm">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="text-right text-xs font-semibold tabular-nums">
                    {formatMoney(inv.totalCents, inv.currency)}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handlePrintPdf(inv)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                        title="PDF / Print"
                      >
                        <Printer className="h-3 w-3" />
                        PDF / Print
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormalizeTarget(inv);
                          setFormalizationType(inv.formalization);
                          setTaxId(inv.taxId ?? "");
                        }}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <FileCheck className="h-3 w-3" />
                        Formalize
                      </button>
                      {inv.status !== "PAID" && (
                        <button
                          type="button"
                          onClick={() => markPaid(inv.id)}
                          className="cpki-btn cpki-btn-primary cpki-btn-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Paid
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

      {/* Formalize Modal */}
      <Modal
        isOpen={Boolean(formalizeTarget)}
        onClose={() => setFormalizeTarget(null)}
        title={formalizeTarget ? `Formalize ${formalizeTarget.invoiceNumber}` : "Formalize Invoice"}
      >
        {formalizeTarget && (
          <form onSubmit={handleFormalize} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tax Document Format</label>
              <select
                value={formalizationType}
                onChange={(e) => setFormalizationType(e.target.value as AdminInvoice["formalization"])}
                className="cpki-select"
              >
                <option value="STANDARD">Standard Commercial Invoice</option>
                <option value="VAT_EINVOICE">EU / UK VAT E-Invoice</option>
                <option value="GST_TAX_INVOICE">India GST Tax Invoice</option>
                <option value="PROFORMA">Proforma Invoice</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Customer Tax / VAT / GST ID</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. DE298471203"
                className="cpki-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormalizeTarget(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                Save Formalization
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Invoice Preview Modal */}
      <Modal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title={previewInvoice ? `Invoice ${previewInvoice.invoiceNumber}` : "Invoice Preview"}
        maxWidth="640px"
      >
        {previewInvoice && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-[var(--border)] pb-3">
              <div>
                <div className="text-sm font-semibold">WebServicers Commerce OS</div>
                <div className="text-[var(--muted-foreground)]">Billed To: {previewInvoice.customerName}</div>
                <div className="text-[var(--muted-foreground)]">{previewInvoice.customerEmail}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold">{previewInvoice.invoiceNumber}</div>
                <div className="text-[var(--muted-foreground)]">Issued: {formatDate(previewInvoice.issuedAt)}</div>
                <div className="text-[var(--muted-foreground)]">Status: {previewInvoice.status}</div>
              </div>
            </div>

            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewInvoice.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.description}</td>
                    <td className="text-right tabular-nums">{it.quantity}</td>
                    <td className="text-right tabular-nums">
                      {formatMoney(it.unitPriceCents * it.quantity, previewInvoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end border-t border-[var(--border)] pt-3">
              <div className="w-48 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(previewInvoice.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Tax</span>
                  <span className="tabular-nums">{formatMoney(previewInvoice.taxCents)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-[var(--border)]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(previewInvoice.totalCents)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="cpki-btn cpki-btn-primary cpki-btn-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
