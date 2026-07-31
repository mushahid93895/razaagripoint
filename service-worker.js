const CACHE_NAME = "rap-cache"; // Ab is naam ko kabhi badalne ki zarurat nahi

const APP_ASSETS = [
  "/razaagripoint/",
  "/razaagripoint/index.html",
  "/razaagripoint/manifest.json"
];

// Install: shuruaati assets cache karo, naya SW turant activate karo
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

// Activate: turant control le lo (purana cache delete karne ki zarurat nahi,
// kyunki fetch me hum hamesha fresh network response se overwrite karte hain)
self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// Fetch: NETWORK FIRST for everything.
// - Internet available -> hamesha latest file server se aayegi, aur cache
//   background me automatically update ho jayega (koi version number nahi chahiye).
// - Internet band -> jo last cached mila wahi dikha denge (offline support).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
