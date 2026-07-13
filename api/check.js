module.exports = async function handler(request, response) {
  const bigshieldKey = process.env.BIGSHIELD_API_KEY;
  if (!bigshieldKey) return response.status(200).json({ error: 'no key' });

  const results = {};

  // 1. Usage endpoint
  try {
    const r1 = await fetch('https://www.bigshield.app/api/v1/usage', {
      headers: { 'Authorization': 'Bearer ' + bigshieldKey }
    });
    results.usage = { status: r1.status, body: (await r1.text()).substring(0, 500) };
  } catch (e) { results.usage = { error: e.message }; }

  // 2. Validate with real email
  try {
    const r2 = await fetch('https://www.bigshield.app/api/v1/validate', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + bigshieldKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@gmail.com' })
    });
    results.validate = { status: r2.status, body: (await r2.text()).substring(0, 500) };
  } catch (e) { results.validate = { error: e.message }; }

  // 3. Domain score (public, no auth)
  try {
    const r3 = await fetch('https://www.bigshield.app/api/v1/domain-score?domain=gmail.com');
    results.domainScore = { status: r3.status, body: (await r3.text()).substring(0, 300) };
  } catch (e) { results.domainScore = { error: e.message }; }

  return response.status(200).json(results);
};
