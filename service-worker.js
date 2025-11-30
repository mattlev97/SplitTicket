// service-worker.js
const CACHE_NAME = 'splitticket-cache-v2'; // Versione del cache aggiornata
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
const APP_SHELL_FALLBACK = '/index.html';

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

// Evento fetch: intercetta le richieste di rete con una logica migliorata.
self.addEventListener('fetch', event => {
    // Gestisce solo richieste GET.
    if (event.request.method !== 'GET') {
        return;
    }

    // Per le richieste di navigazione (apertura di una pagina), usa una strategia "network-first".
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Se la risposta è un 404, restituisce l'app shell dalla cache.
                    if (response.status === 404) {
                        return caches.match(APP_SHELL_FALLBACK);
                    }
                    return response;
                })
                .catch(() => {
                    // Se la rete fallisce (offline), restituisce l'app shell dalla cache.
                    return caches.match(APP_SHELL_FALLBACK);
                })
        );
        return;
    }

    // Per tutte le altre richieste (CSS, JS, immagini), usa una strategia "cache-first" per velocità.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se è in cache, la restituisce.
                if (response) {
                    return response;
                }
                // Altrimenti, la richiede alla rete.
                return fetch(event.request);
            })
    );
});