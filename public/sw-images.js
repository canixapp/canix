/// <reference lib="webworker" />

const CACHE_NAME = 'petcao-images-v2';
const MAX_CACHE_SIZE = 200; // Max cached images

// Match Supabase storage URLs and common image extensions
const isImageRequest = (url) => {
  const u = new URL(url);
  // Supabase storage
  if (u.pathname.includes('/storage/v1/object/')) return true;
  // Common image extensions
  if (/\.(png|jpe?g|gif|webp|svg|ico|avif)(\?.*)?$/i.test(u.pathname)) return true;
  return false;
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Trim cache to prevent excessive storage
async function trimCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_SIZE) {
    // Remove oldest entries (FIFO)
    const toDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET image requests
  if (request.method !== 'GET' || !isImageRequest(request.url)) return;

  event.respondWith(
    // Stale-while-revalidate: serve cache immediately, update in background
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      
      // Background fetch to update cache
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          // Periodically trim
          if (Math.random() < 0.1) trimCache();
        }
        return response;
      }).catch(() => {
        // Network failed, return cached or fallback
        return cached || new Response(
          Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), c => c.charCodeAt(0)),
          { headers: { 'Content-Type': 'image/png' } }
        );
      });

      // Return cached version immediately if available, otherwise wait for network
      return cached || fetchPromise;
    })
  );
});
