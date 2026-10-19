import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { authenticateCaller } from '../_lib/authMiddleware';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit';

export default async function handler(req: any, res: any) {
  // CORS & Options
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Anti-brute-force & limitation de débit
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`admin-users-${clientIp}`, 40, 60000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Trop de requêtes administratives. Veuillez patienter avant de réessayer.',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
  }

  // 2. Authentification obligatoire de l'appelant
  let caller;
  try {
    caller = await authenticateCaller(req);
  } catch (err: any) {
    return res.status(err.statusCode || 401).json({ error: err.message || 'Authentification requise.' });
  }

  // Seuls les administrateurs et super administrateurs ont accès à cet endpoint
  if (caller.profile.role !== 'super_admin' && caller.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // -------------------------------------------------------------
  // GET : Lister tous les utilisateurs et profils
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, nom_complet, email, role, titre, actif, created_at, updated_at, blocked_at, blocked_by')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs : ' + error.message });
      }

      const users = (profiles || []).map((p: any) => ({
        id: p.id,
        nomComplet: p.nom_complet,
        email: p.email,
        role: p.role,
        titre: p.titre || 'Archiviste Opérationnel',
        actif: p.actif,
        dateCreation: p.created_at,
        blockedAt: p.blocked_at,
        blockedBy: p.blocked_by
      }));

      return res.status(200).json({ success: true, users });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
    }
  }

  // -------------------------------------------------------------
  // POST : Création atomique d'un utilisateur (Auth + Profil)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { email, password, nomComplet, role, titre } = body || {};

      if (!email || !password || !nomComplet || !role) {
        return res.status(400).json({
          error: 'Les champs nomComplet, email, password et role sont obligatoires.'
        });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          error: 'Le mot de passe doit comporter au moins 6 caractères.'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const validRoles = ['super_admin', 'admin', 'stagiaire'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide.' });
      }

      // RÈGLE MATRICE D'HABILITATION :
      // - Super Admin : peut créer stagiaire, admin, super_admin
      // - Admin : peut créer stagiaire, admin. INTERDIT de créer super_admin
      if (role === 'super_admin' && caller.profile.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Seul un Super Administrateur a le droit de créer ou promouvoir un Super Administrateur.'
        });
      }

      // 1. Vérifier si un profil existe déjà avec cet email
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        return res.status(409).json({
          error: 'Un utilisateur avec cette adresse email existe déjà.'
        });
      }

      // 2. Création dans auth.users de Supabase
      const { data: authCreated, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          nom_complet: nomComplet.trim(),
          titre: (titre || '').trim()
        },
        app_metadata: {
          role: role
        }
      });

      if (authCreateError || !authCreated?.user) {
        return res.status(400).json({
          error: 'Échec de la création dans Supabase Auth : ' + (authCreateError?.message || 'Erreur inconnue')
        });
      }

      const newUserId = authCreated.user.id;

      // 3. Création atomique dans public.profiles avec le même UUID
      const { data: profileCreated, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUserId,
          nom_complet: nomComplet.trim(),
          email: normalizedEmail,
          role: role,
          titre: (titre || 'Archiviste Opérationnel').trim(),
          actif: true,
          created_by: caller.profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      // Compensation en cas d'échec sur le profil pour garantir l'atomicité
      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
        return res.status(500).json({
          error: 'Échec de création du profil (opération annulée) : ' + profileError.message
        });
      }

      // 4. Journal d'audit immuable
      await supabaseAdmin.from('audit_logs').insert({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_id: caller.profile.id,
        user_name: caller.profile.nom_complet,
        user_role: caller.profile.role,
        action: 'Création Utilisateur',
        details: `Création du compte ${nomComplet.trim()} (${role}, ${normalizedEmail}) par ${caller.profile.nom_complet}`,
        category: 'utilisateur'
      });

      return res.status(201).json({
        success: true,
        message: `Compte de ${nomComplet.trim()} créé avec succès.`,
        user: {
          id: profileCreated.id,
          nomComplet: profileCreated.nom_complet,
          email: profileCreated.email,
          role: profileCreated.role,
          titre: profileCreated.titre,
          actif: profileCreated.actif,
          dateCreation: profileCreated.created_at
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
