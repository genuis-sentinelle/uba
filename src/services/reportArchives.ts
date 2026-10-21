import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ArchivableKind, ArchivedDocument, DailyReport, SynthesisReport, TransferSlip } from '../types';

/**
 * Critères d'éligibilité à l'archivage unitaire (Étape 3) :
 * - Rapport journalier : non archivé ET statut !== 'brouillon'
 * - Bordereau : non archivé ET statut !== 'en_transit'
 * - Synthèse : non archivée
 */
export function isReportArchivable(
  kind: ArchivableKind,
  doc: DailyReport | SynthesisReport | TransferSlip
): { eligible: boolean; reason?: string } {
  if (doc.archived) {
    return { eligible: false, reason: 'Ce document est déjà archivé.' };
  }

  if (kind === 'daily') {
    const report = doc as DailyReport;
    if (report.statut === 'brouillon') {
      return { eligible: false, reason: 'Un rapport au statut brouillon ne peut pas être archivé. Validez-le d\'abord.' };
    }
    return { eligible: true };
  }

  if (kind === 'slip') {
    const slip = doc as TransferSlip;
    if (slip.statut === 'en_transit') {
      return { eligible: false, reason: 'Un bordereau encore en transit ne peut pas être archivé. Réceptionnez-le d\'abord.' };
    }
    return { eligible: true };
  }

  return { eligible: true };
}

/**
 * Archive unitairement un rapport ou bordereau (Admin et Super Admin).
 * Appelle la fonction RPC sécurisée `archive_report` de PostgreSQL.
 */
export async function archiveReport(
  kind: ArchivableKind,
  id: string,
  note?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      message: 'Archivage enregistré localement (mode hors-ligne).'
    };
  }

  try {
    const { error } = await supabase.rpc('archive_report', {
      p_kind: kind,
      p_id: id,
      p_note: note && note.trim().length > 0 ? note.trim() : null
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'archivage sur le serveur.'
      };
    }

    return {
      success: true,
      message: 'Document archivé avec succès.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Exception inattendue lors de l\'archivage.'
    };
  }
}

/**
 * Désarchive unitairement un rapport ou bordereau (Super Admin UNIQUEMENT).
 * Appelle la fonction RPC sécurisée `unarchive_report` de PostgreSQL.
 */
export async function unarchiveReport(
  kind: ArchivableKind,
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: true,
      message: 'Désarchivage enregistré localement (mode hors-ligne).'
    };
  }

  try {
    const { error } = await supabase.rpc('unarchive_report', {
      p_kind: kind,
      p_id: id
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors du désarchivage sur le serveur.'
      };
    }

    return {
      success: true,
      message: 'Document désarchivé avec succès.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Exception inattendue lors du désarchivage.'
    };
  }
}

/**
 * Compile les documents archivés depuis les collections en mémoire ou serveur.
 */
export function buildArchivedList(
  dailyReports: DailyReport[],
  synthesisReports: SynthesisReport[],
  transferSlips: TransferSlip[]
): ArchivedDocument[] {
  const archives: ArchivedDocument[] = [];

  for (const r of dailyReports) {
    if (r.archived) {
      archives.push({
        id: r.id,
        kind: 'daily',
        titre: r.titre,
        dateDoc: r.dateDebut,
        archivedAt: r.archivedAt || r.dateCreation || new Date().toISOString(),
        archivedBy: r.archivedBy,
        archiveNote: r.archiveNote,
        raw: r
      });
    }
  }

  for (const s of synthesisReports) {
    if (s.archived) {
      archives.push({
        id: s.id,
        kind: 'synthesis',
        titre: s.titre,
        dateDoc: `${s.dateDebut} au ${s.dateFin}`,
        archivedAt: s.archivedAt || s.dateCreation || new Date().toISOString(),
        archivedBy: s.archivedBy,
        archiveNote: s.archiveNote,
        raw: s
      });
    }
  }

  for (const b of transferSlips) {
    if (b.archived) {
      archives.push({
        id: b.id,
        kind: 'slip',
        titre: `Bordereau ${b.numeroBordereau} (${b.siteDepart} -> ${b.siteArrivee})`,
        dateDoc: b.dateTransfert,
        archivedAt: b.archivedAt || new Date().toISOString(),
        archivedBy: b.archivedBy,
        archiveNote: b.archiveNote,
        raw: b
      });
    }
  }

  return archives.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
}
