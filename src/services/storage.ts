import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_NAME = 'report-attachments';

/**
 * Téléverse une image vers le bucket Supabase Storage
 * Si Supabase n'est pas configuré ou en cas d'erreur réseau, renvoie null pour permettre
 * un repli (ex: stockage local ou base64) sans bloquer l'utilisateur.
 */
export async function uploadReportImage(
  file: File,
  reportId: string
): Promise<{ url: string; path: string } | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[Storage] Supabase non configuré, image ignorée sur le cloud.');
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn('[Storage] Erreur upload:', error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: publicData.publicUrl,
      path: data.path
    };
  } catch (err) {
    console.warn('[Storage] Échec inattendu upload:', err);
    return null;
  }
}

/**
 * Supprime une image du bucket
 */
export async function deleteReportImage(path: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
    return !error;
  } catch {
    return false;
  }
}
