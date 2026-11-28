import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/services",
  "/about",
  "/blog",
  "/contact",
  "/careers",
  "/help",
  "/tools",
  "/talk-to-an-expert",
  "/terms",
  "/privacy",
  "/sitemap",
  "/press",
  "/cookie-settings",
  "/website",
  "/website-design",
  "/seo",
  "/google-my-business",
  "/google-search-ads",
  "/google-shopping-ads",
  "/facebook-ads",
  "/instagram-ads",
  "/youtube-ads",
  "/tiktok-marketing",
  "/linkedin-marketing",
  "/android-marketing",
  "/marketing-analytics",
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/install",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api/install/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/blog/")) return true;
  if (pathname.startsWith("/pages/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/fonts/")) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|avif|woff|woff2|ttf|css|js)$/)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie on protected routes
  const sessionToken = request.cookies.get("ws_session")?.value;

  if (!sessionToken) {
    // Redirect to login for dashboard/admin routes
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin routes require admin role check (done server-side in layouts/pages)
  // Here we just ensure the cookie exists
  if (pathname.startsWith("/admin") && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
