const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(
      'SELECT id, email, status, password FROM users WHERE email = $1 LIMIT 1',
      ['admin@posalpro.com']
    );
    if (res.rows.length === 0) {
      console.log('NOT_FOUND');
      return;
    }
    const row = res.rows[0];
    const matches = await bcrypt.compare('ProposalPro2024!', row.password || '');
    console.log(
      JSON.stringify({
        email: row.email,
        status: row.status,
        hashPrefix: (row.password || '').slice(0, 7),
        passwordMatches: matches,
      })
    );
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
}

run();


