import { Role } from '../types';

/**
 * ARCHIVA UBA — Matrice des habilitations unifiée
 */
export const can = {
  manageUsers: (r?: Role) => r === 'super_admin' || r === 'admin',
  viewAudit: (r?: Role) => r === 'super_admin' || r === 'admin',
  editReferentials: (r?: Role) => r === 'super_admin' || r === 'admin',
  deleteData: (r?: Role) => r === 'super_admin' || r === 'admin',
  clearAll: (r?: Role) => r === 'super_admin',
  viewConfidential: (r?: Role) => r === 'super_admin' || r === 'admin'
};
