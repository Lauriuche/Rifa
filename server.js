const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

let db = null;

// ---------- Firebase Admin ----------
try {
    if (process.env.FIREBASE_CREDENTIALS) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DB_URL || 'https://vagner-34d5b.firebaseio.com'
            });
        }
        console.log('🔥 Firebase Admin OK');
        db = admin.database();
    } else {
        console.warn('⚠️ FIREBASE_CREDENTIALS não configurado no Render — webhook não grava no Firebase');
    }
} catch (error) {
    console.error('Erro Firebase:', error.message);
}

function resolveDbPath(tenant, rifa) {
    if (!tenant || tenant === 'rifa_master') return 'rifa_master';
    return `tenants/${tenant}/rifas/${rifa || 'padrao'}`;
}

/**
 * Marca cotas do order_nsu como paid (ou donated se for doação).
 */
async function confirmOrder(dbPath, nsu, meta = {}) {
    if (!db || !nsu) return 0;
    const numRef = db.ref(`${dbPath}/numeros`);
    const numSnap = await numRef.once('value');
    const numeros = numSnap.val() || {};

    const updates = {};
    let count = 0;

    Object.entries(numeros).forEach(([num, data]) => {
        if (!data || String(data.order_nsu) !== String(nsu)) return;
        // reserved ou donated_pending
        if (data.status === 'reserved' || data.status === 'donated_pending') {
            const isDoacao = !!data.item_doacao;
            updates[`${num}/status`] = isDoacao ? 'donated' : 'paid';
            updates[`${num}/paidAt`] = Date.now();
            if (meta.paymentId) updates[`${num}/payment_id`] = String(meta.paymentId);
            if (meta.gateway) updates[`${num}/gateway`] = meta.gateway;
            count++;
        }
    });

    if (count > 0) {
        await numRef.update(updates);
        console.log(`✅ NSU ${nsu} → ${count} cotas confirmadas (${meta.gateway || 'mp'})`);
    } else {
        console.log(`ℹ️ NSU ${nsu} — nenhuma cota pendente encontrada em ${dbPath}`);
    }

    try {
        await db.ref(`${dbPath}/payment_logs`).push({
            order_nsu: nsu,
            cotas: count,
            at: Date.now(),
            ...meta
        });
    } catch (_) {}

    return count;
}

// ==========================================
// HEALTH
// ==========================================
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        firebase: !!db,
        time: new Date().toISOString()
    });
});

app.get('/', (_req, res) => {
    res.json({ service: 'Rifa Master Backend', health: '/health' });
});

// ==========================================
// CRIAR PIX — Mercado Pago
// ==========================================
app.post('/api/create-pix', async (req, res) => {
    try {
        const { tenantId, rifaId, payData, mpToken } = req.body || {};
        if (!mpToken) return res.status(400).json({ error: 'mpToken obrigatório' });
        if (!payData || !payData.priceCents) return res.status(400).json({ error: 'payData.priceCents obrigatório' });

        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const payment = new Payment(client);

        const backendUrl = process.env.BACKEND_URL || process.env.PUBLIC_URL || 'https://rifa-1-m8tv.onrender.com';
        // Mantém tenant/rifa na query para o webhook saber onde gravar
        const webhookUrl = `${backendUrl}/api/webhook?tenant=${encodeURIComponent(tenantId || 'rifa_master')}&rifa=${encodeURIComponent(rifaId || 'padrao')}`;

        const request = {
            transaction_amount: Number(payData.priceCents) / 100,
            description: String(payData.description || 'Cotas da rifa').slice(0, 200),
            payment_method_id: 'pix',
            payer: {
                email: payData.email || 'cliente@rifamaster.com.br',
                first_name: String(payData.nome || 'Cliente').split(' ')[0]
            },
            external_reference: String(payData.nsu || ''),
            notification_url: webhookUrl
        };

        const result = await payment.create({ body: request });

        res.json({
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            ticket_url: result.point_of_interaction?.transaction_data?.ticket_url || null,
            expiration: result.date_of_expiration || null
        });
    } catch (error) {
        console.error('Erro MP create-pix:', error?.message || error);
        const msg = error?.message || 'Erro ao gerar PIX';
        res.status(500).json({ error: msg });
    }
});

// ==========================================
// CHECAR STATUS PIX (polling + confirma se aprovado)
// ==========================================
app.get('/api/check-status/:id', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ status: null, error: 'token obrigatório' });

        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: req.params.id });

        // Fallback: se o webhook falhou, o polling também confirma
        if (paymentInfo.status === 'approved' && paymentInfo.external_reference && db) {
            try {
                // Tenta achar em rifa_master; se o frontend mandar tenant depois, melhor
                // Aqui usamos path padrão; o webhook é a via principal
                const tenant = req.query.tenant || 'rifa_master';
                const rifa = req.query.rifa || 'padrao';
                const dbPath = resolveDbPath(tenant, rifa);
                await confirmOrder(dbPath, paymentInfo.external_reference, {
                    gateway: 'mercadopago',
                    paymentId: paymentInfo.id,
                    via: 'check-status'
                });
            } catch (e) {
                console.warn('check-status confirm:', e.message);
            }
        }

        res.json({
            status: paymentInfo.status,
            id: paymentInfo.id,
            external_reference: paymentInfo.external_reference
        });
    } catch (e) {
        console.error('check-status:', e.message);
        res.status(500).json({ status: 'error' });
    }
});

