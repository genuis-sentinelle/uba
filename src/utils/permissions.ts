import { Role } from '../types';

/**
 * ARCHIVA UBA — Matrice des habilitations unifiée
 * - stagiaire : lecture seule, pas de synthèses confidentielles
 * - admin : lecture + écriture (INSERT/UPDATE), AUCUNE suppression
 * - super_admin : accès total (suppression, purge, gestion complète des rôles)
 */
const isAdminLike = (r?: Role) => r === 'super_admin' || r === 'admin';

export const can = {
  manageUsers: (r?: Role) => r === 'super_admin' || r === 'admin',
  deleteUsers: (r?: Role) => r === 'super_admin',
  viewAudit: (r?: Role) => r === 'super_admin' || r === 'admin',
  editReferentials: (r?: Role) => r === 'super_admin' || r === 'admin',
  deleteData: (r?: Role) => r === 'super_admin',
  clearAll: (r?: Role) => r === 'super_admin',
  archive: (r?: Role) => r === 'super_admin' || r === 'admin',
  unarchive: (r?: Role) => r === 'super_admin',
  viewArchives: (r?: Role) => Boolean(r),
  manageSnapshots: (r?: Role) => r === 'super_admin' || r === 'admin',
  viewConfidential: (r?: Role) => r === 'super_admin' || r === 'admin',
  write: isAdminLike,
  print: isAdminLike,
  export: isAdminLike,
  importData: isAdminLike,
};

export class PermissionError extends Error {}

export const assertCan = (ok: boolean) => {
  if (!ok) throw new PermissionError('Action non autorisée : profil en lecture seule ou droits insuffisants.');
};
