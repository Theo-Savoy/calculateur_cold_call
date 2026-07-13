module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const auth = request.headers['authorization'] || '';
  const expected = 'Bearer ' + (process.env.ADMIN_TOKEN || '');
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;

  if (!token || !baseId || !tableId) {
    return response.status(500).json({ error: 'Airtable non configure' });
  }

  try {
    const records = [];
    let offset = null;

    do {
      let url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc`;
      if (offset) url += `&offset=${encodeURIComponent(offset)}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errText = await res.text();
        return response.status(500).json({ error: 'Airtable error', detail: errText });
      }

      const data = await res.json();
      if (data.records) {
        records.push(...data.records.map(r => ({
          id: r.id,
          email: r.fields.Email,
          timestamp: r.fields.Timestamp,
          userAgent: r.fields.UserAgent,
          referer: r.fields.Referer
        })));
      }
      offset = data.offset || null;
    } while (offset);

    return response.status(200).json({ count: records.length, entries: records });
  } catch (err) {
    return response.status(500).json({ error: 'Server error', detail: err.message });
  }
};
