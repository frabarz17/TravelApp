const CACHE_NAME = 'travelapp-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/trips/_active.json',
  '/trips/index.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for trip.json; cache-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Frankfurter API: network-only (no point caching live FX rates)
  if (url.hostname === 'api.frankfurter.app') return;

  // trip.json: stale-while-revalidate
  if (url.pathname.endsWith('trip.json') || url.pathname.endsWith('_active.json')) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(resp => {
    if (resp.ok) cache.put(request, resp.clone());
    return resp;
  }).catch(() => null);
  return cached || fetchPromise;
}

// Cache trip PDFs on demand when PWA sends CACHE_TRIP message
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CACHE_TRIP') {
    const { tripId, assets } = e.data;
    const tripAssets = [
      `/trips/${tripId}/trip.json`,
      ...(assets || []),
    ];
    caches.open(CACHE_NAME).then(cache => {
      tripAssets.forEach(url => {
        fetch(url).then(resp => { if (resp.ok) cache.put(url, resp); }).catch(() => {});
      });
    });
  }
});
