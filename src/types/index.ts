export type Role = 'super_admin' | 'admin' | 'stagiaire';

export interface User {
  id: string;
  nomComplet: string;
  email: string;
  role: Role;
  titre: string;
  actif: boolean;
  dateCreation: string;
  blockedAt?: string;
  blockedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  memberId: string;
  statut: 'present' | 'mazala' | 'ordinateur' | 'absent';
  motif?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  details: string;
  category: 'auth' | 'rapport' | 'agence' | 'equipe' | 'utilisateur' | 'systeme';
}

export interface Agency {
  id: string;
  code: string;
  nom: string;
  description?: string;
  conventionsCount: number;
  cartonsCount: number;
  dossiersCount: number;
  statut: 'active' | 'terminee' | 'en_cours';
  dateCreation: string;
  ordre?: number;
}

export interface TeamMember {
  id: string;
  nomOfficiel: string;
  alias?: string[];
  categorie: 'chef' | 'superviseur' | 'ancien_stagiaire' | 'nouveau_stagiaire';
  site: 'Maya-Maya' | 'Mazala';
  actif: boolean;
}

export interface ConventionLot {
  id: string;
  agenceId: string;
  agenceNom: string;
  code: string;
  exercice: number;
  quantite: number;
  boites: number;
  statut: 'T' | 'A' | 'O' | 'trie' | 'mis_de_cote'; // T: Transmis/traité, A: En attente, O: Oublié probable
  unite: 'conventions' | 'boites' | 'dossiers';
  note?: string;
}

export interface DailyReportMouvement {
  id: string;
  agenceId: string;
  agenceNom: string;
  code: string;
  exercice: number;
  conventions: number;
  boites: number;
  traitement?: string;
}

export interface ReportCustomStyles {
  headerColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontScale?: 'compact' | 'normal' | 'spacious';
  showCoverBadge?: boolean;
}

export interface ReportCustomField {
  id: string;
  label: string;
  value: string;
}

export interface ReportImageAttachment {
  id: string;
  url: string;
  caption?: string;
  position?: 'header' | 'observations' | 'annex';
}

export interface DailyReport {
  id: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  horaires: string;
  chefNom: string;
  superviseurs: string[];
  effectifTotal: number;
  presents: number;
  absents: number;
  absentsMotifs?: string;
  equipeMazala: string[];
  equipeOrdinateur: string[];
  groupes: {
    nom: string;
    membres: string[];
    tachesAssignees?: string;
  }[];
  taches: {
    numero: number;
    titre: string;
    horaire: string;
    description: string;
  }[];
  transferts: DailyReportMouvement[];
  receptions: {
    id: string;
    description: string;
    boites: number;
    provenance: string;
    statut: string;
  }[];
  chronologie: {
    heure: string;
    evenement: string;
  }[];
  observations: {
    point: string;
    constat: string;
    estIncident?: boolean;
  }[];
  totalDeclare: number;
  totalCalcule: number;
  ecart: number;
  statut: 'brouillon' | 'valide' | 'diffuse';
  version: number;
  creePar: string;
  dateCreation: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveNote?: string;
  // Personnalisation & boîtes
  customStyles?: ReportCustomStyles;
  customFields?: ReportCustomField[];
  images?: ReportImageAttachment[];
  hideMatrix?: boolean;
  boitesDatees?: number;
  boitesNonDatees?: number;
  boitesRecues?: number;
  boitesNonTriees?: number;
}

export interface SynthesisReport {
  id: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  type: 'chef_confidentiel' | 'equipe_public';
  dossiersTraites: number;
  dossiersEnAttente: number;
  totalGlobal: number;
  boitesTotal: number;
  agencesCount: number;
  joursCouverts: number;
  joursManquants: string[];
  matrice: {
    agenceNom: string;
    code: string;
    annees: Record<number, 'T' | 'A' | 'O' | '-' | string>;
  }[];
  repartitionAgences: {
    nom: string;
    code: string;
    traite: number;
    attente: number;
    total: number;
    taux: number;
  }[];
  pointsAConfirmer: string[];
  creePar: string;
  dateCreation: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveNote?: string;
  customStyles?: ReportCustomStyles;
  customFields?: ReportCustomField[];
  images?: ReportImageAttachment[];
  hideMatrix?: boolean;
}

