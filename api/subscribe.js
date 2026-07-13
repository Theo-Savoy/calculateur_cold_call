module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let body = request.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ error: 'Invalid JSON' }); }
  }

  const email = (body.email || '').trim().toLowerCase();
  const at = email.indexOf('@');
  const dot = email.lastIndexOf('.');
  const emailOk = at > 0 && dot > at + 1 && dot < email.length - 1;
  if (!emailOk) {
    return response.status(400).json({ valid: false, error: 'Adresse email invalide.' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const abstractKey = process.env.ABSTRACT_API_KEY;

  if (!token || !baseId || !tableId) {
    return response.status(500).json({ valid: false, error: 'Airtable non configure' });
  }

  try {
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=LOWER({Email})='${email}'&maxRecords=1`;
    const searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${token}` } });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.records && searchData.records.length > 0) {
        return response.status(200).json({ valid: true, duplicate: true });
      }
    }

    const verdict = await verifyEmail(email, abstractKey);

    if (!verdict.pass) {
      return response.status(400).json({ valid: false, error: verdict.error });
    }

    const fields = {
      'Email': email,
      'Timestamp': new Date().toISOString(),
      'UserAgent': request.headers['user-agent'] || '',
      'Referer': request.headers['referer'] || '',
      'EmailStatus': verdict.status
    };

    const createUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return response.status(500).json({ valid: false, error: 'Storage error', detail: errText });
    }

    return response.status(200).json({ valid: true, status: verdict.status, source: verdict.source });
  } catch (err) {
    return response.status(500).json({ valid: false, error: 'Server error', detail: err.message });
  }
};

async function verifyEmail(email, abstractKey) {
  // Couche 1: disposable (debounce, gratuit, ~126ms)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('https://disposable.debounce.io/?email=' + encodeURIComponent(email), { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const d = await r.json();
      if (d.disposable === true) {
        return { pass: false, status: 'undeliverable', error: 'Adresse email temporaire non autorisee.' };
      }
    }
  } catch (e) { }

  // Couche 2: MX du domaine (DNS-over-HTTPS Google, gratuit, ~60ms)
  const domain = email.split('@')[1];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=MX', { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const d = await r.json();
      const hasMx = d.Answer && d.Answer.some(a => a.type === 15);
      if (!hasMx) {
        return { pass: false, status: 'undeliverable', error: 'Domaine email sans serveur de messagerie.' };
      }
    }
  } catch (e) { }

  // Couche 3: AbstractAPI Email Reputation (SMTP complet) si clé présente
  if (abstractKey) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://emailreputation.abstractapi.com/v1/?api_key=' + abstractKey + '&email=' + encodeURIComponent(email), { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) {
        const v = await r.json();
        const status = (v.email_deliverability && v.email_deliverability.status || '').toLowerCase();
        if (status === 'deliverable') {
          return { pass: true, status: 'deliverable', source: 'abstract' };
        }
        if (status === 'undeliverable') {
          return { pass: false, status: 'undeliverable', error: 'Cette adresse email n\'existe pas.' };
        }
        // unknown -> on laisse passer avec flag
        return { pass: true, status: 'risky', source: 'abstract' };
      }
    } catch (e) { }
  }

  return { pass: true, status: 'unchecked', source: 'free' };
}
