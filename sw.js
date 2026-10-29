
const CACHE_VERSION='v3.05.0-feed-fict';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
