const CACHE = "mc-v2";
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const scope = self.registration.scope;
    // Убираем trailing / у scope и нормализуем root
    const root = scope.replace(/\/$/, "");
    const precache = [
      `${root}/`,
      `${root}/index.html`,
      `${root}/timeline/`,
      `${root}/graph/`,
      `${root}/map/`,
      `${root}/manifest.webmanifest`,
      `${root}/geo/world.json`,
      `${root}/data/connections.json`,
      `${root}/data/search-index.json`
    ];
    const c = await caches.open(CACHE);
    await c.addAll(precache);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Кэшируем JSON с fallback
  if (url.pathname.endsWith(".json")) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(e.request);
      const networkFetch = fetch(e.request).then(resp => {
        if (resp.ok) cache.put(e.request, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || networkFetch;
    })());
    return;
  }
  // Cache-first для остального
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
