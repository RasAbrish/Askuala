const CACHE_NAME = "askuala-v2";
const APP_SHELL = [
  "/",
  "/dashboard",
  "/upload",
  "/tutor",
  "/settings",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned)).catch(() => undefined);
          return res;
        })
        .catch(() => cached);
    }),
  );
});
