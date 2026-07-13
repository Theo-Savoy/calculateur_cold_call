module.exports = async function handler(request, response) {
  const abstractKey = process.env.ABSTRACT_API_KEY;
  const bsKey = process.env.BIGSHIELD_API_KEY;

  const out = { abstractKeySet: !!abstractKey, bigshieldKeySet: !!bsKey };

  // Test disposable debounce
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('https://disposable.debounce.io/?email=test@mailinator.com', { signal: ctrl.signal });
    clearTimeout(t);
    out.debounce = r.ok ? await r.json() : { error: r.status };
  } catch (e) { out.debounce = { error: e.message }; }

  // Test MX DNS
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('https://dns.google/resolve?name=gmail.com&type=MX', { signal: ctrl.signal });
    clearTimeout(t);
    const d = await r.json();
    out.mxGmail = { ok: r.ok, hasMx: !!(d.Answer && d.Answer.some(a => a.type === 15)) };
  } catch (e) { out.mxGmail = { error: e.message }; }

  // Test AbstractAPI si clé
  if (abstractKey) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://emailvalidation.abstractapi.com/v1/?api_key=' + abstractKey + '&email=test@gmail.com', { signal: ctrl.signal });
      clearTimeout(t);
      out.abstract = { status: r.status, body: (await r.text()).substring(0, 500) };
    } catch (e) { out.abstract = { error: e.message }; }
  }

  return response.status(200).json(out);
};
