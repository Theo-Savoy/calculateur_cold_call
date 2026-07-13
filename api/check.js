module.exports = async function handler(request, response) {
  const bigshieldKey = process.env.BIGSHIELD_API_KEY;

  if (!bigshieldKey) {
    return response.status(200).json({
      error: 'BIGSHIELD_API_KEY not set in env',
      keyLength: 0
    });
  }

  // Test direct BigShield
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('https://www.bigshield.app/api/v1/validate', {
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
      status: r.status,
      ok: r.ok,
      body: body.substring(0, 1000),
      keyLength: bigshieldKey.length,
      keyPrefix: bigshieldKey.substring(0, 10)
    });
  } catch (e) {
    return response.status(200).json({
      error: e.message,
      errorName: e.name,
      keyLength: bigshieldKey.length,
      keyPrefix: bigshieldKey.substring(0, 10)
    });
  }
};
