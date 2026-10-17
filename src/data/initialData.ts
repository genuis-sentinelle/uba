import { Agency, TeamMember, DailyReport, SynthesisReport, User, LogEntry, ArchiveIncident, CartonInventory, TransferSlip } from '../types';

/**
 * ARCHIVA UBA — Base de données initiale officielle
 * Contient les 7 agences bancaires officielles UBA Congo.
 * Aucune donnée fictive de personnes ou de rapports n'est codée en dur.
 * L'application démarre propre : le Super Administrateur est initialisé au premier lancement.
 */

export const INITIAL_AGENCIES: Agency[] = [
  {
    id: 'ag-901',
    code: '901',
    nom: 'City Center',
    description: 'Agence Principale City Center',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-902',
    code: '902',
    nom: 'Poto-Poto',
    description: 'Agence Poto-Poto',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-904',
    code: '904',
    nom: 'Bacongo',
    description: 'Agence Bacongo',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-906',
    code: '906',
    nom: 'Maya-Maya',
    description: 'Agence & Site Maya-Maya',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-907',
    code: '907',
    nom: 'Moungali',
    description: 'Agence Moungali',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-909',
    code: '909',
    nom: 'Plateau-Ville',
    description: 'Agence Plateau-Ville',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  },
  {
    id: 'ag-910',
    code: '910',
    nom: 'Mazala',
    description: 'Agence & Site Central Mazala',
    conventionsCount: 0,
    cartonsCount: 0,
    dossiersCount: 0,
    statut: 'active',
    dateCreation: '2026-01-01'
  }
];

export const INITIAL_USERS: User[] = [];
export const INITIAL_MEMBERS: TeamMember[] = [];
export const INITIAL_DAILY_REPORTS: DailyReport[] = [];
export const INITIAL_SYNTHESIS_REPORTS: SynthesisReport[] = [];
export const INITIAL_LOGS: LogEntry[] = [];
export const INITIAL_INCIDENTS: ArchiveIncident[] = [];
export const INITIAL_CARTONS: CartonInventory[] = [];
export const INITIAL_SLIPS: TransferSlip[] = [];
