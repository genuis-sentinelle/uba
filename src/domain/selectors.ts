import { Agency, DailyReport, CartonInventory, Lot, SynthesisReport } from '../types';

/**
 * Normalise une date en chaîne 'YYYY-MM-DD'
 */
export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.split('T')[0];
  return d.toISOString().split('T')[0];
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

  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const reportDateSet = new Set(existingReportDates.map(d => normalizeDate(d)));
  const missing: string[] = [];

  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current)) {
      const iso = current.toISOString().split('T')[0];
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
 * Calcul dynamique et déterministe de la matrice des exercices (T / A / O / -)
 * T = Transmis / Traité (présent dans les transferts réels ou lots transmis)
 * O = Oublié probable (exercice antérieur resté en attente alors qu'un exercice plus récent a été transmis)
 * A = En attente (exercice répertorié ou carton existant mais non encore transmis)
 * - = Aucun lot/carton/mouvement recensé pour cet exercice
 */
export interface MatrixRow {
  agenceNom: string;
  code: string;
  annees: Record<number, 'T' | 'A' | 'O' | '-' | string>;
}

export const selectMatrix = (
  agencies: Agency[],
  reports: DailyReport[],
  years: number[] = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  cartons: CartonInventory[] = []
): MatrixRow[] => {
  // Map agence -> Set d'exercices transmis (T)
  const transmisByAgency: Record<string, Set<number>> = {};
  // Map agence -> Set d'exercices recensés en attente ou cartons
  const recensesByAgency: Record<string, Set<number>> = {};

  // 1. Initialiser avec les agences
  agencies.forEach(ag => {
    const key = ag.nom.trim().toLowerCase();
    transmisByAgency[key] = new Set<number>();
    recensesByAgency[key] = new Set<number>();
  });

  // 2. Récolter les exercices transmis dans les rapports journaliers
  reports.forEach(rep => {
    (rep.transferts || []).forEach(tr => {
      if (tr.agenceNom && tr.exercice) {
        const key = tr.agenceNom.trim().toLowerCase();
        if (!transmisByAgency[key]) transmisByAgency[key] = new Set<number>();
        if (!recensesByAgency[key]) recensesByAgency[key] = new Set<number>();
        transmisByAgency[key].add(Number(tr.exercice));
      }
    });
  });

  // 3. Récolter les exercices depuis l'inventaire des cartons
  cartons.forEach(c => {
    if (c.agenceNom && c.exercice) {
      const key = c.agenceNom.trim().toLowerCase();
      if (!recensesByAgency[key]) recensesByAgency[key] = new Set<number>();
      recensesByAgency[key].add(Number(c.exercice));
    }
  });

  // 4. Générer la matrice
  return agencies.map(agency => {
    const key = agency.nom.trim().toLowerCase();
    const transmisYears = transmisByAgency[key] || new Set<number>();
    const recensesYears = recensesByAgency[key] || new Set<number>();

    // Plus grand exercice transmis pour détecter les "O" (oubliés probables)
    const maxTransmisYear = transmisYears.size > 0 ? Math.max(...Array.from(transmisYears)) : null;

    const anneesRecord: Record<number, 'T' | 'A' | 'O' | '-' | string> = {};

    years.forEach(yr => {
      if (transmisYears.has(yr)) {
        anneesRecord[yr] = 'T';
      } else if (recensesYears.has(yr)) {
        // Présent mais pas encore transmis
        if (maxTransmisYear !== null && yr < maxTransmisYear) {
          anneesRecord[yr] = 'O'; // Oublié probable : antérieur à un exercice déjà transmis !
        } else {
          anneesRecord[yr] = 'A';
        }
      } else {
        // Aucune trace
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
 * Calcul certifié de la synthèse des rapports (sans coefficient fictif 0.4)
 */
export const selectSynthesisData = (
  reportsInRange: DailyReport[],
  agencies: Agency[],
  dateDebut: string,
  dateFin: string,
  type: 'chef_confidentiel' | 'equipe_public',
  currentUserNom: string = 'Système',
  cartons: CartonInventory[] = []
): SynthesisReport => {
  let dossiersTraites = 0;
  let boitesTotal = 0;
  const agenceMap: Record<string, { code: string; traite: number; cartons: number }> = {};

  // Initialisation sur la base des agences référencées
  agencies.forEach(ag => {
    agenceMap[ag.nom] = {
      code: ag.code,
      traite: 0,
      cartons: ag.cartonsCount || 0
    };
  });

  // Agrégation stricte sur les transferts effectifs des rapports
  reportsInRange.forEach(rep => {
    (rep.transferts || []).forEach(tr => {
      const conv = Number(tr.conventions) || 0;
      const bts = Number(tr.boites) || 0;
      dossiersTraites += conv;
      boitesTotal += bts;

      if (!agenceMap[tr.agenceNom]) {
        agenceMap[tr.agenceNom] = { code: tr.code || 'N/A', traite: 0, cartons: 0 };
      }
      agenceMap[tr.agenceNom].traite += conv;
    });
  });

  // Répartition par agence sans données fictives
  const repartitionAgences = Object.entries(agenceMap).map(([nom, data]) => {
    const total = data.traite;
    // Si l'agence a des conventions estimées dans ses fiches agences, calculer le restant réel
    const agencyObj = agencies.find(a => a.nom.toLowerCase() === nom.toLowerCase());
    const conventionsAttendues = agencyObj?.conventionsCount || 0;
    const attente = Math.max(0, conventionsAttendues - data.traite);
    const totGlobal = data.traite + attente;
    const taux = totGlobal > 0 ? Math.round((data.traite / totGlobal) * 100) : (data.traite > 0 ? 100 : 0);

    return {
      nom,
      code: data.code,
      traite: data.traite,
      attente,
      total: totGlobal,
      taux
    };
  });

  const totalDossiersEnAttente = repartitionAgences.reduce((acc, a) => acc + a.attente, 0);

  // Dates réelles des rapports pour calculer les jours ouvrés manquants
  const existingReportDates = reportsInRange.map(r => r.dateDebut || r.dateFin || '');
  const joursManquants = selectMissingDays(dateDebut, dateFin, existingReportDates);

  // Matrice déterministe
  const matrice = selectMatrix(agencies, reportsInRange, undefined, cartons);

  return {
    id: `syn-${Date.now()}`,
    titre: `Synthèse d'avancement (${dateDebut} au ${dateFin})`,
    dateDebut,
    dateFin,
    type,
    dossiersTraites,
    dossiersEnAttente: totalDossiersEnAttente,
    totalGlobal: dossiersTraites + totalDossiersEnAttente,
    boitesTotal,
    agencesCount: repartitionAgences.filter(r => r.total > 0).length,
    joursCouverts: reportsInRange.length,
    joursManquants,
    matrice,
    repartitionAgences,
    pointsAConfirmer: [
      `Synthèse calculée sur la base stricte de ${reportsInRange.length} rapport(s) journalier(s).`,
      `Volume total certifié : ${dossiersTraites} conventions dans ${boitesTotal} boîte(s).`,
      joursManquants.length > 0
        ? `Attention : ${joursManquants.length} jour(s) ouvré(s) sans rapport répertorié sur la période (${joursManquants.join(', ')}).`
        : `Couverture complète : tous les jours ouvrés de la période sont documentés.`
    ],
    creePar: currentUserNom,
    dateCreation: new Date().toISOString()
  };
};
