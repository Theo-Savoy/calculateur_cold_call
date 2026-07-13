module.exports = async function handler(request, response) {
  const abstractKey = process.env.ABSTRACT_API_KEY;
  const out = { abstractKeySet: !!abstractKey };

  // debounce disposable
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('https://disposable.debounce.io/?email=test@mailinator.com', { signal: ctrl.signal });
    clearTimeout(t);
    out.debounce = r.ok ? await r.json() : { error: r.status };
  } catch (e) { out.debounce = { error: e.message }; }

  // AbstractAPI Email Reputation
  if (abstractKey) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://emailreputation.abstractapi.com/v1/?api_key=' + abstractKey + '&email=test@gmail.com', { signal: ctrl.signal });
      clearTimeout(t);
      const v = await r.json();
      out.abstract = {
        status: r.status,
        deliverability: v.email_deliverability ? v.email_deliverability.status : (v.error ? v.error.message : 'n/a')
      };
    } catch (e) { out.abstract = { error: e.message }; }
  }

  return response.status(200).json(out);
};
