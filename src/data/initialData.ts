import { Agency, TeamMember, DailyReport, SynthesisReport, User, LogEntry, ArchiveIncident, CartonInventory, TransferSlip } from '../types';

/**
 * ARCHIVA UBA — Base de données initiale vierge
 * Aucune donnée fictive codée en dur.
 * L'application démarre à l'état propre. Le premier compte Super Administrateur
 * est initialisé une seule fois depuis la page de connexion.
 */

export const INITIAL_USERS: User[] = [];
export const INITIAL_AGENCIES: Agency[] = [];
export const INITIAL_MEMBERS: TeamMember[] = [];
export const INITIAL_DAILY_REPORTS: DailyReport[] = [];
export const INITIAL_SYNTHESIS_REPORTS: SynthesisReport[] = [];
export const INITIAL_LOGS: LogEntry[] = [];
export const INITIAL_INCIDENTS: ArchiveIncident[] = [];
export const INITIAL_CARTONS: CartonInventory[] = [];
export const INITIAL_SLIPS: TransferSlip[] = [];
