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

  // Synchronisation continue des profils Supabase et vérification de sécurité (déconnexion immédiate si bloqué)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const syncProfiles = async () => {
      try {
        const { data: profiles, error } = await client.from('profiles').select('*');
        if (!error && profiles && profiles.length > 0) {
          setUsers(prev => {
            const updated = [...prev];
            profiles.forEach(p => {
              const idx = updated.findIndex(u => u.email.toLowerCase() === p.email.toLowerCase() || u.id === p.id);
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
                  nomComplet: p.nom_complet,
                  email: p.email,
                  role: p.role,
                  titre: p.titre || 'Archiviste Opérationnel',
                  actif: p.actif ?? true,
                  dateCreation: p.created_at || new Date().toISOString()
                });
              }
            });
            return updated;
          });

          // Si l'utilisateur connecté est devenu inactif sur le serveur, déconnexion immédiate
          if (currentUser) {
            const myProfile = profiles.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.id === currentUser.id);
            if (myProfile && myProfile.actif === false) {
              console.warn('[ARCHIVA UBA] Compte bloqué détecté par le serveur. Déconnexion immédiate.');
              logout();
            }
          }
        }
      } catch (err) {
        console.warn('[ARCHIVA UBA] Erreur lors de la synchronisation des profils:', err);
      }
    };

    syncProfiles();
    const interval = setInterval(syncProfiles, 15000); // Polling de sécurité toutes les 15s
    return () => clearInterval(interval);
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert({
          nom_complet: newSuperAdmin.nomComplet,
          email: newSuperAdmin.email,
          role: newSuperAdmin.role,
          titre: newSuperAdmin.titre,
          actif: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (err) {
        console.warn('[ARCHIVA UBA] Super Admin profil non synchronisé sur Supabase:', err);
      }
    }

    return {
      success: true,
      message: 'Compte Super Administrateur unique initialisé avec succès.'
    };
  };

  /**
   * Connexion sécurisée avec vérification stricte du statut actif/bloqué (Local SHA-256 + Supabase Auth)
   */
  const login = async (identifiant: string, password: string): Promise<{ success: boolean; message: string }> => {
    const query = identifiant.trim().toLowerCase();
    if (!query) return { success: false, message: 'Veuillez saisir votre identifiant.' };
    if (!password) return { success: false, message: 'Veuillez saisir votre mot de passe.' };

    const emailAuth = query.includes('@') ? query : `${query.replace(/[^a-z0-9]/g, '.')}@uba.local`;

    // 1. Si Supabase est actif, vérifier le statut actif sur la table profiles
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: remoteProfile } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${emailAuth},nom_complet.ilike.${query}`)
          .maybeSingle();

        if (remoteProfile && remoteProfile.actif === false) {
          await supabase.auth.signOut().catch(() => {});
          return {
            success: false,
            message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
          };
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailAuth,
          password: password
        });

        if (authData?.user && !authError) {
          const { data: verifiedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (verifiedProfile && verifiedProfile.actif === false) {
            await supabase.auth.signOut().catch(() => {});
            return {
              success: false,
              message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
            };
          }

          const found = users.find(u => u.email.toLowerCase() === emailAuth.toLowerCase() || u.id === authData.user.id);
          if (found) {
            if (!found.actif) {
              await supabase.auth.signOut().catch(() => {});
              return {
                success: false,
                message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
              };
            }
            setCurrentUser(found);
            return { success: true, message: 'Connexion réussie.' };
          } else if (verifiedProfile) {
            const syncdUser: User = {
              id: verifiedProfile.id,
              nomComplet: verifiedProfile.nom_complet,
              email: verifiedProfile.email,
              role: verifiedProfile.role,
              titre: verifiedProfile.titre || 'Archiviste Opérationnel',
              actif: verifiedProfile.actif ?? true,
              dateCreation: verifiedProfile.created_at || new Date().toISOString()
            };
            if (!syncdUser.actif) {
              await supabase.auth.signOut().catch(() => {});
              return {
                success: false,
                message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
              };
            }
            setUsers(prev => [syncdUser, ...prev.filter(u => u.email !== syncdUser.email)]);
            setCurrentUser(syncdUser);
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

    // SÉCURITÉ STRICTE : Si le compte est désactivé ou bloqué, interdiction formelle d'accès
    if (!found.actif) {
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut().catch(() => {});
      }
      return {
        success: false,
        message: 'Ce compte utilisateur a été bloqué par le Super Administrateur. Accès strictement refusé.'
      };
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

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.from('profiles').delete().eq('email', target.email).then(null, () => {});
    }

    return { success: true, message: `L'utilisateur ${target.nomComplet} a été supprimé avec succès.` };
  };

  const addUser = async (userData: Omit<User, 'id' | 'dateCreation'> & { motDePasse?: string }): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      return { success: false, message: 'Seuls les administrateurs peuvent ajouter des utilisateurs.' };
    }
    // RÈGLE STRICTE : Seul le Super Administrateur peut créer un autre Super Administrateur
    if (userData.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return { success: false, message: 'Seul le Super Administrateur a le droit de créer un autre compte Super Administrateur.' };
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

    // Synchronisation sur Supabase profiles
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.from('profiles').upsert({
        nom_complet: newUser.nomComplet,
        email: newUser.email,
        role: newUser.role,
        titre: newUser.titre,
        actif: newUser.actif,
        created_at: newUser.dateCreation,
        updated_at: newUser.dateCreation
      }, { onConflict: 'email' }).then(null, () => {});
    }

    return { success: true, message: `Utilisateur ${newUser.nomComplet} créé avec succès.` };
  };

  const updateUser = (updatedUser: User): { success: boolean; message: string } => {
    // RÈGLE STRICTE : Un admin standard ne peut pas promouvoir un utilisateur en super_admin
    if (updatedUser.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      return { success: false, message: 'Seul le Super Administrateur peut accorder le rôle de Super Administrateur.' };
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Si le compte de l'utilisateur connecté est désactivé/bloqué, déconnexion immédiate
    if (currentUser?.id === updatedUser.id) {
      if (!updatedUser.actif) {
        logout();
      } else {
        setCurrentUser(updatedUser);
      }
    }

    // Synchronisation immédiate du statut (actif/bloqué, rôle, nom) dans Supabase
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client
        .from('profiles')
        .update({
          nom_complet: updatedUser.nomComplet,
          role: updatedUser.role,
          titre: updatedUser.titre,
          actif: updatedUser.actif,
          updated_at: new Date().toISOString()
        })
        .eq('email', updatedUser.email)
        .then(({ error }: { error: any }) => {
          if (error) {
            console.warn('[ARCHIVA UBA] Échec mise à jour Supabase profile:', error.message);
          }
        }, (err: unknown) => {
          console.warn('[ARCHIVA UBA] Erreur réseau mise à jour profil:', err);
        });
    }

    return {
      success: true,
      message: updatedUser.actif
        ? `Compte de ${updatedUser.nomComplet} activé et mis à jour.`
        : `Compte de ${updatedUser.nomComplet} BLOQUÉ avec succès. L'accès au logiciel est désormais strictement interdit.`
    };
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
