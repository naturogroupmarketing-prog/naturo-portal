const CACHE_NAME = "trackio-v3";
const OFFLINE_URL = "/offline";

// Critical pages to cache for offline use
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/trackio_white.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fall back to cache (for pages)
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      return cached || caches.match(OFFLINE_URL);
    }
  },
  // Cache first, fall back to network (for static assets)
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response("Offline", { status: 503 });
    }
  },
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API calls and auth routes
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Static assets — cache first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/) ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }

  // Pages — network first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
});