// ==========================================
// INFINITEPAY — criar link
// ==========================================
app.post('/api/create-infinitepay', async (req, res) => {
    try {
        const body = req.body || {};
        const payData = body.payData || body;
        const handle = String(body.handle || '').replace(/^[@$]+/, '');
        if (!handle) return res.status(400).json({ error: 'handle obrigatório' });

        const backendUrl = process.env.BACKEND_URL || process.env.PUBLIC_URL || 'https://rifa-1-m8tv.onrender.com';
        const payload = {
            handle,
            order_nsu: payData.nsu || body.order_nsu,
            redirect_url: body.redirect_url,
            webhook_url: body.webhook_url || `${backendUrl}/api/webhook-infinitepay`,
            customer: body.customer || {
                name: payData.nome,
                phone_number: payData.telefone ? '55' + String(payData.telefone).replace(/\D/g, '') : undefined,
                email: payData.email || 'cliente@rifamaster.com.br'
            },
            items: body.items || [{
                quantity: 1,
                price: payData.priceCents,
                description: payData.description || 'Cotas da rifa'
            }]
        };

        const response = await fetch('https://api.checkout.infinitepay.io/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.url || data.checkout_url) {
            res.json({ url: data.url || data.checkout_url, slug: data.slug || null });
        } else {
            console.warn('InfinitePay resposta:', data);
            res.status(400).json({ error: 'Erro na API InfinitePay', details: data });
        }
    } catch (e) {
        console.error('create-infinitepay:', e.message);
        res.status(500).json({ error: 'Erro interno InfinitePay' });
    }
});

// ==========================================
// WEBHOOK MERCADO PAGO
// Aceita: /api/webhook e /api/webhook/mercadopago
// ==========================================
async function handleMercadoPagoWebhook(req, res) {
    // Responde rápido (MP exige)
    res.status(200).send('OK');

    try {
        if (!db) {
            console.warn('[Webhook MP] Firebase offline — ignore');
            return;
        }

        const { tenant, rifa } = req.query;
        const body = req.body || {};

        // Formatos que o MP envia
        const action = body.action || body.type || body.topic || '';
        const paymentId = body.data?.id || body.id || body['data.id'];

        console.log('[Webhook MP]', { action, paymentId, tenant, rifa });

        const isPayment =
            String(action).toLowerCase().includes('payment') ||
            body.topic === 'payment' ||
            !!paymentId;

        if (!isPayment || !paymentId) return;

        const dbPath = resolveDbPath(tenant, rifa);

        // Token: preferência da config da rifa; fallback env
        let mpToken = process.env.MP_ACCESS_TOKEN || null;
        try {
            const configSnap = await db.ref(`${dbPath}/config`).once('value');
            const config = configSnap.val();
            if (config?.mpToken) mpToken = config.mpToken;
        } catch (_) {}

        if (!mpToken) {
            console.error('[Webhook MP] sem mpToken');
            return;
        }

        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status !== 'approved') {
            console.log(`[Webhook MP] payment ${paymentId} status=${paymentInfo.status}`);
            return;
        }

        const nsu = paymentInfo.external_reference;
        await confirmOrder(dbPath, nsu, {
            gateway: 'mercadopago',
            paymentId: paymentInfo.id,
            amount: paymentInfo.transaction_amount
        });
    } catch (error) {
        console.error('[Webhook MP] erro:', error.message);
    }
}

app.post('/api/webhook', handleMercadoPagoWebhook);
app.post('/api/webhook/mercadopago', handleMercadoPagoWebhook);
app.post('/api/webhook-mercadopago', handleMercadoPagoWebhook);

// ==========================================
// WEBHOOK INFINITEPAY
// ==========================================
app.post('/api/webhook-infinitepay', async (req, res) => {
    res.status(200).json({ ok: true });

    try {
        if (!db) {
            console.warn('[Webhook IP] Firebase offline');
            return;
        }

        const body = req.body || {};
        console.log('[Webhook IP]', JSON.stringify(body).slice(0, 400));

        const orderNsu = body.order_nsu || body.orderNsu || body.nsu || body.external_id;
        const status = String(body.status || body.payment_status || '').toLowerCase();
        const paid =
            ['paid', 'approved', 'confirmed', 'success', 'captured', 'completed'].includes(status) ||
            body.paid === true;

        if (!paid || !orderNsu) {
            console.log('[Webhook IP] ignorado status=', status);
            return;
        }

        const tenant = body.tenantId || body.tenant || 'rifa_master';
        const rifa = body.rifaId || body.rifa || 'padrao';
        const dbPath = resolveDbPath(tenant, rifa);

        await confirmOrder(dbPath, orderNsu, {
            gateway: 'infinitepay',
            paymentId: body.transaction_nsu || body.transaction_id || body.id
        });
    } catch (error) {
        console.error('[Webhook IP]', error.message);
    }
});

// ==========================================
// CONFIRMAÇÃO MANUAL (teste)
// Body: { order_nsu, tenant?, rifa?, secret }
// ==========================================
app.post('/api/confirm-order', async (req, res) => {
    try {
        const { order_nsu, tenant, rifa, secret } = req.body || {};
        const adminSecret = process.env.ADMIN_SECRET;
        if (adminSecret && secret !== adminSecret) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        if (!order_nsu) return res.status(400).json({ error: 'order_nsu obrigatório' });
        if (!db) return res.status(503).json({ error: 'Firebase offline' });

        const dbPath = resolveDbPath(tenant || 'rifa_master', rifa || 'padrao');
        const count = await confirmOrder(dbPath, order_nsu, { gateway: 'manual' });
        res.json({ ok: true, cotas_atualizadas: count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT} | Firebase: ${db ? 'OK' : 'OFF'}`);
});
