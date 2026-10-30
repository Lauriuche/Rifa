# Checklist Rifa Master — COMPLETO

> Build final: `index-completo.html` · 2026-10-30

## Lotes 1–6 + final ✅

### Conversão e pagamento
- [x] Retomar PIX da reserva (banner)
- [x] Comprovante WhatsApp + baixar .txt
- [x] Prova social ao vivo
- [x] Cupom via URL
- [x] Upsell pós-pagamento
- [x] Meta R$ X de R$ Y
- [x] Preço ao vivo na seleção rápida
- [x] Bloqueio campanha pausada/encerrada/esgotada

### Admin e operação
- [x] Filtro gateway + NSU
- [x] Logs pagamento (Firebase)
- [x] Logs admin + audit ao salvar
- [x] CSV hoje + CSV ganhadores
- [x] Health check backend
- [x] WA pendentes em fila
- [x] Catálogo multi-rifas (`rifas.html`)
- [x] FAQ editável
- [x] Limite cotas por WhatsApp
- [x] PIN 30 min + admin.html com backend opcional

### UX / técnico
- [x] QR maior no mobile
- [x] Modo grade oculta guiado
- [x] Status badge + banner
- [x] SEO/meta dinâmico
- [x] GA4 + Pixel
- [x] Progresso real/induzido
- [x] Compradores fictícios
- [x] SW network-first HTML
- [x] Notificação local no pagamento
- [x] Compartilhar ganhador

### Arquivos para publicar
1. `index-completo.html` → `index.html`
2. `admin.html`
3. `rifas.html` (opcional catálogo)
4. `sw.js`
5. Rules Firebase: `rifa_catalog`, `payment_logs`, `admin_logs` leitura/escrita conforme política
6. Opcional: snippet PIN no server.js do Render
