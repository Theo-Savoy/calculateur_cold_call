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
    return response.status(400).json({ error: 'Email invalide' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;

  if (!token || !baseId || !tableId) {
    return response.status(500).json({ error: 'Airtable non configure' });
  }

  try {
    // Verifier si l'email existe deja (dedup)
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=LOWER({Email})='${email}'&maxRecords=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.records && searchData.records.length > 0) {
        return response.status(200).json({ ok: true, duplicate: true });
      }
    }

    // Creer le record
    const createUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'Email': email,
            'Timestamp': new Date().toISOString(),
            'UserAgent': request.headers['user-agent'] || '',
            'Referer': request.headers['referer'] || ''
          }
        }]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return response.status(500).json({ error: 'Airtable error', detail: errText });
    }

    return response.status(200).json({ ok: true });
  } catch (err) {
    return response.status(500).json({ error: 'Server error', detail: err.message });
  }
};
