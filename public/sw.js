const CACHE = "mc-v1";
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const scope = self.registration.scope; // https://apel-s-in.github.io/music-connections/
    const root = new URL("./", scope).pathname.replace(/\/$/, "");
    const precache = [
      `${root}/`,
      `${root}/index.html`,
      `${root}/timeline/`,
      `${root}/graph/`,
      `${root}/map/`,
      `${root}/manifest.webmanifest`,
      `${root}/geo/world.json`
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
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // SWR для данных/гео
  if (url.pathname.endsWith(".json")) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then(resp => {
        cache.put(e.request, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }
  // cache-first для статики
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
