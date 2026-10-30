/**
 * Trecho para adicionar no server.js (Render)
 * POST /api/admin-auth  body: { pin: "...." }
 * Compara com PIN salvo no Firebase config e aplica rate limit por IP.
 */
/*
const pinAttempts = new Map(); // ip -> { fails, lockUntil }

app.post('/api/admin-auth', express.json(), async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const st = pinAttempts.get(ip) || { fails: 0, lockUntil: 0 };
  if (now < st.lockUntil) {
    return res.status(429).json({ ok: false, error: 'locked', retryMin: Math.ceil((st.lockUntil - now) / 60000) });
  }
  const pin = String(req.body?.pin || '').trim();
  if (!pin) return res.status(400).json({ ok: false, error: 'pin_required' });
  try {
    const snap = await admin.database().ref('rifa_master/config/pin').once('value');
    const real = String(snap.val() || '').trim();
    if (!real || pin !== real) {
      st.fails += 1;
      if (st.fails >= 5) { st.lockUntil = now + 30 * 60 * 1000; st.fails = 0; }
      pinAttempts.set(ip, st);
      return res.status(401).json({ ok: false, error: 'invalid', fails: st.fails });
    }
    pinAttempts.set(ip, { fails: 0, lockUntil: 0 });
    return res.json({ ok: true, token: 'session-ok', exp: now + 7 * 24 * 60 * 60 * 1000 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'server' });
  }
});
*/
