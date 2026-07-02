const CACHE = 'epress-cache-v3';
const STATIC_ASSETS = ['/', '/offline'];
const API_CACHE = 'epress-api-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (e.request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(e.request).then((response) => {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(() => caches.match(e.request).then((cached) => cached || new Response(JSON.stringify({ message: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })))
      )
    );
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/').then((cached) =>
        fetch(e.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
