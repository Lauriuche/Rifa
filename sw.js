
const CACHE_VERSION = 'v3.04.0-ga4';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html'))
    e.respondWith(fetch(r).catch(() => caches.match(r)));
});
