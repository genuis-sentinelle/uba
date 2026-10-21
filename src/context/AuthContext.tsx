import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  usersError: string | null;
  hasSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  createInitialSuperAdmin: (data: {
    nomUtilisateur: string;
    motDePasse: string;
    email?: string;
    titre?: string;
  }) => Promise<{ success: boolean; message: string }>;
  addUser: (userData: {
    nomComplet: string;
    email: string;
    role: Role;
    titre?: string;
    motDePasse?: string;
  }) => Promise<{ success: boolean; message: string }>;
  updateUser: (user: User) => Promise<{ success: boolean; message: string }>;
  deleteUser: (targetUserId: string) => Promise<{ success: boolean; message: string }>;
  canDeleteUser: (targetUser: User) => { allowed: boolean; reason?: string };
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  refreshUsers: () => Promise<void>;
  checkBootstrapStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBootstrapLocked, setIsBootstrapLocked] = useState<boolean>(true); // Fail-closed par défaut

  /**
   * Vérifie le verrou d'initialisation en base de données
   */
  const checkBootstrapStatus = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setIsBootstrapLocked(true);
      return true;
    }
    try {
      const { data, error } = await supabase.rpc('is_bootstrap_locked');
      if (!error && typeof data === 'boolean') {
        setIsBootstrapLocked(data);
        return data;
      }
      if (error) {
        // Si la fonction n'est pas encore créée en base (PGRST202 / 42883), le verrou n'est pas encore posé
        if (error.code === 'PGRST202' || error.code === '42883') {
          setIsBootstrapLocked(false);
          return false;
        }
      }
      setIsBootstrapLocked(true);
      return true;
    } catch {
      setIsBootstrapLocked(false);
      return false;
    }
  }, []);

  /**
   * Récupère le jeton Bearer de la session courante
   */
  const getAccessToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  };

  /**
   * Charge la liste des utilisateurs depuis l'API serveur sécurisée (réservée admin)
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
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
          setUsersError(null);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (res.status === 500) {
          setUsersError('Serveur non configuré : contactez l\'administrateur (SUPABASE_SERVICE_ROLE_KEY)');
        } else if (res.status === 401 || res.status === 403) {
          setUsersError(errJson?.error || 'Session invalide ou droits insuffisants pour accéder à la liste des utilisateurs.');
        } else {
          setUsersError(errJson?.error || `Erreur serveur (${res.status}) lors de la récupération des utilisateurs.`);
        }
      }
    } catch (err) {
      console.warn('[ARCHIVA Auth] Erreur récupération utilisateurs :', err);
      setUsersError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    }
  }, []);

  /**
   * Hydratation de la session Supabase — Source unique de vérité
   */
  const hydrate = useCallback(async (session: Session | null) => {
    if (!supabase) {
      setCurrentUser(null);
      setUsers([]);
      setLoading(false);
      return;
    }

    if (!session?.user) {
      setCurrentUser(null);
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      const { data: p, error } = await supabase
        .from('profiles')
        .select('id, nom_complet, email, role, titre, actif, created_at, blocked_at, blocked_by')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error || !p || p.actif === false) {
        console.warn('[ARCHIVA Auth] Compte absent ou bloqué par le serveur. Déconnexion immédiate.');
        if (p && p.actif === false) {
          try {
            sessionStorage.setItem('archiva_logout_reason', 'Votre compte a été désactivé ou bloqué par un administrateur.');
          } catch {}
        }
        await supabase.auth.signOut().catch(() => {});
        setCurrentUser(null);
        setUsers([]);
        setLoading(false);
        return;
      }

      const verifiedUser: User = {
        id: p.id,
        nomComplet: p.nom_complet,
        email: p.email,
        role: p.role,
        titre: p.titre || (p.role === 'admin' ? 'Administrateur' : p.role === 'super_admin' ? 'Super Administrateur' : 'Archiviste Opérationnel'),
        actif: p.actif,
        dateCreation: p.created_at || new Date().toISOString(),
        blockedAt: p.blocked_at,
        blockedBy: p.blocked_by
      };

      setCurrentUser(verifiedUser);

      // Si l'utilisateur est admin ou super_admin, charger la liste des utilisateurs via l'API sécurisée
      if (verifiedUser.role === 'admin' || verifiedUser.role === 'super_admin') {
        await fetchUsersList(session.access_token);
      } else {
        setUsers([verifiedUser]);
      }
    } catch (err) {
      console.error('[ARCHIVA Auth] Erreur vérification session :', err);
      setCurrentUser(null);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUsersList]);

  // Initialisation de la session et écoute des changements Supabase Auth
  useEffect(() => {
    checkBootstrapStatus();

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      hydrate(data.session);
    }).finally(() => {
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        hydrate(session);
      }, 0);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [hydrate, checkBootstrapStatus]);

  // Contrôle périodique du statut du compte (toutes les 20s)
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
          console.warn('[ARCHIVA Auth] Compte désactivé/bloqué par le serveur. Déconnexion immédiate.');
          try {
            sessionStorage.setItem('archiva_logout_reason', 'Votre compte a été désactivé ou bloqué par un administrateur.');
          } catch {}
          await logout();
        }
      } catch {
        // Ignorer les erreurs réseau temporaires
      }
    };

    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  /**
   * Connexion sécurisée au logiciel via Supabase Auth
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const raw = email.trim();
    if (!raw) return { success: false, message: 'Veuillez saisir votre adresse email.' };
    if (!password) return { success: false, message: 'Veuillez saisir votre mot de passe.' };

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Supabase n\'est pas configuré. Veuillez vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
      };
    }

    const emailAuth = raw.includes('@')
      ? raw.toLowerCase()
      : `${raw.replace(/[^a-z0-9]/gi, '.').toLowerCase()}@uba.cg`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailAuth,
        password
      });

      if (authError || !authData?.user) {
        // Message générique anti-énumération de comptes
        return {
          success: false,
          message: 'Identifiants incorrects ou compte inactif.'
        };
      }

      await hydrate(authData.session);
      return { success: true, message: 'Connexion réussie.' };
    } catch {
      return {
        success: false,
        message: 'Une erreur réseau est survenue lors de la connexion.'
      };
    }
  };

  /**
   * Déconnexion sécurisée et purge des données de session
   */
  const logout = async () => {
    setCurrentUser(null);
    setUsers([]);
    try {
      // Purge des files d'attente locales et caches sensibles
      localStorage.removeItem('archiva_uba_sync_queue');
      localStorage.removeItem('archiva_sync_queue_v2');
      localStorage.removeItem('archiva_uba_users_v5');
      localStorage.removeItem('archiva_uba_current_user_v5');
      localStorage.removeItem('archiva_uba_agencies');
      localStorage.removeItem('archiva_uba_members');
      localStorage.removeItem('archiva_uba_daily_reports');
      localStorage.removeItem('archiva_uba_synthesis_reports');
      localStorage.removeItem('archiva_uba_incidents');
      localStorage.removeItem('archiva_uba_cartons');
      localStorage.removeItem('archiva_uba_slips');
      localStorage.removeItem('archiva_uba_attendance');
      localStorage.removeItem('archiva_uba_logs');
    } catch {
      // Ignorer
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  };

  /**
   * Création UNIQUE du Super Administrateur via l'API sécurisée avec verrou atomique
   */
  const createInitialSuperAdmin = async (data: {
    nomUtilisateur: string;
    motDePasse: string;
    email?: string;
    titre?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const nom = data.nomUtilisateur.trim();
    const mdp = data.motDePasse;
    const email = data.email?.trim() || (nom.includes('@')
      ? nom.toLowerCase()
      : `${nom.replace(/[^a-z0-9]/gi, '.').toLowerCase()}@uba.cg`);

    if (!nom) {
      return { success: false, message: 'Le nom d\'utilisateur ou nom complet est obligatoire.' };
    }
    if (!mdp) {
      return { success: false, message: 'Le mot de passe est obligatoire.' };
    }

    try {
      let apiSuccess = false;
      let apiErrorMsg = '';

      // 1. Essai prioritaire via l'API serveur sécurisée avec clé service_role
      try {
        const res = await fetch('/api/auth/bootstrap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nomComplet: nom,
            email,
            password: mdp,
            titre: data.titre || 'Super Administrateur des Archives UBA'
          })
        });

        if (res.ok) {
          apiSuccess = true;
        } else {
          const body = await res.json().catch(() => ({}));
          apiErrorMsg = body.error || '';
        }
      } catch (err: any) {
        apiErrorMsg = err.message || '';
      }

      // 2. Si l'API serveur n'a pas pu traiter la demande, repli direct via Supabase Auth
      if (!apiSuccess) {
        if (!supabase) {
          return { success: false, message: apiErrorMsg || 'Supabase n\'est pas configuré.' };
        }

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password: mdp,
          options: {
            data: {
              nom_complet: nom,
              titre: data.titre || 'Super Administrateur des Archives UBA'
            }
          }
        });

        if (signUpErr) {
          return {
            success: false,
            message: signUpErr.message || apiErrorMsg || 'Impossible de créer le Super Administrateur.'
          };
        }

        // Tenter également l'insertion directe du profil si l'utilisateur est authentifié
        if (signUpData?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              nom_complet: nom,
              email,
              role: 'super_admin',
              titre: data.titre || 'Super Administrateur des Archives UBA',
              actif: true
            });
          } catch {
            // Pris en charge par le trigger handle_new_user en base
          }
        }
      }

      setIsBootstrapLocked(true);

      // 3. Connexion automatique après la création réussie
      const loginRes = await login(email, mdp);
      if (!loginRes.success) {
        return {
          success: true,
          message: 'Super Administrateur créé avec succès. Veuillez vous connecter avec vos identifiants.'
        };
      }

      return {
        success: true,
        message: 'Super Administrateur créé et initialisé avec succès. La création publique est désormais verrouillée.'
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors de l\'initialisation du Super Administrateur.' };
    }
  };

  /**
   * Création d'un utilisateur par l'administrateur via l'API serveur
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
          password: userData.motDePasse
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Erreur lors de la création de l\'utilisateur.' };
      }

      await fetchUsersList(token);
      return { success: true, message: data.message || 'Utilisateur créé avec succès.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau lors de la création de l\'utilisateur.' };
    }
  };

  /**
   * Mise à jour d'un utilisateur via l'API serveur
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
      return { success: false, message: err.message || 'Erreur réseau lors de la mise à jour.' };
    }
  };

  /**
   * Droits de suppression
   */
  const canDeleteUser = (targetUser: User): { allowed: boolean; reason?: string } => {
    if (!currentUser) return { allowed: false, reason: 'Vous devez être connecté.' };
    if (currentUser.id === targetUser.id) {
      return { allowed: false, reason: 'Vous ne pouvez pas supprimer votre propre compte.' };
    }
    if (targetUser.role === 'super_admin') {
      return { allowed: false, reason: 'Le Super Administrateur unique ne peut pas être supprimé.' };
    }
    if (currentUser.role === 'super_admin') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Suppression réservée au Super Administrateur.' };
  };

  /**
   * Suppression définitive d'un compte via l'API serveur
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
      return { success: false, message: err.message || 'Erreur réseau lors de la suppression.' };
    }
  };

  /**
   * Modification du mot de passe de l'utilisateur connecté via Supabase Auth
   */
  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Non connecté.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, message: 'Erreur lors de la mise à jour : ' + error.message };
      }
      return { success: true, message: 'Mot de passe mis à jour avec succès sur le serveur.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors du changement de mot de passe.' };
    }
  };

  const refreshUsers = async () => {
    await fetchUsersList();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        usersError,
        hasSuperAdmin: isBootstrapLocked,
        loading,
        login,
        logout,
        createInitialSuperAdmin,
        addUser,
        updateUser,
        deleteUser,
        canDeleteUser,
        changePassword,
        refreshUsers,
        checkBootstrapStatus
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
