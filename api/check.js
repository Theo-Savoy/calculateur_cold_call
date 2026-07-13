module.exports = async function handler(request, response) {
  const bigshieldKey = process.env.BIGSHIELD_API_KEY;

  if (!bigshieldKey) {
    return response.status(200).json({ error: 'BIGSHIELD_API_KEY not set' });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('https://www.bigshield.app/api/v1/validate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + bigshieldKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@gmail.com', wait: true }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const body = await r.text();

    return response.status(200).json({
      status: r.status,
      ok: r.ok,
      body: body.substring(0, 2000),
      headers: Object.fromEntries(r.headers.entries()),
      keyLength: bigshieldKey.length,
      keyPrefix: bigshieldKey.substring(0, 12),
      keySuffix: bigshieldKey.substring(bigshieldKey.length - 4),
      keyHasNewline: bigshieldKey.includes('\n'),
      keyHasSpace: bigshieldKey.includes(' '),
      keyTrimmedLength: bigshieldKey.trim().length
    });
  } catch (e) {
    return response.status(200).json({
      error: e.message,
      errorName: e.name,
      keyLength: bigshieldKey.length
    });
  }
};
