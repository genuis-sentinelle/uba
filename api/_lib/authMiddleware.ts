import { getSupabaseAdmin } from './supabaseAdmin.ts';

export interface AuthenticatedCaller {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    nom_complet: string;
    email: string;
    role: 'super_admin' | 'admin' | 'stagiaire';
    actif: boolean;
  };
}

export async function authenticateCaller(req: any): Promise<AuthenticatedCaller> {
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

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Validation du jeton auprès de Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authData?.user) {
    const error: any = new Error('Session invalide ou expirée. Veuillez vous reconnecter.');
    error.statusCode = 401;
    throw error;
  }

  const authUser = authData.user;

  // 2. Chargement du profil actuel en base (source de vérité immuable)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, nom_complet, email, role, actif')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    const error: any = new Error('Profil utilisateur introuvable sur le serveur.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Vérification formelle du statut actif
  if (profile.actif === false) {
    // Révocation globale immédiate des sessions si le compte a été bloqué
    await supabaseAdmin.auth.admin.signOut(authUser.id, 'global').catch(() => {});
    const error: any = new Error('Ce compte utilisateur a été bloqué par un administrateur. Accès formellement refusé.');
    error.statusCode = 403;
    throw error;
  }

  return {
    user: {
      id: authUser.id,
      email: authUser.email
    },
    profile: {
      id: profile.id,
      nom_complet: profile.nom_complet,
      email: profile.email,
      role: profile.role,
      actif: profile.actif
    }
  };
}
