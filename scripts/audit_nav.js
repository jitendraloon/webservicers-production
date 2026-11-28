const fs = require("fs");
const path = require("path");

const root = "C:/Users/jiten/Desktop/Gemini/Webservicers/src/app";

function getRoutes(dir, base = "") {
  let res = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith("(") && e.name.endsWith(")")) {
        res = res.concat(getRoutes(full, base));
      } else {
        res = res.concat(getRoutes(full, base + "/" + e.name));
      }
    } else if (e.name.startsWith("page.")) {
      res.push(base || "/");
    }
  }
  return res;
}
const all = new Set(getRoutes(root));

const sidebarLinks = [
  // Admin
  "/admin", "/admin/orders", "/admin/fulfillment", "/admin/providers", "/admin/incidents",
  "/admin/services", "/admin/pricing", "/admin/billing", "/admin/coupons", "/admin/wallet",
  "/admin/seo", "/admin/seo/keywords", "/admin/seo/ai-visibility", "/admin/seo/audits", "/admin/seo/tools",
  "/admin/customers", "/admin/tickets", "/admin/affiliates", "/admin/announcements",
  "/admin/team", "/admin/audit-logs", "/admin/security", "/admin/api-keys", "/admin/settings",
  "/admin/automations", "/admin/cron", "/admin/health", "/admin/maintenance",
  // Dashboard
  "/dashboard", "/dashboard/pricing",
  "/dashboard/smm/new", "/dashboard/smm/orders", "/dashboard/smm/services",
  "/dashboard/seo", "/dashboard/seo/health", "/dashboard/seo/ranks",
  "/dashboard/seo/keywords", "/dashboard/seo/serp", "/dashboard/seo/competitors", "/dashboard/seo/backlinks",
  "/dashboard/seo/ai-visibility", "/dashboard/seo/citations", "/dashboard/seo/prompts",
  "/dashboard/seo/audit", "/dashboard/seo/on-page", "/dashboard/seo/schema",
  "/dashboard/seo/writer", "/dashboard/seo/briefs", "/dashboard/seo/meta-studio",
  "/dashboard/orders", "/dashboard/invoices", "/dashboard/billing",
  "/dashboard/website", "/dashboard/integrations", "/dashboard/support",
  // Marketing & Legal
  "/", "/about", "/services", "/pricing", "/help", "/tools", "/contact", "/terms", "/privacy", "/cookies", "/legal", "/kb", "/login", "/register", "/portal"
];

const unhandled = sidebarLinks.filter(l => !all.has(l));
console.log("Unhandled links from navbars & sidebars (" + unhandled.length + "):");
unhandled.forEach(u => console.log(" -> " + u));
