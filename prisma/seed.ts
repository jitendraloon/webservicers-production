import { PackageTier, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SERVICES } from "../src/data/services";

const prisma = new PrismaClient();

async function seedRoles() {
  const rolesData = [
    {
      name: "Super Admin",
      description: "Full administrative access across all modules",
      permissions: [{ module: "*", action: "*" }],
    },
    {
      name: "Support Agent",
      description: "Manage customer tickets, orders, and knowledge base",
      permissions: [
        { module: "tickets", action: "*" },
        { module: "orders", action: "read" },
        { module: "customers", action: "read" },
        { module: "kb", action: "*" },
      ],
    },
    {
      name: "SEO Specialist",
      description: "Manage SEO projects, audits, rank tracking, and reports",
      permissions: [
        { module: "seo", action: "*" },
        { module: "reports", action: "*" },
      ],
    },
    {
      name: "Billing Manager",
      description: "Manage invoices, payments, coupons, and cash vault",
      permissions: [
        { module: "billing", action: "*" },
        { module: "payments", action: "*" },
        { module: "coupons", action: "*" },
      ],
    },
  ];

  const roleMap = new Map<string, string>();

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: {
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      },
    });
    roleMap.set(r.name, role.id);

    for (const perm of r.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_module_action: {
            roleId: role.id,
            module: perm.module,
            action: perm.action,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          module: perm.module,
          action: perm.action,
        },
      });
    }
  }

  return roleMap;
}

