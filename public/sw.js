// A self-cleaning service worker that unregisters any active service workers on localhost in development mode.
// In production, it does nothing (acts as a no-op) to avoid browser overhead.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  const isDev = self.location.hostname === "localhost" || 
                self.location.hostname === "127.0.0.1" || 
                self.location.hostname.endsWith(".local");

  if (isDev) {
    console.log("[Service Worker] Development environment detected. Unregistering self to clean browser cache...");
    self.registration.unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url) {
            client.navigate(client.url);
          }
        });
      })
      .catch((err) => {
        console.error("[Service Worker] Failed to unregister:", err);
      });
  } else {
    console.log("[Service Worker] Production environment detected. Active but no-op.");
  }
});
