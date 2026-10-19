import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  hasSuperAdmin: boolean;
  loading: boolean;
  login: (identifiant: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  addUser: (userData: { nomComplet: string; email: string; role: Role; titre?: string; motDePasse?: string }) => Promise<{ success: boolean; message: string }>;
  updateUser: (user: User) => Promise<{ success: boolean; message: string }>;
  deleteUser: (targetUserId: string) => Promise<{ success: boolean; message: string }>;
  canDeleteUser: (targetUser: User) => { allowed: boolean; reason?: string };
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Nettoyage impératif de tout artefact d'authentification locale legacy
  useEffect(() => {
    try {
      localStorage.removeItem('archiva_uba_users');
      localStorage.removeItem('archiva_uba_current_user');
      localStorage.removeItem('archiva_uba_clean_v3_blank_users');
    } catch {
      // Ignorer si localStorage non disponible
    }
  }, []);

  const hasSuperAdmin = true; // Géré strictement par la base de données et l'amorçage serveur

  /**
   * Récupère le jeton Bearer de la session courante
   */
  const getAccessToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  };

  /**
   * Charge la liste des utilisateurs depuis l'API serveur sécurisée
   */
  const fetchUsersList = useCallback(async (tokenOverride?: string | null) => {
    try {
      const token = tokenOverride || (await getAccessToken());
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.users && Array.isArray(json.users)) {
          setUsers(json.users);
        }
      } else {
        console.warn('[ARCHIVA Auth] Impossible de charger les utilisateurs :', res.status);
      }
    } catch (err) {
      console.warn('[ARCHIVA Auth] Erreur réseau lors de la récupération des utilisateurs :', err);
    }
  }, []);

  /**
   * Vérifie le profil serveur et applique les restrictions d'état (actif/bloqué)
   */
  const verifyAndSetUser = useCallback(async (userId: string, tokenOverride?: string | null) => {
    if (!supabase) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, nom_complet, email, role, titre, actif, created_at, blocked_at, blocked_by')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        console.warn('[ARCHIVA Auth] Profil serveur introuvable. Déconnexion immédiate.');
        await supabase.auth.signOut().catch(() => {});
        setCurrentUser(null);
        setUsers([]);
        return;
      }

      // SÉCURITÉ SERVEUR : Compte bloqué -> révocation immédiate de la session
      if (profile.actif === false) {
        console.warn('[ARCHIVA Auth] Compte bloqué par le serveur. Déconnexion immédiate.');
        await supabase.auth.signOut().catch(() => {});
        setCurrentUser(null);
        setUsers([]);
        return;
      }

      const verifiedUser: User = {
        id: profile.id,
        nomComplet: profile.nom_complet,
        email: profile.email,
        role: profile.role,
        titre: profile.titre || 'Archiviste Opérationnel',
        actif: profile.actif,
        dateCreation: profile.created_at || new Date().toISOString(),
        blockedAt: profile.blocked_at,
        blockedBy: profile.blocked_by
      };

      setCurrentUser(verifiedUser);

      // Si l'utilisateur est admin ou super_admin, charger la liste des utilisateurs
      if (verifiedUser.role === 'admin' || verifiedUser.role === 'super_admin') {
        await fetchUsersList(tokenOverride);
      } else {
        setUsers([verifiedUser]);
      }
    } catch (err) {
      console.error('[ARCHIVA Auth] Erreur lors de la vérification du profil :', err);
      setCurrentUser(null);
    }
  }, [fetchUsersList]);

  // Initialisation de la session et écoute des changements Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await client.auth.getSession();
        if (session?.user && isMounted) {
          await verifyAndSetUser(session.user.id, session.access_token);
        } else if (isMounted) {
          setCurrentUser(null);
          setUsers([]);
        }
      } catch (err) {
        console.error('[ARCHIVA Auth] Erreur session :', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // Surveillance des événements d'authentification (déconnexion globale, renouvellement de jeton)
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await verifyAndSetUser(session.user.id, session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUsers([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verifyAndSetUser]);

  // Vérification périodique du statut actif en base (toutes les 20 secondes)
  useEffect(() => {
    if (!currentUser || !supabase) return;
    const client = supabase;

    const checkStatus = async () => {
      try {
        const { data: profile } = await client
          .from('profiles')
          .select('actif')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profile && profile.actif === false) {
          console.warn('[ARCHIVA Auth] Compte désactivé ou bloqué détecté par contrôle périodique. Déconnexion.');
          await logout();
        }
      } catch {
        // Ignorer les erreurs réseau temporaires sur le poll
      }
    };

    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  /**
   * Connexion 100% pilotée par le serveur Supabase Auth
   */
  const login = async (identifiant: string, password: string): Promise<{ success: boolean; message: string }> => {
    const query = identifiant.trim();
    if (!query) return { success: false, message: 'Veuillez saisir votre identifiant ou adresse email.' };
    if (!password) return { success: false, message: 'Veuillez saisir votre mot de passe.' };

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase n\'est pas configuré. Veuillez vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
      };
    }

    const emailAuth = query.includes('@')
      ? query.toLowerCase()
      : `${query.replace(/[^a-z0-9]/gi, '.').toLowerCase()}@uba.cg`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailAuth,
        password: password
      });

      if (authError || !authData?.user) {
        // Message générique anti-énumération de comptes
        return {
          success: false,
          message: 'Identifiants invalides ou accès non autorisé.'
        };
      }

      // Vérification immédiate du profil serveur et du statut actif
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, nom_complet, email, role, titre, actif, created_at, blocked_at, blocked_by')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        await supabase.auth.signOut().catch(() => {});
        return {
          success: false,
          message: 'Identifiants invalides ou accès non autorisé.'
        };
      }

      if (profile.actif === false) {
        await supabase.auth.signOut().catch(() => {});
        return {
          success: false,
          message: 'Ce compte utilisateur a été bloqué par un administrateur. Accès formellement refusé.'
        };
      }

      const loggedUser: User = {
        id: profile.id,
        nomComplet: profile.nom_complet,
        email: profile.email,
        role: profile.role,
        titre: profile.titre || 'Archiviste Opérationnel',
        actif: profile.actif,
        dateCreation: profile.created_at || new Date().toISOString(),
        blockedAt: profile.blocked_at,
        blockedBy: profile.blocked_by
      };

      setCurrentUser(loggedUser);

      if (loggedUser.role === 'admin' || loggedUser.role === 'super_admin') {
        await fetchUsersList(authData.session?.access_token);
      } else {
        setUsers([loggedUser]);
      }

      return { success: true, message: 'Connexion réussie.' };
    } catch {
      return {
        success: false,
        message: 'Une erreur réseau est survenue lors de la tentative de connexion.'
      };
    }
  };

  /**
   * Déconnexion sécurisée
   */
  const logout = async () => {
    setCurrentUser(null);
    setUsers([]);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  };

  /**
   * Changement de mot de passe via Supabase Auth
   */
  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Non connecté.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Mot de passe mis à jour avec succès sur le serveur.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors du changement de mot de passe.' };
    }
  };

  /**
   * Vérification des droits de suppression
   */
  const canDeleteUser = (targetUser: User): { allowed: boolean; reason?: string } => {
    if (!currentUser) return { allowed: false, reason: 'Vous devez être connecté.' };
    if (currentUser.id === targetUser.id) {
      return { allowed: false, reason: 'Vous ne pouvez pas supprimer votre propre compte.' };
    }
    if (currentUser.role === 'super_admin') {
      return { allowed: true };
    }
    if (currentUser.role === 'admin') {
      if (targetUser.role === 'super_admin') {
        return { allowed: false, reason: 'Seul le Super Administrateur peut supprimer un Super Administrateur.' };
      }
      if (targetUser.role === 'admin') {
        return { allowed: false, reason: 'Seul le Super Administrateur peut supprimer un Administrateur.' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'Droits insuffisants pour supprimer un utilisateur.' };
  };

  /**
   * Création d'un utilisateur via l'API serveur atomique /api/admin/users
   */
  const addUser = async (userData: {
    nomComplet: string;
    email: string;
    role: Role;
    titre?: string;
    motDePasse?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Session invalide ou expirée.' };
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nomComplet: userData.nomComplet,
          email: userData.email,
          role: userData.role,
          titre: userData.titre,
          password: userData.motDePasse || 'uba2026'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Erreur lors de la création de l\'utilisateur.' };
      }

      await fetchUsersList(token);
      return { success: true, message: data.message || 'Utilisateur créé avec succès.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur de communication avec l\'API serveur.' };
    }
  };

  /**
   * Mise à jour d'un utilisateur (statut actif/bloqué, rôle, métadonnées) via /api/admin/users/:id
   */
  const updateUser = async (userToUpdate: User): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Session invalide ou expirée.' };
    }

    try {
      const res = await fetch(`/api/admin/users/${userToUpdate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nomComplet: userToUpdate.nomComplet,
          titre: userToUpdate.titre,
          role: userToUpdate.role,
          actif: userToUpdate.actif
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Erreur lors de la mise à jour.' };
      }

      // Si l'utilisateur connecté s'est lui-même mis à jour
      if (currentUser?.id === userToUpdate.id) {
        if (!userToUpdate.actif) {
          await logout();
        } else {
          setCurrentUser(userToUpdate);
        }
      }

      await fetchUsersList(token);
      return { success: true, message: data.message || 'Mise à jour réussie.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau.' };
    }
  };

  /**
   * Suppression définitive d'un compte via /api/admin/users/:id
   */
  const deleteUser = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Session invalide ou expirée.' };
    }

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Erreur lors de la suppression.' };
      }

      await fetchUsersList(token);
      return { success: true, message: data.message || 'Utilisateur supprimé définitivement.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        hasSuperAdmin,
        loading,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        canDeleteUser,
        changePassword,
        refreshUsers: () => fetchUsersList()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
