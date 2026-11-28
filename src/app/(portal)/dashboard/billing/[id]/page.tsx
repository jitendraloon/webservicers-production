"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/formatters";
import { INVOICE_GATEWAYS, usePortalStore } from "../../_data/portal-store";
import { StatusBadge } from "../../_components/StatusBadge";

export default function PortalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { state, walletBalanceCents, payInvoice } = usePortalStore();

  const invoice = state.invoices.find(
    (inv) => inv.id === params?.id || inv.invoiceNumber === params?.id
  );

  const [payModalOpen, setPayModalOpen] = useState(
    () => searchParams?.get("pay") === "1"
  );
  const [selectedGateway, setSelectedGateway] = useState<string>(INVOICE_GATEWAYS[0].name);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoice Not Found"
          subtitle="We could not locate this invoice in your account."
          actions={
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Invoices
              </Button>
            </Link>
          }
        />
        <Card className="p-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Please return to the invoices list and select a valid invoice.
          </p>
        </Card>
      </div>
    );
  }

  const handleDownloadInvoice = () => {
    const lines = [
      `WEBSERVICERS INVOICE`,
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Status: ${invoice.status}`,
      `Issue Date: ${formatDate(invoice.createdAt)}`,
      `Due Date: ${formatDate(invoice.dueAt)}`,
      `Bill To: ${state.profile.name} (${state.profile.company})`,
      `Email: ${state.profile.email}`,
      `----------------------------------------`,
      ...invoice.items.map(
        (item) =>
          `${item.description} x${item.quantity} — ${formatMoney(item.amountCents, invoice.currency)}`
      ),
      `----------------------------------------`,
      `Subtotal: ${formatMoney(invoice.subtotalCents, invoice.currency)}`,
      `Discount: -${formatMoney(invoice.discountCents, invoice.currency)}`,
      `Tax: ${formatMoney(invoice.taxCents, invoice.currency)}`,
      `Total: ${formatMoney(invoice.totalCents, invoice.currency)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmPayment = () => {
    setPayError(null);
    const res = payInvoice(invoice.id, selectedGateway);
    if (!res.ok) {
      setPayError(res.error ?? "Payment failed.");
      return;
    }
    setPaySuccess(`Payment completed via ${selectedGateway}.`);
    setPayModalOpen(false);
  };

  const canPay = invoice.status === "UNPAID" || invoice.status === "OVERDUE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued ${formatDate(invoice.createdAt)} · Due ${formatDate(invoice.dueAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/billing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                All Invoices
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            {canPay ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setPayError(null);
                  setPayModalOpen(true);
                }}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay Now
              </Button>
            ) : null}
          </div>
        }
      />

      {paySuccess ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--insight-border)] bg-[var(--insight-surface)] px-4 py-3 text-xs font-medium text-[var(--insight-foreground)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {paySuccess}
        </div>
      ) : null}

      {/* Printable Invoice Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-base font-bold tracking-tight text-[var(--foreground)]">
              WebServicers Inc.
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              548 Market St, Suite 41200 · San Francisco, CA 94104
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              billing@webservicers.io
            </p>
          </div>
          <div className="sm:text-right">
            <div className="flex items-center sm:justify-end gap-2">
              <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-[var(--muted-foreground)]">
              <div>Issued: {formatDate(invoice.createdAt)}</div>
              <div>Due: {formatDate(invoice.dueAt)}</div>
              {invoice.paidAt ? (
                <div className="text-[var(--success)] font-medium">
                  Paid: {formatDate(invoice.paidAt)} via {invoice.gatewayUsed ?? "Gateway"}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Bill To
            </div>
            <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
              {state.profile.name}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {state.profile.company}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {state.profile.email}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Related Order
            </div>
            <div className="mt-1.5">
              {invoice.orderId ? (
                <Link
                  href={`/dashboard/orders/${invoice.orderId}`}
                  className="font-mono text-xs font-semibold text-[var(--primary-text)] hover:underline"
                >
                  {invoice.orderReference}
                </Link>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto border border-[var(--border)] rounded-[var(--radius-control)]">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="text-xs font-medium text-[var(--foreground)]">
                    {item.description}
                  </td>
                  <td className="text-right font-mono text-xs">{item.quantity}</td>
                  <td className="text-right font-mono text-xs font-medium">
                    {formatMoney(item.amountCents, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span>Subtotal</span>
              <span className="font-mono">
                {formatMoney(invoice.subtotalCents, invoice.currency)}
              </span>
            </div>
            {invoice.discountCents > 0 ? (
              <div className="flex items-center justify-between text-[var(--success)]">
                <span>Discount</span>
                <span className="font-mono">
                  -{formatMoney(invoice.discountCents, invoice.currency)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-[var(--muted-foreground)]">
              <span>Tax</span>
              <span className="font-mono">
                {formatMoney(invoice.taxCents, invoice.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm font-semibold text-[var(--foreground)]">
              <span>Total</span>
              <span className="font-mono">
                {formatMoney(invoice.totalCents, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Pay Now 8-Gateway Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Pay ${invoice.invoiceNumber}`}
        maxWidth="560px"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--muted)] px-3.5 py-2.5 border border-[var(--border)]">
            <span className="text-xs text-[var(--muted-foreground)]">Amount Due</span>
            <span className="font-mono text-base font-semibold text-[var(--foreground)]">
              {formatMoney(invoice.totalCents, invoice.currency)}
            </span>
          </div>

          <div>
            <div className="text-xs font-medium text-[var(--foreground)] mb-2">
              Select Payment Gateway (8 supported)
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INVOICE_GATEWAYS.map((gw) => {
                const isSelected = selectedGateway === gw.name;
                const isWallet = gw.id === "wallet";
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelectedGateway(gw.name)}
                    className={`flex flex-col items-start rounded-[var(--radius-control)] border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        {gw.name}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                        {gw.feeNote}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      {isWallet
                        ? `Available: ${formatMoney(walletBalanceCents, "USD")}`
                        : gw.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {payError ? (
            <div className="rounded-[var(--radius-control)] bg-[var(--danger-subtle)] px-3 py-2 text-xs text-[var(--destructive)]">
              {payError}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              256-bit encrypted checkout
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmPayment}>
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
