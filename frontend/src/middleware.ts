import { defineMiddleware } from "astro:middleware";
import type { AuthUser } from "@/lib/api-client";

const AUTH_COOKIE = "sb-esurat-auth-token";
const GO_API_BASE = process.env.GO_API_URL || "http://127.0.0.1:8080";

const PUBLIC_PATHS = new Set(["/login", "/unauthorized", "/maintenance"]);
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
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    `frame-src 'self' blob: http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com ${process.env.PUBLIC_PUSDATIN_URL || ""}`,
    `connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com ${process.env.PUBLIC_PUSDATIN_URL || ""}`,
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

  if (PUBLIC_PATHS.has(pathname) || SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return next();
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

  if (pathname === "/manajemen-surat" && !isSuperAdmin(user)) {
    return context.redirect("/");
  }

  const response = await next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});