/* service-worker.js
   Simple service worker implementing:
   - Cache-first for static assets
   - Network-first for /api-like endpoints (not used now)
   - Cache versioning
*/

const CACHE_NAME = 'split-ticket-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.webmanifest',
  '/src/app.js',
  '/src/optimizer.js',
  '/src/db.js',
  '/src/barcode.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  // cleanup old caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Network-first for POST (data sync), cache-first for GET static
  if (req.method !== 'GET'){
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // optionally put in cache
        if (req.url.startsWith(self.location.origin)){
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});