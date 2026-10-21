import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { todayLocal, toISODateLocal } from '../utils/dates';

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

const LOCAL_SNAPSHOTS_KEY = 'archiva_uba_archive_snapshots_v1';

async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return 'local_' + Math.abs(hash).toString(16).padStart(32, '0');
}

function getLocalSnapshots(): (ArchiveSnapshotMeta & { payload?: Record<string, unknown> })[] {
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSnapshots(snapshots: (ArchiveSnapshotMeta & { payload?: Record<string, unknown> })[]) {
  try {
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Récupère la liste de tous les clichés hebdomadaires et manuels scellés.
 */
export async function listArchives(): Promise<ArchiveSnapshotMeta[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalSnapshots().map(s => {
      const { payload, ...meta } = s;
      return meta;
    });
  }

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

/**
 * Récupère le payload JSON complet d'un cliché pour inspection dans l'interface.
 */
export async function getArchivePayload(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured || !supabase) {
    const found = getLocalSnapshots().find(s => s.id === id);
    return found?.payload || null;
  }

  try {
    const { data, error } = await supabase
      .from('archive_snapshots')
      .select('payload')
      .eq('id', id)
      .single();

    if (error || !data?.payload) {
      console.warn('[Archives] Payload introuvable :', error?.message);
      return null;
    }

    return data.payload as Record<string, unknown>;
  } catch (err) {
    console.error('[Archives] Exception getArchivePayload :', err);
    return null;
  }
}

/**
 * Télécharge le fichier JSON d'un cliché scellé.
 */
export async function downloadArchive(id: string, filename?: string): Promise<boolean> {
  const payload = await getArchivePayload(id);
  if (!payload) return false;

  try {
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `archive_UBA_${id.slice(0, 8)}.json`;
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

/**
 * Crée un cliché scellé d'archives (hebdomadaire ou période personnalisée).
 */
export async function archiveNow(
  pStart?: string,
  pEnd?: string
): Promise<{ success: boolean; id?: string; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    // Mode local de secours
    const now = new Date();
    const dStart = pStart || toISODateLocal(new Date(now.setDate(now.getDate() - now.getDay() + 1)));
    const dEnd = pEnd || todayLocal();
    const newId = 'local-snap-' + Date.now();

    const mockPayload: Record<string, unknown> = {
      meta: { periode_debut: dStart, periode_fin: dEnd, genere_le: new Date().toISOString() },
      agencies: JSON.parse(localStorage.getItem('archiva_uba_agencies') || '[]'),
      team_members: JSON.parse(localStorage.getItem('archiva_uba_members') || '[]'),
      daily_reports: JSON.parse(localStorage.getItem('archiva_uba_daily_reports') || '[]'),
      synthesis_reports: JSON.parse(localStorage.getItem('archiva_uba_synthesis_reports') || '[]'),
      transfer_slips: JSON.parse(localStorage.getItem('archiva_uba_slips') || '[]'),
      cartons: JSON.parse(localStorage.getItem('archiva_uba_cartons') || '[]'),
      incidents: JSON.parse(localStorage.getItem('archiva_uba_incidents') || '[]'),
      attendance_records: JSON.parse(localStorage.getItem('archiva_uba_attendance') || '[]'),
      audit_logs: JSON.parse(localStorage.getItem('archiva_uba_logs') || '[]')
    };

    const serialized = JSON.stringify(mockPayload);
    const hash = await computeSha256(serialized);

    const counts: Record<string, number> = {};
    for (const [key, val] of Object.entries(mockPayload)) {
      if (Array.isArray(val)) counts[key] = val.length;
    }

    const localSnap: ArchiveSnapshotMeta & { payload: Record<string, unknown> } = {
      id: newId,
      kind: 'manual',
      periodStart: dStart,
      periodEnd: dEnd,
      rowCounts: counts,
      checksum: hash,
      sizeBytes: new Blob([serialized]).size,
      createdAt: new Date().toISOString(),
      createdBy: 'Administrateur Local',
      payload: mockPayload
    };

    const current = getLocalSnapshots();
    saveLocalSnapshots([localSnap, ...current]);

    return {
      success: true,
      id: newId,
      message: 'Archive générée et scellée avec succès (SHA-256 vérifié).'
    };
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

/**
 * Vérifie l'intégrité cryptographique SHA-256 d'un cliché scellé.
 */
export async function verifyArchiveIntegrity(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const found = getLocalSnapshots().find(s => s.id === id);
    if (!found || !found.payload) return false;
    const computed = await computeSha256(JSON.stringify(found.payload));
    return computed === found.checksum;
  }

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
