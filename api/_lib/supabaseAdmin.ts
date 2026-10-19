import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  // 1. Protection environnement Vercel Preview
  const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV;
  const allowPreviewWithProd = process.env.ALLOW_PREVIEW_WITH_PROD_DB === 'true';

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[ARCHIVA UBA SERVEUR] Configuration Supabase manquante : SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY doivent être définis côté serveur.'
    );
  }

  // Si on est sur un déploiement Preview Vercel, interdiction formelle d'utiliser la base de production
  if (vercelEnv === 'preview' && !allowPreviewWithProd) {
    const prodUrl = process.env.SUPABASE_PROD_URL || '';
    if (prodUrl && supabaseUrl.toLowerCase().trim() === prodUrl.toLowerCase().trim()) {
      throw new Error(
        'DÉPLOIEMENT PREVIEW BLOQUÉ : La base de données de production ne doit pas être utilisée en environnement Preview. ' +
        'Veuillez associer un projet Supabase de staging séparé dans les variables d\'environnement Preview de Vercel.'
      );
    }
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedAdminClient;
}
