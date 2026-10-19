import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { assertAllowedOrigin } from '../_lib/cors';
import { validatePassword, validateEmail } from '../_lib/validators';

export default async function handler(req: any, res: any) {
  if (!assertAllowedOrigin(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { email, password, nomComplet, titre } = body || {};

  if (!nomComplet || typeof nomComplet !== 'string' || !nomComplet.trim() || !validateEmail(email)) {
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
    return res.status(500).json({ error: err.message || 'Configuration serveur manquante.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verrou atomique : réussit une seule fois dans toute la vie du projet
  const { data: claimed, error: claimErr } = await admin
    .from('system_state')
    .update({ super_admin_created: true, locked_at: new Date().toISOString() })
    .eq('id', true)
    .eq('super_admin_created', false)
    .select('id');

  if (claimErr) {
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification du verrou : ' + claimErr.message });
  }

  if (!claimed || claimed.length === 0) {
    return res.status(403).json({ error: 'Initialisation déjà effectuée : la création est définitivement verrouillée.' });
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
      throw new Error(authErr?.message || 'Création Supabase Auth impossible.');
    }
    userId = created.user.id;

    // 3. Création du profil (l'index unique uq_single_super_admin est la seconde barrière de sécurité)
    const { error: profErr } = await admin.from('profiles').insert({
      id: userId,
      nom_complet: nomComplet.trim(),
      email: normalizedEmail,
      role: 'super_admin',
      titre: (titre || 'Super Administrateur des Archives UBA').trim(),
      actif: true
    });

    if (profErr) {
      throw new Error(profErr.message);
    }

    await admin.from('system_state').update({ super_admin_id: userId }).eq('id', true);

    await admin.from('audit_logs').insert({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
      user_id: userId,
      user_name: nomComplet.trim(),
      user_role: 'super_admin',
      action: 'Initialisation Système',
      details: 'Création du Super Administrateur unique et verrouillage définitif.',
      category: 'systeme'
    });

    return res.status(201).json({
      success: true,
      message: 'Super Administrateur créé avec succès. La création publique est désormais verrouillée.'
    });
  } catch (e: any) {
    // Annulation complète (rollback) pour permettre un réessai légitime si la création auth/profil a échoué
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    await admin
      .from('system_state')
      .update({ super_admin_created: false, locked_at: null, super_admin_id: null })
      .eq('id', true);

    return res.status(500).json({ error: `Échec de l'initialisation (opération annulée) : ${e.message}` });
  }
}
