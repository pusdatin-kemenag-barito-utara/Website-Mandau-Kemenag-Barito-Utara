const CACHE_VERSION = "si-mandau-v3.0.0";
const STATIC_CACHE = `mandau-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mandau-runtime-${CACHE_VERSION}`;

// Pre-cached critical assets
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/mandau.png",
  "/kemenag.svg"
];

// Offline HTML fallback with enterprise glassmorphism design and auto-reconnect detection
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Koneksi Terputus | SI MANDAU Kemenag Barito Utara</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #090d16;
      color: #f1f5f9;
      padding: 1.5rem;
      position: relative;
      overflow-x: hidden;
    }
    .bg-mesh {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 15%, rgba(16, 185, 129, 0.15), transparent 60%),
        radial-gradient(circle at 80% 85%, rgba(14, 165, 233, 0.1), transparent 50%);
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, #000 60%, transparent 100%);
    }
    .card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 2rem;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(16, 185, 129, 0.15);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.25);
      color: #fb7185;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1.75rem;
      transition: all 0.3s ease;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f43f5e;
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.5; }
    }
    .icon-container {
      position: relative;
      width: 88px;
      height: 88px;
      margin: 0 auto 1.5rem;
    }
    .icon-glow {
      position: absolute;
      inset: -4px;
      border-radius: 1.5rem;
      background: rgba(16, 185, 129, 0.25);
      filter: blur(12px);
      animation: pulse-glow 3s infinite alternate;
    }
    @keyframes pulse-glow {
      0% { opacity: 0.4; transform: scale(0.95); }
      100% { opacity: 0.8; transform: scale(1.05); }
    }
    .icon-box {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 1.5rem;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon-box img {
      width: 52px;
      height: 52px;
      border-radius: 0.75rem;
      object-contain: contain;
    }
    .wifi-badge {
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e11d48;
      border: 2px solid #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 10px rgba(225, 29, 72, 0.5);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.6rem;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.75rem;
    }
    .diagnostic-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      text-align: left;
      margin-bottom: 1.75rem;
    }
    @media (max-width: 480px) {
      .diagnostic-grid { grid-template-columns: 1fr; }
    }
    .diagnostic-item {
      padding: 0.85rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
    }
    .item-num {
      width: 22px;
      height: 22px;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .item-title { font-size: 0.75rem; font-weight: 700; color: #e2e8f0; }
    .item-desc { font-size: 0.7rem; color: #64748b; margin-top: 2px; line-height: 1.3; }
    .btn-group {
      display: flex;
      gap: 0.75rem;
    }
    @media (max-width: 400px) {
      .btn-group { flex-direction: column; }
    }
    .btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
      color: white;
      border: none;
      padding: 0.9rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: inherit;
      border-radius: 1rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 10px 20px -5px rgba(5, 150, 105, 0.4);
      transition: all 0.2s ease;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
      transform: translateY(-2px);
      box-shadow: 0 14px 25px -5px rgba(5, 150, 105, 0.5);
    }
    .btn-primary:active { transform: translateY(0); }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.9rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: inherit;
      border-radius: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      transform: translateY(-2px);
    }
    .footer-text {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.7rem;
      font-weight: 600;
      color: #475569;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="bg-grid"></div>

  <div class="card">
    <div class="badge" id="status-badge">
      <span class="badge-dot" id="badge-dot"></span>
      <span id="badge-text">Offline Mode • SI MANDAU</span>
    </div>

    <div class="icon-container">
      <div class="icon-glow"></div>
      <div class="icon-box">
        <img src="/mandau.png" alt="SI MANDAU">
      </div>
      <div class="wifi-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2" y1="2" x2="22" y2="22"></line>
          <path d="M8.5 16.5a5 5 0 0 1 7 0"></path>
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65"></path>
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"></path>
          <path d="M5 12.86a10 10 0 0 1 5.17-2.39"></path>
          <path d="M19 12.86c-.52-.39-1.07-.74-1.66-1.03"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
    </div>

    <h1>Koneksi Internet Terputus</h1>
    <p>Perangkat Anda sedang tidak terhubung ke jaringan. SI MANDAU memerlukan sambungan internet aktif untuk sinkronisasi persuratan & validasi sesi.</p>

    <div class="diagnostic-grid">
      <div class="diagnostic-item">
        <div class="item-num">1</div>
        <div>
          <div class="item-title">Periksa Jaringan</div>
          <div class="item-desc">Pastikan WiFi atau data seluler aktif.</div>
        </div>
      </div>
      <div class="diagnostic-item">
        <div class="item-num">2</div>
        <div>
          <div class="item-title">Auto-Reconnect</div>
          <div class="item-desc">Memuat ulang otomatis saat sinyal pulih.</div>
        </div>
      </div>
    </div>

    <div class="btn-group">
      <button class="btn-primary" onclick="retryConnection()" id="retry-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span>Coba Muat Ulang</span>
      </button>
      <a href="/" class="btn-secondary">Beranda</a>
    </div>

    <div class="footer-text">
      Kantor Kementerian Agama Kabupaten Barito Utara
    </div>
  </div>

  <script>
    function retryConnection() {
      const btn = document.getElementById("retry-btn");
      if (btn) {
        btn.innerHTML = '<span>Menghubungkan...</span>';
        btn.style.opacity = '0.8';
      }
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }

    // Auto-detect when internet returns
    window.addEventListener("online", function () {
      const badge = document.getElementById("status-badge");
      const dot = document.getElementById("badge-dot");
      const text = document.getElementById("badge-text");
      if (badge && dot && text) {
        badge.style.background = "rgba(16, 185, 129, 0.2)";
        badge.style.borderColor = "rgba(16, 185, 129, 0.4)";
        badge.style.color = "#34d399";
        dot.style.background = "#34d399";
        text.innerText = "Koneksi Pulih! Memuat Halaman...";
      }
      setTimeout(() => {
        window.location.reload();
      }, 600);
    });
  </script>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
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

// Support instant update triggers from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass API requests, mutations, and direct backend ports (Network Only)
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

  // 2. Static Assets (Google Fonts, Images, Astro Bundles, PDF Worker): Cache-first with Stale-while-revalidate
  const isStatic =
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.startsWith("/_astro/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".mjs") ||
    url.pathname.endsWith(".css");

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(request)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkRes));
              }
            })
            .catch(() => {});
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

