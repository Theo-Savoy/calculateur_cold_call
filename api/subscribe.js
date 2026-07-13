const { Redis } = require('@upstash/redis');

let redis = null;
function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let body = request.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ error: 'Invalid JSON' }); }
  }

  const email = (body.email || '').trim().toLowerCase();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return response.status(400).json({ error: 'Email invalide' });
  }

  try {
    const r = getRedis();
    const exists = await r.get(`email:${email}`);
    if (exists) {
      return response.status(200).json({ ok: true, duplicate: true });
    }

    const entry = {
      email,
      ts: new Date().toISOString(),
      ua: request.headers['user-agent'] || '',
      ref: request.headers['referer'] || '',
    };
    await r.set(`email:${email}`, entry);
    await r.lpush('emails:list', email);

    return response.status(200).json({ ok: true });
  } catch (err) {
    return response.status(500).json({ error: 'Storage error: ' + (err.message || 'unknown') });
  }
};
