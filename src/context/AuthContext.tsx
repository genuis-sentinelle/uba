import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { newId } from '../utils/ids';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  hasSuperAdmin: boolean;
  loading: boolean;
  login: (identifiant: string, password: string) => Promise<{ success: boolean; message: string }>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'archiva_uba_users_v5';
const CURRENT_USER_STORAGE_KEY = 'archiva_uba_current_user_v5';
const RESET_INIT_FLAG = 'archiva_uba_reset_v5_done';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Réinitialisation contrôlée des identifiants existants pour permettre l'initialisation unique demandée
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const isResetDone = localStorage.getItem(RESET_INIT_FLAG);
      if (!isResetDone) {
        // Purge des anciennes versions de comptes
        localStorage.removeItem('archiva_uba_users');
        localStorage.removeItem('archiva_uba_current_user');
        localStorage.removeItem('archiva_uba_users_v2');
        localStorage.removeItem('archiva_uba_users_v3');
        localStorage.removeItem('archiva_uba_users_v4');
        localStorage.removeItem('archiva_uba_clean_v3_blank_users');
        localStorage.removeItem(USERS_STORAGE_KEY);
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.setItem(RESET_INIT_FLAG, 'true');
        return [];
      }
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorer
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const isResetDone = localStorage.getItem(RESET_INIT_FLAG);
      if (!isResetDone) return null;
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorer
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Le Super Administrateur est actif dès qu'un utilisateur possède le rôle 'super_admin' et actif = true
  const hasSuperAdmin = users.some(u => u.role === 'super_admin' && u.actif !== false);

  // Sauvegarde persistante des utilisateurs dans le stockage local sécurisé
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Ignorer si quota plein
    }
  }, [users]);

  // Sauvegarde persistante de l'utilisateur actif
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch {
      // Ignorer
    }
  }, [currentUser]);

  /**
   * Synchronisation des profils Supabase en arrière-plan
   */
  const syncSupabaseProfiles = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: remoteProfiles, error } = await supabase.from('profiles').select('*');
      if (!error && remoteProfiles && remoteProfiles.length > 0) {
        setUsers(prev => {
          const updated = [...prev];
          remoteProfiles.forEach((p: any) => {
            const idx = updated.findIndex(
              u => u.id === p.id || u.email.toLowerCase() === (p.email || '').toLowerCase()
            );
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                nomComplet: p.nom_complet || updated[idx].nomComplet,
                role: p.role || updated[idx].role,
                titre: p.titre || updated[idx].titre,
                actif: p.actif !== undefined ? p.actif : updated[idx].actif
              };
            } else {
              updated.push({
                id: p.id,
                nomComplet: p.nom_complet || 'Archiviste UBA',
                email: p.email,
                role: p.role || 'stagiaire',
                titre: p.titre || 'Archiviste Opérationnel',
                actif: p.actif ?? true,
                dateCreation: p.created_at || new Date().toISOString()
              });
            }
          });
          return updated;
        });

        // Si le profil de l'utilisateur actuel est marqué inactif/bloqué côté serveur -> déconnexion immédiate
        if (currentUser) {
          const currentRemote = remoteProfiles.find(
            (p: any) => p.id === currentUser.id || p.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (currentRemote && currentRemote.actif === false) {
            console.warn('[ARCHIVA UBA] Compte bloqué côté base de données. Déconnexion immédiate.');
            setCurrentUser(null);
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
          }
        }
      }
    } catch {
      // Ignorer les erreurs temporaires
    }
  }, [currentUser]);

  useEffect(() => {
    syncSupabaseProfiles();
    const interval = setInterval(syncSupabaseProfiles, 20000);
    return () => clearInterval(interval);
  }, [syncSupabaseProfiles]);

  /**
   * Initialisation UNIQUE du Super Administrateur (accessible une seule fois)
   */
  const createInitialSuperAdmin = async (data: {
    nomUtilisateur: string;
    motDePasse: string;
    email?: string;
    titre?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (hasSuperAdmin) {
      return {
        success: false,
        message: 'Un compte Super Administrateur est déjà configuré. La création publique est verrouillée de manière permanente.'
      };
    }

    const nom = data.nomUtilisateur.trim();
    const mdp = data.motDePasse;

    if (!nom) {
      return { success: false, message: 'Le nom d\'utilisateur ou nom complet est obligatoire.' };
    }
    if (!mdp || mdp.length < 4) {
      return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const email = data.email?.trim() || (nom.includes('@')
      ? nom.toLowerCase()
      : `${nom.replace(/[^a-z0-9]/gi, '.').toLowerCase()}@uba.cg`);

    const { hash, salt } = await hashPassword(mdp);
    const superAdmin: User = {
      id: newId('usr'),
      nomComplet: nom,
      email: email,
      role: 'super_admin',
      titre: data.titre?.trim() || 'Super Administrateur des Archives UBA',
      actif: true,
      dateCreation: new Date().toISOString(),
      passwordHash: hash,
      salt: salt
    };

    const newUsers = [superAdmin];
    setUsers(newUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    setCurrentUser(superAdmin);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(superAdmin));

    // Synchronisation vers Supabase profiles
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').upsert({
        id: superAdmin.id,
        nom_complet: superAdmin.nomComplet,
        email: superAdmin.email,
        role: 'super_admin',
        titre: superAdmin.titre,
        actif: true,
        created_at: superAdmin.dateCreation,
        updated_at: superAdmin.dateCreation
      }).then(null, (err: unknown) => {
        console.warn('[ARCHIVA UBA] Sauvegarde Supabase notice:', err);
      });
    }

    return {
      success: true,
      message: `Compte Super Administrateur configuré avec succès ! L'accès libre est désormais verrouillé.`
    };
  };

  /**
   * Connexion sécurisée au logiciel avec vérification stricte
   */
  const login = async (identifiant: string, password: string): Promise<{ success: boolean; message: string }> => {
    const query = identifiant.trim().toLowerCase();
    if (!query) {
      return { success: false, message: 'Veuillez saisir votre identifiant ou adresse email.' };
    }
    if (!password) {
      return { success: false, message: 'Veuillez saisir votre mot de passe.' };
    }

    // Recherche de l'utilisateur
    const found = users.find(u =>
      u.nomComplet.toLowerCase() === query ||
      u.email.toLowerCase() === query ||
      u.email.split('@')[0].toLowerCase() === query ||
      u.nomComplet.toLowerCase().replace(/[^a-z0-9]/g, '.') === query
    );

    if (!found) {
      return { success: false, message: 'Identifiant introuvable ou accès non autorisé.' };
    }

    // SÉCURITÉ STRICTE : Si le compte est désactivé ou bloqué, accès formellement interdit
    if (!found.actif) {
      return {
        success: false,
        message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
      };
    }

    // Vérification cryptographique du mot de passe
    if (found.passwordHash && found.salt) {
      const isValid = await verifyPassword(password, found.passwordHash, found.salt);
      if (!isValid) {
        return { success: false, message: 'Mot de passe incorrect.' };
      }
    } else {
      // Enregistrement immédiat du mot de passe pour les profils migrés sans hash
      const { hash, salt } = await hashPassword(password);
      found.passwordHash = hash;
      found.salt = salt;
      const updated = users.map(u => u.id === found.id ? found : u);
      setUsers(updated);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    }

    setCurrentUser(found);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(found));
    return { success: true, message: 'Connexion réussie.' };
  };

  /**
   * Déconnexion de la session
   */
  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  /**
   * Création d'un nouvel utilisateur par le Super Administrateur ou Administrateur
   */
  const addUser = async (userData: {
    nomComplet: string;
    email: string;
    role: Role;
    titre?: string;
    motDePasse?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      return { success: false, message: 'Seuls les administrateurs peuvent ajouter des utilisateurs.' };
    }

    // RÈGLE STRICTE : Seul le Super Administrateur peut créer un autre Super Administrateur
    if (userData.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return {
        success: false,
        message: 'Seul le Super Administrateur a le droit de créer un autre compte Super Administrateur.'
      };
    }

    const normalizedEmail = userData.email.trim().toLowerCase();
    const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: 'Un utilisateur avec cette adresse email existe déjà.' };
    }

    let passwordHash: string | undefined;
    let salt: string | undefined;
    if (userData.motDePasse) {
      const h = await hashPassword(userData.motDePasse);
      passwordHash = h.hash;
      salt = h.salt;
    }

    const newUser: User = {
      id: newId('usr'),
      nomComplet: userData.nomComplet.trim(),
      email: normalizedEmail,
      role: userData.role,
      titre: userData.titre?.trim() || (userData.role === 'admin' ? 'Administrateur' : 'Archiviste Opérationnel'),
      actif: true,
      dateCreation: new Date().toISOString(),
      passwordHash,
      salt
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    // Synchronisation sur Supabase profiles
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').upsert({
        id: newUser.id,
        nom_complet: newUser.nomComplet,
        email: newUser.email,
        role: newUser.role,
        titre: newUser.titre,
        actif: true,
        created_at: newUser.dateCreation,
        updated_at: newUser.dateCreation
      }).then(null, () => {});
    }

    return { success: true, message: `Utilisateur ${newUser.nomComplet} créé avec succès.` };
  };

  /**
   * Mise à jour d'un utilisateur (rôle, nom, statut actif/bloqué)
   */
  const updateUser = async (updatedUser: User): Promise<{ success: boolean; message: string }> => {
    // RÈGLE STRICTE : Un admin standard ne peut pas promouvoir un utilisateur en super_admin
    if (updatedUser.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      return { success: false, message: 'Seul le Super Administrateur peut accorder le rôle de Super Administrateur.' };
    }

    const updated = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    // Si le compte de l'utilisateur connecté est désactivé/bloqué, déconnexion immédiate
    if (currentUser?.id === updatedUser.id) {
      if (!updatedUser.actif) {
        await logout();
      } else {
        setCurrentUser(updatedUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }

    // Synchronisation immédiate du statut dans Supabase
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('profiles')
        .update({
          nom_complet: updatedUser.nomComplet,
          role: updatedUser.role,
          titre: updatedUser.titre,
          actif: updatedUser.actif,
          updated_at: new Date().toISOString()
        })
        .eq('email', updatedUser.email)
        .then(null, () => {});
    }

    return {
      success: true,
      message: updatedUser.actif
        ? `Compte de ${updatedUser.nomComplet} activé et mis à jour.`
        : `Compte de ${updatedUser.nomComplet} BLOQUÉ avec succès. L'accès au logiciel est désormais strictement interdit.`
    };
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
        return { allowed: false, reason: 'Seul le Super Administrateur peut supprimer un compte Super Admin.' };
      }
      if (targetUser.role === 'admin') {
        return { allowed: false, reason: 'Seul le Super Administrateur a le droit de supprimer un Administrateur.' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'Droits insuffisants pour supprimer un utilisateur.' };
  };

  /**
   * Suppression d'un utilisateur
   */
  const deleteUser = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Utilisateur introuvable.' };

    const check = canDeleteUser(target);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Action non autorisée.' };
    }

    const updated = users.filter(u => u.id !== targetUserId);
    setUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').delete().eq('email', target.email).then(null, () => {});
    }

    return { success: true, message: `L'utilisateur ${target.nomComplet} a été supprimé avec succès.` };
  };

  /**
   * Modification du mot de passe
   */
  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Non connecté.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const { hash, salt } = await hashPassword(newPassword);
    const updated = { ...currentUser, passwordHash: hash, salt: salt };
    await updateUser(updated);

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  };

  const refreshUsers = async () => {
    await syncSupabaseProfiles();
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
        createInitialSuperAdmin,
        addUser,
        updateUser,
        deleteUser,
        canDeleteUser,
        changePassword,
        refreshUsers
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
