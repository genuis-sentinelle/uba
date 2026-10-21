import { createClient } from '@supabase/supabase-js';

function validateEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pwd?: string, role: string = 'stagiaire'): string | null {
  if (!pwd || typeof pwd !== 'string') return 'Mot de passe obligatoire.';
  const minLen = role === 'stagiaire' ? 8 : 10;
  if (pwd.length < minLen) return `Le mot de passe doit comporter au moins ${minLen} caractères.`;
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return 'Le mot de passe doit comporter au moins une lettre et un chiffre.';
  return null;
}

function applyCors(req: any, res: any): boolean {
  const allowed = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://uba-rapport.vercel.app,https://archiva-uba.vercel.app';
  const origins = allowed.split(',').map(o => o.trim().toLowerCase());
  const origin = (req.headers?.origin || '').trim().toLowerCase();
  res.setHeader('Access-Control-Allow-Origin', (origin && origins.includes(origin)) ? req.headers.origin : (origins[0] || '*'));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    const error: any = new Error('Configuration serveur incomplète : variable manquante (voir /api/health).');
    error.statusCode = 500;
    throw error;
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (typeof body !== 'object' || body === null) body = {};
  } catch {
    return res.status(400).json({ error: 'Format JSON invalide dans le corps de la requête.' });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const nomComplet = typeof body.nomComplet === 'string' ? body.nomComplet.trim().slice(0, 150) : '';
  const titre = typeof body.titre === 'string' ? body.titre.trim().slice(0, 150) : 'Super Administrateur';
  const password = body.password;

  if (!nomComplet || !validateEmail(email)) {
    return res.status(400).json({ error: 'Nom complet et adresse e-mail valides obligatoires.' });
  }

  const pwdError = validatePassword(password, 'super_admin');
  if (pwdError) {
    return res.status(400).json({ error: pwdError });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Configuration serveur manquante.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verrou atomique : réussit une seule fois dans toute la vie du projet
  try {
    const { data: claimed, error: claimErr } = await admin
      .from('system_state')
      .update({ super_admin_created: true, locked_at: new Date().toISOString() })
      .eq('id', true)
      .eq('super_admin_created', false)
      .select('id');

    if (claimErr) {
      // Si la table system_state n'existe pas encore, vérifier dans profiles
      const { data: existingSuper } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1);

      if (existingSuper && existingSuper.length > 0) {
        return res.status(403).json({ error: 'Initialisation déjà effectuée : la création est définitivement verrouillée.' });
      }
    } else if (!claimed || claimed.length === 0) {
      return res.status(403).json({ error: 'Initialisation déjà effectuée : la création est définitivement verrouillée.' });
    }
  } catch {
    // Continuer vers la création
  }

  let userId: string | null = null;
  try {
    // 2. Création dans Supabase Auth
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { nom_complet: nomComplet.trim(), titre: titre?.trim() || 'Super Administrateur des Archives UBA' }
    });

    if (authErr || !created?.user) {
      throw new Error(authErr?.message || 'Impossible de créer le compte utilisateur dans Supabase Auth.');
    }

    userId = created.user.id;

    // 3. Création du profil super_admin
    const { error: profErr } = await admin.from('profiles').upsert({
      id: userId,
      nom_complet: nomComplet.trim(),
      email: normalizedEmail,
      role: 'super_admin',
      titre: (titre || 'Super Administrateur des Archives UBA').trim(),
      actif: true
    });

    if (profErr) {
      throw new Error('Erreur profil : ' + profErr.message);
    }

    // 4. Mettre à jour system_state
    await admin.from('system_state').update({
      super_admin_created: true,
      super_admin_id: userId,
      locked_at: new Date().toISOString()
    }).eq('id', true);

    // 5. Audit log
    await admin.from('audit_logs').insert({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
      user_id: userId,
      user_name: nomComplet.trim(),
      user_role: 'super_admin',
      action: 'Initialisation Système',
      details: 'Création du Super Administrateur unique.',
      category: 'systeme'
    });

    return res.status(201).json({
      success: true,
      message: 'Super Administrateur créé avec succès. La création est maintenant définitivement verrouillée.'
    });
  } catch (err: any) {
    console.error('[ARCHIVA API] Bootstrap error:', err);
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    try {
      await admin.from('system_state').update({
        super_admin_created: false,
        locked_at: null,
        super_admin_id: null
      }).eq('id', true);
    } catch {
      // Ignorer
    }

    return res.status(500).json({
      error: 'Échec de l\'initialisation du Super Administrateur.'
    });
  }
}
