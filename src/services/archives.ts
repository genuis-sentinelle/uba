import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ArchiveSnapshotMeta {
  id: string;
  kind: 'weekly' | 'manual';
  isoWeek?: string;
  periodStart: string;
  periodEnd: string;
  rowCounts: Record<string, number>;
  checksum: string;
  sizeBytes: number;
  createdAt: string;
  createdBy?: string;
}

export async function listArchives(): Promise<ArchiveSnapshotMeta[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('archive_snapshots')
      .select('id, kind, iso_week, period_start, period_end, row_counts, checksum, size_bytes, created_at, created_by')
      .order('period_start', { ascending: false });

    if (error || !data) {
      console.warn('[Archives] Erreur récupération archives :', error?.message);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      kind: r.kind,
      isoWeek: r.iso_week || undefined,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      rowCounts: r.row_counts || {},
      checksum: r.checksum,
      sizeBytes: r.size_bytes,
      createdAt: r.created_at,
      createdBy: r.created_by || undefined
    }));
  } catch (err) {
    console.error('[Archives] Exception listArchives :', err);
    return [];
  }
}

export async function downloadArchive(id: string, filename?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { data, error } = await supabase
      .from('archive_snapshots')
      .select('payload, iso_week, period_start')
      .eq('id', id)
      .single();

    if (error || !data?.payload) {
      throw new Error(error?.message || 'Archive introuvable');
    }

    const jsonStr = JSON.stringify(data.payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `archive_UBA_${data.iso_week || data.period_start}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[Archives] Erreur téléchargement archive :', err);
    return false;
  }
}

export async function archiveNow(pStart?: string, pEnd?: string): Promise<{ success: boolean; id?: string; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase n\'est pas configuré.' };
  }

  try {
    const { data, error } = await supabase.rpc('archive_now', {
      p_start: pStart || null,
      p_end: pEnd || null
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      id: data,
      message: 'Archive hebdomadaire générée et scellée avec succès.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erreur lors de la création de l\'archive.' };
  }
}

export async function verifyArchiveIntegrity(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { data, error } = await supabase.rpc('verify_archive', { p_id: id });
    if (error) {
      console.warn('[Archives] Erreur vérification intégrité :', error.message);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}
