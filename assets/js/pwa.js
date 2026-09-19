let deferredPrompt;
        const installBanner = document.getElementById('pwa-install-banner');
        const btnSim = document.getElementById('btn-instalar-sim');
        const btnNao = document.getElementById('btn-instalar-nao');

        let newWorker;
        const updateBanner = document.getElementById('pwa-update-banner');
        const btnAtualizar = document.getElementById('btn-atualizar-app');

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').then(reg => {
                    reg.addEventListener('updatefound', () => {
                        newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                updateBanner.style.display = 'flex';
                                if(window.lucide) window.lucide.createIcons();
                            }
                        });
                    });
                }).catch(err => console.log('Erro SW:', err));
            });

            btnAtualizar.addEventListener('click', () => {
                if (newWorker) newWorker.postMessage({ type: 'SKIP_WAITING' });
            });

            let refreshing;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); 
            deferredPrompt = e; 
            installBanner.style.display = 'flex'; 
            if(window.lucide) window.lucide.createIcons(); 
        });

        // Clique em "Baixar"
        btnSim.addEventListener('click', async () => {
            installBanner.style.display = 'none';
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') console.log('Usuário aceitou a instalação');
                deferredPrompt = null;
            }
        });

        // Clique no "X" para fechar
        btnNao.addEventListener('click', () => {
            installBanner.style.display = 'none';
        });

        // Esconde banner se o app for instalado
        window.addEventListener('appinstalled', () => {
            installBanner.style.display = 'none';
            deferredPrompt = null;
        });
