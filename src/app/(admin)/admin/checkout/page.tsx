"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileArchive,
  Settings2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatters";
import type { CheckoutModulePackage, PaymentGatewayConfig } from "@/lib/admin-types";

export default function AdminCheckoutPage() {
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [modules, setModules] = useState<CheckoutModulePackage[]>([]);
  const [editingGw, setEditingGw] = useState<PaymentGatewayConfig | null>(null);
  const [gwMode, setGwMode] = useState<"LIVE" | "SANDBOX">("LIVE");
  const [gwFee, setGwFee] = useState("2.9");
  const [gwKey, setGwKey] = useState("");
  const [gwWebhook, setGwWebhook] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setGateways(json.gateways);
          setModules(json.checkoutModules);
        }
      });
  }, []);

  const toggleGateway = async (gw: PaymentGatewayConfig) => {
    const res = await fetch("/api/admin/commerce", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "gateway", id: gw.id, enabled: !gw.enabled }),
    });
    const json = await res.json();
    if (json.ok) {
      setGateways((prev) => prev.map((g) => (g.id === gw.id ? json.gateway : g)));
    }
  };

  const openConfigModal = (gw: PaymentGatewayConfig) => {
    setEditingGw(gw);
    setGwMode(gw.mode);
    setGwFee(String(gw.feePercent));
    setGwKey(gw.publicKeyMasked);
    setGwWebhook(gw.webhookUrl);
  };

  const saveConfigModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;
    const res = await fetch("/api/admin/commerce", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "gateway",
        id: editingGw.id,
        mode: gwMode,
        feePercent: Number(gwFee),
        publicKeyMasked: gwKey,
        webhookUrl: gwWebhook,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setGateways((prev) => prev.map((g) => (g.id === json.gateway.id ? json.gateway : g)));
      setEditingGw(null);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/commerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "checkout_module",
          fileName: file.name,
          moduleName: file.name.replace(/\.zip$/i, "").replace(/[-_]/g, " "),
          version: "1.0.0",
          sizeKb: Math.max(12, Math.round(file.size / 1024)),
        }),
      });
      const json = await res.json();
      if (json.ok) setModules((prev) => [json.module, ...prev]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout Experience"
        subtitle="Configure all 8 payment gateways, webhook endpoints, and custom ZIP checkout modules."
      />

      {/* 8 Gateways Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Payment Gateways ({gateways.filter((g) => g.enabled).length}/{gateways.length} Enabled)
          </h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            PCI-DSS tokenized checkout orchestration
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {gateways.map((gw) => (
            <div key={gw.id} className="cpki-card p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary-text)]">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{gw.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">{gw.region}</div>
                    </div>
                  </div>
                  <Badge tone={gw.enabled ? "success" : "neutral"} variant="sm">
                    {gw.enabled ? "Enabled" : "Off"}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-[var(--muted-foreground)]">
                  <div className="flex justify-between">
                    <span>Environment</span>
                    <span className="font-medium text-[var(--foreground)]">{gw.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processor Fee</span>
                    <span className="font-medium tabular-nums text-[var(--foreground)]">
                      {gw.feePercent}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currencies</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {gw.supportedCurrencies.slice(0, 3).join(", ")}
                      {gw.supportedCurrencies.length > 3 ? ` +${gw.supportedCurrencies.length - 3}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  onClick={() => toggleGateway(gw)}
                  className={`cpki-btn cpki-btn-xs ${
                    gw.enabled ? "cpki-btn-outline" : "cpki-btn-primary"
                  }`}
                >
                  {gw.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => openConfigModal(gw)}
                  className="cpki-btn cpki-btn-quiet cpki-btn-xs"
                >
                  <Settings2 className="h-3 w-3" />
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZIP Module Uploader */}
      <div className="cpki-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Checkout Extension Modules (.zip)
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Upload signed ZIP packages for regional payment adapters, tax hooks, or checkout UI blocks.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload ZIP Module"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Package File</th>
                <th>Version</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id}>
                  <td>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <FileArchive className="h-4 w-4 text-[var(--primary-text)]" />
                      {mod.moduleName}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{mod.fileName}</td>
                  <td className="font-mono text-xs">v{mod.version}</td>
                  <td className="text-xs tabular-nums">{mod.sizeKb} KB</td>
                  <td className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(mod.uploadedAt)}
                  </td>
                  <td>
                    <Badge tone="success" variant="sm">
                      <CheckCircle2 className="h-3 w-3" />
                      {mod.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gateway Config Modal */}
      <Modal
        isOpen={Boolean(editingGw)}
        onClose={() => setEditingGw(null)}
        title={editingGw ? `Configure ${editingGw.name}` : "Gateway Config"}
      >
        {editingGw && (
          <form onSubmit={saveConfigModal} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Mode</label>
                <select
                  value={gwMode}
                  onChange={(e) => setGwMode(e.target.value as "LIVE" | "SANDBOX")}
                  className="cpki-select"
                >
                  <option value="LIVE">LIVE (Production)</option>
                  <option value="SANDBOX">SANDBOX (Test)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Fee Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gwFee}
                  onChange={(e) => setGwFee(e.target.value)}
                  className="cpki-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Publishable / Client Key</label>
              <input
                type="text"
                value={gwKey}
                onChange={(e) => setGwKey(e.target.value)}
                className="cpki-input font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Webhook Endpoint</label>
              <input
                type="url"
                value={gwWebhook}
                onChange={(e) => setGwWebhook(e.target.value)}
                className="cpki-input font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              <span>Secrets are encrypted at rest via AES-256-GCM.</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingGw(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="cpki-btn cpki-btn-primary cpki-btn-sm">
                Save Configuration
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
