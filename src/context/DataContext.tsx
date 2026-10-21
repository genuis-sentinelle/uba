import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Agency,
  TeamMember,
  DailyReport,
  SynthesisReport,
  LogEntry,
  Role,
  ArchiveIncident,
  CartonInventory,
  TransferSlip,
  AttendanceRecord,
  ArchivableKind
} from '../types';
import { archiveReport, unarchiveReport } from '../services/reportArchives';
import {
  INITIAL_AGENCIES,
  INITIAL_MEMBERS,
  INITIAL_DAILY_REPORTS,
  INITIAL_SYNTHESIS_REPORTS,
  INITIAL_LOGS,
  INITIAL_INCIDENTS,
  INITIAL_CARTONS,
  INITIAL_SLIPS
} from '../data/initialData';
import { useAuth } from './AuthContext';
import { selectSynthesisData } from '../domain/selectors';
import { eventBus } from '../domain/events';
import {
  pushLog,
  pushAgency,
  deleteAgencyRemote,
  pushDailyReport,
  deleteDailyReportRemote,
  pushSynthesisReport,
  deleteSynthesisReportRemote,
  pushTransferSlip,
  deleteTransferSlipRemote,
  pushCarton,
  deleteCartonRemote,
  pushIncident,
  deleteIncidentRemote,
  pushTeamMember,
  deleteTeamMemberRemote,
  pushAttendanceRecord,
  fetchAllRemote
} from '../services/sync';
import { newId, nextSlipNumber } from '../utils/ids';
import { todayLocal } from '../utils/dates';
import { can, assertCan } from '../utils/permissions';
import { isSupabaseConfigured } from '../lib/supabase';

interface DataContextType {
  agencies: Agency[];
  teamMembers: TeamMember[];
  dailyReports: DailyReport[];
  synthesisReports: SynthesisReport[];
  incidents: ArchiveIncident[];
  cartons: CartonInventory[];
  transferSlips: TransferSlip[];
  logs: LogEntry[];
  attendance: AttendanceRecord[];

  // Logs
  addLog: (action: string, details: string, category: LogEntry['category']) => void;
  clearLogs: () => void;

  // Attendance
  saveAttendance: (date: string, entries: { memberId: string; statut: AttendanceRecord['statut']; motif?: string }[]) => { success: boolean; message: string };
  getAttendance: (date: string) => AttendanceRecord[];

  // Agencies CRUD
  addAgency: (agency: Omit<Agency, 'id' | 'dateCreation'>) => { success: boolean; message: string };
  updateAgency: (agency: Agency) => { success: boolean; message: string };
  deleteAgency: (agencyId: string) => { success: boolean; message: string };

  // Team Members CRUD
  addTeamMember: (member: Omit<TeamMember, 'id'>) => { success: boolean; message: string };
  updateTeamMember: (member: TeamMember) => { success: boolean; message: string };
  deleteTeamMember: (memberId: string) => { success: boolean; message: string };

  // Daily Reports CRUD
  addDailyReport: (report: Omit<DailyReport, 'id' | 'dateCreation' | 'version'>) => { success: boolean; reportId: string };
  updateDailyReport: (report: DailyReport) => { success: boolean; message: string };
  deleteDailyReport: (id: string) => { success: boolean; message: string };

  // Synthesis CRUD & Auto Compiler
  addSynthesisReport: (synthesis: Omit<SynthesisReport, 'id' | 'dateCreation'>) => { success: boolean; reportId: string };
  updateSynthesisReport: (synthesis: SynthesisReport) => { success: boolean; message: string };
  deleteSynthesisReport: (id: string) => { success: boolean; message: string };
  compileSynthesisFromReports: (dateDebut: string, dateFin: string, type: 'chef_confidentiel' | 'equipe_public') => { success: boolean; reportId?: string; message: string };

  // Incidents CRUD
  addIncident: (incident: Omit<ArchiveIncident, 'id' | 'dateSignalement'>) => { success: boolean; message: string };
  updateIncident: (incident: ArchiveIncident) => { success: boolean; message: string };
  deleteIncident: (id: string) => { success: boolean; message: string };

  // Cartons CRUD
  addCarton: (carton: Omit<CartonInventory, 'id' | 'dateEnregistrement'>) => { success: boolean; message: string };
  updateCarton: (carton: CartonInventory) => { success: boolean; message: string };
  deleteCarton: (id: string) => { success: boolean; message: string };

