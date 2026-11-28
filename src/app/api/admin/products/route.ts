import { NextRequest, NextResponse } from "next/server";
import { createDefaultRequirements, getAdminStore } from "@/server/admin-store";
import type { AdminProductTier, AdminRequirementField } from "@/lib/admin-types";

export async function GET(request: NextRequest) {
  const store = getAdminStore();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const product = store.products.find((p) => p.id === id || p.slug === id);
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  }

  return NextResponse.json({
    ok: true,
    products: store.products,
    categories: store.categories,
    addons: store.addons,
    requirements: store.requirements,
  });
}

export async function POST(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();
  const kind = body.kind as string;

  if (kind === "reset_requirements") {
    store.requirements = createDefaultRequirements();
    return NextResponse.json({ ok: true, requirements: store.requirements });
  }

  if (kind === "product") {
    const cat = store.categories.find((c) => c.id === body.categoryId) ?? store.categories[0];
    const basePriceCents = body.basePriceCents !== undefined
      ? Number(body.basePriceCents)
      : Math.round(Number(body.basePriceUsd || 149) * 100);

    const slug = (body.slug || body.name || "new-service")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const tiers: AdminProductTier[] = Array.isArray(body.tiers) && body.tiers.length > 0
      ? body.tiers
      : [
          {
            id: `tier_${Date.now()}_1`,
            name: "Basic",
            description: "Essential setup and core deliverable for getting started quickly.",
            priceCents: basePriceCents,
            annualDiscountPct: 20,
            deliveryDays: 3,
            revisions: "1 revision",
            features: ["Core setup & configuration", "Initial consultation", "Delivery report"],
            highlightAsRecommended: false,
          },
          {
            id: `tier_${Date.now()}_2`,
            name: "Standard",
            description: "Most popular comprehensive package for growing businesses.",
            priceCents: basePriceCents * 2,
            annualDiscountPct: 20,
            deliveryDays: 5,
            revisions: "3 revisions",
            features: ["Everything in Basic", "Full implementation & testing", "Custom optimization & analytics", "Priority turnaround"],
            highlightAsRecommended: true,
          },
          {
            id: `tier_${Date.now()}_3`,
            name: "Premium",
            description: "Full-service enterprise tier with bespoke deliverables and ongoing support.",
            priceCents: basePriceCents * 4,
            annualDiscountPct: 20,
            deliveryDays: 7,
            revisions: "Unlimited",
            features: ["Everything in Standard", "Dedicated account manager", "Comprehensive performance audit", "30 days post-launch support", "Expedited SLA"],
            highlightAsRecommended: false,
          },
        ];

    const newProduct = {
      id: `prod_${Date.now()}`,
      slug,
      name: body.name || "Untitled Product",
      shortName: body.shortName || body.name || "Untitled",
      categoryId: cat ? cat.id : "cat_1",
      categoryName: cat ? cat.name : "Managed Services",
      type: (body.type || "service") as "service" | "digital" | "smm",
      status: (body.status || "DRAFT") as "ACTIVE" | "DRAFT" | "ARCHIVED",
      tagline: body.tagline || "Managed digital growth package",
      description: body.description || "",
      iconUrl: body.iconUrl || "",
      basePriceCents: tiers[0]?.priceCents || basePriceCents,
      tiers,
      addonIds: Array.isArray(body.addonIds) ? body.addonIds : [],
      requirementIds: Array.isArray(body.requirementIds) ? body.requirementIds : [],
      customRequirements: Array.isArray(body.customRequirements) ? body.customRequirements : [],
      activeSubscriptions: 0,
    };

    store.products.unshift(newProduct);
    if (cat) cat.productCount += 1;
    return NextResponse.json({ ok: true, product: newProduct }, { status: 201 });
  }

  if (kind === "category") {
    const newCat = {
      id: `cat_${Date.now()}`,
      slug: (body.name || "category").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: body.name || "New Category",
      description: body.description || "",
      sortOrder: store.categories.length + 1,
      productCount: 0,
      visible: true,
    };
    store.categories.push(newCat);
    return NextResponse.json({ ok: true, category: newCat }, { status: 201 });
  }

  if (kind === "addon") {
    const newAddon = {
      id: `addon_${Date.now()}`,
      name: body.name || "New Add-on",
      slug: (body.name || "addon").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: body.description || "",
      priceCents: Math.round(Number(body.priceUsd || 99) * 100),
      billingType: (body.billingType || "recurring") as "one_time" | "recurring",
      applicableCategories: Array.isArray(body.applicableCategories) && body.applicableCategories.length > 0
        ? body.applicableCategories
        : ["All Categories"],
      active: true,
    };
    store.addons.unshift(newAddon);
    return NextResponse.json({ ok: true, addon: newAddon }, { status: 201 });
  }

  if (kind === "requirement") {
    const newReq: AdminRequirementField = {
      id: `req_${Date.now()}`,
      key: (body.key || body.label || "custom_field").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label: body.label || "New Requirement Question",
      category: body.category || "General & Business",
      fieldType: (body.fieldType || "text") as AdminRequirementField["fieldType"],
      required: Boolean(body.required),
      placeholder: body.placeholder || "",
      options: Array.isArray(body.options)
        ? body.options.map(String).map((s: string) => s.trim()).filter(Boolean)
        : body.options
        ? String(body.options).split(",").map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      isMultiSelect: Boolean(body.isMultiSelect),
      assignedCount: 0,
    };
    store.requirements.unshift(newReq);
    return NextResponse.json({ ok: true, requirement: newReq }, { status: 201 });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const store = getAdminStore();
  const body = await request.json();

  if (body.kind === "product") {
    const prod = store.products.find((p) => p.id === body.id);
    if (!prod) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (body.name) prod.name = body.name;
    if (body.slug) prod.slug = body.slug;
    if (body.categoryId) {
      prod.categoryId = body.categoryId;
      const cat = store.categories.find((c) => c.id === body.categoryId);
      if (cat) prod.categoryName = cat.name;
    }
    if (body.type) prod.type = body.type;
    if (body.tagline !== undefined) prod.tagline = body.tagline;
    if (body.description !== undefined) prod.description = body.description;
    if (body.iconUrl !== undefined) prod.iconUrl = body.iconUrl;
    if (body.status) prod.status = body.status;
    if (body.basePriceCents !== undefined) prod.basePriceCents = Number(body.basePriceCents);
    if (Array.isArray(body.tiers)) {
      prod.tiers = body.tiers;
      if (prod.tiers[0]) prod.basePriceCents = prod.tiers[0].priceCents;
    }
    if (Array.isArray(body.requirementIds)) prod.requirementIds = body.requirementIds;
    if (Array.isArray(body.addonIds)) prod.addonIds = body.addonIds;
    if (Array.isArray(body.customRequirements)) prod.customRequirements = body.customRequirements;

    return NextResponse.json({ ok: true, product: prod });
  }

  if (body.kind === "category") {
    const cat = store.categories.find((c) => c.id === body.id);
    if (!cat) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (body.name) cat.name = body.name;
    if (body.description !== undefined) cat.description = body.description;
    if (body.sortOrder !== undefined) cat.sortOrder = Number(body.sortOrder);
    if (body.visible !== undefined) cat.visible = body.visible;
    return NextResponse.json({ ok: true, category: cat });
  }

  if (body.kind === "addon") {
    const addon = store.addons.find((a) => a.id === body.id);
    if (!addon) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (body.name) addon.name = body.name;
    if (body.description !== undefined) addon.description = body.description;
    if (body.priceUsd !== undefined) addon.priceCents = Math.round(Number(body.priceUsd) * 100);
    if (body.priceCents !== undefined) addon.priceCents = Number(body.priceCents);
    if (body.billingType) addon.billingType = body.billingType;
    if (Array.isArray(body.applicableCategories)) addon.applicableCategories = body.applicableCategories;
    if (body.active !== undefined) addon.active = body.active;
    return NextResponse.json({ ok: true, addon });
  }

  if (body.kind === "requirement") {
    const req = store.requirements.find((r) => r.id === body.id);
    if (!req) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (body.label) req.label = body.label;
    if (body.category) req.category = body.category;
    if (body.fieldType) req.fieldType = body.fieldType;
    if (body.placeholder !== undefined) req.placeholder = body.placeholder;
    if (body.required !== undefined) req.required = body.required;
    if (body.isMultiSelect !== undefined) req.isMultiSelect = body.isMultiSelect;
    if (Array.isArray(body.options)) req.options = body.options;
    return NextResponse.json({ ok: true, requirement: req });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const store = getAdminStore();
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id || !kind) {
    return NextResponse.json({ ok: false, error: "Missing id or kind" }, { status: 400 });
  }

  if (kind === "requirement") {
    store.requirements = store.requirements.filter((r) => r.id !== id);
    return NextResponse.json({ ok: true });
  }

  if (kind === "category") {
    store.categories = store.categories.filter((c) => c.id !== id);
    return NextResponse.json({ ok: true });
  }

  if (kind === "addon") {
    store.addons = store.addons.filter((a) => a.id !== id);
    return NextResponse.json({ ok: true });
  }

  if (kind === "reset_requirements") {
    store.requirements = createDefaultRequirements();
    return NextResponse.json({ ok: true, requirements: store.requirements });
  }

  if (kind === "product") {
    store.products = store.products.filter((p) => p.id !== id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid kind" }, { status: 400 });
}
