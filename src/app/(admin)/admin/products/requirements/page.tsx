"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlignLeft,
  Check,
  CheckCircle2,
  CheckSquare,
  Edit3,
  List,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { AdminRequirementField } from "@/lib/admin-types";

export default function AdminProductRequirementsPage() {
  const [fields, setFields] = useState<AdminRequirementField[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState("");
  const [modalCategory, setModalCategory] = useState("Web Development");
  const [modalType, setModalType] = useState<AdminRequirementField["fieldType"]>("text");
  const [modalPlaceholder, setModalPlaceholder] = useState("");
  const [modalRequired, setModalRequired] = useState(true);
  const [modalOptions, setModalOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [modalMultiSelect, setModalMultiSelect] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRequirements = async () => {
    const res = await fetch("/api/admin/products");
    const json = await res.json();
    if (json.ok && Array.isArray(json.requirements)) {
      setFields(json.requirements);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Compute categories and question counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Categories": fields.length };
    fields.forEach((f) => {
      const cat = f.category || "General & Business";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [fields]);

  const categoryList = useMemo(() => {
    const defaultOrder = [
      "All Categories",
      "Web Development",
      "SEO & Growth",
      "Branding & Graphic Design",
      "Social Media Marketing",
      "General & Business",
    ];
    const presentCats = Object.keys(categoryCounts).filter((c) => c !== "All Categories");
    const ordered = defaultOrder.filter((c) => c === "All Categories" || categoryCounts[c] !== undefined);
    presentCats.forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });
    return ordered;
  }, [categoryCounts]);

  // Filtered requirements
  const filtered = useMemo(() => {
    return fields.filter((f) => {
      if (selectedCategory !== "All Categories") {
        const cat = f.category || "General & Business";
        if (cat !== selectedCategory) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesLabel = f.label.toLowerCase().includes(q);
        const matchesCat = (f.category || "").toLowerCase().includes(q);
        const matchesOpts = (f.options || []).some((o) => o.toLowerCase().includes(q));
        if (!matchesLabel && !matchesCat && !matchesOpts) return false;
      }
      return true;
    });
  }, [fields, selectedCategory, search]);

  // Reset to default 16 requirements
  const handleResetDefaults = async () => {
    if (!confirm("Reset requirements bank to the default standard 16 questions?")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "reset_requirements" }),
      });
      const json = await res.json();
      if (json.ok) {
        setFields(json.requirements);
        setSelectedCategory("All Categories");
        setToast("Reset requirements bank to default questions.");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Failed to reset requirements.");
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setModalLabel("");
    setModalCategory(selectedCategory === "All Categories" ? "Web Development" : selectedCategory);
    setModalType("text");
    setModalPlaceholder("");
    setModalRequired(true);
    setModalOptions(["Option 1", "Option 2"]);
    setModalMultiSelect(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (f: AdminRequirementField) => {
    setEditingId(f.id);
    setModalLabel(f.label);
    setModalCategory(f.category || "General & Business");
    setModalType(f.fieldType);
    setModalPlaceholder(f.placeholder || "");
    setModalRequired(f.required);
    setModalOptions(Array.isArray(f.options) && f.options.length > 0 ? f.options : ["Option 1", "Option 2"]);
    setModalMultiSelect(Boolean(f.isMultiSelect));
    setIsModalOpen(true);
  };

  // Delete requirement
  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete requirement question "${label}"?`)) return;
    const res = await fetch(`/api/admin/products?kind=requirement&id=${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) {
      setFields((prev) => prev.filter((f) => f.id !== id));
      setToast(`Requirement "${label}" removed.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Save (Create or Edit)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLabel.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        // Edit existing
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "requirement",
            id: editingId,
            label: modalLabel.trim(),
            category: modalCategory,
            fieldType: modalType,
            placeholder: modalPlaceholder.trim(),
            required: modalRequired,
            options: modalType === "choice" ? modalOptions.map((s) => s.trim()).filter(Boolean) : undefined,
            isMultiSelect: modalType === "choice" ? modalMultiSelect : undefined,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setFields((prev) => prev.map((f) => (f.id === editingId ? json.requirement : f)));
          setToast(`Updated requirement "${modalLabel}".`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        }
      } else {
        // Create new
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "requirement",
            label: modalLabel.trim(),
            category: modalCategory,
            fieldType: modalType,
            placeholder: modalPlaceholder.trim(),
            required: modalRequired,
            options: modalType === "choice" ? modalOptions.map((s) => s.trim()).filter(Boolean) : undefined,
            isMultiSelect: modalType === "choice" ? modalMultiSelect : undefined,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setFields((prev) => [json.requirement, ...prev]);
          setToast(`Created new requirement "${modalLabel}".`);
          setIsModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // Options helpers
  const handleOptionChange = (idx: number, val: string) => {
    setModalOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addOption = () => {
    setModalOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const removeOption = (idx: number) => {
    if (modalOptions.length <= 1) return;
    setModalOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header (Image 7) */}
      <PageHeader
        title="Product requirements"
        subtitle="Catalog · Define standardized project requirement questions by category to directly import into products."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
              title="Reset all questions to default predefined set"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset defaults
            </button>
            <Link href="/admin/products/new" className="cpki-btn cpki-btn-outline cpki-btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Add product
            </Link>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New question
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

      {/* Main Grid: Left Category Sidebar + Right Questions List (Image 7) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Categories Card */}
        <div className="cpki-card p-4 space-y-3 lg:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2">
            CATEGORIES
          </div>
          <div className="space-y-1">
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-sm"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                  }`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[var(--background)]/20 text-[var(--background)]"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Questions Column */}
        <div className="space-y-4 lg:col-span-3">
          {/* Search bar & count header */}
          <div className="cpki-card p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search predefined requirements..."
                className="cpki-input !pl-9 text-xs"
              />
            </div>
            <div className="text-xs text-[var(--muted-foreground)] font-medium">
              Showing {filtered.length} of {fields.length} questions
            </div>
          </div>

          {/* Question cards list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="cpki-card p-8 text-center text-xs text-[var(--muted-foreground)]">
                No requirement questions found for this category or search filter.
              </div>
            ) : (
              filtered.map((f) => (
                <div
                  key={f.id}
                  className="cpki-card p-4 hover:border-[var(--primary)]/40 transition-colors space-y-2.5"
                >
                  {/* Top Badges & Actions */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary-text)] border border-[var(--primary)]/20">
                        {f.category || "General & Business"}
                      </span>
                      {f.required ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          * Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
                          Optional
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--muted-foreground)]">
                        {f.fieldType === "choice" ? (
                          <>
                            <List className="h-3 w-3" />
                            Multiple choice ({f.options?.length || 0} options
                            {f.isMultiSelect ? " · multi-select" : ""})
                          </>
                        ) : f.fieldType === "attachment" ? (
                          <>
                            <Paperclip className="h-3 w-3" />
                            Attachment
                          </>
                        ) : (
                          <>
                            <AlignLeft className="h-3 w-3" />
                            Free text
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(f)}
                        className="cpki-btn cpki-btn-outline cpki-btn-xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id, f.label)}
                        className="cpki-btn cpki-btn-quiet cpki-btn-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Title */}
                  <div className="text-sm font-semibold text-[var(--foreground)] pt-0.5">
                    {f.label}
                  </div>

                  {/* Choice Options list (Image 7) */}
                  {f.fieldType === "choice" && Array.isArray(f.options) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {f.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="px-2.5 py-1 rounded-full text-[11px] border border-[var(--border)] bg-[var(--muted)]/40 text-[var(--foreground)] flex items-center gap-1.5"
                        >
                          <span className="text-[var(--muted-foreground)] text-xs">
                            {f.isMultiSelect ? "☑" : "○"}
                          </span>
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachment hint */}
                  {f.fieldType === "attachment" && f.placeholder && (
                    <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 pt-0.5">
                      <Upload className="h-3 w-3 opacity-60" />
                      {f.placeholder}
                    </div>
                  )}

                  {/* Free text placeholder */}
                  {f.fieldType === "text" && f.placeholder && (
                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono truncate pt-0.5">
                      Placeholder: &ldquo;{f.placeholder}&rdquo;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Field Question Modal (Image 3) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Requirement Question" : "New Requirement Question"}
        maxWidth="640px"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Question Configuration
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={modalRequired}
                onChange={(e) => setModalRequired(e.target.checked)}
                className="rounded"
              />
              Required Question
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Category</label>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="cpki-select text-xs"
              >
                <option value="Web Development">Web Development</option>
                <option value="SEO & Growth">SEO & Growth</option>
                <option value="Branding & Graphic Design">Branding & Graphic Design</option>
                <option value="Social Media Marketing">Social Media Marketing</option>
                <option value="General & Business">General & Business</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Get it in a form of:</label>
              <select
                value={modalType}
                onChange={(e) =>
                  setModalType(e.target.value as AdminRequirementField["fieldType"])
                }
                className="cpki-select text-xs font-semibold"
              >
                <option value="text">Free text</option>
                <option value="attachment">Attachment</option>
                <option value="choice">Multiple choice</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Question Prompt / Title *</label>
            <textarea
              required
              rows={2}
              value={modalLabel}
              onChange={(e) => setModalLabel(e.target.value)}
              placeholder="e.g. What is your primary project goal or current website URL?"
              maxLength={400}
              className="cpki-textarea text-xs"
            />
            <div className="text-right text-[10px] text-[var(--muted-foreground)]">
              {modalLabel.length}/400 characters
            </div>
          </div>

          {/* DYNAMIC FIELD RENDERING BASED ON DROPDOWN (Requirement 4) */}
          {modalType === "text" && (
            <div className="space-y-1.5 p-3 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
              <label className="text-xs font-medium">Input Placeholder (Optional)</label>
              <input
                type="text"
                value={modalPlaceholder}
                onChange={(e) => setModalPlaceholder(e.target.value)}
                placeholder="e.g. https://mycompany.com or brand guidelines..."
                className="cpki-input text-xs"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Shows a single line or multiline text box for client responses.
              </p>
            </div>
          )}

          {modalType === "attachment" && (
            <div className="space-y-1.5 p-3 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
              <label className="text-xs font-medium">Upload Guidance &amp; Allowed Formats</label>
              <input
                type="text"
                value={modalPlaceholder}
                onChange={(e) => setModalPlaceholder(e.target.value)}
                placeholder="e.g. Upload PNG, SVG, PDF moodboard or cloud shared link"
                className="cpki-input text-xs"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Displays a secure file upload dropzone on the client onboarding screen.
              </p>
            </div>
          )}

          {modalType === "choice" && (
            <div className="space-y-3 p-3 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Multiple Choice Options
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)] cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={modalMultiSelect}
                    onChange={(e) => setModalMultiSelect(e.target.checked)}
                    className="rounded"
                  />
                  Allow clients to pick more than one option
                </label>
              </div>

              <div className="space-y-2">
                {modalOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] w-4 text-center">
                      {modalMultiSelect ? "☑" : "○"}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      className="cpki-input text-xs flex-1"
                    />
                    {modalOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(oIdx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove option"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus className="h-3 w-3" />
                  Add option choice
                </button>
              </div>
            </div>
          )}

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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Question"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
