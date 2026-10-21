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

export function parseJsonBody(req: any): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed;
    } catch {
      const error: any = new Error('Format JSON invalide dans le corps de la requête.');
      error.statusCode = 400;
      throw error;
    }
  }
  return {};
}

export function sanitizeString(val: unknown, maxLen = 255): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}
