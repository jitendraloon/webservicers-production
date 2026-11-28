"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Layers,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/formatters";
import type { AdminAddon, AdminCategory } from "@/lib/admin-types";

export default function AdminProductAddonsPage() {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [billingFilter, setBillingFilter] = useState<"ALL" | "recurring" | "one_time">("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalPriceUsd, setModalPriceUsd] = useState("149");
  const [modalBillingType, setModalBillingType] = useState<"recurring" | "one_time">("recurring");
  const [modalApplicableCats, setModalApplicableCats] = useState<string[]>(["All Categories"]);
  const [modalActive, setModalActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAddons = async () => {
    const res = await fetch("/api/admin/products");
    const json = await res.json();
    if (json.ok) {
      if (Array.isArray(json.addons)) setAddons(json.addons);
      if (Array.isArray(json.categories)) setCategories(json.categories);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const filtered = useMemo(() => {
    return addons.filter((a) => {
      if (billingFilter !== "ALL" && a.billingType !== billingFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${a.name} ${a.description}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [addons, billingFilter, search]);

  const toggleAddon = async (addon: AdminAddon) => {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "addon", id: addon.id, active: !addon.active }),
    });
    const json = await res.json();
    if (json.ok) {
      setAddons((prev) => prev.map((a) => (a.id === addon.id ? json.addon : a)));
      setToast(`Add-on "${addon.name}" is now ${json.addon.active ? "Active" : "Paused"}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (addon: AdminAddon) => {
    if (!confirm(`Delete add-on "${addon.name}"?`)) return;
    const res = await fetch(`/api/admin/products?kind=addon&id=${addon.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) {
      setAddons((prev) => prev.filter((a) => a.id !== addon.id));
      setToast(`Add-on "${addon.name}" deleted.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setModalName("");
    setModalDescription("");
    setModalPriceUsd("149");
    setModalBillingType("recurring");
    setModalApplicableCats(["All Categories"]);
    setModalActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addon: AdminAddon) => {
    setEditingId(addon.id);
    setModalName(addon.name);
    setModalDescription(addon.description || "");
    setModalPriceUsd(String(Math.round(addon.priceCents / 100)));
    setModalBillingType(addon.billingType);
    setModalApplicableCats(addon.applicableCategories || ["All Categories"]);
    setModalActive(addon.active);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "addon",
            id: editingId,
            name: modalName.trim(),
            description: modalDescription.trim(),
            priceUsd: Number(modalPriceUsd),
            billingType: modalBillingType,
            applicableCategories: modalApplicableCats,
            active: modalActive,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setAddons((prev) => prev.map((a) => (a.id === editingId ? json.addon : a)));
          setToast(`Add-on "${modalName}" updated.`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "addon",
            name: modalName.trim(),
            description: modalDescription.trim(),
            priceUsd: Number(modalPriceUsd),
            billingType: modalBillingType,
            applicableCategories: modalApplicableCats,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setAddons((prev) => [json.addon, ...prev]);
          setToast(`Add-on "${modalName}" created.`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Product Add-ons"
        subtitle="Catalog · Configure upsells, priority SLAs, and one-time onboarding accelerators."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/products" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              All Products
            </Link>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New Add-on
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Filter Card */}
        <div className="cpki-card p-4 space-y-3 lg:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2">
            BILLING MODEL
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setBillingFilter("ALL")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                billingFilter === "ALL"
                  ? "bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-sm"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              }`}
            >
              <span>All Add-ons</span>
              <span className="text-[11px] opacity-75">{addons.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingFilter("recurring")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                billingFilter === "recurring"
                  ? "bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-sm"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Monthly Recurring
              </span>
              <span className="text-[11px] opacity-75">
                {addons.filter((a) => a.billingType === "recurring").length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingFilter("one_time")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                billingFilter === "one_time"
                  ? "bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-sm"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                One-Time Delivery
              </span>
              <span className="text-[11px] opacity-75">
                {addons.filter((a) => a.billingType === "one_time").length}
              </span>
            </button>
          </div>
        </div>

        {/* Right Add-ons List */}
        <div className="space-y-4 lg:col-span-3">
          <div className="cpki-card p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search add-on upsells..."
                className="cpki-input !pl-9 text-xs"
              />
            </div>
            <div className="text-xs text-[var(--muted-foreground)] font-medium">
              Showing {filtered.length} of {addons.length} add-ons
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="cpki-card p-8 text-center text-xs text-[var(--muted-foreground)]">
                No add-ons match the current filter.
              </div>
            ) : (
              filtered.map((addon) => (
                <div
                  key={addon.id}
                  className="cpki-card p-4 hover:border-[var(--primary)]/40 transition-colors space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary-text)] border border-[var(--primary)]/20">
                        {addon.billingType === "recurring" ? "Recurring" : "One-Time"}
                      </span>
                      <span className="text-xs font-bold text-[var(--primary-text)] font-mono">
                        +{formatMoney(addon.priceCents)}
                        {addon.billingType === "recurring" ? "/mo" : ""}
                      </span>
                      <Badge tone={addon.active ? "success" : "warning"} variant="sm">
                        {addon.active ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className="cpki-btn cpki-btn-quiet cpki-btn-xs"
                      >
                        {addon.active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(addon)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addon)}
                        className="cpki-btn cpki-btn-quiet cpki-btn-xs text-red-500 hover:text-red-700"
                        title="Delete add-on"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {addon.name}
                  </div>

                  {addon.description && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {addon.description}
                    </p>
                  )}

                  {Array.isArray(addon.applicableCategories) && addon.applicableCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {addon.applicableCategories.map((cat, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded text-[10.5px] bg-[var(--muted)] text-[var(--muted-foreground)]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Add-on Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Add-on Upsell" : "New Add-on Upsell"}
        maxWidth="560px"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Add-on Name *</label>
            <input
              required
              type="text"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="e.g. Dedicated Technical Lead / Fast-Track SLA"
              className="cpki-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--foreground)]">
                  $
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  value={modalPriceUsd}
                  onChange={(e) => setModalPriceUsd(e.target.value)}
                  className="cpki-input text-xs !pl-6 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Billing Model</label>
              <select
                value={modalBillingType}
                onChange={(e) =>
                  setModalBillingType(e.target.value as "recurring" | "one_time")
                }
                className="cpki-select text-xs"
              >
                <option value="recurring">Monthly Recurring</option>
                <option value="one_time">One-Time Delivery</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <textarea
              rows={2}
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              placeholder="Explain deliverables and customer value included in this upsell..."
              className="cpki-textarea text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Applicable Categories</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {["All Categories", ...categories.map((c) => c.name)].map((cat) => {
                const checked = modalApplicableCats.includes(cat);
                return (
                  <label
                    key={cat}
                    className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${
                      checked
                        ? "bg-[var(--primary)]/10 text-[var(--primary-text)] border-[var(--primary)]/40 font-semibold"
                        : "bg-[var(--muted)]/40 text-[var(--muted-foreground)] border-[var(--border)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => {
                        if (cat === "All Categories") {
                          setModalApplicableCats(["All Categories"]);
                        } else {
                          setModalApplicableCats((prev) => {
                            const withoutAll = prev.filter((x) => x !== "All Categories");
                            return withoutAll.includes(cat)
                              ? withoutAll.filter((x) => x !== cat)
                              : [...withoutAll, cat];
                          });
                        }
                      }}
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Add-on"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
