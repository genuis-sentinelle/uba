/**
 * ARCHIVA UBA — Cryptographie standard Web Crypto API (SHA-256 avec sel)
 */

export const hashPassword = async (password: string, salt?: string): Promise<{ hash: string; salt: string }> => {
  const effectiveSalt = salt || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
  const enc = new TextEncoder();
  const data = enc.encode(`${effectiveSalt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: effectiveSalt };
};

export const verifyPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  if (!password || !hash || !salt) return false;
  const res = await hashPassword(password, salt);
  return res.hash === hash;
};
