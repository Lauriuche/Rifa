const CACHE_VERSION='v4.6.0-progress-upsell';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode==='navigate'||(r.headers.get('accept')||'').includes('text/html'))e.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match(r)))});
