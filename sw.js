const CACHE_VERSION = 'v4.4.0-melhorias-1-20';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async()=>{
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || req.destination === 'document' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');
  if (isHTML) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
