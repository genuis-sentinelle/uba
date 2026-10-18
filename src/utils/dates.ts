/**
 * ARCHIVA UBA — Gestion stricte des dates calendaires locales
 * Évite les décalages UTC/fuseau horaire (notamment UTC+1 au Congo).
 */

export const toISODateLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayLocal = (): string => toISODateLocal(new Date());

export const parseLocalDate = (s: string): Date => {
  if (!s) return new Date();
  const parts = s.split('T')[0].split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date(s);
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
};
