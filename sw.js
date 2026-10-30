const CACHE_VERSION = 'v4.5.0-logo-hold';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req=e.request;
  if(req.mode==='navigate'||(req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
  }
});
