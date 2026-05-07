const postgres = require('postgres');
const sql = postgres('postgresql://postgres.ykxnxnrcwmlzgsopqlue:Rajuedupulse%4015@aws-0-eu-central-1.pooler.supabase.com:5432/postgres');
sql`SELECT 1 as result`
  .then(res => {
    console.log('Connected!', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
