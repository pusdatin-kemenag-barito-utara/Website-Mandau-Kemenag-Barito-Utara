import { defineMiddleware } from "astro:middleware";
import type { AuthUser } from "@/lib/api-client";

const AUTH_COOKIE = "sb-esurat-auth-token";
const GO_API_BASE = process.env.GO_API_URL || "http://127.0.0.1:8080";

const PUBLIC_PATHS = new Set(["/login", "/unauthorized", "/maintenance", "/offline", "/sitemap.xml", "/robots.txt"]);
const SKIP_PREFIXES = [
  "/api/",
  "/_astro/",
  "/manifest.json",
  "/sw.js",
  "/pdf.worker.min.mjs",
  "/mandau.png",
  "/kemenag.svg",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "X-Powered-By": "Astro, GoFiber",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Alt-Svc": 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Link": "<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin, <https://files.kemenag-baritoutara.com>; rel=preconnect; crossorigin, </mandau.png>; rel=preload; as=image; fetchpriority=high",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.kemenag-baritoutara.com",
    "frame-src 'self' blob: http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com https://www.googletagmanager.com https://pusdatin.kemenag-baritoutara.com https://*.kemenag-baritoutara.com",
    "connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com https://cloudflareinsights.com https://*.cloudflareinsights.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com https://pusdatin.kemenag-baritoutara.com https://*.kemenag-baritoutara.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; "),
};

function isSuperAdmin(user: AuthUser): boolean {
  return Boolean(
    user.is_super_admin ||
      user.isSuper ||
      user.role === "super_admin" ||
      user.role === "Super Admin" ||
      user.email === process.env.SUPER_ADMIN_EMAIL,
  );
}

async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${GO_API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { success?: boolean; data?: AuthUser };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // 1. Enterprise Edge CDN Caching for Vite Bundles
  if (pathname.startsWith("/_astro/")) {
    const response = await next();
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    response.headers.set("Alt-Svc", 'h3=":443"; ma=86400, h3-29=":443"; ma=86400');
    return response;
  }

  // 2. Enterprise Edge CDN Caching for Static Public Assets
  if (
    pathname === "/mandau.png" ||
    pathname === "/kemenag.svg" ||
    pathname === "/pdf.worker.min.mjs" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  ) {
    const response = await next();
    response.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    response.headers.set("Alt-Svc", 'h3=":443"; ma=86400, h3-29=":443"; ma=86400');
    return response;
  }

  // Jika sistem sedang dalam mode maintenance dari Pusdatin, langsung arahkan ke /maintenance
  const isMaintenanceActive = context.cookies.get("sys_maintenance")?.value === "true";
  if (isMaintenanceActive && pathname !== "/maintenance" && !SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return context.redirect("/maintenance");
  }

  if (PUBLIC_PATHS.has(pathname) || SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    const response = await next();
    response.headers.set("Alt-Svc", 'h3=":443"; ma=86400, h3-29=":443"; ma=86400');
    return response;
  }

  const token = context.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return context.redirect("/login");
  }

  const user = await fetchCurrentUser(token);

  if (!user) {
    context.cookies.delete(AUTH_COOKIE);
    return context.redirect("/login");
  }

  context.locals.authToken = token;
  context.locals.user = user;

  if ((pathname.startsWith("/manajemen-surat") || pathname === "/manajemen-pengguna") && !isSuperAdmin(user)) {
    return context.redirect("/");
  }

  const response = await next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});