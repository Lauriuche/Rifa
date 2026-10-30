const CACHE_VERSION = 'v4.0.0-completo';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || req.destination === 'document' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isHTML) e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