async function seedUsers(roleMap: Map<string, string>) {
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const clientPasswordHash = await bcrypt.hash("Client@123456", 12);

  await prisma.user.upsert({
    where: { email: "admin@webservicers.com" },
    update: {
      name: "System Administrator",
      role: "ADMIN",
      roleGroupId: roleMap.get("Super Admin") ?? null,
      status: "ACTIVE",
    },
    create: {
      name: "System Administrator",
      email: "admin@webservicers.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      roleGroupId: roleMap.get("Super Admin") ?? null,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "client@webservicers.com" },
    update: {
      name: "Demo Customer",
      role: "USER",
      status: "ACTIVE",
    },
    create: {
      name: "Demo Customer",
      email: "client@webservicers.com",
      passwordHash: clientPasswordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedCatalog() {
  const categories = [
    { name: "Presence", slug: "presence", sortOrder: 1 },
    { name: "Promote", slug: "promote", sortOrder: 2 },
    { name: "Analytics", slug: "analytics", sortOrder: 3 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.name, record.id);
  }

  const tierMap: Record<"Standard" | "Growth" | "Enterprise", PackageTier> = {
    Standard: "STANDARD",
    Growth: "GROWTH",
    Enterprise: "ENTERPRISE",
  };

  for (let i = 0; i < SERVICES.length; i++) {
    const svc = SERVICES[i];
    const categoryId = categoryMap.get(svc.category) ?? null;

    const product = await prisma.product.upsert({
      where: { slug: svc.slug },
      update: {
        categoryId,
        name: svc.name,
        type: svc.slug === "social-media-marketing" ? "SMM" : "SERVICE",
        description: svc.description,
        shortDescription: svc.tagline,
        status: "ACTIVE",
        featured: i < 4,
        sortOrder: i + 1,
      },
      create: {
        categoryId,
        name: svc.name,
        slug: svc.slug,
        type: svc.slug === "social-media-marketing" ? "SMM" : "SERVICE",
        description: svc.description,
        shortDescription: svc.tagline,
        status: "ACTIVE",
        featured: i < 4,
        sortOrder: i + 1,
      },
    });

    for (let tIdx = 0; tIdx < svc.tiers.length; tIdx++) {
      const tier = svc.tiers[tIdx];
      const prismaTier = tierMap[tier.name];
      const priceCents = BigInt(Math.round(tier.priceUsd * 100));

      const existingPkg = await prisma.productPackage.findFirst({
        where: { productId: product.id, tier: prismaTier },
      });

      if (existingPkg) {
        await prisma.productPackage.update({
          where: { id: existingPkg.id },
          data: {
            name: tier.name,
            priceCents,
            currency: "USD",
            billingCycle: "MONTHLY",
            features: tier.features,
            isPopular: Boolean(tier.popular),
            sortOrder: tIdx + 1,
          },
        });
      } else {
        await prisma.productPackage.create({
          data: {
            productId: product.id,
            tier: prismaTier,
            name: tier.name,
            priceCents,
            currency: "USD",
            billingCycle: "MONTHLY",
            features: tier.features,
            isPopular: Boolean(tier.popular),
            sortOrder: tIdx + 1,
          },
        });
      }
    }
  }
}

async function seedPaymentGateways() {
  const gateways = [
    { slug: "wallet", name: "Account Wallet", enabled: true, sortOrder: 1 },
    { slug: "stripe", name: "Stripe", enabled: false, sortOrder: 2 },
    { slug: "paypal", name: "PayPal", enabled: false, sortOrder: 3 },
    { slug: "razorpay", name: "Razorpay", enabled: false, sortOrder: 4 },
    { slug: "payu", name: "PayU", enabled: false, sortOrder: 5 },
    { slug: "cashfree", name: "Cashfree", enabled: false, sortOrder: 6 },
    { slug: "coinpayments", name: "CoinPayments", enabled: false, sortOrder: 7 },
    {
      slug: "bank_manual",
      name: "Bank / Manual Transfer",
      enabled: true,
      sortOrder: 8,
    },
  ];

  for (const gw of gateways) {
    await prisma.paymentGateway.upsert({
      where: { slug: gw.slug },
      update: { name: gw.name, isBuiltin: true, sortOrder: gw.sortOrder },
      create: {
        slug: gw.slug,
        name: gw.name,
        isBuiltin: true,
        enabled: gw.enabled,
        sortOrder: gw.sortOrder,
      },
    });
  }
}

async function seedCurrencies() {
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar", exchangeRateToUsd: 1 },
    { code: "EUR", symbol: "€", name: "Euro", exchangeRateToUsd: 0.92 },
    { code: "GBP", symbol: "£", name: "British Pound", exchangeRateToUsd: 0.79 },
    { code: "INR", symbol: "₹", name: "Indian Rupee", exchangeRateToUsd: 84 },
    { code: "AUD", symbol: "A$", name: "Australian Dollar", exchangeRateToUsd: 1.52 },
    { code: "CAD", symbol: "CA$", name: "Canadian Dollar", exchangeRateToUsd: 1.38 },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan", exchangeRateToUsd: 7.25 },
  ];

  for (const cur of currencies) {
    await prisma.currency.upsert({
      where: { code: cur.code },
      update: {
        symbol: cur.symbol,
        name: cur.name,
        exchangeRateToUsd: cur.exchangeRateToUsd,
        enabled: true,
      },
      create: {
        ...cur,
        enabled: true,
      },
    });
  }
}

async function seedIntegrations() {
  const initialIntegrations: Array<{
    category: string;
    provider: string;
    enabled: boolean;
  }> = [
    // Mail
    { category: "mail", provider: "smtp", enabled: false },
    { category: "mail", provider: "sendgrid", enabled: false },
    { category: "mail", provider: "mailgun", enabled: false },
    { category: "mail", provider: "ses", enabled: false },
    { category: "mail", provider: "mailchimp_transactional", enabled: false },
    // SMS
    { category: "sms", provider: "twilio", enabled: false },
    { category: "sms", provider: "vonage", enabled: false },
    // Storage
    { category: "storage", provider: "local", enabled: true },
    { category: "storage", provider: "ftp", enabled: false },
    { category: "storage", provider: "r2", enabled: false },
    { category: "storage", provider: "s3", enabled: false },
    // Captcha
    { category: "captcha", provider: "recaptcha", enabled: false },
    { category: "captcha", provider: "turnstile", enabled: false },
    { category: "captcha", provider: "hcaptcha", enabled: false },
    // AI
    { category: "ai", provider: "gemini", enabled: false },
    { category: "ai", provider: "openai", enabled: false },
    { category: "ai", provider: "anthropic", enabled: false },
    { category: "ai", provider: "grok", enabled: false },
    { category: "ai", provider: "mistral", enabled: false },
    { category: "ai", provider: "llama", enabled: false },
    // SEO
    { category: "seo", provider: "seranking", enabled: false },
    { category: "seo", provider: "dataforseo", enabled: false },
    { category: "seo", provider: "mangools", enabled: false },
    { category: "seo", provider: "serper", enabled: false },
    { category: "seo", provider: "semrush", enabled: false },
    { category: "seo", provider: "ahrefs", enabled: false },
  ];

  for (const item of initialIntegrations) {
    await prisma.integration.upsert({
      where: {
        category_provider: {
          category: item.category,
          provider: item.provider,
        },
      },
      update: {},
      create: {
        category: item.category,
        provider: item.provider,
        enabled: item.enabled,
      },
    });
  }
}

async function main() {
  const roleMap = await seedRoles();
  await seedUsers(roleMap);
  await seedCatalog();
  await seedPaymentGateways();
  await seedCurrencies();
  await seedIntegrations();
  console.log("Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
