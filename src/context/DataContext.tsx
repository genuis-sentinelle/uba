import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Agency,
  TeamMember,
  DailyReport,
  SynthesisReport,
  LogEntry,
  Role,
  ArchiveIncident,
  CartonInventory,
  TransferSlip
} from '../types';
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

interface DataContextType {
  agencies: Agency[];
  teamMembers: TeamMember[];
  dailyReports: DailyReport[];
  synthesisReports: SynthesisReport[];
  incidents: ArchiveIncident[];
  cartons: CartonInventory[];
  transferSlips: TransferSlip[];
  logs: LogEntry[];

  // Logs
  addLog: (action: string, details: string, category: LogEntry['category']) => void;
  clearLogs: () => void;

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

  // Global Data Controls (Vierge vs Démo)
  clearAllData: () => void;
  loadDemoData: () => void;
  exportDataToJson: () => void;
  importDataFromJson: (jsonStr: string) => { success: boolean; message: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Purge unique des anciennes données fictives si la version propre v2 démarre
  useEffect(() => {
    const isCleaned = localStorage.getItem('archiva_uba_data_clean_v2');
    if (!isCleaned) {
      localStorage.removeItem('archiva_uba_agencies');
      localStorage.removeItem('archiva_uba_members');
      localStorage.removeItem('archiva_uba_daily_reports');
      localStorage.removeItem('archiva_uba_synthesis_reports');
      localStorage.removeItem('archiva_uba_incidents');
      localStorage.removeItem('archiva_uba_cartons');
      localStorage.removeItem('archiva_uba_slips');
      localStorage.removeItem('archiva_uba_logs');
      localStorage.setItem('archiva_uba_data_clean_v2', 'true');
      setAgencies([]);
      setTeamMembers([]);
      setDailyReports([]);
      setSynthesisReports([]);
      setIncidents([]);
      setCartons([]);
      setTransferSlips([]);
      setLogs([]);
    }
  }, []);

  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem('archiva_uba_agencies');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_AGENCIES; }
    }
    return INITIAL_AGENCIES;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('archiva_uba_members');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_MEMBERS; }
    }
    return INITIAL_MEMBERS;
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('archiva_uba_daily_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_DAILY_REPORTS; }
    }
    return INITIAL_DAILY_REPORTS;
  });

  const [synthesisReports, setSynthesisReports] = useState<SynthesisReport[]>(() => {
    const saved = localStorage.getItem('archiva_uba_synthesis_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_SYNTHESIS_REPORTS; }
    }
    return INITIAL_SYNTHESIS_REPORTS;
  });

  const [incidents, setIncidents] = useState<ArchiveIncident[]>(() => {
    const saved = localStorage.getItem('archiva_uba_incidents');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_INCIDENTS; }
    }
    return INITIAL_INCIDENTS;
  });

  const [cartons, setCartons] = useState<CartonInventory[]>(() => {
    const saved = localStorage.getItem('archiva_uba_cartons');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_CARTONS; }
    }
    return INITIAL_CARTONS;
  });

  const [transferSlips, setTransferSlips] = useState<TransferSlip[]>(() => {
    const saved = localStorage.getItem('archiva_uba_slips');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_SLIPS; }
    }
    return INITIAL_SLIPS;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('archiva_uba_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_LOGS; }
    }
    return INITIAL_LOGS;
  });

  // Persistent storage
  useEffect(() => { localStorage.setItem('archiva_uba_agencies', JSON.stringify(agencies)); }, [agencies]);
  useEffect(() => { localStorage.setItem('archiva_uba_members', JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem('archiva_uba_daily_reports', JSON.stringify(dailyReports)); }, [dailyReports]);
  useEffect(() => { localStorage.setItem('archiva_uba_synthesis_reports', JSON.stringify(synthesisReports)); }, [synthesisReports]);
  useEffect(() => { localStorage.setItem('archiva_uba_incidents', JSON.stringify(incidents)); }, [incidents]);
  useEffect(() => { localStorage.setItem('archiva_uba_cartons', JSON.stringify(cartons)); }, [cartons]);
  useEffect(() => { localStorage.setItem('archiva_uba_slips', JSON.stringify(transferSlips)); }, [transferSlips]);
  useEffect(() => { localStorage.setItem('archiva_uba_logs', JSON.stringify(logs)); }, [logs]);

  const addLog = (action: string, details: string, category: LogEntry['category']) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.nomComplet || 'Système',
      userRole: (currentUser?.role || 'user') as Role,
      action,
      details,
      category
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Agency CRUD
  const addAgency = (agencyData: Omit<Agency, 'id' | 'dateCreation'>) => {
    const exists = agencies.some(a => a.code.trim().toLowerCase() === agencyData.code.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Le code agence ${agencyData.code} existe déjà.` };
    }

    const newAgency: Agency = {
      ...agencyData,
      id: `ag-${Date.now()}`,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    setAgencies(prev => [...prev, newAgency]);
    addLog('Création d\'agence', `Ajout de l'agence ${newAgency.nom} (Code ${newAgency.code})`, 'agence');
    return { success: true, message: `L'agence ${newAgency.nom} a été ajoutée.` };
  };

  const updateAgency = (updatedAgency: Agency) => {
    setAgencies(prev => prev.map(a => a.id === updatedAgency.id ? updatedAgency : a));
    addLog('Modification d\'agence', `Mise à jour de l'agence ${updatedAgency.nom} (Code ${updatedAgency.code})`, 'agence');
    return { success: true, message: `Agence ${updatedAgency.nom} mise à jour.` };
  };

  const deleteAgency = (agencyId: string) => {
    const target = agencies.find(a => a.id === agencyId);
    if (!target) return { success: false, message: 'Agence introuvable.' };

    setAgencies(prev => prev.filter(a => a.id !== agencyId));
    addLog('Suppression d\'agence', `Suppression de l'agence ${target.nom} (Code ${target.code})`, 'agence');
    return { success: true, message: `Agence ${target.nom} supprimée.` };
  };

  // Team Member CRUD
  const addTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `m-${Date.now()}`
    };
    setTeamMembers(prev => [...prev, newMember]);
    addLog('Ajout Membre', `Nouveau membre : ${newMember.nomOfficiel} (${newMember.site})`, 'equipe');
    return { success: true, message: `Membre ${newMember.nomOfficiel} ajouté.` };
  };

  const updateTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
    addLog('Modification Membre', `Mise à jour : ${member.nomOfficiel}`, 'equipe');
    return { success: true, message: `Membre ${member.nomOfficiel} modifié.` };
  };

  const deleteTeamMember = (memberId: string) => {
    const target = teamMembers.find(m => m.id === memberId);
    if (!target) return { success: false, message: 'Membre introuvable.' };
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    addLog('Suppression Membre', `Suppression : ${target.nomOfficiel}`, 'equipe');
    return { success: true, message: `Membre ${target.nomOfficiel} retiré.` };
  };

  // Daily Report CRUD
  const addDailyReport = (reportData: Omit<DailyReport, 'id' | 'dateCreation' | 'version'>) => {
    const newReport: DailyReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      version: 1,
      dateCreation: new Date().toISOString()
    };
    setDailyReports(prev => [newReport, ...prev]);
    addLog('Création Rapport', `Nouveau rapport journalier (${newReport.titre})`, 'rapport');
    eventBus.emit({ type: 'rapport.cree', rapportId: newReport.id });
    if (newReport.statut === 'valide') {
      eventBus.emit({ type: 'rapport.valide', rapportId: newReport.id, date: newReport.dateDebut });
    }
    return { success: true, reportId: newReport.id };
  };

  const updateDailyReport = (report: DailyReport) => {
    setDailyReports(prev => prev.map(r => r.id === report.id ? { ...report, version: report.version + 1 } : r));
    addLog('Modification Rapport', `Mise à jour du rapport (${report.titre}) - v${report.version + 1}`, 'rapport');
    if (report.statut === 'valide') {
      eventBus.emit({ type: 'rapport.valide', rapportId: report.id, date: report.dateDebut });
    }
    return { success: true, message: 'Rapport mis à jour avec succès.' };
  };

  const deleteDailyReport = (id: string) => {
    const report = dailyReports.find(r => r.id === id);
    setDailyReports(prev => prev.filter(r => r.id !== id));
    if (report) {
      addLog('Suppression Rapport', `Suppression du rapport : ${report.titre}`, 'rapport');
    }
    return { success: true, message: 'Rapport supprimé.' };
  };

  // Synthesis Report CRUD & Auto Compiler
  const addSynthesisReport = (synthesisData: Omit<SynthesisReport, 'id' | 'dateCreation'>) => {
    const newSynthesis: SynthesisReport = {
      ...synthesisData,
      id: `syn-${Date.now()}`,
      dateCreation: new Date().toISOString()
    };
    setSynthesisReports(prev => [newSynthesis, ...prev]);
    addLog('Création Synthèse', `Synthèse de période : ${newSynthesis.titre}`, 'rapport');
    return { success: true, reportId: newSynthesis.id };
  };

  const updateSynthesisReport = (synthesis: SynthesisReport) => {
    setSynthesisReports(prev => prev.map(s => s.id === synthesis.id ? synthesis : s));
    addLog('Modification Synthèse', `Mise à jour : ${synthesis.titre}`, 'rapport');
    return { success: true, message: 'Synthèse mise à jour.' };
  };

  const deleteSynthesisReport = (id: string) => {
    setSynthesisReports(prev => prev.filter(s => s.id !== id));
    addLog('Suppression Synthèse', `Suppression synthèse ID ${id}`, 'rapport');
    return { success: true, message: 'Synthèse supprimée.' };
  };

  // Compilation certifiée et déterministe (zéro chiffre inventé)
  const compileSynthesisFromReports = (dateDebut: string, dateFin: string, type: 'chef_confidentiel' | 'equipe_public') => {
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
      cartons
    );

    setSynthesisReports(prev => [newSynthesis, ...prev]);
    addLog(
      'Compilation Synthèse',
      `Synthèse certifiée générée pour la période ${dateDebut} au ${dateFin} (${newSynthesis.dossiersTraites} conventions)`,
      'rapport'
    );
    return {
      success: true,
      reportId: newSynthesis.id,
      message: `Synthèse certifiée compilée avec succès (${newSynthesis.dossiersTraites} conventions traitées) !`
    };
  };

  // Incidents CRUD
  const addIncident = (incData: Omit<ArchiveIncident, 'id' | 'dateSignalement'>) => {
    const newInc: ArchiveIncident = {
      ...incData,
      id: `inc-${Date.now()}`,
      dateSignalement: new Date().toISOString().split('T')[0]
    };
    setIncidents(prev => [newInc, ...prev]);
    addLog('Signalement Incident', `Incident : ${newInc.titre} (${newInc.severite})`, 'systeme');
    return { success: true, message: 'Incident enregistré.' };
  };

  const updateIncident = (inc: ArchiveIncident) => {
    setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
    addLog('Mise à jour Incident', `Incident ${inc.titre} passé au statut ${inc.statut}`, 'systeme');
    return { success: true, message: 'Incident mis à jour.' };
  };

  const deleteIncident = (id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
    addLog('Suppression Incident', `Incident ID ${id} supprimé`, 'systeme');
    return { success: true, message: 'Incident supprimé.' };
  };

  // Cartons CRUD
  const addCarton = (cartonData: Omit<CartonInventory, 'id' | 'dateEnregistrement'>) => {
    const newCarton: CartonInventory = {
      ...cartonData,
      id: `cart-${Date.now()}`,
      dateEnregistrement: new Date().toISOString().split('T')[0]
    };
    setCartons(prev => [newCarton, ...prev]);
    addLog('Inventaire Carton', `Nouveau carton répertorié : ${newCarton.numeroCarton}`, 'agence');
    return { success: true, message: 'Carton enregistré à l\'inventaire.' };
  };

  const updateCarton = (carton: CartonInventory) => {
    setCartons(prev => prev.map(c => c.id === carton.id ? carton : c));
    addLog('Modification Carton', `Carton ${carton.numeroCarton} mis à jour (${carton.emplacement})`, 'agence');
    return { success: true, message: 'Carton mis à jour.' };
  };

  const deleteCarton = (id: string) => {
    setCartons(prev => prev.filter(c => c.id !== id));
    addLog('Suppression Carton', `Carton ${id} retiré de l'inventaire`, 'agence');
    return { success: true, message: 'Carton supprimé.' };
  };

  // Transfer Slips CRUD
  const addTransferSlip = (slipData: Omit<TransferSlip, 'id' | 'numeroBordereau'>) => {
    const newSlip: TransferSlip = {
      ...slipData,
      id: `slip-${Date.now()}`,
      numeroBordereau: `BORD-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 90 + 10)}`
    };
    setTransferSlips(prev => [newSlip, ...prev]);
    addLog('Bordereau de Transfert', `Bordereau officiel émis : ${newSlip.numeroBordereau} (${newSlip.totalBoites} boîtes)`, 'rapport');
    return { success: true, slipId: newSlip.id, message: 'Bordereau de décharge créé avec succès.' };
  };

  const updateTransferSlip = (slip: TransferSlip) => {
    setTransferSlips(prev => prev.map(s => s.id === slip.id ? slip : s));
    addLog('Mise à jour Bordereau', `Bordereau ${slip.numeroBordereau} mis à jour (${slip.statut})`, 'rapport');
    return { success: true, message: 'Bordereau mis à jour.' };
  };

  const deleteTransferSlip = (id: string) => {
    setTransferSlips(prev => prev.filter(s => s.id !== id));
    addLog('Suppression Bordereau', `Bordereau ID ${id} supprimé`, 'rapport');
    return { success: true, message: 'Bordereau supprimé.' };
  };

  // Reset to Clean Blank State
  const clearAllData = () => {
    setAgencies([]);
    setTeamMembers([]);
    setDailyReports([]);
    setSynthesisReports([]);
    setIncidents([]);
    setCartons([]);
    setTransferSlips([]);
    setLogs([]);
    localStorage.removeItem('archiva_uba_agencies');
    localStorage.removeItem('archiva_uba_members');
    localStorage.removeItem('archiva_uba_daily_reports');
    localStorage.removeItem('archiva_uba_synthesis_reports');
    localStorage.removeItem('archiva_uba_incidents');
    localStorage.removeItem('archiva_uba_cartons');
    localStorage.removeItem('archiva_uba_slips');
    localStorage.removeItem('archiva_uba_logs');
    addLog('Réinitialisation', 'Toutes les données ont été vidées. Logiciel vierge initialisé.', 'systeme');
  };

  // Reload Reference Sample
  const loadDemoData = () => {
    setAgencies(INITIAL_AGENCIES);
    setTeamMembers(INITIAL_MEMBERS);
    setDailyReports(INITIAL_DAILY_REPORTS);
    setSynthesisReports(INITIAL_SYNTHESIS_REPORTS);
    setIncidents(INITIAL_INCIDENTS);
    setCartons(INITIAL_CARTONS);
    setTransferSlips(INITIAL_SLIPS);
    setLogs(INITIAL_LOGS);
    addLog('Chargement Démo', 'Jeu de données de référence UBA chargé.', 'systeme');
  };

  // Export JSON
  const exportDataToJson = () => {
    const backup = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      agencies,
      teamMembers,
      dailyReports,
      synthesisReports,
      incidents,
      cartons,
      transferSlips,
      logs
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archiva_uba_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const importDataFromJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.agencies) setAgencies(data.agencies);
      if (data.teamMembers) setTeamMembers(data.teamMembers);
      if (data.dailyReports) setDailyReports(data.dailyReports);
      if (data.synthesisReports) setSynthesisReports(data.synthesisReports);
      if (data.incidents) setIncidents(data.incidents);
      if (data.cartons) setCartons(data.cartons);
      if (data.transferSlips) setTransferSlips(data.transferSlips);
      if (data.logs) setLogs(data.logs);
      addLog('Import JSON', 'Données restaurées depuis une sauvegarde externe.', 'systeme');
      return { success: true, message: 'Sauvegarde importée avec succès !' };
    } catch {
      return { success: false, message: 'Fichier JSON invalide.' };
    }
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
        addLog,
        clearLogs,
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
