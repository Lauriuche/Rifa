const CACHE_VERSION='v3.07.0-lote-1-5';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
