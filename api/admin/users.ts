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

async function authenticateCaller(req: any) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    const error: any = new Error('Jeton d\'authentification manquant ou format invalide (Bearer token requis).');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    const error: any = new Error('Jeton d\'authentification vide.');
    error.statusCode = 401;
    throw error;
  }

  // Si getSupabaseAdmin() lève une erreur (ex: variables manquantes -> 500), elle est propagée telle quelle
  const supabaseAdmin = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    console.error('[ARCHIVA API] Auth getUser error:', authError);
    const error: any = new Error('Session invalide ou expirée. Veuillez vous reconnecter.');
    error.statusCode = 401;
    throw error;
  }

  const user = authData.user;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, nom_complet, email, role, actif')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[ARCHIVA API] Profile error:', profileError);
    const error: any = new Error('Profil utilisateur introuvable dans la base de données.');
    error.statusCode = 403;
    throw error;
  }

  if (!profile.actif) {
    const error: any = new Error('Ce compte utilisateur a été désactivé ou bloqué.');
    error.statusCode = 403;
    throw error;
  }

  return { user, profile };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentification obligatoire de l'appelant
  let caller;
  try {
    caller = await authenticateCaller(req);
  } catch (err: any) {
    console.error('[ARCHIVA API] Authenticate caller error:', err?.message || err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Authentification requise.' });
  }

  // Seuls les administrateurs et super administrateurs ont accès à cet endpoint
  if (caller.profile.role !== 'super_admin' && caller.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Configuration administrative indisponible.' });
  }

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
        console.error('[ARCHIVA API] Error fetching profiles:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
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
      console.error('[ARCHIVA API] GET users internal error:', err);
      return res.status(500).json({ error: 'Erreur interne lors de la récupération des utilisateurs.' });
    }
  }

  // -------------------------------------------------------------
  // POST : Création atomique d'un utilisateur (Auth + Profil)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      let body: any;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        if (typeof body !== 'object' || body === null) body = {};
      } catch {
        return res.status(400).json({ error: 'Format JSON invalide dans le corps de la requête.' });
      }

      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const password = body.password;
      const nomComplet = typeof body.nomComplet === 'string' ? body.nomComplet.trim().slice(0, 150) : '';
      const role = body.role;
      const titre = typeof body.titre === 'string' ? body.titre.trim().slice(0, 150) : (role === 'admin' ? 'Administrateur' : 'Archiviste Opérationnel');

      if (!nomComplet || !validateEmail(email)) {
        return res.status(400).json({
          error: 'Nom complet et adresse e-mail valides obligatoires.'
        });
      }

      const validRoles = ['admin', 'stagiaire'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Rôle invalide. La création d\'un Super Administrateur est formellement interdite (compte unique).'
        });
      }

      if (caller.profile.role === 'admin' && role !== 'stagiaire') {
        return res.status(403).json({
          error: 'Un administrateur ne peut créer que des comptes stagiaires.'
        });
      }

      const pwdError = validatePassword(password, role);
      if (pwdError) {
        return res.status(400).json({ error: pwdError });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Vérifier si l'email existe déjà dans profiles
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        return res.status(409).json({ error: 'Un compte avec cette adresse email existe déjà.' });
      }

      // 1. Création dans auth.users
      const { data: authCreated, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: { nom_complet: nomComplet.trim(), titre: (titre || '').trim() },
        app_metadata: { role }
      });

      if (authError || !authCreated?.user) {
        console.error('[ARCHIVA API] Auth createUser error:', authError);
        return res.status(400).json({
          error: 'Erreur lors de la création d\'authentification de l\'utilisateur.'
        });
      }

      const newUserId = authCreated.user.id;

      // 2. Création atomique dans public.profiles avec le même UUID
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        nom_complet: nomComplet.trim(),
        email: normalizedEmail,
        role,
        titre: (titre || (role === 'admin' ? 'Administrateur' : 'Archiviste Opérationnel')).trim(),
        actif: true,
        created_by: caller.user.id
      });

      if (profileError) {
        console.error('[ARCHIVA API] Profile insert error:', profileError);
        // Rollback : suppression de l'utilisateur dans auth.users
        await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
        return res.status(500).json({
          error: 'Échec de création du profil (opération annulée).'
        });
      }

      // 3. Journal d'audit immuable
      await supabaseAdmin.from('audit_logs').insert({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
        user_id: caller.user.id,
        user_name: caller.profile.nom_complet,
        user_role: caller.profile.role,
        action: 'Création Utilisateur',
        details: `Création du compte ${nomComplet.trim()} (${normalizedEmail}) avec le rôle ${role}`,
        category: 'utilisateur'
      });

      return res.status(201).json({
        success: true,
        message: `Utilisateur ${nomComplet.trim()} créé avec succès.`,
        user: {
          id: newUserId,
          nomComplet: nomComplet.trim(),
          email: normalizedEmail,
          role,
          titre: (titre || (role === 'admin' ? 'Administrateur' : 'Archiviste Opérationnel')).trim(),
          actif: true
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur interne lors de la création de l\'utilisateur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
