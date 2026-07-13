module.exports = async function handler(request, response) {
  const auth = request.headers['authorization'] || '';
  const expected = 'Bearer ' + (process.env.ADMIN_TOKEN || '');
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;

  try {
    const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'EmailStatus',
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'deliverable' },
            { name: 'risky' },
            { name: 'undeliverable' },
            { name: 'unknown' },
            { name: 'unchecked' }
          ]
        }
      })
    });
    const data = await res.json();
    return response.status(res.ok ? 200 : 500).json(data);
  } catch (err) {
    return response.status(500).json({ error: err.message });
  }
};
