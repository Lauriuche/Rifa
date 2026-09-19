# Rifa Master — versão dividida

A estrutura visual e os IDs da página foram preservados.

## Arquivos

- `index.html`: estrutura da página.
- `assets/css/styles.css`: estilos incorporados anteriormente no HTML.
- `assets/js/app.js`: lógica principal da aplicação.
- `assets/js/pwa.js`: instalação, atualização e service worker do PWA.

Mantenha a pasta `img/` no mesmo nível de `index.html`. Abra/publice `index.html` pela raiz do site.

A divisão melhora manutenção e cache; ela não reduz automaticamente o peso total baixado na primeira visita. Para isso, use compressão HTTP, minificação e carregamento sob demanda.
