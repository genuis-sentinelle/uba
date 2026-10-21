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
const poolerHost = process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-central-1.pooler.supabase.com';

async function tryConnect(config) {
  const client = new Client(config);
  try {
    await client.connect();
    console.log(`Connecté avec succès à ${config.host}:${config.port} !`);
    return client;
  } catch (err) {
    console.warn(`Échec connexion à ${config.host}:${config.port} :`, err.message);
    try { await client.end(); } catch { }
    return null;
  }
}

async function run() {
  console.log('--- EXÉCUTION DE LA MIGRATION SUR SUPABASE ---');

  // Essai 1 : Direct host port 5432
  let client = await tryConnect({
    user: 'postgres',
    password: password,
    host: host,
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  // Essai 2 : Direct host port 6543 (transaction mode)
  if (!client) {
    client = await tryConnect({
      user: 'postgres',
      password: password,
      host: host,
      port: 6543,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  }

  // Essai 3 : Pooler IPv4 Supabase (eu-central-1 / global pooler)
  if (!client) {
    client = await tryConnect({
      user: 'postgres.ahukxrgkpwfvxwtqelcw',
      password: password,
      host: poolerHost,
      port: 6543,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  }

  // Essai 4 : Pooler IPv4 Supabase (us-east-1 / standard pooler)
  if (!client) {
    client = await tryConnect({
      user: 'postgres.ahukxrgkpwfvxwtqelcw',
      password: password,
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  }

  // Essai 5 : Pooler IPv4 Supabase (session mode port 5432)
  if (!client) {
    client = await tryConnect({
      user: 'postgres.ahukxrgkpwfvxwtqelcw',
      password: password,
      host: poolerHost,
      port: 5432,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
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
