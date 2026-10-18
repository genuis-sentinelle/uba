import { TransferSlip } from '../types';

/**
 * ARCHIVA UBA — Identifiants universels sans collision
 */
export const newId = (prefix: string): string => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // fallback
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Numérotation officielle des bordereaux sans collision entre sites
 */
export const nextSlipNumber = (slips: TransferSlip[], site: string): string => {
  const year = new Date().getFullYear();
  const code = site === 'Maya-Maya' ? 'MM' : 'MZ';
  const prefix = `BORD-${code}-${year}-`;
  const max = slips
    .filter(s => s.numeroBordereau && s.numeroBordereau.startsWith(prefix))
    .reduce((m, s) => {
      const num = parseInt(s.numeroBordereau.slice(prefix.length), 10);
      return isNaN(num) ? m : Math.max(m, num);
    }, 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
};
