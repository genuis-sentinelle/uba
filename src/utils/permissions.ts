import { Role } from '../types';

/**
 * ARCHIVA UBA — Matrice des habilitations unifiée
 */
const isAdminLike = (r?: Role) => r === 'super_admin' || r === 'admin';

export const can = {
  manageUsers: (r?: Role) => r === 'super_admin' || r === 'admin',
  viewAudit: (r?: Role) => r === 'super_admin' || r === 'admin',
  editReferentials: (r?: Role) => r === 'super_admin' || r === 'admin',
  deleteData: (r?: Role) => r === 'super_admin' || r === 'admin',
  clearAll: (r?: Role) => r === 'super_admin',
  viewConfidential: (r?: Role) => r === 'super_admin' || r === 'admin',
  write: isAdminLike,
  print: isAdminLike,
  export: isAdminLike,
  importData: isAdminLike,
  manageArchives: isAdminLike,
};

export class PermissionError extends Error {}

export const assertCan = (ok: boolean) => {
  if (!ok) throw new PermissionError('Action non autorisée : profil en lecture seule.');
};
