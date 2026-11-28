"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AdminProductTier,
  AdminRequirementField,
} from "@/lib/admin-types";

export default function AdminNewProductPage() {
  const router = useRouter();

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

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setCategories(json.categories || []);
          setAvailableAddons(json.addons || []);
          setPredefinedLibrary(json.requirements || []);
          if (json.categories?.[0]) {
            setCategoryId(json.categories[0].id);
          }
        }
      });
  }, []);

  // Auto-slug when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  // Tier updates
  const updateTier = (idx: number, patch: Partial<AdminProductTier>) => {
    setTiers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      if (patch.highlightAsRecommended) {
        return next.map((t, i) => ({
          ...t,
          highlightAsRecommended: i === idx,
        }));
      }
      return next;
    });
  };

  const addTierFeature = (tierIdx: number, featureText: string) => {
    if (!featureText.trim()) return;
    setTiers((prev) => {
      const next = [...prev];
      next[tierIdx] = {
        ...next[tierIdx],
        features: [...next[tierIdx].features, featureText.trim()],
      };
      return next;
    });
  };

  const removeTierFeature = (tierIdx: number, featureIdx: number) => {
    setTiers((prev) => {
      const next = [...prev];
      next[tierIdx] = {
        ...next[tierIdx],
        features: next[tierIdx].features.filter((_, i) => i !== featureIdx),
      };
      return next;
    });
  };

  // Add requirement from predefined library
  const handleAddPredefinedQuestion = (req: AdminRequirementField) => {
    if (requirementQuestions.some((q) => q.id === req.id || q.label === req.label)) {
      setToast(`"${req.label}" is already added.`);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setRequirementQuestions((prev) => [...prev, req]);
    setToast(`Added "${req.label}" to product requirements.`);
    setTimeout(() => setToast(null), 2500);
  };

  // Add custom question
  const handleSaveCustomQuestion = () => {
    if (!customPrompt.trim()) return;
    const newField: AdminRequirementField = {
      id: `custom_${Date.now()}`,
      key: customPrompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32),
      label: customPrompt.trim(),
      category: customCategory,
      fieldType: customFieldType,
      required: customRequired,
      options:
        customFieldType === "choice"
          ? customOptions.map((s) => s.trim()).filter(Boolean)
          : undefined,
      isMultiSelect: customFieldType === "choice" ? customMultiSelect : undefined,
      placeholder:
        customFieldType === "text"
          ? "Client response..."
          : customFieldType === "attachment"
          ? "Upload files..."
          : undefined,
    };

    setRequirementQuestions((prev) => [...prev, newField]);
    setIsAddingQuestion(false);
    setCustomPrompt("");
    setCustomOptions(["Option 1", "Option 2"]);
    setCustomMultiSelect(false);
    setToast("Custom requirement question added!");
    setTimeout(() => setToast(null), 2500);
  };

  const removeQuestion = (id: string) => {
    setRequirementQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCustomOptionChange = (idx: number, val: string) => {
    setCustomOptions((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addCustomOption = () => {
    setCustomOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const removeCustomOption = (idx: number) => {
    if (customOptions.length <= 1) return;
    setCustomOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Submit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast("Product name is required.");
      return;
    }
    setSaving(true);
    try {
      const libraryIds = requirementQuestions
        .filter((q) => !q.id.startsWith("custom_"))
        .map((q) => q.id);
      const customReqs = requirementQuestions.filter((q) => q.id.startsWith("custom_"));

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "product",
          name: name.trim(),
          slug: slug.trim() || undefined,
          categoryId,
          type,
          status,
          tagline: tagline.trim(),
          description: description.trim(),
          iconUrl: iconUrl.trim(),
          basePriceCents: tiers[0]?.priceCents || 14900,
          tiers,
          requirementIds: libraryIds,
          customRequirements: customReqs,
          addonIds: selectedAddonIds,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setToast("Product created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/admin/products");
        }, 1000);
      } else {
        setToast(json.error || "Failed to create product");
      }
    } catch {
      setToast("Network error creating product");
    } finally {
      setSaving(false);
    }
  };

  const minPrice = useMemo(() => {
    if (tiers.length === 0) return 0;
    return Math.min(...tiers.map((t) => t.priceCents));
  }, [tiers]);

  const modalCategories = useMemo(() => {
    const set = new Set<string>(["All Categories"]);
    predefinedLibrary.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [predefinedLibrary]);

  const filteredModalQuestions = useMemo(() => {
    if (modalCategoryFilter === "All Categories") return predefinedLibrary;
    return predefinedLibrary.filter((q) => q.category === modalCategoryFilter);
  }, [predefinedLibrary, modalCategoryFilter]);

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Top Bar (Image 6) */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 bg-[var(--background)]/90 px-4 py-3 backdrop-blur-md border-b border-[var(--border)] transition-all sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="cpki-btn cpki-btn-outline cpki-btn-xs"
              title="Return to Catalog"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted-foreground)]">
                  READY TO PUBLISH
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setStatus((prev) => (prev === "ACTIVE" ? "DRAFT" : "ACTIVE"))
                  }
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                    status === "ACTIVE"
                      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30"
                      : "bg-[#fef3c7] text-[#92400e] border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === "ACTIVE" ? "bg-[var(--success)]" : "bg-amber-500"
                    }`}
                  />
                  {status === "ACTIVE" ? "Active" : "Draft"}
                </button>
              </div>
              <h1 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                {name || "Untitled Product"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
                <span className="bg-[var(--muted)] px-2 py-0.5 rounded text-[11px]">
                  {tiers.length} packages (USD)
                </span>
                <span className="bg-[var(--accent)]/60 text-[var(--primary-text)] px-2 py-0.5 rounded text-[11px] font-medium">
                  From {formatMoney(minPrice)}
                </span>
                <span className="bg-[var(--muted)] px-2 py-0.5 rounded text-[11px]">
                  {requirementQuestions.length} requirement questions
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={saving}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              {saving ? "Creating..." : "Create product & packages"}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="cpki-card-insight px-4 py-2.5 text-xs font-medium text-[var(--insight-foreground)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          {toast}
        </div>
      )}

      {/* Product Icon Section (Image 5) */}
      <div className="cpki-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">Product icon</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Shown beside the product name. A square image works best.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--foreground)]">Upload icon</label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/40 text-[var(--muted-foreground)] overflow-hidden">
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Tag className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or icon image URL"
                  className="cpki-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const sampleIcons = [
                      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=128&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80",
                    ];
                    setIconUrl(sampleIcons[Math.floor(Math.random() * sampleIcons.length)]);
                  }}
                  className="cpki-btn cpki-btn-outline cpki-btn-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Sample
                </button>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                PNG, JPG, WebP or GIF · up to 4 MB. Saved with your product.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* General Product Information */}
      <div className="cpki-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Product Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Product Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Modern Full-Stack Web Development"
              className="cpki-input text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. full-stack-web-development"
              className="cpki-input text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="cpki-select text-xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Fulfillment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "service" | "digital" | "smm")}
              className="cpki-select text-xs"
            >
              <option value="service">Managed Service (Manual / Hybrid)</option>
              <option value="digital">Digital Asset / License Delivery</option>
              <option value="smm">SMM Panel / Automated API</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Short Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Bespoke responsive web application built with modern architecture."
            className="cpki-input text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Full Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Comprehensive description of the service deliverables, tech stack, and scope..."
            className="cpki-textarea text-xs"
          />
        </div>
      </div>

      {/* Pricing packages · USD (Image 4) */}
      <div className="cpki-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">Pricing packages · USD</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Standard three-tier pricing model (Basic, Standard, Premium) for transparent client selection.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {tiers.map((tier, idx) => {
            const isPopular = tier.highlightAsRecommended;
            return (
              <div
                key={tier.id || idx}
                className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isPopular
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--background)] shadow-sm"
                    : "border-[var(--border)] bg-[var(--background)]"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 right-4 rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--background)] uppercase shadow-sm">
                    POPULAR
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[var(--foreground)]">
                      {tier.name}
                    </label>
                    <textarea
                      rows={2}
                      value={tier.description || ""}
                      onChange={(e) => updateTier(idx, { description: e.target.value })}
                      placeholder={`Description for ${tier.name} tier...`}
                      className="cpki-textarea text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Delivery
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={tier.deliveryDays}
                          onChange={(e) =>
                            updateTier(idx, { deliveryDays: Number(e.target.value) || 1 })
                          }
                          className="cpki-input text-xs w-16"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">days</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        Revisions
                      </label>
                      <input
                        type="text"
                        value={tier.revisions || ""}
                        onChange={(e) => updateTier(idx, { revisions: e.target.value })}
                        placeholder="e.g. 3 revisions"
                        className="cpki-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--muted-foreground)]">
                      Price ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--foreground)]">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={Math.round(tier.priceCents / 100)}
                        onChange={(e) =>
                          updateTier(idx, {
                            priceCents: Math.round(Number(e.target.value || 0) * 100),
                          })
                        }
                        className="cpki-input text-sm font-bold !pl-7"
                      />
                    </div>
                  </div>

                  {/* Included features checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                    <label className="text-[11px] font-semibold text-[var(--foreground)] uppercase tracking-wider">
                      Included features
                    </label>
                    <div className="space-y-1.5">
                      {tier.features.map((feature, fIdx) => (
                        <div
                          key={fIdx}
                          className="group flex items-center justify-between text-xs py-1 border-b border-dashed border-[var(--border)]/60"
                        >
                          <div className="flex items-center gap-1.5 pr-2">
                            <Check className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
                            <span className="text-[var(--foreground)]">{feature}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTierFeature(idx, fIdx)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-opacity"
                            title="Remove feature"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add feature input */}
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const feat = prompt("Enter feature description for " + tier.name + ":");
                          if (feat) addTierFeature(idx, feat);
                        }}
                        className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add feature
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[var(--border)]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={Boolean(tier.highlightAsRecommended)}
                      onChange={(e) => updateTier(idx, { highlightAsRecommended: e.target.checked })}
                      className="rounded border-[var(--border)]"
                    />
                    Highlight as recommended
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* YOUR QUESTIONS · Product requirement questions (Image 1, 2, 3) */}
      <div className="cpki-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--muted-foreground)]">
              YOUR QUESTIONS
            </span>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Product requirement questions
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Here&apos;s where you can request any details needed to complete the order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <Eye className="h-3.5 w-3.5" />
              Client view preview
            </button>
            <button
              type="button"
              onClick={() => setIsPredefinedModalOpen(true)}
              className="cpki-btn cpki-btn-outline cpki-btn-sm"
            >
              <FolderTree className="h-3.5 w-3.5" />
              Select from Predefined
            </button>
            <button
              type="button"
              onClick={() => setIsAddingQuestion((prev) => !prev)}
              className="cpki-btn cpki-btn-primary cpki-btn-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </button>
          </div>
        </div>

        {/* Inline Add a Question Box (Image 3) */}
        {isAddingQuestion && (
          <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--muted)]/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--foreground)]">Add a question</h3>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={customRequired}
                  onChange={(e) => setCustomRequired(e.target.checked)}
                  className="rounded"
                />
                Required
              </label>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Request necessary details such as dimensions, brand guidelines, and more."
                maxLength={400}
                className="cpki-textarea text-xs"
              />
              <div className="text-right text-[10px] text-[var(--muted-foreground)]">
                {customPrompt.length}/400 characters
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Get it in a form of:</label>
                <select
                  value={customFieldType}
                  onChange={(e) =>
                    setCustomFieldType(e.target.value as "text" | "attachment" | "choice")
                  }
                  className="cpki-select text-xs"
                >
                  <option value="text">Free text</option>
                  <option value="attachment">Attachment</option>
                  <option value="choice">Multiple choice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Question Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="cpki-select text-xs"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="SEO & Growth">SEO & Growth</option>
                  <option value="Branding & Graphic Design">Branding & Graphic Design</option>
                  <option value="Social Media Marketing">Social Media Marketing</option>
                  <option value="General & Business">General & Business</option>
                </select>
              </div>
            </div>

            {/* Dynamic Options for Multiple Choice */}
            {customFieldType === "choice" && (
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Multiple Choice Options</label>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customMultiSelect}
                      onChange={(e) => setCustomMultiSelect(e.target.checked)}
                      className="rounded"
                    />
                    Allow clients to pick more than one option
                  </label>
                </div>

                <div className="space-y-2">
                  {customOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] w-4 text-center">
                        {customMultiSelect ? "☑" : "○"}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleCustomOptionChange(oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="cpki-input text-xs flex-1"
                      />
                      {customOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomOption(oIdx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCustomOption}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 mt-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add option choice
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="cpki-btn cpki-btn-outline cpki-btn-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomQuestion}
                className="cpki-btn cpki-btn-primary cpki-btn-xs"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Empty state (Image 1) */}
        {requirementQuestions.length === 0 && !isAddingQuestion && (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center space-y-3">
            <div className="text-sm font-semibold text-[var(--foreground)]">
              No requirements defined for this product yet.
            </div>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
              Add specific questions for clients to answer when placing their order.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPredefinedModalOpen(true)}
                className="cpki-btn cpki-btn-outline cpki-btn-sm"
              >
                <FolderTree className="h-3.5 w-3.5" />
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
        )}

        {/* Attached Questions List */}
        {requirementQuestions.length > 0 && (
          <div className="space-y-2.5">
            {requirementQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 flex flex-wrap items-center justify-between gap-3 hover:border-[var(--primary)]/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary-text)]">
                      {q.category || "General"}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                      {q.fieldType === "choice"
                        ? `Multiple choice (${(q.options || []).length} options${
                            q.isMultiSelect ? " · multi-select" : ""
                          })`
                        : q.fieldType === "attachment"
                        ? "Attachment"
                        : "Free text"}
                    </span>
                    {q.required && (
                      <span className="text-[11px] font-semibold text-rose-500">* Required</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">{q.label}</div>

                  {q.fieldType === "choice" && Array.isArray(q.options) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="px-2 py-0.5 rounded-full text-[10.5px] border border-[var(--border)] bg-[var(--muted)]/40 text-[var(--foreground)] flex items-center gap-1"
                        >
                          <span className="text-[var(--muted-foreground)]">
                            {q.isMultiSelect ? "☑" : "○"}
                          </span>
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="cpki-btn cpki-btn-quiet cpki-btn-xs text-red-500 hover:text-red-700"
                    title="Remove question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upsell Add-ons checklist */}
      <div className="cpki-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">Upsell Add-ons</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Select additional features or accelerator add-ons that clients can add to their order during checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableAddons.map((addon) => {
            const checked = selectedAddonIds.includes(addon.id);
            return (
              <label
                key={addon.id}
                className={`rounded-xl border p-3 flex items-start gap-3 cursor-pointer transition-all ${
                  checked
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border)] hover:bg-[var(--muted)]/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAddon(addon.id)}
                  className="mt-0.5 rounded"
                />
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold text-[var(--foreground)]">{addon.name}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">
                    {addon.description}
                  </div>
                  <div className="text-[11px] font-bold text-[var(--primary-text)] pt-1">
                    +{formatMoney(addon.priceCents)}{" "}
                    <span className="font-normal text-[var(--muted-foreground)]">
                      ({addon.billingType === "recurring" ? "/mo" : "one-time"})
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Predefined Requirement Library Modal (Image 2) */}
      <Modal
        isOpen={isPredefinedModalOpen}
        onClose={() => setIsPredefinedModalOpen(false)}
        title="Select Predefined Requirement Questions"
        maxWidth="740px"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Choose standardized questions defined under Catalog &gt; Product Requirements to attach to this product.
          </p>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[var(--border)]">
            {modalCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setModalCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  modalCategoryFilter === cat
                    ? "bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-sm"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions list */}
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
            {filteredModalQuestions.map((req) => {
              const alreadyAdded = requirementQuestions.some(
                (q) => q.id === req.id || q.label === req.label
              );
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-[var(--border)] p-3.5 flex items-center justify-between gap-3 hover:border-[var(--primary)]/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary-text)]">
                        {req.category || "General"}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        {req.fieldType === "choice"
                          ? `Multiple choice (${(req.options || []).length} options)`
                          : req.fieldType === "attachment"
                          ? "Attachment"
                          : "Free text"}
                      </span>
                      {req.required && (
                        <span className="text-[11px] font-semibold text-rose-500">* Required</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-[var(--foreground)]">
                      {req.label}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPredefinedQuestion(req)}
                    disabled={alreadyAdded}
                    className={`cpki-btn cpki-btn-xs shrink-0 ${
                      alreadyAdded
                        ? "bg-[var(--muted)] text-[var(--muted-foreground)] opacity-70 cursor-not-allowed"
                        : "cpki-btn-primary"
                    }`}
                  >
                    {alreadyAdded ? (
                      <>
                        <Check className="h-3 w-3" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <Link
              href="/admin/products/requirements"
              target="_blank"
              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-medium"
            >
              Manage predefined library &rarr;
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
        title="Client Requirement Step Preview"
        maxWidth="640px"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-[var(--muted)]/40 p-3 text-xs text-[var(--muted-foreground)]">
            This is how clients will see the onboarding requirement form after checkout.
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {requirementQuestions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-1.5 border-b border-[var(--border)] pb-3">
                <label className="text-xs font-semibold text-[var(--foreground)] flex items-center justify-between">
                  <span>
                    {idx + 1}. {q.label}
                  </span>
                  {q.required && <span className="text-[10px] text-rose-500 font-bold">* Required</span>}
                </label>

                {q.fieldType === "choice" ? (
                  <div className="space-y-1.5 pt-1">
                    {(q.options || []).map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className="flex items-center gap-2 text-xs text-[var(--foreground)] p-1.5 rounded hover:bg-[var(--muted)]/50 cursor-pointer"
                      >
                        <input
                          type={q.isMultiSelect ? "checkbox" : "radio"}
                          name={`preview_${q.id}`}
                          className="rounded"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : q.fieldType === "attachment" ? (
                  <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted-foreground)]">
                    <Upload className="h-5 w-5 mx-auto mb-1 opacity-70" />
                    <span>Click or drag files here to upload project assets</span>
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    placeholder={q.placeholder || "Enter your response..."}
                    className="cpki-textarea text-xs"
                    disabled
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
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
