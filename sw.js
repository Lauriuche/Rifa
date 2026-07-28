// Mude este número da versão sempre que quiser forçar uma atualização no celular dos clientes!
const CACHE_VERSION = 'v2.10.1'; 

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado: ', CACHE_VERSION);
});

self.addEventListener('fetch', (event) => {
    // O site carrega normalmente
});

// AQUI ESTÁ O SEGREDO: Ouve o clique do botão "Atualizar"
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting(); // Força a nova versão a assumir o controle
    }
});
