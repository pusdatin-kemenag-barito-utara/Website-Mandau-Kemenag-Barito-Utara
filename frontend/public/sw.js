const CACHE_VERSION = "si-mandau-v2.1.0";
const STATIC_CACHE = `mandau-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mandau-runtime-${CACHE_VERSION}`;

// Pre-cached critical assets
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/mandau.png",
  "/kemenag.svg"
];

// Offline HTML fallback
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SI MANDAU - Sedang Offline</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0b0f19; color: #f1f5f9; text-align: center; padding: 1.5rem; }
    .card { max-width: 420px; background: #1e293b; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: #34d399; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
    button { background: #059669; color: white; border: none; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 700; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; }
    button:hover { background: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <img src="/mandau.png" alt="SI MANDAU" width="72" height="72" style="margin-bottom: 1rem; border-radius: 1rem;">
    <h1>Koneksi Internet Terputus</h1>
    <p>Aplikasi SI MANDAU memerlukan sambungan internet untuk sinkronisasi surat terbaru ke server.</p>
    <button onclick="window.location.reload()">Coba Muat Ulang</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass API requests and non-GET requests (Network Only)
  if (request.method !== "GET" || url.pathname.startsWith("/api/") || url.port === "8080") {
    return;
  }

  // 1. Navigation Requests: Network-first with Cache and Offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 2. Static Assets (Google Fonts, Images, Astro Bundles): Cache-first with Stale-while-revalidate
  const isStatic =
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.startsWith("/_astro/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".mjs");

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkRes));
            }
          }).catch(() => {});
          return cached;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

