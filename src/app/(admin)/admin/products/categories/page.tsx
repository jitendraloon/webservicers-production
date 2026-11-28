"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FolderTree,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { AdminCategory } from "@/lib/admin-types";

export default function AdminProductCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingCat, setEditingCat] = useState<AdminCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editOrder, setEditOrder] = useState("1");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCategories(json.categories);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(q));
  }, [categories, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "category", name, description }),
    });
    const json = await res.json();
    if (json.ok) {
      setCategories((prev) => [...prev, json.category]);
      setName("");
      setDescription("");
      setToast(`Category "${json.category.name}" created!`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleVisible = async (cat: AdminCategory) => {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "category", id: cat.id, visible: !cat.visible }),
    });
    const json = await res.json();
    if (json.ok) {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? json.category : c)));
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!confirm(`Delete category "${cat.name}"? Products in this category will become uncategorized.`)) return;
    const res = await fetch(`/api/admin/products?kind=category&id=${cat.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setToast(`Category "${cat.name}" deleted.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditDesc(cat.description);
    setEditOrder(String(cat.sortOrder));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "category",
          id: editingCat.id,
          name: editName.trim(),
          description: editDesc.trim(),
          sortOrder: Number(editOrder || 1),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setCategories((prev) => prev.map((c) => (c.id === json.category.id ? json.category : c)));
        setToast(`Category "${json.category.name}" updated!`);
        setEditingCat(null);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Product Categories"
        subtitle="Catalog · Organize catalog taxonomy, store navigation structure, and product filtering."
        actions={
          <Link href="/admin/products" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Products
          </Link>
        }
      />

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Create Category Form */}
        <form onSubmit={handleAdd} className="cpki-card p-5 h-fit space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FolderTree className="h-4 w-4 text-[var(--primary-text)]" />
            Add Category
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Category Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Conversion & CRO"
              className="cpki-input text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary for storefront and filters..."
              className="cpki-textarea text-xs"
            />
          </div>
          <button type="submit" className="cpki-btn cpki-btn-primary w-full cpki-btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Create Category
          </button>
        </form>

        {/* Categories List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="cpki-card p-3 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="cpki-input !pl-9 text-xs"
              />
            </div>
            <div className="text-xs text-[var(--muted-foreground)] font-medium">
              {filtered.length} categories
            </div>
          </div>

          <div className="cpki-card overflow-hidden">
            <table className="cpki-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Visibility</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td className="font-mono text-xs">{cat.sortOrder}</td>
                    <td>
                      <div className="text-xs font-semibold">{cat.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">{cat.description}</div>
                    </td>
                    <td className="text-xs tabular-nums font-semibold">{cat.productCount}</td>
                    <td>
                      <Badge tone={cat.visible ? "success" : "neutral"} variant="sm">
                        {cat.visible ? "Visible" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="cpki-btn cpki-btn-outline cpki-btn-xs"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVisible(cat)}
                          className="cpki-btn cpki-btn-quiet cpki-btn-xs"
                        >
                          {cat.visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="cpki-btn cpki-btn-quiet cpki-btn-xs text-red-500 hover:text-red-700"
                          title="Delete category"
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

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(editingCat)}
        onClose={() => setEditingCat(null)}
        title="Edit Category"
      >
        {editingCat && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Category Name</label>
              <input
                required
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="cpki-input text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Sort Order</label>
              <input
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
                className="cpki-input text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="cpki-textarea text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cpki-btn cpki-btn-primary cpki-btn-sm"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
