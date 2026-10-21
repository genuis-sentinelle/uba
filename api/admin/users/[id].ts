import { createClient } from '@supabase/supabase-js';

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

  // 1. Authentification de l'appelant
  let caller;
  try {
    caller = await authenticateCaller(req);
  } catch (err: any) {
    console.error('[ARCHIVA API] Authenticate caller error:', err?.message || err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Authentification requise.' });
  }

  if (caller.profile.role !== 'super_admin' && caller.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }

  // Extraction de l'ID cible (via req.query.id dans Vercel ou via l'URL)
  let targetUserId = req.query?.id;
  if (!targetUserId && req.url) {
    const parts = req.url.split('?')[0].split('/');
    targetUserId = parts[parts.length - 1];
  }

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Identifiant utilisateur cible manquant.' });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Configuration administrative indisponible.' });
  }

  // Chargement du profil cible actuel
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (targetError || !targetProfile) {
    return res.status(404).json({ error: 'Utilisateur cible introuvable.' });
  }

  // -------------------------------------------------------------
  // PATCH : Mise à jour (rôle, métadonnées, blocage/déblocage)
  // -------------------------------------------------------------
  if (req.method === 'PATCH') {
    try {
      let body: any;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        if (typeof body !== 'object' || body === null) body = {};
      } catch {
        return res.status(400).json({ error: 'Format JSON invalide dans le corps de la requête.' });
      }

      const nomComplet = typeof body.nomComplet === 'string' ? body.nomComplet.trim().slice(0, 150) : undefined;
      const titre = typeof body.titre === 'string' ? body.titre.trim().slice(0, 150) : undefined;
      const role = body.role;
      const actif = body.actif;

      // Protection absolue du Super Administrateur
      if (targetProfile.role === 'super_admin') {
        if (actif === false) {
          return res.status(400).json({ error: 'Le Super Administrateur ne peut être ni rétrogradé ni bloqué.' });
        }
        if (role !== undefined && role !== 'super_admin') {
          return res.status(400).json({ error: 'Le Super Administrateur ne peut pas être rétrogradé.' });
        }
      }

      // CAS A : BLOCAGE / DÉBLOCAGE DU COMPTE
      if (actif !== undefined && actif !== targetProfile.actif) {
        if (caller.profile.id === targetUserId) {
          return res.status(400).json({
            error: 'Vous ne pouvez pas modifier le statut de votre propre compte.'
          });
        }

        if (caller.profile.role === 'admin') {
          if (targetProfile.role !== 'stagiaire') {
            return res.status(403).json({
              error: 'Un administrateur standard ne peut bloquer ou débloquer qu\'un stagiaire.'
            });
          }
        }

        // 1. Mise à jour de la table profiles
        const updatePayload: Record<string, any> = {
          actif: actif,
          updated_at: new Date().toISOString()
        };

        if (actif === false) {
          updatePayload.blocked_at = new Date().toISOString();
          updatePayload.blocked_by = caller.profile.id;
        } else {
          updatePayload.blocked_at = null;
          updatePayload.blocked_by = null;
        }

        const { data: updatedProfile, error: updateErr } = await supabaseAdmin
          .from('profiles')
          .update(updatePayload)
          .eq('id', targetUserId)
          .select('*')
          .single();

        if (updateErr) {
          console.error('[ARCHIVA API] Update actif error:', updateErr);
          return res.status(500).json({ error: 'Échec de la mise à jour du statut du compte.' });
        }

        // 2. Révocation globale des sessions auprès de Supabase Auth
        await supabaseAdmin.auth.admin.signOut(targetUserId, 'global').catch(() => {});

        // 3. Journal d'audit immuable
        const actionLabel = actif ? 'Déblocage Utilisateur' : 'Blocage Utilisateur';
        const detailsLabel = actif
          ? `Compte de ${targetProfile.nom_complet} (${targetProfile.email}) DÉBLOQUÉ par ${caller.profile.nom_complet}`
          : `Compte de ${targetProfile.nom_complet} (${targetProfile.email}) BLOQUÉ par ${caller.profile.nom_complet}. Toutes les sessions ont été révoquées.`;

        await supabaseAdmin.from('audit_logs').insert({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
          timestamp: new Date().toISOString(),
          user_id: caller.profile.id,
          user_name: caller.profile.nom_complet,
          user_role: caller.profile.role,
          action: actionLabel,
          details: detailsLabel,
          category: 'utilisateur'
        });

        return res.status(200).json({
          success: true,
          message: actif
            ? `Compte de ${targetProfile.nom_complet} débloqué avec succès.`
            : `Compte de ${targetProfile.nom_complet} BLOQUÉ avec succès. Sessions révoquées immédiatement.`,
          user: {
            id: updatedProfile.id,
            nomComplet: updatedProfile.nom_complet,
            email: updatedProfile.email,
            role: updatedProfile.role,
            titre: updatedProfile.titre,
            actif: updatedProfile.actif,
            dateCreation: updatedProfile.created_at,
            blockedAt: updatedProfile.blocked_at,
            blockedBy: updatedProfile.blocked_by
          }
        });
      }

      // CAS B : MISE À JOUR DU RÔLE OU DES INFORMATIONS
      if (caller.profile.role === 'admin') {
        const isSelf = caller.profile.id === targetUserId;
        const isStagiaire = targetProfile.role === 'stagiaire';
        if (!isSelf && !isStagiaire) {
          return res.status(403).json({
            error: 'Un administrateur ne peut modifier que les comptes stagiaires ou son propre profil.'
          });
        }
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (nomComplet !== undefined) updateData.nom_complet = nomComplet.trim();
      if (titre !== undefined) updateData.titre = titre.trim();

      if (role !== undefined && role !== targetProfile.role) {
        if (role === 'super_admin') {
          return res.status(400).json({
            error: 'Promotion en Super Administrateur formellement interdite (le Super Administrateur est unique).'
          });
        }

        const validRoles = ['admin', 'stagiaire'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Rôle invalide.' });
        }

        if (caller.profile.role === 'admin') {
          return res.status(403).json({
            error: 'Seul le Super Administrateur peut modifier le rôle des utilisateurs.'
          });
        }

        updateData.role = role;

        // Mise à jour de app_metadata dans auth.users
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          app_metadata: { role }
        }).catch(() => {});
      }

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', targetUserId)
        .select('*')
        .single();

      if (updateErr) {
        console.error('[ARCHIVA API] Update profile error:', updateErr);
        return res.status(500).json({ error: 'Échec de la mise à jour du profil utilisateur.' });
      }

      // Journal d'audit
      await supabaseAdmin.from('audit_logs').insert({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
        timestamp: new Date().toISOString(),
        user_id: caller.profile.id,
        user_name: caller.profile.nom_complet,
        user_role: caller.profile.role,
        action: 'Modification Utilisateur',
        details: `Profil de ${targetProfile.nom_complet} mis à jour par ${caller.profile.nom_complet}`,
        category: 'utilisateur'
      });

      return res.status(200).json({
        success: true,
        message: `Profil de ${updatedProfile.nom_complet} mis à jour.`,
        user: {
          id: updatedProfile.id,
          nomComplet: updatedProfile.nom_complet,
          email: updatedProfile.email,
          role: updatedProfile.role,
          titre: updatedProfile.titre,
          actif: updatedProfile.actif,
          dateCreation: updatedProfile.created_at,
          blockedAt: updatedProfile.blocked_at,
          blockedBy: updatedProfile.blocked_by
        }
      });
    } catch (err: any) {
      console.error('[ARCHIVA API] PATCH user error:', err);
      return res.status(500).json({ error: 'Erreur interne lors de la modification de l\'utilisateur.' });
    }
  }

  // -------------------------------------------------------------
  // DELETE : Suppression définitive d'un compte utilisateur (Super Admin UNIQUEMENT)
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      if (caller.profile.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Suppression de compte réservée au Super Administrateur.'
        });
      }

      if (caller.profile.id === targetUserId) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas supprimer votre propre compte utilisateur.'
        });
      }

      if (targetProfile.role === 'super_admin') {
        return res.status(400).json({
          error: 'Le Super Administrateur unique ne peut pas être supprimé.'
        });
      }

      // 1. Révocation globale des sessions
      await supabaseAdmin.auth.admin.signOut(targetUserId, 'global').catch(() => {});

      // 2. Suppression dans auth.users (cascade vers profiles via FK)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteAuthError) {
        console.error('[ARCHIVA API] Delete auth error:', deleteAuthError);

        // Journal d'audit d'échec
        try {
          await supabaseAdmin.from('audit_logs').insert({
            id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
            timestamp: new Date().toISOString(),
            user_id: caller.profile.id,
            user_name: caller.profile.nom_complet,
            user_role: caller.profile.role,
            action: 'Échec Suppression Utilisateur',
            details: `Tentative de suppression de ${targetProfile.nom_complet} (${targetProfile.email}) échouée.`,
            category: 'utilisateur'
          });
        } catch {
          // Ignorer
        }

        return res.status(500).json({
          error: 'Échec de la suppression de l\'utilisateur dans l\'authentification.'
        });
      }

      try {
        await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
      } catch {
        // Ignorer si supprimé par cascade
      }

      // 3. Journalisation de l'audit APRÈS la suppression réussie
      try {
        await supabaseAdmin.from('audit_logs').insert({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`),
          timestamp: new Date().toISOString(),
          user_id: caller.profile.id,
          user_name: caller.profile.nom_complet,
          user_role: caller.profile.role,
          action: 'Suppression Utilisateur',
          details: `Compte de ${targetProfile.nom_complet} (${targetProfile.email}, rôle: ${targetProfile.role}) DÉFINITIVEMENT supprimé par ${caller.profile.nom_complet}.`,
          category: 'utilisateur'
        });
      } catch {
        // Ignorer
      }

      return res.status(200).json({
        success: true,
        message: `L'utilisateur ${targetProfile.nom_complet} a été supprimé définitivement.`
      });
    } catch (err: any) {
      console.error('[ARCHIVA API] DELETE user error:', err);
      return res.status(500).json({ error: 'Erreur interne lors de la suppression de l\'utilisateur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
