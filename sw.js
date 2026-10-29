
// Force update when config save fix ships
const CACHE_VERSION = 'v3.02.0-save-fix';

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado: ', CACHE_VERSION);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(fetch(req).catch(() => caches.match(req)));
        return;
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
