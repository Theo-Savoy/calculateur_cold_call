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
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const auth = request.headers['authorization'] || '';
  const expected = 'Bearer ' + (process.env.ADMIN_TOKEN || '');
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const r = getRedis();
    const emails = await r.lrange('emails:list', 0, -1);
    const entries = await Promise.all(
      emails.map(async (email) => {
        const data = await r.get(`email:${email}`);
        return data;
      })
    );

    return response.status(200).json({ count: entries.length, entries });
  } catch (err) {
    return response.status(500).json({ error: 'Storage error' });
  }
};
