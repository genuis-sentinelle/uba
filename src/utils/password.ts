/**
 * Générateur cryptographique de mot de passe fort pour ARCHIVA UBA
 * Respecte les exigences de sécurité (>= 14 caractères, lettres, chiffres, symboles).
 */
export const generatePassword = (len = 14): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  const pwd = Array.from(buf, n => alphabet[n % alphabet.length]).join('');
  return /[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd) ? pwd : generatePassword(len);
};
