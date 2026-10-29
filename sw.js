const CACHE_VERSION = 'v3.03.0-progress-admin';
self.addEventListener('install', (e) => { console.log('SW', CACHE_VERSION); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});
