import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Agency, DailyReport, CartonInventory, TransferSlip, ArchiveIncident, TeamMember } from '../types';

/**
 * Service de synchronisation temps réel avec Supabase
 * Assure la communication entre sites (Maya-Maya & Mazala).
 * Si une table n'est pas encore créée, il capture l'erreur silencieusement sans bloquer l'interface.
 */

export const supabaseSync = {
  // --- AGENCES ---
  async syncAgency(agency: Agency): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('agencies').upsert({
        id: agency.id,
        code: agency.code,
        nom: agency.nom,
        description: agency.description || null,
        conventions_count: agency.conventionsCount,
        cartons_count: agency.cartonsCount,
        dossiers_count: agency.dossiersCount,
        statut: agency.statut
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation agence:', e);
    }
  },

  async deleteAgency(agencyId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('agencies').delete().eq('id', agencyId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression agence:', e);
    }
  },

  // --- RAPPORTS JOURNALIERS ---
  async syncDailyReport(report: DailyReport): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('daily_reports').upsert({
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
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation rapport:', e);
    }
  },

  async deleteDailyReport(reportId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('daily_reports').delete().eq('id', reportId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression rapport:', e);
    }
  },

  // --- BORDEREAUX DE TRANSFERT ---
  async syncTransferSlip(slip: TransferSlip): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('transfer_slips').upsert({
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
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation bordereau:', e);
    }
  },

  async deleteTransferSlip(slipId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('transfer_slips').delete().eq('id', slipId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression bordereau:', e);
    }
  },

  // --- CARTONS ---
  async syncCarton(carton: CartonInventory): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('cartons').upsert({
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
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation carton:', e);
    }
  },

  async deleteCarton(cartonId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('cartons').delete().eq('id', cartonId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression carton:', e);
    }
  },

  // --- INCIDENTS ---
  async syncIncident(inc: ArchiveIncident): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('incidents').upsert({
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
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation incident:', e);
    }
  },

  async deleteIncident(incId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('incidents').delete().eq('id', incId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression incident:', e);
    }
  },

  // --- MEMBRES EQUIPE ---
  async syncTeamMember(member: TeamMember): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('team_members').upsert({
        id: member.id,
        nom_officiel: member.nomOfficiel,
        alias: member.alias || [],
        categorie: member.categorie,
        site: member.site,
        actif: member.actif
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info synchronisation membre:', e);
    }
  },

  async deleteTeamMember(memberId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('team_members').delete().eq('id', memberId);
    } catch (e) {
      console.warn('[SupabaseSync] Info suppression membre:', e);
    }
  },

  // --- LOGS D'AUDIT ---
  async syncLog(log: { id: string; timestamp: string; userId: string; userName: string; userRole: string; action: string; details: string; category: string }): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('audit_logs').insert({
        id: log.id,
        user_id: log.userId.startsWith('u-') ? null : log.userId, // uuid check
        user_nom: log.userName,
        user_role: log.userRole,
        action: log.action,
        details: log.details,
        categorie: log.category,
        created_at: log.timestamp
      });
    } catch (e) {
      console.warn('[SupabaseSync] Info journalisation distante:', e);
    }
  },

  // --- CHARGEMENT COMPLET INITIAL DEPUIS SUPABASE ---
  async fetchAll(): Promise<{
    agencies?: Agency[];
    teamMembers?: TeamMember[];
    dailyReports?: DailyReport[];
    cartons?: CartonInventory[];
    transferSlips?: TransferSlip[];
    incidents?: ArchiveIncident[];
  } | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const [agRes, tmRes, drRes, crRes, tsRes, inRes] = await Promise.allSettled([
        supabase.from('agencies').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('daily_reports').select('*'),
        supabase.from('cartons').select('*'),
        supabase.from('transfer_slips').select('*'),
        supabase.from('incidents').select('*')
      ]);

      const result: {
        agencies?: Agency[];
        teamMembers?: TeamMember[];
        dailyReports?: DailyReport[];
        cartons?: CartonInventory[];
        transferSlips?: TransferSlip[];
        incidents?: ArchiveIncident[];
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
          observations: r.observations || [],
          totalDeclare: r.total_declare ?? 0,
          totalCalcule: r.total_calcule ?? 0,
          ecart: r.ecart ?? 0,
          statut: r.statut || 'valide',
          version: r.version ?? 1,
          creePar: r.cree_par || 'Archiviste',
          dateCreation: r.created_at || new Date().toISOString()
        }));
      }

      if (crRes.status === 'fulfilled' && crRes.value.data && crRes.value.data.length > 0) {
        result.cartons = crRes.value.data.map((r: any) => ({
          id: r.id,
          numeroCarton: r.numero_carton,
          agenceId: r.agence_id,
          lotId: r.lot_id,
          agenceNom: r.agence_nom,
          code: r.code,
          exercice: r.exercice,
          boitesCount: r.boites_count ?? 1,
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
          statut: r.statut || 'en_transit',
          observations: r.observations || ''
        }));
      }

      if (inRes.status === 'fulfilled' && inRes.value.data && inRes.value.data.length > 0) {
        result.incidents = inRes.value.data.map((r: any) => ({
          id: r.id,
          dateSignalement: r.date_signalement,
          titre: r.titre,
          agenceId: r.agence_id,
          agenceNom: r.agence_nom,
          code: r.code,
          severite: r.severite,
          statut: r.statut,
          description: r.description,
          actionsPrises: r.actions_prises || '',
          signalePar: r.signale_par
        }));
      }

      return result;
    } catch (e) {
      console.warn('[SupabaseSync] fetchAll catch:', e);
      return null;
    }
  }
};