export interface ArchiveIncident {
  id: string;
  dateSignalement: string;
  titre: string;
  agenceId?: string; // ID canonique agence
  agenceNom: string;
  code: string;
  severite: 'faible' | 'moyen' | 'critique';
  statut: 'signale' | 'en_cours' | 'resolu';
  description: string;
  actionsPrises?: string;
  signalePar: string;
}

export interface CartonInventory {
  id: string;
  numeroCarton: string;
  agenceId?: string; // ID canonique agence
  lotId?: string;    // Rattachement au lot agence × exercice
  agenceNom: string;
  code: string;
  exercice: number;
  boitesCount: number;
  conventionsEstimees: number;
  emplacement: string;
  site: 'Mazala' | 'Maya-Maya';
  etat: 'bon' | 'abime' | 'a_verifier';
  dateEnregistrement: string;
  notes?: string;
  // Nouveaux indicateurs de gestion des boîtes
  boitesDatees?: number;
  boitesNonDatees?: number;
  boitesRecues?: number;
  boitesNonTriees?: number;
  statutTri?: 'non_commence' | 'en_cours' | 'termine';
}

export interface TransferSlipLine {
  agenceId?: string; // ID canonique agence
  lotId?: string;
  agenceNom: string;
  code: string;
  exercice: number;
  boites: number;
  conventions: number;
  traitement: string;
}

export interface TransferSlip {
  id: string;
  numeroBordereau: string;
  dateTransfert: string;
  siteDepart: string;
  siteArrivee: string;
  chauffeurNom: string;
  vehicule: string;
  responsableDepart: string;
  responsableArrivee: string;
  lignes: TransferSlipLine[];
  totalBoites: number;
  totalConventions: number;
  statut: 'en_transit' | 'receptionne' | 'valide';
  observations?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveNote?: string;
}

export type ArchivableKind = 'daily' | 'synthesis' | 'slip';

export interface ArchivedDocument {
  id: string;
  kind: ArchivableKind;
  titre: string;
  dateDoc: string;
  archivedAt: string;
  archivedBy?: string;
  archiveNote?: string;
  raw: DailyReport | SynthesisReport | TransferSlip;
}

// ============================================================================
// MODÈLE PIVOT DE MODERNISATION (Lot, Mouvement, Événements de domaine)
// ============================================================================

export type SiteId = 'Maya-Maya' | 'Mazala';

export type LotStatut =
  | 'recu'         // arrivé, non encore traité
  | 'trie'         // trié sur place
  | 'mis_de_cote'  // mis de côté (problème / vérification)
  | 'en_transit'   // sur un bordereau en cours d'acheminement
  | 'transmis'     // réceptionné et transféré (= 'T')
  | 'archive'      // archivé définitivement
  | 'T'            // Transmis / Traité (compatibilité matrice)
  | 'A'            // En attente
  | 'O';           // Oublié probable

export interface Lot {
  id: string;
  agenceId: string;          // Référence stricte vers Agency.id
  agenceNom: string;
  code: string;
  exercice: number;
  site: SiteId;
  statut: LotStatut;
  boites: number;
  conventions: number;
  updatedAt: string;
  notes?: string;
}

export interface Mouvement {
  id: string;
  lotId?: string;
  agenceId: string;
  agenceNom: string;
  code: string;
  exercice: number;
  type: 'tri' | 'transfert' | 'reception' | 'retour';
  date: string;
  boites: number;
  conventions: number;
  rapportId?: string;
  bordereauId?: string;
  parMembreId?: string;
  notes?: string;
}

export type DomainEvent =
  | { type: 'rapport.valide'; rapportId: string; date: string }
  | { type: 'rapport.cree'; rapportId: string }
  | { type: 'mouvement.cree'; mouvement: Mouvement }
  | { type: 'bordereau.cree'; bordereauId: string }
  | { type: 'bordereau.receptionne'; bordereauId: string; ecartConventions?: number }
  | { type: 'carton.abime'; cartonId: string; agenceId?: string }
  | { type: 'pointage.enregistre'; date: string; presents: number; absents: number };


