import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Agency,
  DailyReport,
  CartonInventory,
  TransferSlip,
  ArchiveIncident,
  TeamMember,
  LogEntry,
  AttendanceRecord
} from '../types';

export type SyncOp = {
  table: string;
  kind: 'upsert' | 'delete';
  row?: Record<string, unknown>;
  id?: string;
};

const QUEUE_KEY = 'archiva_sync_queue_v2';
type NotifyFn = (msg: string, type: 'error' | 'info') => void;
let notify: NotifyFn = () => {};

export const setSyncNotifier = (fn: NotifyFn) => {
  notify = fn;
};

const readQueue = (): SyncOp[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeQueue = (q: SyncOp[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    // ignore
  }
};

export const getPendingSyncCount = (): number => {
  return readQueue().length;
};

async function executeOp(op: SyncOp): Promise<boolean> {
  if (!supabase) return false;
  try {
    const res = op.kind === 'upsert'
      ? await supabase.from(op.table).upsert(op.row!)
      : await supabase.from(op.table).delete().eq('id', op.id!);

    if (res.error) {
      // Erreurs définitives (droits RLS, contraintes de validation) : notifier et ne pas bloquer en boucle
      if (['42501', '23514', '23502', '22P02'].includes(res.error.code ?? '')) {
        notify(`Synchronisation refusée (${op.table}) : ${res.error.message}`, 'error');
        return true;
      }
      return false; // Erreur réseau/temporaire : conserver dans la file d'attente
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushSync(op: SyncOp) {
  if (!isSupabaseConfigured || !supabase) return;
  const ok = typeof navigator !== 'undefined' && navigator.onLine ? await executeOp(op) : false;
  if (!ok) {
    writeQueue([...readQueue(), op]);
  }
}

export async function flushSyncQueue() {
  if (typeof navigator === 'undefined' || !navigator.onLine || !supabase) return;
  const pending = readQueue();
  if (pending.length === 0) return;

  const rest: SyncOp[] = [];
  for (const op of pending) {
    const ok = await executeOp(op);
    if (!ok) rest.push(op);
  }
  writeQueue(rest);
}

// ----------------- Typed Push Helpers -----------------

export const pushLog = (log: LogEntry) => {
  return pushSync({
    table: 'audit_logs',
    kind: 'upsert',
    row: {
      id: log.id,
      timestamp: log.timestamp,
      user_id: log.userId && !log.userId.startsWith('u-') && !log.userId.startsWith('log-') ? log.userId : null,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      details: log.details,
      category: log.category
    }
  });
};

export const pushAgency = (agency: Agency) => {
  return pushSync({
    table: 'agencies',
    kind: 'upsert',
    row: {
      id: agency.id,
      code: agency.code,
      nom: agency.nom,
      description: agency.description || null,
      conventions_count: agency.conventionsCount,
      cartons_count: agency.cartonsCount,
      dossiers_count: agency.dossiersCount,
      statut: agency.statut
    }
  });
};

export const deleteAgencyRemote = (id: string) => {
  return pushSync({ table: 'agencies', kind: 'delete', id });
};

export const pushDailyReport = (report: DailyReport) => {
  return pushSync({
    table: 'daily_reports',
    kind: 'upsert',
    row: {
      id: report.id,
      titre: report.titre,
      date_debut: report.dateDebut,
      date_fin: report.dateFin,
      horaires: report.horaires,
      chef_nom: report.chefNom,
      superviseurs: report.superviseurs,
      effectif_total: report.effectifTotal,
      presents: report.presents,
      absents: report.absents,
      absents_motifs: report.absentsMotifs || null,
      equipe_mazala: report.equipeMazala,
      equipe_ordinateur: report.equipeOrdinateur,
      groupes: report.groupes,
      taches: report.taches,
      transferts: report.transferts,
      receptions: report.receptions,
      chronologie: report.chronologie,
      observations: report.observations,
      total_declare: report.totalDeclare,
      total_calcule: report.totalCalcule,
      ecart: report.ecart,
      statut: report.statut,
      version: report.version,
      cree_par: report.creePar
    }
  });
};

export const deleteDailyReportRemote = (id: string) => {
  return pushSync({ table: 'daily_reports', kind: 'delete', id });
};

export const pushTransferSlip = (slip: TransferSlip) => {
  return pushSync({
    table: 'transfer_slips',
    kind: 'upsert',
    row: {
      id: slip.id,
      numero_bordereau: slip.numeroBordereau,
      date_transfert: slip.dateTransfert,
      site_depart: slip.siteDepart,
      site_arrivee: slip.siteArrivee,
      chauffeur_nom: slip.chauffeurNom,
      vehicule: slip.vehicule,
      responsable_depart: slip.responsableDepart,
      responsable_arrivee: slip.responsableArrivee,
      lignes: slip.lignes,
      total_boites: slip.totalBoites,
      total_conventions: slip.totalConventions,
      statut: slip.statut,
      observations: slip.observations || null
    }
  });
};

export const deleteTransferSlipRemote = (id: string) => {
  return pushSync({ table: 'transfer_slips', kind: 'delete', id });
};

export const pushCarton = (carton: CartonInventory) => {
  return pushSync({
    table: 'cartons',
    kind: 'upsert',
    row: {
      id: carton.id,
      numero_carton: carton.numeroCarton,
      agence_id: carton.agenceId || null,
      lot_id: carton.lotId || null,
      agence_nom: carton.agenceNom,
      code: carton.code,
      exercice: carton.exercice,
      boites_count: carton.boitesCount,
      conventions_estimees: carton.conventionsEstimees,
      emplacement: carton.emplacement,
      site: carton.site,
      etat: carton.etat,
      notes: carton.notes || null,
      date_enregistrement: carton.dateEnregistrement
    }
  });
};

export const deleteCartonRemote = (id: string) => {
  return pushSync({ table: 'cartons', kind: 'delete', id });
};

export const pushIncident = (inc: ArchiveIncident) => {
  return pushSync({
    table: 'incidents',
    kind: 'upsert',
    row: {
      id: inc.id,
      date_signalement: inc.dateSignalement,
      titre: inc.titre,
      agence_id: inc.agenceId || null,
      agence_nom: inc.agenceNom,
      code: inc.code,
      severite: inc.severite,
      statut: inc.statut,
      description: inc.description,
      actions_prises: inc.actionsPrises || null,
      signale_par: inc.signalePar
    }
  });
};

export const deleteIncidentRemote = (id: string) => {
  return pushSync({ table: 'incidents', kind: 'delete', id });
};

export const pushTeamMember = (member: TeamMember) => {
  return pushSync({
    table: 'team_members',
    kind: 'upsert',
    row: {
      id: member.id,
      nom_officiel: member.nomOfficiel,
      alias: member.alias || [],
      categorie: member.categorie,
      site: member.site,
      actif: member.actif
    }
  });
};

export const deleteTeamMemberRemote = (id: string) => {
  return pushSync({ table: 'team_members', kind: 'delete', id });
};

export const pushAttendanceRecord = (record: AttendanceRecord) => {
  return pushSync({
    table: 'attendance_records',
    kind: 'upsert',
    row: {
      id: record.id,
      date: record.date,
      member_id: record.memberId,
      statut: record.statut,
      motif: record.motif || null
    }
  });
};

// --- CHARGEMENT COMPLET INITIAL DEPUIS SUPABASE ---
export async function fetchAllRemote(): Promise<{
  agencies?: Agency[];
  teamMembers?: TeamMember[];
  dailyReports?: DailyReport[];
  cartons?: CartonInventory[];
  transferSlips?: TransferSlip[];
  incidents?: ArchiveIncident[];
  attendance?: AttendanceRecord[];
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const [agRes, tmRes, drRes, crRes, tsRes, inRes, atRes] = await Promise.allSettled([
      supabase.from('agencies').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('daily_reports').select('*'),
      supabase.from('cartons').select('*'),
      supabase.from('transfer_slips').select('*'),
      supabase.from('incidents').select('*'),
      supabase.from('attendance_records').select('*')
    ]);

    const result: {
      agencies?: Agency[];
      teamMembers?: TeamMember[];
      dailyReports?: DailyReport[];
      cartons?: CartonInventory[];
      transferSlips?: TransferSlip[];
      incidents?: ArchiveIncident[];
      attendance?: AttendanceRecord[];
    } = {};

    if (agRes.status === 'fulfilled' && agRes.value.data && agRes.value.data.length > 0) {
      result.agencies = agRes.value.data.map((r: any) => ({
        id: r.id,
        code: r.code,
        nom: r.nom,
        description: r.description || '',
        conventionsCount: r.conventions_count ?? 0,
        cartonsCount: r.cartons_count ?? 0,
        dossiersCount: r.dossiers_count ?? 0,
        statut: r.statut || 'active',
        dateCreation: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    }

    if (tmRes.status === 'fulfilled' && tmRes.value.data && tmRes.value.data.length > 0) {
      result.teamMembers = tmRes.value.data.map((r: any) => ({
        id: r.id,
        nomOfficiel: r.nom_officiel,
        alias: r.alias || [],
        categorie: r.categorie,
        site: r.site,
        actif: r.actif ?? true
      }));
    }

    if (drRes.status === 'fulfilled' && drRes.value.data && drRes.value.data.length > 0) {
      result.dailyReports = drRes.value.data.map((r: any) => ({
        id: r.id,
        titre: r.titre,
        dateDebut: r.date_debut,
        dateFin: r.date_fin,
        horaires: r.horaires,
        chefNom: r.chef_nom,
        superviseurs: r.superviseurs || [],
        effectifTotal: r.effectif_total ?? 0,
        presents: r.presents ?? 0,
        absents: r.absents ?? 0,
        absentsMotifs: r.absents_motifs || '',
        equipeMazala: r.equipe_mazala || [],
        equipeOrdinateur: r.equipe_ordinateur || [],
        groupes: r.groupes || [],
        taches: r.taches || [],
        transferts: r.transferts || [],
        receptions: r.receptions || [],
        chronologie: r.chronologie || [],
        observations: r.observations || '',
        totalDeclare: r.total_declare ?? 0,
        totalCalcule: r.total_calcule ?? 0,
        ecart: r.ecart ?? 0,
        statut: r.statut || 'brouillon',
        version: r.version ?? 1,
        creePar: r.cree_par || 'Système',
        dateCreation: r.created_at || new Date().toISOString()
      }));
    }

    if (crRes.status === 'fulfilled' && crRes.value.data && crRes.value.data.length > 0) {
      result.cartons = crRes.value.data.map((r: any) => ({
        id: r.id,
        numeroCarton: r.numero_carton,
        agenceId: r.agence_id || undefined,
        lotId: r.lot_id || undefined,
        agenceNom: r.agence_nom,
        code: r.code,
        exercice: r.exercice,
        boitesCount: r.boites_count ?? 0,
        conventionsEstimees: r.conventions_estimees ?? 0,
        emplacement: r.emplacement,
        site: r.site,
        etat: r.etat,
        notes: r.notes || '',
        dateEnregistrement: r.date_enregistrement || new Date().toISOString().split('T')[0]
      }));
    }

    if (tsRes.status === 'fulfilled' && tsRes.value.data && tsRes.value.data.length > 0) {
      result.transferSlips = tsRes.value.data.map((r: any) => ({
        id: r.id,
        numeroBordereau: r.numero_bordereau,
        dateTransfert: r.date_transfert,
        siteDepart: r.site_depart,
        siteArrivee: r.site_arrivee,
        chauffeurNom: r.chauffeur_nom,
        vehicule: r.vehicule,
        responsableDepart: r.responsable_depart,
        responsableArrivee: r.responsable_arrivee,
        lignes: r.lignes || [],
        totalBoites: r.total_boites ?? 0,
        totalConventions: r.total_conventions ?? 0,
        statut: r.statut,
        observations: r.observations || ''
      }));
    }

    if (inRes.status === 'fulfilled' && inRes.value.data && inRes.value.data.length > 0) {
      result.incidents = inRes.value.data.map((r: any) => ({
        id: r.id,
        dateSignalement: r.date_signalement,
        titre: r.titre,
        agenceId: r.agence_id || undefined,
        agenceNom: r.agence_nom,
        code: r.code,
        severite: r.severite,
        statut: r.statut,
        description: r.description,
        actionsPrises: r.actions_prises || '',
        signalePar: r.signale_par
      }));
    }

    if (atRes.status === 'fulfilled' && atRes.value.data && atRes.value.data.length > 0) {
      result.attendance = atRes.value.data.map((r: any) => ({
        id: r.id,
        date: r.date,
        memberId: r.member_id,
        statut: r.statut,
        motif: r.motif || undefined
      }));
    }

    return result;
  } catch (err) {
    console.warn('[Sync] Erreur chargement distant:', err);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushSyncQueue);
}
