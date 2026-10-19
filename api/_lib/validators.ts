export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePassword(password: unknown, role: string): string | null {
  if (typeof password !== 'string') {
    return 'Le mot de passe doit être une chaîne de caractères.';
  }

  const minLen = role === 'super_admin' || role === 'admin' ? 10 : 8;
  if (password.length < minLen) {
    return `Le mot de passe pour le rôle ${role === 'super_admin' ? 'Super Administrateur' : role === 'admin' ? 'Administrateur' : 'Archiviste'} doit comporter au moins ${minLen} caractères.`;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasLetter || !hasDigit) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  }

  return null;
}
