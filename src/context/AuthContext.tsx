import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { newId } from '../utils/ids';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  hasSuperAdmin: boolean;
  loading: boolean;
  login: (identifiant: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  createInitialSuperAdmin: (data: { nomUtilisateur: string; motDePasse: string; email?: string }) => Promise<{ success: boolean; message: string }>;
  addUser: (user: Omit<User, 'id' | 'dateCreation'> & { motDePasse?: string }) => Promise<{ success: boolean; message: string }>;
  updateUser: (user: User) => { success: boolean; message: string };
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (targetUserId: string) => { success: boolean; message: string };
  canDeleteUser: (targetUser: User) => { allowed: boolean; reason?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const isCleaned = localStorage.getItem('archiva_uba_clean_v3_blank_users');
    if (!isCleaned) {
      localStorage.removeItem('archiva_uba_users');
      localStorage.removeItem('archiva_uba_current_user');
      localStorage.setItem('archiva_uba_clean_v3_blank_users', 'true');
      return [];
    }
    const saved = localStorage.getItem('archiva_uba_users');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const isCleaned = localStorage.getItem('archiva_uba_clean_v3_blank_users');
    if (!isCleaned) return null;
    const saved = localStorage.getItem('archiva_uba_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  const hasSuperAdmin = users.some(u => u.role === 'super_admin');

  useEffect(() => {
    localStorage.setItem('archiva_uba_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('archiva_uba_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('archiva_uba_current_user');
    }
  }, [currentUser]);

  /**
   * Création unique du Super Administrateur avec mot de passe haché de manière sécurisée
   */
  const createInitialSuperAdmin = async (data: { nomUtilisateur: string; motDePasse: string; email?: string }): Promise<{ success: boolean; message: string }> => {
    if (hasSuperAdmin) {
      return {
        success: false,
        message: 'Le compte Super Administrateur a déjà été initialisé. La création publique est verrouillée.'
      };
    }

    const nom = data.nomUtilisateur.trim();
    const mdp = data.motDePasse.trim();

    if (!nom) return { success: false, message: 'Le nom d\'utilisateur est obligatoire.' };
    if (!mdp) return { success: false, message: 'Le mot de passe est obligatoire.' };
    if (mdp.length < 4) return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };

    const emailGen = data.email?.trim() || (nom.includes('@') ? nom.toLowerCase() : `${nom.toLowerCase().replace(/[^a-z0-9]/g, '.')}@uba.local`);

    const { hash, salt } = await hashPassword(mdp);

    const newSuperAdmin: User = {
      id: newId('usr-super'),
      nomComplet: nom,
      email: emailGen,
      role: 'super_admin',
      titre: 'Super Administrateur des Archives UBA',
      actif: true,
      dateCreation: new Date().toISOString(),
      passwordHash: hash,
      salt: salt
    };

    const nextUsers = [newSuperAdmin];
    setUsers(nextUsers);
    setCurrentUser(newSuperAdmin);
    localStorage.setItem('archiva_uba_users', JSON.stringify(nextUsers));
    localStorage.setItem('archiva_uba_current_user', JSON.stringify(newSuperAdmin));

    return {
      success: true,
      message: 'Compte Super Administrateur unique initialisé avec succès.'
    };
  };

  /**
   * Connexion sécurisée : vérifie le mot de passe réel (Local SHA-256 + Supabase Auth si configuré)
   */
  const login = async (identifiant: string, password: string): Promise<{ success: boolean; message: string }> => {
    const query = identifiant.trim().toLowerCase();
    if (!query) return { success: false, message: 'Veuillez saisir votre identifiant.' };
    if (!password) return { success: false, message: 'Veuillez saisir votre mot de passe.' };

    // 1. Si Supabase est actif, tenter l'authentification officielle
    if (isSupabaseConfigured && supabase) {
      try {
        const emailAuth = query.includes('@') ? query : `${query.replace(/[^a-z0-9]/g, '.')}@uba.local`;
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailAuth,
          password: password
        });
        if (authData?.user && !authError) {
          const found = users.find(u => u.email.toLowerCase() === emailAuth.toLowerCase() || u.id === authData.user.id);
          if (found) {
            setCurrentUser(found);
            return { success: true, message: 'Connexion réussie.' };
          }
        }
      } catch {
        // Fallback local en cas d'absence de réseau
      }
    }

    // 2. Authentification locale sécurisée
    const found = users.find(u => 
      u.nomComplet.toLowerCase() === query ||
      u.email.toLowerCase() === query ||
      u.email.split('@')[0].toLowerCase() === query ||
      u.nomComplet.toLowerCase().replace(/[^a-z0-9]/g, '.') === query
    );

    if (!found) {
      return { success: false, message: 'Identifiant introuvable ou inexistant.' };
    }

    if (!found.actif) {
      return { success: false, message: 'Ce compte utilisateur a été désactivé par l\'administrateur.' };
    }

    // Vérification cryptographique du hash
    if (found.passwordHash && found.salt) {
      const isValid = await verifyPassword(password, found.passwordHash, found.salt);
      if (!isValid) {
        return { success: false, message: 'Mot de passe incorrect.' };
      }
    } else {
      // Compte hérité sans mot de passe : enregistrer le mot de passe fourni
      const { hash, salt } = await hashPassword(password);
      found.passwordHash = hash;
      found.salt = salt;
      setUsers([...users]);
    }

    setCurrentUser(found);
    return { success: true, message: 'Connexion réussie.' };
  };

  const logout = () => {
    setCurrentUser(null);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Non connecté.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const { hash, salt } = await hashPassword(newPassword);
    const updated = { ...currentUser, passwordHash: hash, salt: salt };
    updateUser(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {
        // local already updated
      }
    }

    return { success: true, message: 'Mot de passe mis à jour avec succès.' };
  };

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

  const deleteUser = (targetUserId: string): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Utilisateur introuvable.' };

    const check = canDeleteUser(target);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Action non autorisée.' };
    }

    setUsers(prev => prev.filter(u => u.id !== targetUserId));
    return { success: true, message: `L'utilisateur ${target.nomComplet} a été supprimé avec succès.` };
  };

  const addUser = async (userData: Omit<User, 'id' | 'dateCreation'> & { motDePasse?: string }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      return { success: false, message: 'Seuls les administrateurs peuvent ajouter des utilisateurs.' };
    }
    if (currentUser.role === 'admin' && userData.role === 'super_admin') {
      return { success: false, message: 'Un administrateur ne peut pas créer un Super Administrateur.' };
    }
    const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
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

    const { motDePasse, ...rest } = userData;
    const newUser: User = {
      ...rest,
      id: newId('usr'),
      dateCreation: new Date().toISOString(),
      passwordHash,
      salt
    };

    setUsers(prev => [newUser, ...prev]);
    return { success: true, message: `Utilisateur ${newUser.nomComplet} créé avec succès.` };
  };

  const updateUser = (updatedUser: User): { success: boolean; message: string } => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    return { success: true, message: `Compte de ${updatedUser.nomComplet} mis à jour.` };
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
        changePassword,
        deleteUser,
        canDeleteUser
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
