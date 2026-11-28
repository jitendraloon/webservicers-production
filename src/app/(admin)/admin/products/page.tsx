"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CheckSquare,
  Edit3,
  ExternalLink,
  FolderTree,
  Layers,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/formatters";
import type { AdminCategory, AdminProduct, AdminRequirementField } from "@/lib/admin-types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [requirements, setRequirements] = useState<AdminRequirementField[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setProducts(json.products);
          setCategories(json.categories);
          setRequirements(json.requirements || []);
        }
      });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "ALL" && p.categoryId !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${p.name} ${p.slug} ${p.categoryName} ${p.tagline}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryFilter, search]);

  const toggleStatus = async (prod: AdminProduct) => {
    const nextStatus = prod.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "product", id: prod.id, status: nextStatus }),
    });
    const json = await res.json();
    if (json.ok) {
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? json.product : p)));
      setToast(`Product "${prod.name}" status updated to ${nextStatus}.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products Catalog"
        subtitle="Manage all core services, pricing tiers, categories, and customer order requirements."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/products/categories" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <FolderTree className="h-3.5 w-3.5" />
              Categories
            </Link>
            <Link href="/admin/products/requirements" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <CheckSquare className="h-3.5 w-3.5" />
              Requirements
            </Link>
            <Link href="/admin/products/addons" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Add-ons
            </Link>
            <Link href="/admin/products/new" className="cpki-btn cpki-btn-primary cpki-btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Create Product
            </Link>
          </div>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      <div className="cpki-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`cpki-btn cpki-btn-xs ${
              categoryFilter === "ALL" ? "cpki-btn-primary" : "cpki-btn-outline"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`cpki-btn cpki-btn-xs ${
                categoryFilter === cat.id ? "cpki-btn-primary" : "cpki-btn-outline"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="cpki-input !pl-8 text-xs"
          />
        </div>
      </div>

      <div className="cpki-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cpki-table">
            <thead>
              <tr>
                <th>Service / Product</th>
                <th>Category</th>
                <th>Tiers & Pricing</th>
                <th>Starting Price</th>
                <th>Requirements</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[var(--muted-foreground)]">
                    No products match your criteria. Click &quot;Create Product&quot; to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const tiersList = Array.isArray(prod.tiers) && prod.tiers.length > 0
                    ? prod.tiers
                    : [];
                  const minPrice = tiersList.length > 0
                    ? Math.min(...tiersList.map((t) => t.priceCents))
                    : prod.basePriceCents;
                  const reqCount = (prod.requirementIds || []).length + (prod.customRequirements || []).length;

                  return (
                    <tr key={prod.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td>
                        <Link
                          href={`/admin/products/${prod.id}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--primary-text)] font-semibold border border-[var(--border)] overflow-hidden">
                            {prod.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={prod.iconUrl} alt={prod.name} className="h-full w-full object-cover" />
                            ) : (
                              <Layers className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold group-hover:text-[var(--primary)] transition-colors flex items-center gap-1.5">
                              {prod.name}
                              <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="font-mono text-[11px] text-[var(--muted-foreground)]">
                              /{prod.slug}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <Badge tone="lilac" variant="sm">
                          {prod.categoryName || "General"}
                        </Badge>
                      </td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {tiersList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tiersList.map((t) => (
                              <span
                                key={t.id || t.name}
                                className={`px-1.5 py-0.5 rounded text-[10.5px] ${
                                  t.highlightAsRecommended
                                    ? "bg-[var(--primary)]/15 text-[var(--primary)] font-semibold border border-[var(--primary)]/30"
                                    : "bg-[var(--muted)] text-[var(--foreground)]"
                                }`}
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "Standard"
                        )}
                      </td>
                      <td className="text-xs font-semibold tabular-nums">
                        {formatMoney(minPrice)}/mo
                      </td>
                      <td>
                        <Badge tone="neutral" variant="sm">
                          {reqCount} questions
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={prod.status === "ACTIVE" ? "success" : "warning"} variant="sm">
                          {prod.status}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/products/${prod.id}`}
                            className="cpki-btn cpki-btn-primary cpki-btn-xs"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit / Manage
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleStatus(prod)}
                            className="cpki-btn cpki-btn-quiet cpki-btn-xs"
                          >
                            {prod.status === "ACTIVE" ? "Set Draft" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
