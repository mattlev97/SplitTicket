// /service-worker.js
// Purpose: Simple PWA service worker
// Strategy: cache-first for static assets, network-first for sync endpoints (not used here)
// Register this file in index.html via navigator.serviceWorker.register('/service-worker.js')

const CACHE_NAME = 'splitticket-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/manifest.webmanifest',
  '/src/app.js',
  '/src/ui.js',
  '/src/store.js',
  '/src/optimizer.js',
  '/src/scanner.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // network-first for API-like calls (none), cache-first for static
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      }).catch(() => {
        // fallback: return cached root if any
        return caches.match('/');
      });
    })
  );
});
