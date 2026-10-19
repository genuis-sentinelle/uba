#!/usr/bin/env node
/**
 * ARCHIVA UBA — Script de Récupération / Maintenance du Super Administrateur
 * Exécution locale uniquement avec clé secrète de service
 * 
 * Usage :
 *   node scripts/recover-superadmin.mjs <nouveauMotDePasse>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\x1b[31m[ERREUR] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.\x1b[0m');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function recover() {
  const newPassword = process.argv[2];
  if (!newPassword || newPassword.length < 10) {
    console.error('\x1b[31m[ERREUR] Veuillez spécifier un nouveau mot de passe d\'au moins 10 caractères.\x1b[0m');
    console.error('Usage: node scripts/recover-superadmin.mjs <nouveauMotDePasse>');
    process.exit(1);
  }

  const { data: superAdminProfile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, nom_complet')
    .eq('role', 'super_admin')
    .maybeSingle();

  if (profErr || !superAdminProfile) {
    console.error('\x1b[31m[ERREUR] Aucun compte Super Administrateur trouvé en base.\x1b[0m');
    process.exit(1);
  }

  console.log(`\x1b[34m[ARCHIVA UBA]\x1b[0m Réinitialisation du mot de passe pour ${superAdminProfile.nom_complet} (${superAdminProfile.email})...`);

  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(superAdminProfile.id, {
    password: newPassword
  });

  if (authErr) {
    console.error('\x1b[31m[ERREUR Auth]\x1b[0m', authErr.message);
    process.exit(1);
  }

  await supabaseAdmin.from('audit_logs').insert({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
    user_id: superAdminProfile.id,
    user_name: 'Système / Maintenance',
    user_role: 'system',
    action: 'Maintenance Sécurité',
    details: `Mot de passe du Super Administrateur réinitialisé par script de maintenance.`,
    category: 'systeme'
  });

  console.log('\x1b[32m[SUCCÈS] Mot de passe du Super Administrateur réinitialisé avec succès.\x1b[0m');
}

recover().catch(err => {
  console.error('\x1b[31m[ERREUR FATALE]\x1b[0m', err);
  process.exit(1);
});
