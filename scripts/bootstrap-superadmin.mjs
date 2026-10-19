#!/usr/bin/env node
/**
 * ARCHIVA UBA — Script d'amorçage contrôlé du Super Administrateur
 * Exécution hors-navigateur avec clé secrète de service
 * 
 * Usage :
 *   node scripts/bootstrap-superadmin.mjs [email] [motDePasse] [nomComplet] [titre]
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Chargement de l'environnement depuis .env s'il existe
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('\x1b[31m[ERREUR] URL Supabase manquante (SUPABASE_URL ou VITE_SUPABASE_URL non défini).\x1b[0m');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('\x1b[31m[ERREUR] Clé SUPABASE_SERVICE_ROLE_KEY manquante dans l\'environnement ou .env.\x1b[0m');
  console.error('Renseignez SUPABASE_SERVICE_ROLE_KEY=<clé> pour exécuter l\'initialisation du Super Admin.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function bootstrap() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'chef.archives@uba.cg').toLowerCase().trim();
  const password = args[1] || 'SuperAdmin2026!';
  const nomComplet = args[2] || 'Chef d\'équipe des Archives UBA';
  const titre = args[3] || 'Super Administrateur des Archives UBA';

  console.log('\x1b[34m[ARCHIVA UBA]\x1b[0m Vérification des comptes existants...');

  // 1. Vérification si un super administrateur existe déjà
  const { data: existingSuper, error: checkErr } = await supabaseAdmin
    .from('profiles')
    .select('id, nom_complet, email, role, actif')
    .eq('role', 'super_admin')
    .limit(1);

  if (checkErr) {
    console.error('\x1b[31m[ERREUR]\x1b[0m Impossible d\'interroger la table profiles :', checkErr.message);
    process.exit(1);
  }

  if (existingSuper && existingSuper.length > 0) {
    console.log(
      `\x1b[33m[ATTENTION]\x1b[0m Un compte Super Administrateur existe déjà : ${existingSuper[0].nom_complet} (${existingSuper[0].email}).`
    );
    console.log('L\'initialisation a été ignorée pour préserver l\'intégrité des accès.');
    process.exit(0);
  }

  console.log(`\x1b[34m[ARCHIVA UBA]\x1b[0m Création du compte Super Administrateur : ${nomComplet} (${email})...`);

  // 2. Création dans auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom_complet: nomComplet, titre },
    app_metadata: { role: 'super_admin' }
  });

  if (authError || !authData?.user) {
    console.error('\x1b[31m[ERREUR Auth]\x1b[0m', authError?.message || 'Erreur inconnue');
    process.exit(1);
  }

  const userId = authData.user.id;

  // 3. Création dans public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      nom_complet: nomComplet,
      email: email,
      role: 'super_admin',
      titre: titre,
      actif: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (profileError) {
    console.error('\x1b[31m[ERREUR Profil]\x1b[0m', profileError.message);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // 4. Inscription dans le journal d'audit
  await supabaseAdmin.from('audit_logs').insert({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user_id: userId,
    user_name: nomComplet,
    user_role: 'super_admin',
    action: 'Initialisation Système',
    details: `Amorçage sécurisé du Super Administrateur (${email}) hors-navigateur.`,
    category: 'systeme'
  });

  console.log('\x1b[32m[SUCCÈS]\x1b[0m Compte Super Administrateur créé avec succès !');
  console.log(`  Identifiant : ${email}`);
  console.log(`  Rôle : super_admin`);
  console.log(`  UUID : ${userId}`);
}

bootstrap().catch(err => {
  console.error('\x1b[31m[ERREUR FATALE]\x1b[0m', err);
  process.exit(1);
});
