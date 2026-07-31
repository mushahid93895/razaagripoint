const CACHE_NAME = "rap-cache-v3"; // 🔴 Har baar bada update dene par is number ko badhao (v3 -> v4 -> v5...)

const APP_ASSETS = [
  "/razaagripoint/",
  "/razaagripoint/index.html",
  "/razaagripoint/manifest.json"
];

// Install: naye assets cache karo, aur naya SW turant activate hone ke liye ready rakho
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting(); // naya version turant "waiting" state se nikal kar activate ho jaye
});

// Activate: purane version ka cache delete karo, turant control le lo
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch:
// - HTML pages (navigation) => NETWORK FIRST -> hamesha latest content, sirf offline hone par cache se
// - baaki assets (css/js/images) => CACHE FIRST + background update -> fast load + offline support
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
