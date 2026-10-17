import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { INITIAL_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  hasSuperAdmin: boolean;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  createInitialSuperAdmin: (data: { nomUtilisateur: string; motDePasse: string; email?: string }) => { success: boolean; message: string };
  addUser: (user: Omit<User, 'id' | 'dateCreation'>) => { success: boolean; message: string };
  updateUser: (user: User) => { success: boolean; message: string };
  deleteUser: (targetUserId: string) => { success: boolean; message: string };
  canDeleteUser: (targetUser: User) => { allowed: boolean; reason?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge unique absolue des anciens comptes pour repartir sur une application 100% vierge
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
    if (!isCleaned) {
      return null;
    }
    const saved = localStorage.getItem('archiva_uba_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null; // Page de connexion ou configuration initiale requise
  });

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
   * Création unique du compte Super Administrateur avec SEULEMENT 2 informations :
   * Nom d'utilisateur et Mot de passe.
   */
  const createInitialSuperAdmin = (data: { nomUtilisateur: string; motDePasse: string; email?: string }): { success: boolean; message: string } => {
    if (hasSuperAdmin) {
      return {
        success: false,
        message: 'Le compte Super Administrateur a déjà été initialisé. La création publique est désormais verrouillée.'
      };
    }

    const nom = data.nomUtilisateur.trim();
    const mdp = data.motDePasse.trim();

    if (!nom) {
      return { success: false, message: 'Le nom d\'utilisateur est obligatoire.' };
    }
    if (!mdp) {
      return { success: false, message: 'Le mot de passe est obligatoire.' };
    }

    const emailGen = data.email?.trim() || (nom.includes('@') ? nom.toLowerCase() : `${nom.toLowerCase().replace(/[^a-z0-9]/g, '.')}@uba.local`);

    const newSuperAdmin: User = {
      id: `user-super-${Date.now()}`,
      nomComplet: nom,
      email: emailGen,
      role: 'super_admin',
      titre: 'Super Administrateur des Archives UBA',
      actif: true,
      dateCreation: new Date().toISOString()
    };

    const nextUsers = [newSuperAdmin];
    setUsers(nextUsers);
    setCurrentUser(newSuperAdmin);
    localStorage.setItem('archiva_uba_users', JSON.stringify(nextUsers));
    localStorage.setItem('archiva_uba_current_user', JSON.stringify(newSuperAdmin));

    return {
      success: true,
      message: 'Compte Super Administrateur unique créé avec succès.'
    };
  };

  /**
   * Connexion avec Nom d'utilisateur OU Email professionnel
   */
  const login = (identifiant: string, _password?: string): boolean => {
    const query = identifiant.trim().toLowerCase();
    if (!query) return false;

    const found = users.find(u => 
      u.nomComplet.toLowerCase() === query ||
      u.email.toLowerCase() === query ||
      u.email.split('@')[0].toLowerCase() === query ||
      u.nomComplet.toLowerCase().replace(/[^a-z0-9]/g, '.') === query
    );

    if (found && found.actif) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found && found.actif) {
      setCurrentUser(found);
    }
  };

  const canDeleteUser = (targetUser: User): { allowed: boolean; reason?: string } => {
    if (!currentUser) return { allowed: false, reason: 'Vous devez être connecté.' };
    if (currentUser.id === targetUser.id) {
      return { allowed: false, reason: 'Vous ne pouvez pas supprimer votre propre compte.' };
    }
    // Only Super Admin can delete an Admin or Super Admin
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

  const addUser = (userData: Omit<User, 'id' | 'dateCreation'>): { success: boolean; message: string } => {
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

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      dateCreation: new Date().toISOString()
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
        login,
        logout,
        switchUser,
        createInitialSuperAdmin,
        addUser,
        updateUser,
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
