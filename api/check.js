module.exports = async function handler(request, response) {
  const bigshieldKey = process.env.BIGSHIELD_API_KEY;
  if (!bigshieldKey) return response.status(200).json({ error: 'no key' });

  const results = {};

  // Test avec Bearer
  try {
    const r = await fetch('https://www.bigshield.app/api/v1/usage', {
      headers: { 'Authorization': 'Bearer ' + bigshieldKey }
    });
    results.bearer = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e) { results.bearer = { error: e.message }; }

  // Test avec X-API-Key header (au cas où)
  try {
    const r = await fetch('https://www.bigshield.app/api/v1/usage', {
      headers: { 'X-API-Key': bigshieldKey }
    });
    results.xapikey = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e) { results.xapikey = { error: e.message }; }

  // Test raw key as header value
  try {
    const r = await fetch('https://www.bigshield.app/api/v1/usage', {
      headers: { 'Authorization': bigshieldKey }
    });
    results.rawkey = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e) { results.rawkey = { error: e.message }; }

  results.keyInfo = {
    length: bigshieldKey.length,
    prefix: bigshieldKey.substring(0, 12),
    fullKeyPreview: bigshieldKey.substring(0, 20) + '...'
  };

  return response.status(200).json(results);
};
