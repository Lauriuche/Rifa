// Este é o código mínimo para o navegador reconhecer como um PWA instalável
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado!');
});

self.addEventListener('fetch', (event) => {
    // Deixa o navegador fazer as requisições normalmente
});
