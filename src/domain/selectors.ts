import { Agency, DailyReport, CartonInventory, SynthesisReport } from '../types';
import { parseLocalDate, toISODateLocal, todayLocal } from '../utils/dates';
import { newId } from '../utils/ids';

/**
 * Normalise une date en chaîne 'YYYY-MM-DD'
 */
export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
};

/**
 * Détermine si une date tombe un jour ouvré (Lundi au Samedi pour les opérations d'archives bancaires)
 */
export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  // 0 = Dimanche (non ouvré), 1-6 = Lundi à Samedi
  return day !== 0;
};

/**
 * Calcule les jours ouvrés manquants (sans rapport) sur une période donnée
 */
export const selectMissingDays = (
  dateDebut: string,
  dateFin: string,
  existingReportDates: string[]
): string[] => {
  if (!dateDebut || !dateFin) return [];

  const start = parseLocalDate(dateDebut);
  const end = parseLocalDate(dateFin);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const reportDateSet = new Set(existingReportDates.map(d => normalizeDate(d)));
  const missing: string[] = [];

  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current)) {
      const iso = toISODateLocal(current);
      if (!reportDateSet.has(iso)) {
        missing.push(iso);
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return missing;
};

/**
 * Totaux stricts certifiés calculés sur un jeu de rapports
 */
export interface CalculatedTotals {
  conventionsTraitees: number;
  boitesTotal: number;
  transfertsCount: number;
  rapportsCount: number;
  agencesConcernees: number;
}

export const selectTotals = (reports: DailyReport[]): CalculatedTotals => {
  let conventionsTraitees = 0;
  let boitesTotal = 0;
  let transfertsCount = 0;
  const agencesSet = new Set<string>();

  reports.forEach(report => {
    (report.transferts || []).forEach(tr => {
      conventionsTraitees += Number(tr.conventions) || 0;
      boitesTotal += Number(tr.boites) || 0;
      transfertsCount += 1;
      if (tr.agenceNom) agencesSet.add(tr.agenceNom.trim().toLowerCase());
    });
  });

  return {
    conventionsTraitees,
    boitesTotal,
    transfertsCount,
    rapportsCount: reports.length,
    agencesConcernees: agencesSet.size
  };
};

/**
 * Années dynamiques de 2015 à l'année en cours
 */
export const defaultYears = (): number[] => {
  const endYear = new Date().getFullYear();
  const list: number[] = [];
  for (let y = 2015; y <= Math.max(endYear, 2026); y++) {
    list.push(y);
  }
  return list;
};

/**
 * Clé normalisée d'une agence (ID prioritaire, nom insensible à la casse en repli)
 */
export const agencyKey = (id?: string, nom?: string): string => {
  if (id && id.trim()) return id.trim();
  return (nom || '').trim().toLowerCase();
};

/**
 * Matrice dynamique des exercices (T / A / O / -)
 */
export interface MatrixRow {
  agenceNom: string;
  code: string;
  annees: Record<number, 'T' | 'A' | 'O' | '-' | string>;
}

export const selectMatrix = (
  agencies: Agency[],
  reports: DailyReport[],
  years: number[] = defaultYears(),
  cartons: CartonInventory[] = []
): MatrixRow[] => {
  const transmisByAgency: Record<string, Set<number>> = {};
  const recensesByAgency: Record<string, Set<number>> = {};

  agencies.forEach(ag => {
    const key = agencyKey(ag.id, ag.nom);
    transmisByAgency[key] = new Set<number>();
    recensesByAgency[key] = new Set<number>();
  });

  // 1. Récolter les exercices transmis dans les rapports
  reports.forEach(rep => {
    (rep.transferts || []).forEach(tr => {
      if (tr.exercice) {
        const key = agencyKey(tr.agenceId, tr.agenceNom);
        if (!transmisByAgency[key]) transmisByAgency[key] = new Set<number>();
        if (!recensesByAgency[key]) recensesByAgency[key] = new Set<number>();
        transmisByAgency[key].add(Number(tr.exercice));
      }
    });
  });

  // 2. Récolter les exercices depuis l'inventaire des cartons
  cartons.forEach(c => {
    if (c.exercice) {
      const key = agencyKey(c.agenceId, c.agenceNom);
      if (!recensesByAgency[key]) recensesByAgency[key] = new Set<number>();
      recensesByAgency[key].add(Number(c.exercice));
    }
  });

  // 3. Générer la matrice
  return agencies.map(agency => {
    const key = agencyKey(agency.id, agency.nom);
    const transmisYears = transmisByAgency[key] || new Set<number>();
    const recensesYears = recensesByAgency[key] || new Set<number>();

    const maxTransmisYear = transmisYears.size > 0 ? Math.max(...Array.from(transmisYears)) : null;
    const anneesRecord: Record<number, 'T' | 'A' | 'O' | '-' | string> = {};

    years.forEach(yr => {
      if (transmisYears.has(yr)) {
        anneesRecord[yr] = 'T';
      } else if (recensesYears.has(yr)) {
        if (maxTransmisYear !== null && yr < maxTransmisYear) {
          anneesRecord[yr] = 'O'; // Oublié probable
        } else {
          anneesRecord[yr] = 'A'; // En attente
        }
      } else {
        anneesRecord[yr] = '-';
      }
    });

    return {
      agenceNom: agency.nom,
      code: agency.code,
      annees: anneesRecord
    };
  });
};

/**
 * Calcul certifié de la synthèse des rapports
 * @param reportsInRange Rapports de la période demandée
 * @param agencies Liste des agences
 * @param dateDebut Date de début
 * @param dateFin Date de fin
 * @param type Type de synthèse ('chef_confidentiel' ou 'equipe_public')
 * @param currentUserNom Nom de l'utilisateur ayant compilé
 * @param cartons Inventaire des cartons
 * @param allReports Historique complet des rapports pour calcul cumulé exact de l'attente
 */
export const selectSynthesisData = (
  reportsInRange: DailyReport[],
  agencies: Agency[],
  dateDebut: string,
  dateFin: string,
  type: 'chef_confidentiel' | 'equipe_public',
  currentUserNom: string = 'Système',
  cartons: CartonInventory[] = [],
  allReports: DailyReport[] = reportsInRange
): SynthesisReport => {
  const validatedInRange = reportsInRange.filter(r => r.statut !== 'brouillon');
  const allValidated = allReports.filter(r => r.statut !== 'brouillon');

  // Traitement cumulé historique depuis l'origine (par agence)
  const traiteCumulHistorique: Record<string, number> = {};
  allValidated.forEach(rep => {
    (rep.transferts || []).forEach(tr => {
      const k = agencyKey(tr.agenceId, tr.agenceNom);
      traiteCumulHistorique[k] = (traiteCumulHistorique[k] || 0) + (Number(tr.conventions) || 0);
    });
  });

  let dossiersTraitesPeriode = 0;
  let boitesTotalPeriode = 0;
  const agenceMapPeriode: Record<string, { id?: string; code: string; nom: string; traite: number }> = {};

  agencies.forEach(ag => {
    const k = agencyKey(ag.id, ag.nom);
    agenceMapPeriode[k] = {
      id: ag.id,
      code: ag.code,
      nom: ag.nom,
      traite: 0
    };
  });

  validatedInRange.forEach(rep => {
    (rep.transferts || []).forEach(tr => {
      const conv = Number(tr.conventions) || 0;
      const bts = Number(tr.boites) || 0;
      dossiersTraitesPeriode += conv;
      boitesTotalPeriode += bts;

      const k = agencyKey(tr.agenceId, tr.agenceNom);
      if (!agenceMapPeriode[k]) {
        agenceMapPeriode[k] = {
          id: tr.agenceId,
          code: tr.code || 'N/A',
          nom: tr.agenceNom,
          traite: 0
        };
      }
      agenceMapPeriode[k].traite += conv;
    });
  });

  // Répartition par agence avec calcul d'attente cumulé
  const repartitionAgences = Object.values(agenceMapPeriode).map(data => {
    const agencyObj = agencies.find(a => agencyKey(a.id, a.nom) === agencyKey(data.id, data.nom));
    const conventionsAttendues = agencyObj?.conventionsCount || 0;
    const k = agencyKey(data.id, data.nom);
    const cumulTraiteTotal = traiteCumulHistorique[k] || data.traite;
    const attente = Math.max(0, conventionsAttendues - cumulTraiteTotal);
    const totGlobal = conventionsAttendues > 0 ? conventionsAttendues : data.traite + attente;
    const taux = totGlobal > 0 ? Math.min(100, Math.round((cumulTraiteTotal / totGlobal) * 100)) : (data.traite > 0 ? 100 : 0);

    return {
      nom: data.nom,
      code: data.code,
      traite: data.traite, // Traité sur la période
      attente,             // En attente globale restante
      total: totGlobal,
      taux
    };
  });

  const totalDossiersEnAttente = repartitionAgences.reduce((acc, a) => acc + a.attente, 0);

  // Nombre de jours couverts uniques (sans doublon de date)
  const uniqueDates = new Set(validatedInRange.map(r => normalizeDate(r.dateDebut)));
  const joursCouverts = uniqueDates.size;

  const existingReportDates = validatedInRange.map(r => r.dateDebut || r.dateFin || '');
  const joursManquants = selectMissingDays(dateDebut, dateFin, existingReportDates);

  const matrice = selectMatrix(agencies, validatedInRange, defaultYears(), cartons);

  // Points et observations certifiés
  const pointsAConfirmer: string[] = [
    `Synthèse calculée sur la base stricte de ${validatedInRange.length} rapport(s) journalier(s) validé(s).`,
    `Volume traité sur la période : ${dossiersTraitesPeriode} conventions dans ${boitesTotalPeriode} boîte(s).`
  ];

  if (type === 'chef_confidentiel') {
    if (joursManquants.length > 0) {
      pointsAConfirmer.push(`Attention : ${joursManquants.length} jour(s) ouvré(s) sans rapport validé (${joursManquants.join(', ')}).`);
    } else {
      pointsAConfirmer.push(`Couverture intégrale : tous les jours ouvrés de la période sont documentés.`);
    }
  } else {
    // Pour la version équipe_public : aucune mention sensible ni jours manquants détaillés
    pointsAConfirmer.push(`Avancement général des opérations d'archivage sur les sites Maya-Maya et Mazala.`);
  }

  return {
    id: newId('syn'),
    titre: `Synthèse d'avancement (${dateDebut} au ${dateFin})`,
    dateDebut,
    dateFin,
    type,
    dossiersTraites: dossiersTraitesPeriode,
    dossiersEnAttente: totalDossiersEnAttente,
    totalGlobal: dossiersTraitesPeriode + totalDossiersEnAttente,
    boitesTotal: boitesTotalPeriode,
    agencesCount: repartitionAgences.filter(r => r.traite > 0).length,
    joursCouverts,
    joursManquants: type === 'chef_confidentiel' ? joursManquants : [],
    matrice,
    repartitionAgences,
    pointsAConfirmer,
    creePar: currentUserNom,
    dateCreation: new Date().toISOString()
  };
};
