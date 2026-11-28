const fs = require("fs");
const path = require("path");

const rootDir = "C:/Users/jiten/Desktop/Gemini/Webservicers";
const srcDir = path.join(rootDir, "src");
const appDir = path.join(srcDir, "app");

// 1. Gather all App Router routes
function getAppRoutes(dir, baseRoute = "") {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        routes = routes.concat(getAppRoutes(fullPath, baseRoute));
      } else if (entry.name.startsWith("@")) {
        continue;
      } else {
        routes = routes.concat(getAppRoutes(fullPath, baseRoute + "/" + entry.name));
      }
    } else if (entry.name === "page.tsx" || entry.name === "page.jsx" || entry.name === "page.js") {
      routes.push(baseRoute === "" ? "/" : baseRoute);
    }
  }
  return routes;
}

const existingRoutes = getAppRoutes(appDir);
console.log(`Found ${existingRoutes.length} actual page.tsx routes defined in src/app`);

// 2. Scan all tsx/ts files for referenced links
function scanLinks(dir) {
  let links = new Set();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      scanLinks(fullPath).forEach(l => links.add(l));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const regex = /(?:href|push|redirect)\s*[:=(]\s*["'`](\/(?:admin|dashboard|[a-z0-9\-_]+)[^"'`\s\?#]*)["'`]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        let link = match[1].trim().replace(/\/$/, "");
        if (!link.startsWith("/api") && !link.startsWith("/_next") && !link.includes("${") && !link.match(/\.(png|jpg|svg|ico)$/)) {
          links.add(link || "/");
        }
      }
    }
  }
  return links;
}

const referencedLinks = Array.from(scanLinks(srcDir)).sort();
console.log(`Found ${referencedLinks.length} distinct links referenced in UI components`);

// 3. Match referenced links to routes
function matchRoute(link, routes) {
  for (const route of routes) {
    if (route === link) return true;
    const routeParts = route.split("/").filter(Boolean);
    const linkParts = link.split("/").filter(Boolean);
    if (routeParts.length === linkParts.length) {
      let match = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith("[") && routeParts[i].endsWith("]")) {
          continue;
        }
        if (routeParts[i] !== linkParts[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

const missing = [];
for (const link of referencedLinks) {
  if (!matchRoute(link, existingRoutes)) {
    missing.push(link);
  }
}

console.log("\n=== MISSING REFERENCED ROUTES (" + missing.length + ") ===");
missing.forEach(m => console.log(" - " + m));
