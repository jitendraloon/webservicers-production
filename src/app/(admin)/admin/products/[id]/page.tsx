"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileCheck,
  FolderTree,
  Image as ImageIcon,
  Layers,
  ListPlus,
  Package,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/formatters";
import type {
  AdminAddon,
  AdminCategory,
  AdminProduct,
  AdminProductTier,
  AdminRequirementField,
} from "@/lib/admin-types";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AdminAddon[]>([]);
  const [predefinedLibrary, setPredefinedLibrary] = useState<AdminRequirementField[]>([]);

  // Product form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"service" | "digital" | "smm">("service");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("DRAFT");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // 3-tier pricing model (Image 4)
  const [tiers, setTiers] = useState<AdminProductTier[]>([
    {
      id: "tier_basic",
      name: "Basic",
      description: "Essential setup and core deliverable for getting started quickly.",
      priceCents: 14900,
      deliveryDays: 3,
      revisions: "1 revision",
      features: ["Core setup & configuration", "Initial consultation", "Delivery report"],
      highlightAsRecommended: false,
    },
    {
      id: "tier_standard",
      name: "Standard",
      description: "Most popular comprehensive package for growing businesses.",
      priceCents: 29900,
      deliveryDays: 5,
      revisions: "3 revisions",
      features: [
        "Everything in Basic",
        "Full implementation & testing",
        "Custom optimization & analytics",
        "Priority turnaround",
      ],
      highlightAsRecommended: true,
    },
    {
      id: "tier_premium",
      name: "Premium",
      description: "Full-service enterprise tier with bespoke deliverables and ongoing support.",
      priceCents: 59900,
      deliveryDays: 7,
      revisions: "Unlimited",
      features: [
        "Everything in Standard",
        "Dedicated account manager",
        "Comprehensive performance audit",
        "30 days post-launch support",
        "Expedited SLA",
      ],
      highlightAsRecommended: false,
    },
  ]);

  // Requirement questions attached to this product (Image 1, 2, 3)
  const [requirementQuestions, setRequirementQuestions] = useState<AdminRequirementField[]>([]);

  // Predefined Library Modal state (Image 2)
  const [isPredefinedModalOpen, setIsPredefinedModalOpen] = useState(false);
  const [modalCategoryFilter, setModalCategoryFilter] = useState("All Categories");

  // Inline Custom Question Creator state (Image 3)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customRequired, setCustomRequired] = useState(true);
  const [customFieldType, setCustomFieldType] = useState<"text" | "attachment" | "choice">("text");
  const [customCategory, setCustomCategory] = useState("General & Business");
  const [customOptions, setCustomOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [customMultiSelect, setCustomMultiSelect] = useState(false);

  // Client view preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Fetch product and library
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setCategories(json.categories || []);
          setAvailableAddons(json.addons || []);
          setPredefinedLibrary(json.requirements || []);

          const prod = (json.products || []).find(
            (p: AdminProduct) => p.id === productId || p.slug === productId
          );

          if (prod) {
            setName(prod.name);
            setSlug(prod.slug);
            setCategoryId(prod.categoryId || (json.categories?.[0]?.id ?? ""));
            setType(prod.type || "service");
            setStatus(prod.status || "DRAFT");
            setTagline(prod.tagline || "");
            setDescription(prod.description || "");
            setIconUrl(prod.iconUrl || "");
            setSelectedAddonIds(prod.addonIds || []);

            // Set tiers
            if (Array.isArray(prod.tiers) && prod.tiers.length > 0) {
              setTiers(prod.tiers);
            }

            // Attached questions: combine matching library ids + custom requirements
            const attachedLibrary = (json.requirements || []).filter((r: AdminRequirementField) =>
              (prod.requirementIds || []).includes(r.id)
            );
            const customs = prod.customRequirements || [];
            setRequirementQuestions([...attachedLibrary, ...customs]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Tier helper updates
  const updateTier = (idx: number, patch: Partial<AdminProductTier>) => {
    setTiers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addTierFeature = (tierIdx: number) => {
    setTiers((prev) => {
      const next = [...prev];
      next[tierIdx] = {
        ...next[tierIdx],
        features: [...next[tierIdx].features, "New Included Feature"],
      };
      return next;
    });
  };

  const removeTierFeature = (tierIdx: number, featIdx: number) => {
    setTiers((prev) => {
      const next = [...prev];
      next[tierIdx] = {
        ...next[tierIdx],
        features: next[tierIdx].features.filter((_, i) => i !== featIdx),
      };
      return next;
    });
  };

  const updateTierFeature = (tierIdx: number, featIdx: number, val: string) => {
    setTiers((prev) => {
      const next = [...prev];
      const feats = [...next[tierIdx].features];
      feats[featIdx] = val;
      next[tierIdx] = { ...next[tierIdx], features: feats };
      return next;
    });
  };

  // Requirement questions actions
  const handleAddPredefined = (question: AdminRequirementField) => {
    if (requirementQuestions.some((q) => q.id === question.id)) return;
    setRequirementQuestions((prev) => [...prev, question]);
  };

  const handleRemoveQuestion = (id: string) => {
    setRequirementQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSaveCustomQuestion = () => {
    if (!customPrompt.trim()) return;
    const newQ: AdminRequirementField = {
      id: `custom_req_${Date.now()}`,
      key: customPrompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30),
      label: customPrompt.trim(),
      category: customCategory,
      fieldType: customFieldType,
      required: customRequired,
      options:
        customFieldType === "choice"
          ? customOptions.map((s) => s.trim()).filter(Boolean)
          : undefined,
      isMultiSelect: customFieldType === "choice" ? customMultiSelect : false,
      placeholder:
        customFieldType === "text"
          ? "Enter your answer here..."
          : customFieldType === "attachment"
          ? "Upload files or provide links"
          : undefined,
      assignedCount: 1,
    };

    setRequirementQuestions((prev) => [...prev, newQ]);
    setCustomPrompt("");
    setIsAddingQuestion(false);
  };

  // Save product changes
  const handleSaveProduct = async () => {
    setSaving(true);
    try {
      const basePriceCents = tiers[0]?.priceCents || 14900;
      const libraryIds = requirementQuestions
        .filter((q) => !q.id.startsWith("custom_req_"))
        .map((q) => q.id);
      const customReqs = requirementQuestions.filter((q) => q.id.startsWith("custom_req_"));

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "product",
          id: productId,
          name,
          slug,
          categoryId,
          type,
          status,
          tagline,
          description,
          iconUrl,
          basePriceCents,
          tiers,
          addonIds: selectedAddonIds,
          requirementIds: libraryIds,
          customRequirements: customReqs,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setToast(`Product "${name}" updated successfully!`);
        setTimeout(() => setToast(null), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  // Predefined questions modal filter
  const modalCategories = useMemo(() => {
    const set = new Set<string>(["All Categories"]);
    predefinedLibrary.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [predefinedLibrary]);

  const filteredPredefined = useMemo(() => {
    if (modalCategoryFilter === "All Categories") return predefinedLibrary;
    return predefinedLibrary.filter((q) => q.category === modalCategoryFilter);
  }, [predefinedLibrary, modalCategoryFilter]);

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[var(--muted-foreground)]">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-60" />
        Loading product editor...
      </div>
    );
  }

  const lowestPrice = Math.min(...tiers.map((t) => t.priceCents)) / 100;

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Top Header Bar (Image 6) */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              {status === "ACTIVE" ? "PUBLISHED LIVE" : "READY TO PUBLISH"}
            </span>
            <button
              type="button"
              onClick={() =>
                setStatus((prev) => (prev === "ACTIVE" ? "DRAFT" : "ACTIVE"))
              }
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                status === "ACTIVE"
                  ? "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/40"
                  : "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/40"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status === "ACTIVE" ? "Active" : "Draft"}
            </button>
          </div>

          <h1 className="mt-1 text-lg font-bold text-[var(--foreground)]">
            {name || "Untitled Product"}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 font-medium text-[var(--foreground)]">
              {tiers.length} packages (USD)
            </span>
            <span className="rounded-md bg-[var(--success-subtle)] px-2 py-0.5 font-medium text-[var(--success)]">
              From ${lowestPrice}
            </span>
            <span className="rounded-md bg-[var(--accent)] px-2 py-0.5 font-medium text-[var(--primary-text)]">
              {requirementQuestions.length} requirement questions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/products" className="cpki-btn cpki-btn-outline cpki-btn-sm">
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveProduct}
            className="cpki-btn cpki-btn-primary cpki-btn-sm font-semibold shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Product & Packages"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Section 1: Product Icon (Image 5) */}
      <div className="cpki-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Product icon</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Shown beside the product name. A square image works best.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 text-[var(--muted-foreground)]">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="Icon preview" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Tag className="h-5 w-5 opacity-60" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="Paste icon image URL (or upload below)..."
                className="cpki-input text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => setIconUrl("https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&auto=format&fit=crop&q=60")}
                className="cpki-btn cpki-btn-outline cpki-btn-xs"
                title="Use sample icon"
              >
                Sample
              </button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              PNG, JPG, WebP or GIF · up to 4 MB. Saved with your product.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: General Information */}
      <div className="cpki-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">General Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[var(--foreground)]">Product Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Conversion Rate Optimization (CRO)"
              className="cpki-input text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">URL Slug</label>
            <input
              required
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="conversion-rate-optimization"
              className="cpki-input text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="cpki-select text-xs"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">Fulfillment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "service" | "digital" | "smm")}
              className="cpki-select text-xs"
            >
              <option value="service">Managed Service (Client Brief & Team Delivery)</option>
              <option value="digital">Digital Product / License Asset</option>
              <option value="smm">SMM Panel Automated API Provisioning</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)]">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Short high-converting value proposition for storefront..."
            className="cpki-input text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)]">Detailed Scope & Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Comprehensive description of deliverables, onboarding process, and guarantees..."
            className="cpki-textarea text-xs"
          />
        </div>
      </div>

      {/* Section 3: Pricing Packages · USD (Image 4) */}
      <div className="cpki-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Pricing packages · USD</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Standard three-tier pricing model (Basic, Standard, Premium) for transparent client selection.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {tiers.map((tier, idx) => {
            const isStandard = tier.name.toLowerCase().includes("standard") || tier.highlightAsRecommended;
            return (
              <div
                key={tier.id || idx}
                className={`relative rounded-xl border p-4 transition-all space-y-4 ${
                  isStandard
                    ? "border-[var(--foreground)] shadow-md bg-[var(--card)] ring-1 ring-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                {isStandard && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[var(--foreground)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--background)] shadow-xs">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(idx, { name: e.target.value })}
                    className="text-base font-bold text-[var(--foreground)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none w-full"
                  />
                  <textarea
                    rows={2}
                    value={tier.description || ""}
                    onChange={(e) => updateTier(idx, { description: e.target.value })}
                    placeholder="Short description of this tier's target client..."
                    className="cpki-textarea text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Delivery</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={tier.deliveryDays}
                        onChange={(e) => updateTier(idx, { deliveryDays: Number(e.target.value) })}
                        className="cpki-input text-xs py-1"
                      />
                      <span className="text-[11px] text-[var(--muted-foreground)]">days</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Revisions</label>
                    <input
                      type="text"
                      value={tier.revisions || "1 revision"}
                      onChange={(e) => updateTier(idx, { revisions: e.target.value })}
                      placeholder="e.g. 3 revisions"
                      className="cpki-input text-xs py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Price ($ USD)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-[var(--muted-foreground)]">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={Math.round(tier.priceCents / 100)}
                      onChange={(e) => updateTier(idx, { priceCents: Number(e.target.value) * 100 })}
                      className="cpki-input pl-7 font-bold text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-[var(--border)] pt-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Included features
                  </label>
                  <div className="space-y-1.5">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 group text-xs">
                        <Check className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => updateTierFeature(idx, fIdx, e.target.value)}
                          className="flex-1 bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeTierFeature(idx, fIdx)}
                          className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--danger)] p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addTierFeature(idx)}
                    className="text-xs font-semibold text-[var(--primary-text)] hover:underline flex items-center gap-1 pt-1"
                  >
                    + Add feature
                  </button>
                </div>

                <div className="border-t border-[var(--border)] pt-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(tier.highlightAsRecommended)}
                      onChange={(e) => updateTier(idx, { highlightAsRecommended: e.target.checked })}
                    />
                    <span className="text-[11px] font-medium text-[var(--foreground)]">
                      Highlight as recommended
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Product Requirement Questions (Image 1, 2, 3) */}
      <div className="cpki-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              YOUR QUESTIONS
            </span>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Product requirement questions
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Here's where you can request any details needed to complete the order. There's no need to repeat general questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="cpki-btn cpki-btn-outline cpki-btn-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Client view preview
            </button>
            <button
              type="button"
              onClick={() => setIsPredefinedModalOpen(true)}
              className="cpki-btn cpki-btn-outline cpki-btn-xs"
            >
              <Layers className="h-3.5 w-3.5" />
              Select from Predefined
            </button>
            <button
              type="button"
              onClick={() => setIsAddingQuestion(true)}
              className="cpki-btn cpki-btn-primary cpki-btn-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </button>
          </div>
        </div>

        {/* Inline Question Builder (Image 3) */}
        {isAddingQuestion && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--foreground)]">Add a question</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={customRequired}
                  onChange={(e) => setCustomRequired(e.target.checked)}
                />
                <span>Required</span>
              </label>
            </div>

            <div className="space-y-1">
              <textarea
                rows={3}
                maxLength={400}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Request necessary details such as dimensions, brand guidelines, access credentials, and more."
                className="cpki-textarea text-xs w-full"
              />
              <div className="text-right text-[10.5px] text-[var(--muted-foreground)] font-mono">
                {customPrompt.length}/400 characters
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Get it in a form of:
                </label>
                <select
                  value={customFieldType}
                  onChange={(e) =>
                    setCustomFieldType(e.target.value as "text" | "attachment" | "choice")
                  }
                  className="cpki-select text-xs"
                >
                  <option value="text">Free text</option>
                  <option value="attachment">Attachment (File Upload)</option>
                  <option value="choice">Multiple choice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Category Tag:
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="cpki-select text-xs"
                >
                  <option value="General & Business">General & Business</option>
                  <option value="Web Development">Web Development</option>
                  <option value="SEO & Growth">SEO & Growth</option>
                  <option value="Branding & Graphic Design">Branding & Graphic Design</option>
                  <option value="Social Media Marketing">Social Media Marketing</option>
                  <option value="Content & Copywriting">Content & Copywriting</option>
                </select>
              </div>
            </div>

            {/* Dynamic Options for Multiple Choice */}
            {customFieldType === "choice" && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Multiple Choice Options</span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customMultiSelect}
                      onChange={(e) => setCustomMultiSelect(e.target.checked)}
                    />
                    <span>Allow clients to pick more than one option</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  {customOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--muted-foreground)] font-mono">{oIdx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...customOptions];
                          next[oIdx] = e.target.value;
                          setCustomOptions(next);
                        }}
                        className="cpki-input text-xs flex-1"
                        placeholder={`Option ${oIdx + 1}`}
                      />
                      {customOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCustomOptions(customOptions.filter((_, i) => i !== oIdx))
                          }
                          className="text-[var(--danger)] p-1 hover:bg-[var(--danger-subtle)] rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCustomOptions([...customOptions, `Option ${customOptions.length + 1}`])}
                  className="text-xs font-semibold text-[var(--primary-text)] hover:underline flex items-center gap-1"
                >
                  + Add another choice
                </button>
              </div>
            )}

            {/* Dynamic File Upload Guidance */}
            {customFieldType === "attachment" && (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-3 text-xs text-[var(--muted-foreground)] space-y-1">
                <span className="font-semibold text-[var(--foreground)]">Attachment Upload:</span>
                <p>
                  Clients will be provided a drag-and-drop file upload container to attach brand guidelines, PDFs, images, or ZIP archives directly on the checkout/order page.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomQuestion}
                disabled={!customPrompt.trim()}
                className="cpki-btn cpki-btn-primary cpki-btn-sm"
              >
                Add Question
              </button>
            </div>
          </div>
        )}

        {/* Questions List or Empty State (Image 1) */}
        {requirementQuestions.length === 0 && !isAddingQuestion ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              No requirements defined for this product yet.
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
              Add specific questions for clients to answer when placing their order.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPredefinedModalOpen(true)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                <Layers className="h-3.5 w-3.5" />
                Browse Predefined Library
              </button>
              <button
                type="button"
                onClick={() => setIsAddingQuestion(true)}
                className="cpki-btn cpki-btn-primary cpki-btn-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Question
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requirementQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--foreground)]/30"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.category && (
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--foreground)]">
                        {q.category}
                      </span>
                    )}
                    <Badge tone="lilac" variant="sm">
                      {q.fieldType === "choice"
                        ? `Multiple choice (${q.options?.length || 0} options)`
                        : q.fieldType === "attachment"
                        ? "Attachment"
                        : "Free text"}
                    </Badge>
                    {q.required ? (
                      <span className="text-[10.5px] font-bold text-[var(--danger)]">
                        * Required
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-[var(--muted-foreground)]">
                        Optional
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {q.label}
                  </p>

                  {/* Option pills if multiple choice */}
                  {q.fieldType === "choice" && q.options && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-2.5 py-0.5 text-[10.5px] text-[var(--foreground)]"
                        >
                          ○ {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--danger)] p-1 rounded"
                  title="Remove from product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Applicable Product Add-ons */}
      <div className="cpki-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Attached Upsell Add-ons</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Select additional upgrades offered to clients during checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 pt-1">
          {availableAddons.map((addon) => {
            const checked = selectedAddonIds.includes(addon.id);
            return (
              <label
                key={addon.id}
                className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked
                    ? "border-[var(--primary)] bg-[var(--accent)]/30"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelectedAddonIds((prev) =>
                      prev.includes(addon.id)
                        ? prev.filter((id) => id !== addon.id)
                        : [...prev, addon.id]
                    )
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {addon.name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)]">
                    {formatMoney(addon.priceCents)} · {addon.billingType}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Predefined Questions Library Modal (Image 2) */}
      <Modal
        isOpen={isPredefinedModalOpen}
        onClose={() => setIsPredefinedModalOpen(false)}
        title="Select Predefined Requirement Questions"
        maxWidth="720px"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Choose standardized questions defined under Catalog &gt; Product Requirements to attach to this product.
          </p>

          {/* Category Pill Filters */}
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-3">
            {modalCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setModalCategoryFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  modalCategoryFilter === cat
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Question Items list */}
          <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
            {filteredPredefined.map((q) => {
              const alreadyAdded = requirementQuestions.some((item) => item.id === q.id);
              return (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 hover:border-[var(--foreground)]/40 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {q.category && (
                        <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--foreground)]">
                          {q.category}
                        </span>
                      )}
                      <Badge tone="lilac" variant="sm">
                        {q.fieldType === "choice"
                          ? `Multiple choice (${q.options?.length || 0} options)`
                          : q.fieldType === "attachment"
                          ? "Attachment"
                          : "Free text"}
                      </Badge>
                      {q.required && (
                        <span className="text-[10.5px] font-bold text-[var(--danger)]">
                          * Required
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      {q.label}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPredefined(q)}
                    disabled={alreadyAdded}
                    className={`cpki-btn cpki-btn-xs ${
                      alreadyAdded ? "cpki-btn-outline opacity-50" : "cpki-btn-primary"
                    }`}
                  >
                    {alreadyAdded ? "Added" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <Link
              href="/admin/products/requirements"
              target="_blank"
              className="text-xs font-semibold text-[var(--primary-text)] hover:underline flex items-center gap-1"
            >
              Manage predefined library ↗
            </Link>
            <button
              type="button"
              onClick={() => setIsPredefinedModalOpen(false)}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Client View Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Client Onboarding Preview"
        maxWidth="680px"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--muted-foreground)]">
            This is how your questions will appear to clients on the order page after checkout:
          </p>

          <div className="space-y-4 rounded-xl border border-[var(--border)] p-4 bg-[var(--muted)]/20">
            {requirementQuestions.map((q, idx) => (
              <div key={idx} className="space-y-1.5">
                <label className="font-semibold text-[var(--foreground)] flex items-center justify-between">
                  <span>
                    {q.label} {q.required && <span className="text-[var(--danger)]">*</span>}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                    {q.fieldType}
                  </span>
                </label>

                {q.fieldType === "choice" ? (
                  <div className="space-y-1.5 pl-1">
                    {q.options?.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type={q.isMultiSelect ? "checkbox" : "radio"}
                          name={`preview_${q.id}`}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : q.fieldType === "attachment" ? (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-center space-y-1 cursor-pointer">
                    <Upload className="h-4 w-4 mx-auto text-[var(--muted-foreground)]" />
                    <span className="font-medium text-[var(--foreground)]">Drag & drop files or browse</span>
                    <p className="text-[10px] text-[var(--muted-foreground)]">PDF, PNG, JPG, ZIP</p>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={q.placeholder || "Client response placeholder..."}
                    className="cpki-input text-xs w-full"
                    disabled
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
