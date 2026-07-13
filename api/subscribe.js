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
    return response.status(400).json({ valid: false, error: 'Adresse email invalide.' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const bigshieldKey = process.env.BIGSHIELD_API_KEY;

  if (!token || !baseId || !tableId) {
    return response.status(500).json({ valid: false, error: 'Airtable non configure' });
  }

  try {
    // 1. Deduplication Airtable
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=LOWER({Email})='${email}'&maxRecords=1`;
    const searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${token}` } });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.records && searchData.records.length > 0) {
        return response.status(200).json({ valid: true, duplicate: true });
      }
    }

    // 2. Validation BigShield si cle presente et valide
    let bsStatus = 'unknown';
    let bsScore = 0;
    let bsReason = '';

    if (bigshieldKey) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 800);
        const verifyRes = await fetch('https://bigshield.app/api/v1/validate', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + bigshieldKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, wait: false }),
          signal: ctrl.signal
        });
        clearTimeout(t);
        if (verifyRes.ok) {
          const v = await verifyRes.json();
          bsStatus = v.recommendation || (v.valid ? 'accept' : 'reject');
          bsScore = typeof v.risk_score === 'number' ? v.risk_score : 0;
          bsReason = v.recommendation || '';
        } else if (verifyRes.status === 401) {
          // Cle BigShield pas activee ou invalide - on laisse passer
          bsStatus = 'unchecked';
        }
      } catch (e) {
        bsStatus = 'unchecked';
      }
    }

    // 3. Decision finale
    if (bsStatus === 'reject') {
      return response.status(400).json({
        valid: false,
        error: 'Cette adresse email n\'est pas valide. Utilisez une adresse reelle.'
      });
    }
    if (bsStatus === 'review' && bsScore < 30) {
      return response.status(400).json({
        valid: false,
        error: 'Adresse email a risque. Verifiez la saisie.'
      });
    }

    // 4. Stockage Airtable
    const fields = {
      'Email': email,
      'Timestamp': new Date().toISOString(),
      'UserAgent': request.headers['user-agent'] || '',
      'Referer': request.headers['referer'] || ''
    };

    // EmailStatus selon verdict
    if (bsStatus === 'accept') fields.EmailStatus = 'deliverable';
    else if (bsStatus === 'review') fields.EmailStatus = 'risky';
    else if (bsStatus === 'reject') fields.EmailStatus = 'undeliverable';
    else fields.EmailStatus = 'unchecked';

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

    return response.status(200).json({ valid: true, status: bsStatus });
  } catch (err) {
    return response.status(500).json({ valid: false, error: 'Server error', detail: err.message });
  }
};
