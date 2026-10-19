import { getSupabaseAdmin } from '../../_lib/supabaseAdmin';
import { authenticateCaller } from '../../_lib/authMiddleware';
import { checkRateLimit, getClientIp } from '../../_lib/rateLimit';
import { assertAllowedOrigin } from '../../_lib/cors';

export default async function handler(req: any, res: any) {
  if (!assertAllowedOrigin(req, res)) return;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Anti-brute-force & limitation
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`admin-user-op-${clientIp}`, 40, 60000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Trop de requêtes administratives. Veuillez patienter avant de réessayer.',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
  }

  // 2. Authentification de l'appelant
  let caller;
  try {
    caller = await authenticateCaller(req);
  } catch (err: any) {
    return res.status(err.statusCode || 401).json({ error: err.message || 'Authentification requise.' });
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
    return res.status(500).json({ error: err.message || 'Configuration administrative indisponible.' });
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { nomComplet, titre, role, actif } = body || {};

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
        if (caller.profile.role === 'admin') {
          if (targetProfile.role === 'admin' || targetProfile.role === 'super_admin') {
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
          return res.status(500).json({ error: 'Échec de la mise à jour du statut : ' + updateErr.message });
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
        return res.status(500).json({ error: 'Échec de mise à jour du profil : ' + updateErr.message });
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
      return res.status(500).json({ error: err.message || 'Erreur interne lors de la modification.' });
    }
  }

  // -------------------------------------------------------------
  // DELETE : Suppression définitive d'un compte utilisateur
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
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

      if (caller.profile.role === 'admin') {
        if (targetProfile.role === 'admin' || targetProfile.role === 'super_admin') {
          return res.status(403).json({
            error: 'Un administrateur standard ne peut supprimer qu\'un compte stagiaire.'
          });
        }
      }

      // 1. Journalisation préalable de l'audit
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

      // 2. Révocation globale des sessions
      await supabaseAdmin.auth.admin.signOut(targetUserId, 'global').catch(() => {});

      // 3. Suppression dans auth.users (cascade vers profiles via FK)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteAuthError) {
        return res.status(500).json({
          error: 'Échec de la suppression dans Supabase Auth : ' + deleteAuthError.message
        });
      }

      try {
        await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
      } catch {
        // Ignorer si supprimé par cascade
      }

      return res.status(200).json({
        success: true,
        message: `L'utilisateur ${targetProfile.nom_complet} a été supprimé définitivement.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
