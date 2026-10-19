import { getSupabaseAdmin } from '../../_lib/supabaseAdmin';
import { authenticateCaller } from '../../_lib/authMiddleware';
import { checkRateLimit, getClientIp } from '../../_lib/rateLimit';

export default async function handler(req: any, res: any) {
  // CORS & Options
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  const supabaseAdmin = getSupabaseAdmin();

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

      // CAS A : BLOCAGE / DÉBLOCAGE DU COMPTE
      if (actif !== undefined && actif !== targetProfile.actif) {
        // RÈGLE MATRICE D'HABILITATION POUR LE BLOCAGE/DÉBLOCAGE :
        // - Super Admin : peut bloquer/débloquer stagiaire, admin, super_admin (sauf son propre dernier compte)
        // - Admin : peut bloquer/débloquer stagiaire UNIQUEMENT. Interdit sur admin ou super_admin.
        if (caller.profile.role === 'admin') {
          if (targetProfile.role === 'admin' || targetProfile.role === 'super_admin') {
            return res.status(403).json({
              error: 'Un administrateur standard ne peut bloquer ou débloquer qu\'un stagiaire.'
            });
          }
        }

        // Empêcher le blocage de son propre compte s'il s'agit du dernier super admin
        if (targetProfile.role === 'super_admin' && actif === false) {
          const { count: superAdminCount } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'super_admin')
            .eq('actif', true);

          if ((superAdminCount || 0) <= 1) {
            return res.status(400).json({
              error: 'Impossible de bloquer le dernier Super Administrateur actif de la plateforme.'
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
        // Indispensable pour invalider immédiatement les refresh tokens
        await supabaseAdmin.auth.admin.signOut(targetUserId, 'global').catch(() => {});

        // 3. Journal d'audit immuable
        const actionLabel = actif ? 'Déblocage Utilisateur' : 'Blocage Utilisateur';
        const detailsLabel = actif
          ? `Compte de ${targetProfile.nom_complet} (${targetProfile.email}) DÉBLOQUÉ par ${caller.profile.nom_complet}`
          : `Compte de ${targetProfile.nom_complet} (${targetProfile.email}) BLOQUÉ par ${caller.profile.nom_complet}. Toutes les sessions ont été révoquées.`;

        await supabaseAdmin.from('audit_logs').insert({
          id: crypto.randomUUID(),
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
        const validRoles = ['super_admin', 'admin', 'stagiaire'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Rôle invalide.' });
        }

        // RÈGLE MATRICE :
        // - Admin : ne peut PAS promouvoir vers super_admin, ni modifier un super_admin ou un admin
        if (caller.profile.role === 'admin') {
          return res.status(403).json({
            error: 'Seul le Super Administrateur peut modifier le rôle des utilisateurs.'
          });
        }

        // Si le rôle de super_admin est retiré, vérifier qu'il reste au moins un autre super_admin
        if (targetProfile.role === 'super_admin' && role !== 'super_admin') {
          const { count: superAdminCount } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'super_admin')
            .eq('actif', true);

          if ((superAdminCount || 0) <= 1) {
            return res.status(400).json({
              error: 'Impossible de rétrograder le dernier Super Administrateur actif.'
            });
          }
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
        id: crypto.randomUUID(),
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
      return res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
    }
  }

  // -------------------------------------------------------------
  // DELETE : Suppression définitive d'un compte utilisateur
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      // RÈGLE 1 : Interdiction formelle de supprimer son propre compte
      if (caller.profile.id === targetUserId) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas supprimer votre propre compte utilisateur.'
        });
      }

      // RÈGLE MATRICE SUPPRESSION :
      // - Super Admin : peut supprimer stagiaire, admin, super_admin (sauf son propre dernier compte)
      // - Admin : peut supprimer stagiaire UNIQUEMENT
      if (caller.profile.role === 'admin') {
        if (targetProfile.role === 'admin' || targetProfile.role === 'super_admin') {
          return res.status(403).json({
            error: 'Un administrateur standard ne peut supprimer qu\'un compte stagiaire.'
          });
        }
      }

      // RÈGLE 2 : Interdiction de supprimer le dernier super admin
      if (targetProfile.role === 'super_admin') {
        const { count: superAdminCount } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin')
          .eq('actif', true);

        if ((superAdminCount || 0) <= 1) {
          return res.status(400).json({
            error: 'Impossible de supprimer le dernier Super Administrateur de la plateforme.'
          });
        }
      }

      // 1. Journalisation préalable de l'audit (avant rupture de FK)
      await supabaseAdmin.from('audit_logs').insert({
        id: crypto.randomUUID(),
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

      // 3. Suppression dans auth.users (cascade automatique vers public.profiles via FK)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteAuthError) {
        return res.status(500).json({
          error: 'Échec de la suppression dans Supabase Auth : ' + deleteAuthError.message
        });
      }

      // Nettoyage de sécurité dans profiles si l'enregistrement persistait
      try {
        await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
      } catch {
        // Ignorer si déjà supprimé par cascade
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
