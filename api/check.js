module.exports = async function handler(request, response) {
  const auth = request.headers['authorization'] || '';
  const expected = 'Bearer ' + (process.env.ADMIN_TOKEN || '');
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const bigshieldKey = process.env.BIGSHIELD_API_KEY;

  // Test direct BigShield
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('https://bigshield.app/api/v1/validate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + bigshieldKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@mailinator.com', wait: false }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const body = await r.text();
    return response.status(200).json({
      bigshieldStatus: r.status,
      bigshieldBody: body,
      keyLength: bigshieldKey.length,
      keyPrefix: bigshieldKey.substring(0, 10)
    });
  } catch (e) {
    return response.status(500).json({ error: e.message });
  }
};
