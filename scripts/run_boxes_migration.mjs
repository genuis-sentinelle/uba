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
  console.log('--- APPLICATION DE LA MIGRATION BOXES & CUSTOMIZATION SUR SUPABASE ---');

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

  // 2. Essai des poolers Supabase IPv4
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
    console.warn('[INFO] Connexion directe pooler indisponible depuis ce réseau. Le fichier SQL reste prêt pour le SQL Editor Supabase.');
    return;
  }

  try {
    const sqlPath = path.resolve('supabase', 'migrations', '20261028_boxes_agencies_customization.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Application de 20261028_boxes_agencies_customization.sql (${sql.length} octets)...`);
    await client.query(sql);
    console.log('\x1b[32m[SUCCÈS]\x1b[0m Migration appliquée avec succès sur la base Supabase !');

    const colCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cartons' AND column_name IN ('boites_datees', 'boites_recues', 'statut_tri');
    `);
    console.log('Colonnes ajoutées à la table cartons :', colCheck.rows);
  } catch (err) {
    console.error('\x1b[31m[ERREUR SQL]\x1b[0m', err.message);
  } finally {
    await client.end();
  }
}

run();
