/**
 * Coffre-fort local de trousseau de mots de passe pour ARCHIVA UBA
 * Chiffre et mémorise localement les identifiants pour éviter de ressaisir les mots de passe.
 */

const VAULT_STORAGE_KEY = 'archiva_uba_vault_credentials';
const VAULT_SALT = 'UBA-ARCHIVES-CONGO-2026-SECURE-VAULT';

// Simple obfuscation/encryption for local browser storage
const simpleEncrypt = (text: string): string => {
  try {
    const textToChars = (t: string) => t.split('').map(c => c.charCodeAt(0));
    const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = (code: number) => textToChars(VAULT_SALT).reduce((a, b) => a ^ b, code);

    return text
      .split('')
      .map(c => c.charCodeAt(0))
      .map(applySaltToChar)
      .map(byteHex)
      .join('');
  } catch {
    return btoa(text);
  }
};

const simpleDecrypt = (encoded: string): string => {
  try {
    const textToChars = (t: string) => t.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = (code: number) => textToChars(VAULT_SALT).reduce((a, b) => a ^ b, code);

    const matches = encoded.match(/.{1,2}/g);
    if (!matches) return '';

    return matches
      .map(hex => parseInt(hex, 16))
      .map(applySaltToChar)
      .map(charCode => String.fromCharCode(charCode))
      .join('');
  } catch {
    try {
      return atob(encoded);
    } catch {
      return '';
    }
  }
};

interface StoredCredentials {
  [email: string]: {
    hash: string;
    savedAt: string;
    autoLogin?: boolean;
  };
}

const getVaultData = (): StoredCredentials => {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const vault = {
  /**
   * Sauvegarde et chiffre le mot de passe d'un utilisateur dans le navigateur
   */
  savePassword(email: string, password: string, autoLogin: boolean = true): void {
    if (!email || !password) return;
    const cleanEmail = email.trim().toLowerCase();
    const data = getVaultData();
    data[cleanEmail] = {
      hash: simpleEncrypt(password),
      savedAt: new Date().toISOString(),
      autoLogin
    };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Récupère et déchiffre le mot de passe enregistré pour un email
   */
  getPassword(email: string): string | null {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const data = getVaultData();
    const entry = data[cleanEmail];
    if (!entry || !entry.hash) return null;
    return simpleDecrypt(entry.hash);
  },

  /**
   * Vérifie si un mot de passe est enregistré pour un compte
   */
  hasSavedPassword(email: string): boolean {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const data = getVaultData();
    return Boolean(data[cleanEmail]);
  },

  /**
   * Supprime un compte du trousseau
   */
  removePassword(email: string): void {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const data = getVaultData();
    delete data[cleanEmail];
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Retourne la liste des emails mémorisés
   */
  getSavedEmails(): string[] {
    const data = getVaultData();
    return Object.keys(data);
  }
};
