// TutuSave service worker.
//
// This exists only so the app meets Android's "Add to Home Screen"
// installability requirements. It intentionally caches nothing:
// financial data must always come from the network, never a cache.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler that calls respondWith() -> every request always
// falls through to the network exactly as if there were no service
// worker at all.
