import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const password = process.env.SUPABASE_DB_PASSWORD || process.env.PGPASSWORD || '';
const host = process.env.SUPABASE_DB_HOST || 'db.ahukxrgkpwfvxwtqelcw.supabase.co';

async function tryConnect(config) {
  const client = new Client({
    ...config,
    connectionTimeoutMillis: 5000
  });
  try {
    await client.connect();
    console.log(`\x1b[32m[SUCCÈS]\x1b[0m Connecté à ${config.host}:${config.port} (${config.user}) !`);
    return client;
  } catch (err) {
    console.warn(`Échec connexion à ${config.host}:${config.port} :`, err.message);
    try { await client.end(); } catch { }
    return null;
  }
}

async function run() {
  console.log('--- EXÉCUTION DE LA MIGRATION SUR SUPABASE ---');

  const poolerRegions = [
    process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-eu-west-3.pooler.supabase.com',
    'aws-0-af-south-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-east-2.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com'
  ];

  let client = null;

  // 1. Essai direct db host port 5432 & 6543
  for (const port of [5432, 6543]) {
    console.log(`Essai direct ${host}:${port}...`);
    client = await tryConnect({
      user: 'postgres',
      password: password,
      host: host,
      port: port,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
    if (client) break;
  }

  // 2. Essai des poolers Supabase IPv4 (mode session 5432 puis transaction 6543)
  if (!client) {
    for (const pooler of poolerRegions) {
      console.log(`Essai pooler ${pooler}...`);
      for (const port of [5432, 6543]) {
        client = await tryConnect({
          user: 'postgres.ahukxrgkpwfvxwtqelcw',
          password: password,
          host: pooler,
          port: port,
          database: 'postgres',
          ssl: { rejectUnauthorized: false }
        });
        if (client) break;
      }
      if (client) break;
    }
  }

  if (!client) {
    console.error('\x1b[31m[ERREUR]\x1b[0m Impossible d\'établir la connexion PostgreSQL.');
    process.exit(1);
  }

  try {
    const sqlPath = path.resolve('supabase', 'DEPLOY_SUPABASE_ALL_IN_ONE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Application du script DEPLOY_SUPABASE_ALL_IN_ONE.sql (' + sql.length + ' octets)...');
    await client.query(sql);
    console.log('\x1b[32m[SUCCÈS]\x1b[0m Script SQL de migration globale appliqué avec succès sur Supabase !');

    // Vérification de la fonction is_bootstrap_locked()
    const checkRes = await client.query('SELECT public.is_bootstrap_locked() AS locked;');
    console.log('Vérification is_bootstrap_locked() :', checkRes.rows[0]);

    // Vérification de la table system_state
    const stateRes = await client.query('SELECT * FROM public.system_state;');
    console.log('Contenu de system_state :', stateRes.rows);

    // Vérification de archive_snapshots
    const archRes = await client.query('SELECT count(*) FROM public.archive_snapshots;');
    console.log('Table archive_snapshots prête, nombre de lignes :', archRes.rows[0].count);

  } catch (err) {
    console.error('\x1b[31m[ERREUR SQL]\x1b[0m', err);
  } finally {
    await client.end();
  }
}

run();
