// Ozelo service worker — app-shell caching so already-visited screens open
// fast and keep working offline. Bumping CACHE_VERSION invalidates old caches
// on the next deploy.
const CACHE_VERSION = 'ozelo-v1';
const APP_SHELL = [
  '/',
  '/app',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never intercept Supabase/Stripe/etc.

  // Navigations: try the network first (fresh content), fall back to the
  // cached app shell so already-loaded routes still open offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/app', copy));
          return response;
        })
        .catch(() => caches.match('/app').then((cached) => cached ?? caches.match('/')))
    );
    return;
  }

  // Everything else same-origin (JS bundles, icons, fonts): stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? networkFetch;
    })
  );
});
