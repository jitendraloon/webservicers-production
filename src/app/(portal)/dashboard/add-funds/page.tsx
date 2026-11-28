"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDate, formatMoney } from "@/lib/formatters";
import {
  PAYMENT_GATEWAYS,
  usePortalStore,
  type MovementType,
  type PortalBalanceMovement,
} from "../_data/portal-store";
import { StatusBadge } from "../_components/StatusBadge";

const AMOUNT_PRESETS = [25, 50, 100, 250, 500];

export default function PortalAddFundsPage() {
  const { state, walletBalanceCents, addFunds } = usePortalStore();
  const [typeFilter, setTypeFilter] = useState<"ALL" | MovementType>("ALL");
  const [query, setQuery] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [amountUsd, setAmountUsd] = useState<string>("100");
  const [selectedGateway, setSelectedGateway] = useState<string>(PAYMENT_GATEWAYS[0].name);
  const [bankRef, setBankRef] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalCreditedCents = useMemo(
    () =>
      state.movements
        .filter((m) => m.type === "CREDIT")
        .reduce((acc, m) => acc + m.amountCents, 0),
    [state.movements]
  );

  const totalDebitedCents = useMemo(
    () =>
      state.movements
        .filter((m) => m.type === "DEBIT")
        .reduce((acc, m) => acc + m.amountCents, 0),
    [state.movements]
  );

  const filteredMovements = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.movements.filter((m) => {
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
      if (!q) return true;
      return (
        m.reference.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.gateway ?? "").toLowerCase().includes(q)
      );
    });
  }, [state.movements, typeFilter, query]);

  const columns: Column<PortalBalanceMovement>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (row) => (
        <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
          {formatDate(row.createdAt, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <StatusBadge status={row.type} size="sm" />,
    },
    {
      key: "reference",
      header: "Reference",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-[var(--foreground)]">
          {row.reference}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-xs text-[var(--foreground)]">{row.description}</span>
      ),
    },
    {
      key: "amountCents",
      header: "Amount",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <span
          className={`font-mono text-xs font-semibold ${
            row.type === "CREDIT"
              ? "text-[var(--success)]"
              : "text-[var(--foreground)]"
          }`}
        >
          {row.type === "CREDIT" ? "+" : "-"}
          {formatMoney(row.amountCents, row.currency)}
        </span>
      ),
    },
  ];

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = Number.parseFloat(amountUsd);
    if (!Number.isFinite(parsed) || parsed < 5) {
      setFormError("Minimum deposit amount is $5.00.");
      return;
    }
    const cents = Math.round(parsed * 100);
    const mov = addFunds(
      cents,
      selectedGateway,
      selectedGateway === "Bank Manual" && bankRef.trim() ? bankRef.trim() : undefined
    );
    setSuccessMsg(
      `Added ${formatMoney(mov.amountCents, "USD")} to your wallet via ${selectedGateway} (${mov.reference}).`
    );
    setBankRef("");
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Funds"
        subtitle="Deposit funds to your WebServicers cash vault balance for instant service renewals and order checkouts."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <Receipt className="h-3.5 w-3.5" />
                View Invoices
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError(null);
                setSuccessMsg(null);
                setAddModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Deposit Funds
            </Button>
          </div>
        }
      />

      {successMsg ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--success)]/40 bg-[var(--success-subtle)] p-3 text-xs text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between border-[var(--primary)]/30 bg-[var(--accent)]/40">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Available Wallet Balance</span>
            <div className="mt-1 text-2xl font-bold font-mono text-[var(--foreground)]">
              {formatMoney(walletBalanceCents, "USD")}
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">Ready for instant checkout</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Total Deposited</span>
            <div className="mt-1 text-xl font-semibold font-mono text-[var(--foreground)]">
              {formatMoney(totalCreditedCents, "USD")}
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">Lifetime credits</span>
          </div>
          <ArrowDownLeft className="h-5 w-5 text-[var(--success)]" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--muted-foreground)]">Total Spent</span>
            <div className="mt-1 text-xl font-semibold font-mono text-[var(--foreground)]">
              {formatMoney(totalDebitedCents, "USD")}
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">Orders & invoices settled</span>
          </div>
          <ArrowUpRight className="h-5 w-5 text-[var(--muted-foreground)]" />
        </Card>
      </div>

      {/* Movements Table */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Wallet Ledger History</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Detailed transaction records of all deposits, deductions, and refunds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "ALL" | MovementType)}
            >
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="CREDIT">Credits</TabsTrigger>
                <TabsTrigger value="DEBIT">Debits</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-48">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ledger..."
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMovements}
          rowKey={(row) => row.id}
          emptyMessage="No ledger movements found."
        />
      </Card>

      {/* Add Funds Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Deposit Funds into Wallet"
        maxWidth="540px"
      >
        <form onSubmit={handleAddFundsSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] block mb-1.5">
              Quick Amount Presets (USD)
            </label>
            <div className="flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUsd(String(preset))}
                  className={`rounded-[var(--radius-control)] border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                    Number(amountUsd) === preset
                      ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--primary-text)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Deposit Amount (USD)"
            type="number"
            min={5}
            step="0.01"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            hint="Minimum deposit: $5.00"
          />

          <div>
            <div className="text-xs font-medium text-[var(--foreground)] mb-2">
              Payment Gateway
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PAYMENT_GATEWAYS.map((gw) => {
                const isSelected = selectedGateway === gw.name;
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelectedGateway(gw.name)}
                    className={`flex flex-col items-start rounded-[var(--radius-control)] border p-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        {gw.name}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {gw.feeNote}
                      </span>
                    </div>
                    <span className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                      {gw.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGateway === "Bank Manual" ? (
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--muted)]/50 p-3 space-y-2">
              <div className="text-xs font-semibold text-[var(--foreground)]">
                Wire / ACH Instructions
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Beneficiary: WebServicers Inc. · Routing: 121000358 · Account: 8841029941 · SWIFT: BOFAUS3N
              </p>
              <Input
                label="Transfer Reference / UTR (optional)"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="e.g. WIRE-992104"
              />
            </div>
          ) : null}

          {formError ? (
            <div className="rounded-[var(--radius-control)] bg-[var(--danger-subtle)] px-3 py-2 text-xs text-[var(--destructive)]">
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              Instant ledger credit
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Proceed to Deposit
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