  // Transfer Slips CRUD
  addTransferSlip: (slip: Omit<TransferSlip, 'id' | 'numeroBordereau'>) => { success: boolean; slipId: string; message: string };
  updateTransferSlip: (slip: TransferSlip) => { success: boolean; message: string };
  deleteTransferSlip: (id: string) => { success: boolean; message: string };

  // Document Archiving (Étape 3)
  archiveDocument: (kind: ArchivableKind, id: string, note?: string) => Promise<{ success: boolean; message: string }>;
  unarchiveDocument: (kind: ArchivableKind, id: string) => Promise<{ success: boolean; message: string }>;

  // Global Data Controls
  clearAllData: () => { success: boolean; message: string };
  loadDemoData: () => void;
  exportDataToJson: () => void;
  importDataFromJson: (jsonStr: string) => { success: boolean; message: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Initialisation ou rechargement : uniquement si mode local sans Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const isSeeded = localStorage.getItem('archiva_uba_seed_v4_octobre_2026');
      if (!isSeeded) {
        localStorage.setItem('archiva_uba_agencies', JSON.stringify(INITIAL_AGENCIES));
        localStorage.setItem('archiva_uba_members', JSON.stringify(INITIAL_MEMBERS));
        localStorage.setItem('archiva_uba_daily_reports', JSON.stringify(INITIAL_DAILY_REPORTS));
        localStorage.setItem('archiva_uba_synthesis_reports', JSON.stringify(INITIAL_SYNTHESIS_REPORTS));
        localStorage.setItem('archiva_uba_incidents', JSON.stringify(INITIAL_INCIDENTS));
        localStorage.setItem('archiva_uba_cartons', JSON.stringify(INITIAL_CARTONS));
        localStorage.setItem('archiva_uba_slips', JSON.stringify(INITIAL_SLIPS));
        localStorage.setItem('archiva_uba_logs', JSON.stringify(INITIAL_LOGS));
        localStorage.setItem('archiva_uba_seed_v4_octobre_2026', 'true');
        setAgencies(INITIAL_AGENCIES);
        setTeamMembers(INITIAL_MEMBERS);
        setDailyReports(INITIAL_DAILY_REPORTS);
        setSynthesisReports(INITIAL_SYNTHESIS_REPORTS);
        setIncidents(INITIAL_INCIDENTS);
        setCartons(INITIAL_CARTONS);
        setTransferSlips(INITIAL_SLIPS);
        setLogs(INITIAL_LOGS);
      }
    }
  }, []);

  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem('archiva_uba_agencies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return !isSupabaseConfigured ? INITIAL_AGENCIES : [];
      }
    }
    return !isSupabaseConfigured ? INITIAL_AGENCIES : [];
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('archiva_uba_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return !isSupabaseConfigured ? INITIAL_MEMBERS : [];
      }
    }
    return !isSupabaseConfigured ? INITIAL_MEMBERS : [];
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('archiva_uba_daily_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return !isSupabaseConfigured ? INITIAL_DAILY_REPORTS : [];
      }
    }
    return !isSupabaseConfigured ? INITIAL_DAILY_REPORTS : [];
  });

  const [synthesisReports, setSynthesisReports] = useState<SynthesisReport[]>(() => {
    const saved = localStorage.getItem('archiva_uba_synthesis_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return !isSupabaseConfigured ? INITIAL_SYNTHESIS_REPORTS : [];
      }
    }
    return !isSupabaseConfigured ? INITIAL_SYNTHESIS_REPORTS : [];
  });

  const [incidents, setIncidents] = useState<ArchiveIncident[]>(() => {
    const saved = localStorage.getItem('archiva_uba_incidents');
    if (saved) {
      try { return JSON.parse(saved); } catch { return !isSupabaseConfigured ? INITIAL_INCIDENTS : []; }
    }
    return !isSupabaseConfigured ? INITIAL_INCIDENTS : [];
  });

  const [cartons, setCartons] = useState<CartonInventory[]>(() => {
    const saved = localStorage.getItem('archiva_uba_cartons');
    if (saved) {
      try { return JSON.parse(saved); } catch { return !isSupabaseConfigured ? INITIAL_CARTONS : []; }
    }
    return !isSupabaseConfigured ? INITIAL_CARTONS : [];
  });

  const [transferSlips, setTransferSlips] = useState<TransferSlip[]>(() => {
    const saved = localStorage.getItem('archiva_uba_slips');
    if (saved) {
      try { return JSON.parse(saved); } catch { return !isSupabaseConfigured ? INITIAL_SLIPS : []; }
    }
    return !isSupabaseConfigured ? INITIAL_SLIPS : [];
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('archiva_uba_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch { return !isSupabaseConfigured ? INITIAL_LOGS : []; }
    }
    return !isSupabaseConfigured ? INITIAL_LOGS : [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('archiva_uba_attendance');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Persistent storage (local cache)
  useEffect(() => { localStorage.setItem('archiva_uba_agencies', JSON.stringify(agencies)); }, [agencies]);
  useEffect(() => { localStorage.setItem('archiva_uba_members', JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem('archiva_uba_daily_reports', JSON.stringify(dailyReports)); }, [dailyReports]);
  useEffect(() => { localStorage.setItem('archiva_uba_synthesis_reports', JSON.stringify(synthesisReports)); }, [synthesisReports]);
  useEffect(() => { localStorage.setItem('archiva_uba_incidents', JSON.stringify(incidents)); }, [incidents]);
  useEffect(() => { localStorage.setItem('archiva_uba_cartons', JSON.stringify(cartons)); }, [cartons]);
  useEffect(() => { localStorage.setItem('archiva_uba_slips', JSON.stringify(transferSlips)); }, [transferSlips]);
  useEffect(() => { localStorage.setItem('archiva_uba_logs', JSON.stringify(logs.slice(0, 2000))); }, [logs]);
  useEffect(() => { localStorage.setItem('archiva_uba_attendance', JSON.stringify(attendance)); }, [attendance]);

  // Synchronisation distante à chaque connexion authentifiée
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    fetchAllRemote().then(remote => {
      if (!remote) return;
      if (remote.agencies && remote.agencies.length > 0) {
        setAgencies(prev => {
          const map = new Map(prev.map(a => [a.id, a]));
          remote.agencies!.forEach(a => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
      if (remote.teamMembers && remote.teamMembers.length > 0) {
        setTeamMembers(prev => {
          const map = new Map(prev.map(m => [m.id, m]));
          remote.teamMembers!.forEach(m => map.set(m.id, m));
          return Array.from(map.values());
        });
      }
      if (remote.dailyReports && remote.dailyReports.length > 0) {
        setDailyReports(prev => {
          const map = new Map(prev.map(r => [r.id, r]));
          remote.dailyReports!.forEach(r => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
      if (remote.cartons && remote.cartons.length > 0) {
        setCartons(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          remote.cartons!.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
      if (remote.transferSlips && remote.transferSlips.length > 0) {
        setTransferSlips(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          remote.transferSlips!.forEach(s => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
      if (remote.incidents && remote.incidents.length > 0) {
        setIncidents(prev => {
          const map = new Map(prev.map(i => [i.id, i]));
          remote.incidents!.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
        });
      }
      if (remote.attendance && remote.attendance.length > 0) {
        setAttendance(prev => {
          const map = new Map(prev.map(a => [`${a.date}_${a.memberId}`, a]));
          remote.attendance!.forEach(a => map.set(`${a.date}_${a.memberId}`, a));
          return Array.from(map.values());
        });
      }
      if (remote.synthesisReports && remote.synthesisReports.length > 0) {
        setSynthesisReports(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          remote.synthesisReports!.forEach(s => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
    });
  }, [currentUser?.id]);

  // Écoute de l'annulation suite à refus serveur définitif (corrige la divergence optimiste)
  useEffect(() => {
    const handleRevert = async () => {
      if (!isSupabaseConfigured) return;
      const remote = await fetchAllRemote();
      if (!remote) return;
      if (remote.agencies) setAgencies(remote.agencies);
      if (remote.teamMembers) setTeamMembers(remote.teamMembers);
      if (remote.dailyReports) setDailyReports(remote.dailyReports);
      if (remote.cartons) setCartons(remote.cartons);
      if (remote.transferSlips) setTransferSlips(remote.transferSlips);
      if (remote.incidents) setIncidents(remote.incidents);
      if (remote.attendance) setAttendance(remote.attendance);
      if (remote.synthesisReports) setSynthesisReports(remote.synthesisReports);
    };

    window.addEventListener('archiva:sync-revert', handleRevert);
    return () => window.removeEventListener('archiva:sync-revert', handleRevert);
  }, []);

  const addLog = useCallback((action: string, details: string, category: LogEntry['category']) => {
    const newLog: LogEntry = {
      id: newId('log'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.nomComplet || 'Système',
      userRole: (currentUser?.role || 'stagiaire') as Role,
      action,
      details,
      category
    };
    setLogs(prev => [newLog, ...prev].slice(0, 2000));
    pushLog(newLog);
  }, [currentUser]);

  const clearLogs = () => {
    if (!can.clearAll(currentUser?.role)) {
      return;
    }
    setLogs([]);
    addLog('Journal local vidé', `Affichage local du journal vidé par ${currentUser?.nomComplet || 'Utilisateur'} (le journal serveur reste inviolable)`, 'systeme');
  };

  // Pointage (Attendance) - Gardé pour écriture
  const saveAttendance = (date: string, entries: { memberId: string; statut: AttendanceRecord['statut']; motif?: string }[]) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const newRecords: AttendanceRecord[] = entries.map(e => ({
      id: `att-${date}-${e.memberId}`,
      date,
      memberId: e.memberId,
      statut: e.statut,
      motif: e.motif
    }));

    setAttendance(prev => {
      const rest = prev.filter(a => a.date !== date);
      return [...rest, ...newRecords];
    });

    // Pousser chaque pointage vers Supabase
    newRecords.forEach(r => pushAttendanceRecord(r));

    addLog(
      'Pointage des présences',
      `Pointage du ${date} enregistré pour ${entries.length} membre(s)`,
      'equipe'
    );
    const presCount = entries.filter(e => e.statut !== 'absent').length;
    const absCount = entries.filter(e => e.statut === 'absent').length;
    eventBus.emit({ type: 'pointage.enregistre', date, presents: presCount, absents: absCount });
    return { success: true, message: `Pointage du ${date} enregistré avec succès.` };
  };

  const getAttendance = (date: string) => {
    return attendance.filter(a => a.date === date);
  };

  // Agency CRUD - Gardé pour écriture
  const addAgency = (agencyData: Omit<Agency, 'id' | 'dateCreation'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const exists = agencies.some(a => a.code.trim().toLowerCase() === agencyData.code.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Le code agence ${agencyData.code} existe déjà.` };
    }

    const newAgency: Agency = {
      ...agencyData,
      id: newId('ag'),
      dateCreation: todayLocal()
    };

    setAgencies(prev => [...prev, newAgency]);
    addLog('Création d\'agence', `Ajout de l'agence ${newAgency.nom} (Code ${newAgency.code})`, 'agence');
    pushAgency(newAgency);
    return { success: true, message: `L'agence ${newAgency.nom} a été ajoutée.` };
  };

  const updateAgency = (updatedAgency: Agency) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setAgencies(prev => prev.map(a => a.id === updatedAgency.id ? updatedAgency : a));
    addLog('Modification d\'agence', `Mise à jour de l'agence ${updatedAgency.nom} (Code ${updatedAgency.code})`, 'agence');
    pushAgency(updatedAgency);
    return { success: true, message: `Agence ${updatedAgency.nom} mise à jour.` };
  };

  const deleteAgency = (agencyId: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    const target = agencies.find(a => a.id === agencyId);
    if (!target) return { success: false, message: 'Agence introuvable.' };

    const usedCartons = cartons.filter(c => c.agenceId === agencyId || c.agenceNom === target.nom).length;
    const usedIncidents = incidents.filter(i => i.agenceId === agencyId || i.agenceNom === target.nom).length;
    const usedReports = dailyReports.filter(r => r.transferts.some(t => t.agenceId === agencyId || t.agenceNom === target.nom)).length;
    const totalUsed = usedCartons + usedIncidents + usedReports;

    if (totalUsed > 0) {
      return {
        success: false,
        message: `Suppression impossible : ${totalUsed} élément(s) liés (${usedCartons} cartons, ${usedIncidents} incidents, ${usedReports} rapports). Veuillez marquer l'agence comme "terminée" à la place.`
      };
    }

    setAgencies(prev => prev.filter(a => a.id !== agencyId));
    addLog('Suppression d\'agence', `Suppression de l'agence ${target.nom} (Code ${target.code})`, 'agence');
    deleteAgencyRemote(agencyId);
    return { success: true, message: `Agence ${target.nom} supprimée.` };
  };

  // Team Member CRUD - Gardé pour écriture
  const addTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const newMember: TeamMember = {
      ...memberData,
      id: newId('m')
    };
    setTeamMembers(prev => [...prev, newMember]);
    addLog('Ajout Membre', `Nouveau membre : ${newMember.nomOfficiel} (${newMember.site})`, 'equipe');
    pushTeamMember(newMember);
    return { success: true, message: `Membre ${newMember.nomOfficiel} ajouté.` };
  };

  const updateTeamMember = (member: TeamMember) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
    addLog('Modification Membre', `Mise à jour : ${member.nomOfficiel}`, 'equipe');
    pushTeamMember(member);
    return { success: true, message: `Membre ${member.nomOfficiel} modifié.` };
  };

  const deleteTeamMember = (memberId: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    const target = teamMembers.find(m => m.id === memberId);
    if (!target) return { success: false, message: 'Membre introuvable.' };
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    addLog('Suppression Membre', `Suppression : ${target.nomOfficiel}`, 'equipe');
    deleteTeamMemberRemote(memberId);
    return { success: true, message: `Membre ${target.nomOfficiel} retiré.` };
  };

  // Daily Report CRUD - Gardé pour écriture
  const addDailyReport = (reportData: Omit<DailyReport, 'id' | 'dateCreation' | 'version'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, reportId: '' };
    }

    const newReport: DailyReport = {
      ...reportData,
      id: newId('rep'),
      version: 1,
      dateCreation: new Date().toISOString()
    };
    setDailyReports(prev => [newReport, ...prev]);
    addLog('Création Rapport', `Nouveau rapport journalier (${newReport.titre}) [Statut: ${newReport.statut}]`, 'rapport');
    eventBus.emit({ type: 'rapport.cree', rapportId: newReport.id });
    if (newReport.statut === 'valide') {
      eventBus.emit({ type: 'rapport.valide', rapportId: newReport.id, date: newReport.dateDebut });
    }
    pushDailyReport(newReport);
    return { success: true, reportId: newReport.id };
  };

  const updateDailyReport = (report: DailyReport) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const updated = { ...report, version: report.version + 1 };
    setDailyReports(prev => prev.map(r => r.id === report.id ? updated : r));
    addLog('Modification Rapport', `Mise à jour du rapport (${report.titre}) - v${report.version + 1}`, 'rapport');
    if (report.statut === 'valide') {
      eventBus.emit({ type: 'rapport.valide', rapportId: report.id, date: report.dateDebut });
    }
    pushDailyReport(updated);
    return { success: true, message: 'Rapport mis à jour avec succès.' };
  };

  const deleteDailyReport = (id: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    const report = dailyReports.find(r => r.id === id);
    setDailyReports(prev => prev.filter(r => r.id !== id));
    if (report) {
      addLog('Suppression Rapport', `Suppression du rapport : ${report.titre}`, 'rapport');
    }
    deleteDailyReportRemote(id);
    return { success: true, message: 'Rapport supprimé.' };
  };

  // Synthesis Report CRUD & Auto Compiler - Gardé pour écriture
  const addSynthesisReport = (synthesisData: Omit<SynthesisReport, 'id' | 'dateCreation'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, reportId: '' };
    }

    const newSynthesis: SynthesisReport = {
      ...synthesisData,
      id: newId('syn'),
      dateCreation: new Date().toISOString()
    };
    setSynthesisReports(prev => [newSynthesis, ...prev]);
    addLog('Création Synthèse', `Synthèse de période : ${newSynthesis.titre}`, 'rapport');
    pushSynthesisReport(newSynthesis);
    return { success: true, reportId: newSynthesis.id };
  };

  const updateSynthesisReport = (synthesis: SynthesisReport) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setSynthesisReports(prev => prev.map(s => s.id === synthesis.id ? synthesis : s));
    addLog('Modification Synthèse', `Mise à jour : ${synthesis.titre}`, 'rapport');
    pushSynthesisReport(synthesis);
    return { success: true, message: 'Synthèse mise à jour.' };
  };

  const deleteSynthesisReport = (id: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    setSynthesisReports(prev => prev.filter(s => s.id !== id));
    addLog('Suppression Synthèse', `Suppression synthèse ID ${id}`, 'rapport');
    deleteSynthesisReportRemote(id);
    return { success: true, message: 'Synthèse supprimée.' };
  };

  // Compilation certifiée et déterministe avec calcul cumulé
  const compileSynthesisFromReports = (dateDebut: string, dateFin: string, type: 'chef_confidentiel' | 'equipe_public') => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const reportsInRange = dailyReports.filter(r => r.dateDebut >= dateDebut && r.dateFin <= dateFin);
    if (reportsInRange.length === 0) {
      return { success: false, message: `Aucun rapport journalier trouvé entre le ${dateDebut} et le ${dateFin}.` };
    }

    const newSynthesis = selectSynthesisData(
      reportsInRange,
      agencies,
      dateDebut,
      dateFin,
      type,
      currentUser?.nomComplet || 'Compilation Automatique',
      cartons,
      dailyReports // Passage de tous les rapports pour calcul d'attente cumulé
    );

    setSynthesisReports(prev => [newSynthesis, ...prev]);
    addLog(
      'Compilation Synthèse',
      `Synthèse certifiée (${type === 'chef_confidentiel' ? 'Confidentielle' : 'Publique Équipe'}) générée pour la période ${dateDebut} au ${dateFin} (${newSynthesis.dossiersTraites} conventions)`,
      'rapport'
    );
    pushSynthesisReport(newSynthesis);
    return {
      success: true,
      reportId: newSynthesis.id,
      message: `Synthèse certifiée compilée avec succès (${newSynthesis.dossiersTraites} conventions traitées) !`
    };
  };

  // Incidents CRUD - Gardé pour écriture
  const addIncident = (incData: Omit<ArchiveIncident, 'id' | 'dateSignalement'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const newInc: ArchiveIncident = {
      ...incData,
      id: newId('inc'),
      dateSignalement: todayLocal()
    };
    setIncidents(prev => [newInc, ...prev]);
    addLog('Signalement Incident', `Incident : ${newInc.titre} (${newInc.severite})`, 'systeme');
    pushIncident(newInc);
    return { success: true, message: 'Incident enregistré.' };
  };

  const updateIncident = (inc: ArchiveIncident) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
    addLog('Mise à jour Incident', `Incident ${inc.titre} passé au statut ${inc.statut}`, 'systeme');
    pushIncident(inc);
    return { success: true, message: 'Incident mis à jour.' };
  };

  const deleteIncident = (id: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    setIncidents(prev => prev.filter(i => i.id !== id));
    addLog('Suppression Incident', `Incident ID ${id} supprimé`, 'systeme');
    deleteIncidentRemote(id);
    return { success: true, message: 'Incident supprimé.' };
  };

  // Cartons CRUD - Gardé pour écriture
  const addCarton = (cartonData: Omit<CartonInventory, 'id' | 'dateEnregistrement'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    const newCarton: CartonInventory = {
      ...cartonData,
      id: newId('cart'),
      dateEnregistrement: todayLocal()
    };
    setCartons(prev => [newCarton, ...prev]);
    addLog('Inventaire Carton', `Nouveau carton répertorié : ${newCarton.numeroCarton}`, 'agence');
    pushCarton(newCarton);
    return { success: true, message: 'Carton enregistré à l\'inventaire.' };
  };

  const updateCarton = (carton: CartonInventory) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setCartons(prev => prev.map(c => c.id === carton.id ? carton : c));
    addLog('Modification Carton', `Carton ${carton.numeroCarton} mis à jour (${carton.emplacement})`, 'agence');
    pushCarton(carton);
    return { success: true, message: 'Carton mis à jour.' };
  };

  const deleteCarton = (id: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    setCartons(prev => prev.filter(c => c.id !== id));
    addLog('Suppression Carton', `Carton ${id} retiré de l'inventaire`, 'agence');
    deleteCartonRemote(id);
    return { success: true, message: 'Carton supprimé.' };
  };

  // Transfer Slips CRUD - Gardé pour écriture
  const addTransferSlip = (slipData: Omit<TransferSlip, 'id' | 'numeroBordereau'>) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, slipId: '', message: 'Action non autorisée : profil en lecture seule.' };
    }

    const newSlip: TransferSlip = {
      ...slipData,
      id: newId('slip'),
      numeroBordereau: nextSlipNumber(transferSlips, slipData.siteDepart || 'Maya-Maya')
    };
    setTransferSlips(prev => [newSlip, ...prev]);
    addLog('Bordereau de Transfert', `Bordereau officiel émis : ${newSlip.numeroBordereau} (${newSlip.totalBoites} boîtes)`, 'rapport');
    pushTransferSlip(newSlip);
    return { success: true, slipId: newSlip.id, message: 'Bordereau de décharge créé avec succès.' };
  };

  const updateTransferSlip = (slip: TransferSlip) => {
    if (!can.write(currentUser?.role)) {
      return { success: false, message: 'Action non autorisée : profil en lecture seule.' };
    }

    setTransferSlips(prev => prev.map(s => s.id === slip.id ? slip : s));
    addLog('Mise à jour Bordereau', `Bordereau ${slip.numeroBordereau} mis à jour (${slip.statut})`, 'rapport');
    pushTransferSlip(slip);
    return { success: true, message: 'Bordereau mis à jour.' };
  };

  const deleteTransferSlip = (id: string) => {
    if (!can.deleteData(currentUser?.role)) {
      return { success: false, message: 'Suppression réservée au Super Administrateur.' };
    }

    setTransferSlips(prev => prev.filter(s => s.id !== id));
    addLog('Suppression Bordereau', `Bordereau ID ${id} supprimé`, 'rapport');
    deleteTransferSlipRemote(id);
    return { success: true, message: 'Bordereau supprimé.' };
  };

  // Reset to Clean Blank State (Restricted to Super Admin)
  const clearAllData = () => {
    if (!can.clearAll(currentUser?.role)) {
      return { success: false, message: 'Action réservée au Super Administrateur.' };
    }

    setAgencies([]);
    setTeamMembers([]);
    setDailyReports([]);
    setSynthesisReports([]);
    setIncidents([]);
    setCartons([]);
    setTransferSlips([]);
    setAttendance([]);
    setLogs([]);
    localStorage.removeItem('archiva_uba_agencies');
    localStorage.removeItem('archiva_uba_members');
    localStorage.removeItem('archiva_uba_daily_reports');
    localStorage.removeItem('archiva_uba_synthesis_reports');
    localStorage.removeItem('archiva_uba_incidents');
    localStorage.removeItem('archiva_uba_cartons');
    localStorage.removeItem('archiva_uba_slips');
    localStorage.removeItem('archiva_uba_attendance');
    localStorage.removeItem('archiva_uba_logs');
    addLog('Réinitialisation Locale', 'Toutes les données locales de cet appareil ont été effacées.', 'systeme');
    return { success: true, message: 'Données locales effacées avec succès.' };
  };

  // Reload Reference Sample (Restricted & safe)
  const loadDemoData = () => {
    if (!can.write(currentUser?.role)) return;
    // Non destructif : charge uniquement les agences de référence si vides
    if (agencies.length === 0) {
      setAgencies(INITIAL_AGENCIES);
      INITIAL_AGENCIES.forEach(a => pushAgency(a));
      addLog('Chargement Référence', 'Agences officielles UBA réinitialisées.', 'systeme');
    }
  };

  // Export JSON (Restricted to Admin & Super Admin)
  const exportDataToJson = () => {
    if (!can.export(currentUser?.role)) return;

    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      agencies,
      teamMembers,
      dailyReports,
      synthesisReports,
      incidents,
      cartons,
      transferSlips,
      attendance,
      logs
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archiva_uba_backup_${todayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON with validation (Restricted to Admin & Super Admin)
  const importDataFromJson = (jsonStr: string) => {
    if (!can.importData(currentUser?.role)) {
      return { success: false, message: 'Droits insuffisants pour importer une sauvegarde.' };
    }
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data !== 'object' || data === null) {
        return { success: false, message: 'Format de fichier de sauvegarde invalide.' };
      }

      if (Array.isArray(data.agencies)) {
        setAgencies(data.agencies);
        data.agencies.forEach((a: Agency) => pushAgency(a));
      }
      if (Array.isArray(data.teamMembers)) {
        setTeamMembers(data.teamMembers);
        data.teamMembers.forEach((m: TeamMember) => pushTeamMember(m));
      }
      if (Array.isArray(data.dailyReports)) {
        setDailyReports(data.dailyReports);
        data.dailyReports.forEach((r: DailyReport) => pushDailyReport(r));
      }
      if (Array.isArray(data.synthesisReports)) setSynthesisReports(data.synthesisReports);
      if (Array.isArray(data.incidents)) {
        setIncidents(data.incidents);
        data.incidents.forEach((i: ArchiveIncident) => pushIncident(i));
      }
      if (Array.isArray(data.cartons)) {
        setCartons(data.cartons);
        data.cartons.forEach((c: CartonInventory) => pushCarton(c));
      }
      if (Array.isArray(data.transferSlips)) {
        setTransferSlips(data.transferSlips);
        data.transferSlips.forEach((s: TransferSlip) => pushTransferSlip(s));
      }
      if (Array.isArray(data.attendance)) {
        setAttendance(data.attendance);
        data.attendance.forEach((a: AttendanceRecord) => pushAttendanceRecord(a));
      }
      if (Array.isArray(data.logs)) setLogs(data.logs);

      addLog('Import Sauvegarde', 'Données restaurées et synchronisées depuis un fichier JSON.', 'systeme');
      return { success: true, message: 'Sauvegarde importée et synchronisée avec succès !' };
    } catch {
      return { success: false, message: 'Erreur d\'analyse : le fichier JSON est corrompu.' };
    }
  };

  // Document Archiving (Étape 3)
  const archiveDocument = async (
    kind: ArchivableKind,
    id: string,
    note?: string
  ): Promise<{ success: boolean; message: string }> => {
    assertCan(can.archive(currentUser?.role));
    const res = await archiveReport(kind, id, note);
    if (!res.success) {
      return res;
    }

    const nowIso = new Date().toISOString();
    const byUser = currentUser?.nomComplet || 'Utilisateur';

    if (kind === 'daily') {
      setDailyReports(prev =>
        prev.map(r => (r.id === id ? { ...r, archived: true, archivedAt: nowIso, archivedBy: byUser, archiveNote: note } : r))
      );
      addLog('ARCHIVER_RAPPORT', `Rapport journalier (${id}) archivé${note ? ' : ' + note : ''}`, 'rapport');
    } else if (kind === 'synthesis') {
      setSynthesisReports(prev =>
        prev.map(s => (s.id === id ? { ...s, archived: true, archivedAt: nowIso, archivedBy: byUser, archiveNote: note } : s))
      );
      addLog('ARCHIVER_SYNTHESE', `Rapport de synthèse (${id}) archivé${note ? ' : ' + note : ''}`, 'rapport');
    } else if (kind === 'slip') {
      setTransferSlips(prev =>
        prev.map(b => (b.id === id ? { ...b, archived: true, archivedAt: nowIso, archivedBy: byUser, archiveNote: note } : b))
      );
      addLog('ARCHIVER_BORDEREAU', `Bordereau (${id}) archivé${note ? ' : ' + note : ''}`, 'rapport');
    }

    return res;
  };

  const unarchiveDocument = async (
    kind: ArchivableKind,
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    assertCan(can.unarchive(currentUser?.role));
    const res = await unarchiveReport(kind, id);
    if (!res.success) {
      return res;
    }

    if (kind === 'daily') {
      setDailyReports(prev =>
        prev.map(r => (r.id === id ? { ...r, archived: false, archivedAt: undefined, archivedBy: undefined, archiveNote: undefined } : r))
      );
      addLog('DESARCHIVER_RAPPORT', `Rapport journalier (${id}) restauré depuis les archives`, 'rapport');
    } else if (kind === 'synthesis') {
      setSynthesisReports(prev =>
        prev.map(s => (s.id === id ? { ...s, archived: false, archivedAt: undefined, archivedBy: undefined, archiveNote: undefined } : s))
      );
      addLog('DESARCHIVER_SYNTHESE', `Rapport de synthèse (${id}) restauré depuis les archives`, 'rapport');
    } else if (kind === 'slip') {
      setTransferSlips(prev =>
        prev.map(b => (b.id === id ? { ...b, archived: false, archivedAt: undefined, archivedBy: undefined, archiveNote: undefined } : b))
      );
      addLog('DESARCHIVER_BORDEREAU', `Bordereau (${id}) restauré depuis les archives`, 'rapport');
    }

    return res;
  };

  return (
    <DataContext.Provider
      value={{
        agencies,
        teamMembers,
        dailyReports,
        synthesisReports,
        incidents,
        cartons,
        transferSlips,
        logs,
        attendance,
        addLog,
        clearLogs,
        saveAttendance,
        getAttendance,
        addAgency,
        updateAgency,
        deleteAgency,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addDailyReport,
        updateDailyReport,
        deleteDailyReport,
        addSynthesisReport,
        updateSynthesisReport,
        deleteSynthesisReport,
        compileSynthesisFromReports,
        addIncident,
        updateIncident,
        deleteIncident,
        addCarton,
        updateCarton,
        deleteCarton,
        addTransferSlip,
        updateTransferSlip,
        deleteTransferSlip,
        archiveDocument,
        unarchiveDocument,
        clearAllData,
        loadDemoData,
        exportDataToJson,
        importDataFromJson
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
