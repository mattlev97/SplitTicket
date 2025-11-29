// service-worker.js
const CACHE_NAME = 'splitticket-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/config.js',
    '/js/db.js',
    '/js/optimizer.js',
    '/js/ui.js',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Evento di installazione: apre la cache e aggiunge i file principali.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento fetch: intercetta le richieste di rete.
// Strategia: Cache First. Cerca nella cache, se non trova, va in rete.
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se la risorsa è in cache, la restituisce
                if (response) {
                    return response;
                }
                // Altrimenti, la richiede alla rete
                return fetch(event.request);
            })
    );
});

// Evento activate: pulisce le vecchie cache.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});