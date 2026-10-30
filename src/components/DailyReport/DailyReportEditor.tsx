import React, { useState } from 'react';
import { DailyReport, DailyReportMouvement, ReportCustomField, ReportImageAttachment, ReportTemplate } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../ui/Feedback';
import { formatNumber } from '../../utils/formatters';
import { parseLocalDate, todayLocal } from '../../utils/dates';
import { newId } from '../../utils/ids';
import { DailyReportPrintPreview } from './DailyReportPrintPreview';
import { AgencyAutocomplete } from '../ui/AgencyAutocomplete';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  FileCheck,
  DownloadCloud,
  Palette,
  Eye,
  Upload,
  Image as ImageIcon,
  Layers,
  Package,
  FolderOpen,
  BookmarkPlus,
  FileText,
  Sliders,
  Clock,
  MessageSquare
} from 'lucide-react';

interface DailyReportEditorProps {
  initialReport?: DailyReport | null;
  onSave: (report: DailyReport) => void;
  onCancel: () => void;
}

export const DailyReportEditor: React.FC<DailyReportEditorProps> = ({ initialReport, onSave, onCancel }) => {
  const { agencies, teamMembers, getAttendance, dailyReports, reportTemplates, addReportTemplate } = useData();
  const { currentUser, users } = useAuth();
  const { toast, confirm } = useFeedback();

  const [step, setStep] = useState(1);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // 1. Informations générales & Période
  const [titre, setTitre] = useState(initialReport?.titre || `Rapport Journalier d'Activité — ${new Date().toLocaleDateString('fr-FR')}`);
  const [dateDebut, setDateDebut] = useState(initialReport?.dateDebut || todayLocal());
  const [dateFin, setDateFin] = useState(initialReport?.dateFin || todayLocal());
  const [horaires, setHoraires] = useState(initialReport?.horaires || '7h30 – 16h30');
  const [chefNom, setChefNom] = useState(initialReport?.chefNom || 'Thony OBAKI');
  const [superviseurs, setSuperviseurs] = useState<string[]>(initialReport?.superviseurs || []);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialReport?.orientation || 'portrait');

  // 2. Effectif & Équipes
  const [effectifTotal, setEffectifTotal] = useState<number>(initialReport?.effectifTotal || 0);
  const [absents, setAbsents] = useState<number>(initialReport?.absents || 0);
  const [absentsMotifs, setAbsentsMotifs] = useState<string>(initialReport?.absentsMotifs || '');
  const presents = Math.max(0, effectifTotal - absents);
  const [equipeMazala, setEquipeMazala] = useState<string[]>(initialReport?.equipeMazala || []);
  const [equipeOrdinateur, setEquipeOrdinateur] = useState<string[]>(initialReport?.equipeOrdinateur || []);

  // 2b. Groupes de travail
  const [groupes, setGroupes] = useState(initialReport?.groupes || [
    { nom: 'Groupe 1 — Réception & Décharge', membres: ['Lorich', 'Déo'], tachesAssignees: 'Contrôle conformité et tri Mazala' }
  ]);

  // 3. Mouvements d'agences
  const [transferts, setTransferts] = useState<DailyReportMouvement[]>(initialReport?.transferts || []);
  const [totalDeclare, setTotalDeclare] = useState<number>(initialReport?.totalDeclare || 0);

  // 3b. Boîtes & Suivi du tri
  const [boitesDatees, setBoitesDatees] = useState<number>(initialReport?.boitesDatees || 0);
  const [boitesNonDatees, setBoitesNonDatees] = useState<number>(initialReport?.boitesNonDatees || 0);
  const [boitesRecues, setBoitesRecues] = useState<number>(initialReport?.boitesRecues || 0);
  const [boitesNonTriees, setBoitesNonTriees] = useState<number>(initialReport?.boitesNonTriees || 0);

  // 3c. Réceptions de matériel
  const [receptions, setReceptions] = useState(initialReport?.receptions || []);

  // 4. Tâches quotidiennes
  const [taches, setTaches] = useState(initialReport?.taches || [
    { numero: 1, titre: 'Organisation & répartition', horaire: '07h30 – 08h30', description: 'Briefing du matin et prise de poste' },
    { numero: 2, titre: 'Traitement et tri des conventions', horaire: '08h30 – 13h00', description: 'Vérification de conformité et classement' },
    { numero: 3, titre: 'Conditionnement & transfert', horaire: '13h30 – 16h30', description: 'Mise en cartons et décharge' }
  ]);

  // 4b. Observations & Constats
  const [observations, setObservations] = useState(initialReport?.observations || [
    { point: 'Conformité', constat: 'Opérations réalisées conformément aux procédures UBA', estIncident: false }
  ]);

  // 5. Personnalisation, styles et sections à afficher/masquer
  const [headerColor, setHeaderColor] = useState<string>(initialReport?.customStyles?.headerColor || '#FF0000');
  const [accentColor, setAccentColor] = useState<string>(initialReport?.customStyles?.accentColor || '#FF0000');
  const [backgroundColor, setBackgroundColor] = useState<string>(initialReport?.customStyles?.backgroundColor || '#FFFFFF');
  const [fontScale, setFontScale] = useState<'micro' | 'compact' | 'normal' | 'spacious'>(initialReport?.customStyles?.fontScale || 'normal');
  const [hideMatrix, setHideMatrix] = useState<boolean>(initialReport?.hideMatrix ?? true);
  const [customFields, setCustomFields] = useState<ReportCustomField[]>(initialReport?.customFields || []);
  const [images, setImages] = useState<ReportImageAttachment[]>(initialReport?.images || []);

  // Sections visibles
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(() => {
    return initialReport?.visibleSections || {
      effectif: true,
      groupes: true,
      taches: true,
      boites: true,
      mouvements: true,
      receptions: true,
      chronologie: true,
      observations: true,
      customFields: true,
      images: true,
      signatures: true
    };
  });

  // Dynamic calculations
  const totalCalcule = transferts.reduce((sum, t) => sum + (Number(t.conventions) || 0), 0);
  const ecart = totalDeclare - totalCalcule;
  const aEcart = ecart !== 0;

  // Importer le pointage du jour (automatique mais entièrement modifiable)
  const handleImportAttendance = () => {
    const records = getAttendance(dateDebut);
    if (records.length === 0) {
      toast(`Aucun pointage enregistré pour le ${dateDebut}. Effectuez l'appel dans la section Pointage.`, 'info');
      return;
    }

    const mazalaNames: string[] = [];
    const ordiNames: string[] = [];
    let abs = 0;
    const absMotifsList: string[] = [];

    records.forEach(r => {
      const member = teamMembers.find(m => m.id === r.memberId);
      const name = member?.nomOfficiel || r.memberId;
      if (r.statut === 'absent') {
        abs++;
        if (r.motif) absMotifsList.push(`${name} (${r.motif})`);
      } else {
        if (r.statut === 'mazala') mazalaNames.push(name);
        if (r.statut === 'ordinateur') ordiNames.push(name);
      }
    });

    setEffectifTotal(records.length);
    setAbsents(abs);
    if (absMotifsList.length > 0) {
      setAbsentsMotifs(absMotifsList.join(', '));
    }
    if (mazalaNames.length > 0) setEquipeMazala(mazalaNames);
    if (ordiNames.length > 0) setEquipeOrdinateur(ordiNames);

    toast(`Pointage du ${dateDebut} importé (${records.length - abs} présents, ${abs} absent(s)). Données modifiables.`, 'success');
  };

  // Chargement d'un modèle réutilisable
  const handleApplyTemplate = (tpl: ReportTemplate) => {
    const data = tpl.reportData;
    if (data.horaires) setHoraires(data.horaires);
    if (data.taches && data.taches.length > 0) setTaches(data.taches);
    if (data.observations && data.observations.length > 0) setObservations(data.observations);
    if (data.groupes && data.groupes.length > 0) setGroupes(data.groupes);
    if (data.customStyles?.headerColor) setHeaderColor(data.customStyles.headerColor);
    if (data.customStyles?.accentColor) setAccentColor(data.customStyles.accentColor);
    if (data.orientation) setOrientation(data.orientation);
    if (data.visibleSections) setVisibleSections(data.visibleSections);
    toast(`Modèle "${tpl.nom}" appliqué avec succès.`, 'success');
  };

  // Sauvegarder le contenu comme modèle
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      toast('Veuillez saisir un nom pour le modèle.', 'error');
      return;
    }
    addReportTemplate({
      nom: newTemplateName.trim(),
      description: newTemplateDesc.trim() || undefined,
      reportData: {
        horaires,
        taches,
        observations,
        groupes,
        customStyles: { headerColor, accentColor, backgroundColor, fontScale },
        orientation,
        visibleSections
      }
    });
    toast(`Modèle "${newTemplateName.trim()}" sauvegardé avec succès.`, 'success');
    setShowTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  // Transferts helpers
  const handleAddTransfer = () => {
    const firstAg = agencies[0];
    const newTr: DailyReportMouvement = {
      id: newId('tr'),
      agenceId: firstAg?.id || '',
      agenceNom: firstAg?.nom || '',
      code: firstAg?.code || '',
      exercice: new Date().getFullYear(),
      conventions: 0,
      boites: 0,
      traitement: 'Trié'
    };
    setTransferts(prev => [...prev, newTr]);
  };

  const handleUpdateTransfer = (idx: number, patch: Partial<DailyReportMouvement>) => {
    setTransferts(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const handleRemoveTransfer = async (idx: number) => {
    const tr = transferts[idx];
    if (tr && (tr.conventions > 0 || tr.boites > 0)) {
      const ok = await confirm({
        title: 'Supprimer ce mouvement ?',
        message: `Supprimer la ligne de transfert de l'agence "${tr.agenceNom || 'Sélectionnée'}" ?`,
        confirmLabel: 'Supprimer',
        danger: true
      });
      if (!ok) return;
    }
    setTransferts(prev => prev.filter((_, i) => i !== idx));
  };

  // Tâches helpers
  const handleAddTask = () => {
    setTaches(prev => [
      ...prev,
      {
        numero: prev.length + 1,
        titre: 'Nouvelle tâche',
        horaire: '14h00 – 16h00',
        description: 'Description des opérations'
      }
    ]);
  };

  const handleUpdateTask = (idx: number, patch: Partial<{ numero: number; titre: string; horaire: string; description: string }>) => {
    setTaches(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const handleRemoveTask = (idx: number) => {
    setTaches(prev => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, numero: i + 1 })));
  };

  // Groupes helpers
  const handleAddGroup = () => {
    setGroupes(prev => [
      ...prev,
      { nom: `Groupe ${prev.length + 1}`, membres: [], tachesAssignees: 'Mission spécifique' }
    ]);
  };

  const handleUpdateGroup = (idx: number, patch: Partial<{ nom: string; membres: string[]; tachesAssignees: string }>) => {
    setGroupes(prev => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const handleRemoveGroup = (idx: number) => {
    setGroupes(prev => prev.filter((_, i) => i !== idx));
  };

  // Observations helpers
  const handleAddObservation = () => {
    setObservations(prev => [
      ...prev,
      { point: 'Observation', constat: 'Constat opérationnel', estIncident: false }
    ]);
  };

  const handleUpdateObservation = (idx: number, patch: Partial<{ point: string; constat: string; estIncident: boolean }>) => {
    setObservations(prev => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const handleRemoveObservation = (idx: number) => {
    setObservations(prev => prev.filter((_, i) => i !== idx));
  };

  // Réceptions helpers
  const handleAddReception = () => {
    setReceptions(prev => [
      ...prev,
      { id: newId('rec'), description: 'Lot de dossiers', boites: 1, provenance: 'Agence', statut: 'Reçu conforme' }
    ]);
  };

  const handleUpdateReception = (idx: number, patch: Partial<{ description: string; boites: number; provenance: string; statut: string }>) => {
    setReceptions(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleRemoveReception = (idx: number) => {
    setReceptions(prev => prev.filter((_, i) => i !== idx));
  };

  // Custom fields helpers
  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { id: newId('cf'), label: '', value: '' }]);
  };

  const handleUpdateCustomField = (id: string, updates: Partial<ReportCustomField>) => {
    setCustomFields(prev => prev.map(cf => cf.id === id ? { ...cf, ...updates } : cf));
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(cf => cf.id !== id));
  };

  // Images helpers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('L\'image dépasse 2 Mo. Veuillez sélectionner une image plus légère.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) {
        setImages(prev => [
          ...prev,
          { id: newId('img'), url, caption: file.name.replace(/\.[^/.]+$/, ''), position: 'annex' }
        ]);
        toast('Image ajoutée au rapport.', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Toggle de visibilité d'une section
  const handleToggleSection = (sectionKey: string) => {
    setVisibleSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === false ? true : false
    }));
  };

  // Validation
  const validateReport = (asValid: boolean): string[] => {
    const errors: string[] = [];
    if (parseLocalDate(dateFin) < parseLocalDate(dateDebut)) {
      errors.push('La date de fin est antérieure à la date de début.');
    }
    if (asValid) {
      if (effectifTotal < 1) {
        errors.push("L'effectif total doit être renseigné pour valider officiellement le rapport.");
      }
      if (transferts.some(t => !t.agenceId || !t.exercice)) {
        errors.push('Chaque ligne de transfert doit spécifier une agence et un exercice.');
      }
      if (aEcart) {
        errors.push(`Écart de ${Math.abs(ecart)} convention(s) entre le total déclaré (${totalDeclare}) et le total calculé (${totalCalcule}).`);
      }
      const hasDuplicate = dailyReports.some(r =>
        r.id !== initialReport?.id &&
        r.statut === 'valide' &&
        r.dateDebut === dateDebut
      );
      if (hasDuplicate) {
        errors.push(`Un rapport validé existe déjà pour le ${dateDebut}.`);
      }
    }
    return errors;
  };

  // Objet de prévisualisation live
  const currentDraftReport: DailyReport = {
    id: initialReport?.id || 'draft-preview',
    titre,
    dateDebut,
    dateFin,
    horaires,
    chefNom: chefNom.trim() || 'Thony OBAKI',
    superviseurs,
    effectifTotal,
    presents,
    absents,
    absentsMotifs,
    equipeMazala,
    equipeOrdinateur,
    groupes,
    taches,
    transferts,
    receptions,
    chronologie: initialReport?.chronologie || [],
    observations,
    totalDeclare,
    totalCalcule,
    ecart,
    statut: 'brouillon',
    version: initialReport ? initialReport.version : 1,
    creePar: currentUser?.nomComplet || 'Archiviste',
    dateCreation: initialReport?.dateCreation || new Date().toISOString(),
    customStyles: {
      ...(initialReport?.customStyles || {}),
      headerColor,
      accentColor,
      backgroundColor,
      fontScale,
      orientation
    },
    customFields,
    images,
    hideMatrix,
    boitesDatees: Number(boitesDatees) || 0,
    boitesNonDatees: Number(boitesNonDatees) || 0,
    boitesRecues: Number(boitesRecues) || 0,
    boitesNonTriees: Number(boitesNonTriees) || 0,
    visibleSections,
    orientation
  };

  const handleSaveReport = (statut: 'brouillon' | 'valide') => {
    const errors = validateReport(statut === 'valide');
    if (errors.length > 0) {
      toast(errors[0], 'error');
      return;
    }

    const finalReport: DailyReport = {
      ...currentDraftReport,
      id: initialReport?.id || newId('rep'),
      statut,
      version: initialReport ? initialReport.version + 1 : 1
    };

    onSave(finalReport);
    toast(statut === 'brouillon' ? 'Brouillon enregistré avec succès.' : 'Rapport validé et enregistré.', 'success');
  };

  return (
    <div className="page" style={{ maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
      {/* Top Action Header */}
      <div className="page-head" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: '6px' }}
          >
            <ArrowLeft size={14} /> Retour aux rapports
          </button>
          <h1 style={{ fontSize: 'clamp(1.2rem, 1rem + 1vw, 1.55rem)' }}>
            {initialReport ? 'Modification du Rapport Journalier' : 'Nouveau Rapport Journalier d\'Activité'}
          </h1>
          <p className="text-muted text-sm">
            Toutes les sections, tableaux, intitulés et métriques sont modifiables selon les exigences UBA.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {reportTemplates.length > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <select
                className="form-select"
                style={{ minHeight: '34px', fontSize: '0.8rem', padding: '4px 8px' }}
                onChange={e => {
                  const found = reportTemplates.find(t => t.id === e.target.value);
                  if (found) handleApplyTemplate(found);
                }}
                defaultValue=""
              >
                <option value="" disabled>📂 Charger un modèle...</option>
                {reportTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="btn btn-secondary btn-sm"
            title="Enregistrer ce contenu comme modèle réutilisable"
          >
            <BookmarkPlus size={15} /> Modèle
          </button>

          <button
            type="button"
            onClick={() => setShowLivePreview(true)}
            className="btn btn-secondary btn-sm"
            title="Aperçu avant impression A4"
          >
            <Eye size={15} /> Aperçu A4
          </button>

          <button
            type="button"
            onClick={() => handleSaveReport('brouillon')}
            className="btn btn-secondary btn-sm"
            title="Enregistrer les modifications comme brouillon"
          >
            <Save size={15} /> Brouillon
          </button>

          <button
            type="button"
            onClick={() => handleSaveReport('valide')}
            className="btn btn-primary btn-sm"
            title="Valider et certifier le rapport"
          >
            <FileCheck size={15} /> Valider
          </button>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="row" style={{ borderBottom: '1px solid var(--line)', marginBottom: '20px', paddingBottom: '6px', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {[
          { num: 1, label: '1. Période & Horaires' },
          { num: 2, label: '2. Effectif & Équipes' },
          { num: 3, label: '3. Conventions & Boîtes' },
          { num: 4, label: '4. Tâches & Observations' },
          { num: 5, label: '5. Sections & Personnalisation' },
          { num: 6, label: '6. Contrôle & Validation' }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`btn btn-sm ${step === s.num ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: Période & Organisation */}
      {step === 1 && (
        <div className="card">
          <h3 className="uba-section-title">Section 1 — Organisation, Période & Horaires</h3>

          <div className="form-group">
            <label className="form-label">Titre officiel du rapport</label>
            <input
              type="text"
              className="form-input"
              value={titre}
              onChange={e => setTitre(e.target.value)}
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Date Début *</label>
              <input
                type="date"
                className="form-input"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date Fin *</label>
              <input
                type="date"
                className="form-input"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Plage Horaire de travail</label>
              <input
                type="text"
                className="form-input"
                value={horaires}
                onChange={e => setHoraires(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Chef d'équipe des Archives</label>
              <input
                type="text"
                list="chefs-registered-list"
                className="form-input"
                placeholder="Sélectionnez ou saisissez le nom du chef d'équipe"
                value={chefNom}
                onChange={e => setChefNom(e.target.value)}
              />
              <datalist id="chefs-registered-list">
                {currentUser && <option value={currentUser.nomComplet}>{currentUser.nomComplet} (Session en cours)</option>}
                {users.filter(u => u.id !== currentUser?.id).map(u => (
                  <option key={u.id} value={u.nomComplet}>{u.nomComplet} ({u.titre || u.role})</option>
                ))}
                {teamMembers.map(m => (
                  <option key={m.id} value={m.nomOfficiel}>{m.nomOfficiel}</option>
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Superviseurs / Équipe (séparés par virgule)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Lorich, Déo, Superviseur Mazala"
                value={superviseurs.join(', ')}
                onChange={e => setSuperviseurs(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label">Orientation du document imprimé</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orientation"
                  checked={orientation === 'portrait'}
                  onChange={() => setOrientation('portrait')}
                />
                <span>A4 Portrait (Standard)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="orientation"
                  checked={orientation === 'landscape'}
                  onChange={() => setOrientation('landscape')}
                />
                <span>A4 Paysage (Grand format tableaux)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-primary">
              Suivant : Effectif & Équipes <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Effectif & Groupes de travail */}
      {step === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 2 — Effectif, Équipes & Groupes de Travail
            </h3>
            <button
              type="button"
              onClick={handleImportAttendance}
              className="btn btn-secondary btn-sm"
              title="Importer automatiquement les présences du jour depuis le pointage"
            >
              <DownloadCloud size={15} /> Importer le pointage du jour
            </button>
          </div>

          <div className="grid-3" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Effectif Total Attendu</label>
              <input
                type="number"
                inputMode="numeric"
                className="form-input num"
                value={effectifTotal}
                onChange={e => setEffectifTotal(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Présents (Calculé : Total - Absents)</label>
              <input
                type="number"
                readOnly
                className="form-input num"
                value={presents}
                style={{ backgroundColor: 'var(--surface-2)', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Absents</label>
              <input
                type="number"
                inputMode="numeric"
                className="form-input num"
                value={absents}
                onChange={e => setAbsents(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {absents > 0 && (
            <div className="form-group">
              <label className="form-label">Motifs des absences constatées</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Maladie, permission, mission extérieure"
                value={absentsMotifs}
                onChange={e => setAbsentsMotifs(e.target.value)}
              />
            </div>
          )}

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Équipe affectée sur le Site Mazala</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Lorich (Stagiaire), Déo (Stagiaire)"
                value={equipeMazala.join(', ')}
                onChange={e => setEquipeMazala(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Équipe affectée Travail sur Ordinateur</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Superviseur Maya-Maya, Chef"
                value={equipeOrdinateur.join(', ')}
                onChange={e => setEquipeOrdinateur(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
          </div>

          {/* Groupes de travail personnalisables */}
          <div className="card" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Groupes de Travail & Répartition des Missions</h4>
              </div>
              <button
                type="button"
                onClick={handleAddGroup}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> + Ajouter un groupe
              </button>
            </div>

            {groupes.length === 0 ? (
              <p className="text-muted text-sm">Aucun groupe de travail défini. Vous pouvez en ajouter un si nécessaire.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groupes.map((g, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--black-panel)', padding: '10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nom du groupe (ex: Groupe 1)"
                      value={g.nom}
                      onChange={e => handleUpdateGroup(idx, { nom: e.target.value })}
                      style={{ width: '160px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Membres (séparés par virgule)"
                      value={g.membres.join(', ')}
                      onChange={e => handleUpdateGroup(idx, { membres: e.target.value.split(',').map(m => m.trim()).filter(Boolean) })}
                      style={{ flex: 1, minWidth: '160px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Mission / Tâches assignées"
                      value={g.tachesAssignees || ''}
                      onChange={e => handleUpdateGroup(idx, { tachesAssignees: e.target.value })}
                      style={{ flex: 1.5, minWidth: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(idx)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Supprimer ce groupe"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Suivant : Conventions & Boîtes <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Mouvements & Boîtes */}
      {step === 3 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 3 — Décompte des Conventions & Mouvements
            </h3>
            <button onClick={handleAddTransfer} className="btn btn-primary btn-sm">
              <Plus size={15} /> + Ajouter une agence
            </button>
          </div>

          {/* Tableau des mouvements */}
          <div className="uba-table-container" style={{ marginBottom: '16px' }}>
            <table className="uba-table uba-table--cards">
              <thead>
                <tr>
                  <th>AGENCE</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>CODE</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>EXERCICE</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>CONVENTIONS</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>BOÎTES</th>
                  <th>TRAITEMENT</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {transferts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }} className="text-muted">
                      Aucun mouvement pour cette journée. Cliquez sur "+ Ajouter une agence" pour enregistrer un transfert.
                    </td>
                  </tr>
                ) : (
                  transferts.map((tr, idx) => (
                    <tr key={tr.id || idx}>
                      <td data-label="Agence" style={{ minWidth: '200px' }}>
                        <AgencyAutocomplete
                          agencies={agencies}
                          value={tr.agenceId || ''}
                          onChange={ag => {
                            if (ag) {
                              handleUpdateTransfer(idx, {
                                agenceId: ag.id,
                                agenceNom: ag.nom,
                                code: ag.code
                              });
                            } else {
                              handleUpdateTransfer(idx, {
                                agenceId: '',
                                agenceNom: '',
                                code: ''
                              });
                            }
                          }}
                          placeholder="Sélectionner l'agence..."
                        />
                      </td>
                      <td data-label="Code" style={{ textAlign: 'center' }}>
                        <input
                          type="text"
                          className="form-input num"
                          value={tr.code}
                          readOnly
                          style={{ textAlign: 'center', fontWeight: 600, backgroundColor: 'var(--surface-2)' }}
                        />
                      </td>
                      <td data-label="Exercice" style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-input num"
                          value={tr.exercice}
                          onChange={e => handleUpdateTransfer(idx, { exercice: Number(e.target.value) })}
                          style={{ textAlign: 'center' }}
                        />
                      </td>
                      <td data-label="Conventions">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-input num"
                          value={tr.conventions}
                          onChange={e => handleUpdateTransfer(idx, { conventions: Number(e.target.value) })}
                          style={{ fontWeight: 700, color: 'var(--brand-hi)', textAlign: 'right' }}
                        />
                      </td>
                      <td data-label="Boîtes">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-input num"
                          value={tr.boites}
                          onChange={e => handleUpdateTransfer(idx, { boites: Number(e.target.value) })}
                          style={{ textAlign: 'right' }}
                        />
                      </td>
                      <td data-label="Traitement">
                        <input
                          type="text"
                          className="form-input"
                          value={tr.traitement}
                          onChange={e => handleUpdateTransfer(idx, { traitement: e.target.value })}
                        />
                      </td>
                      <td data-label="Action" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveTransfer(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="Supprimer la ligne"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Somme dynamique & total déclaré */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '18px',
              backgroundColor: 'var(--surface-2)'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div className="text-muted text-sm">Somme calculée des lignes :</div>
              <div className="num" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-hi)' }}>
                {formatNumber(totalCalcule)} conventions
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <label className="text-muted text-sm" style={{ display: 'block', marginBottom: '4px' }}>Total déclaré dans le rapport :</label>
              <input
                type="number"
                inputMode="numeric"
                className="form-input num"
                style={{ width: '140px', textAlign: 'right', fontWeight: 800 }}
                value={totalDeclare}
                onChange={e => setTotalDeclare(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Suivi des boîtes & réceptions */}
          <div className="card" style={{ marginTop: '20px', border: '1px solid var(--line)', backgroundColor: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Package size={17} color="var(--brand-hi)" />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Suivi des Boîtes & Cartons du Jour</h4>
            </div>
            <div className="grid-4">
              <div className="form-group">
                <label className="form-label">Boîtes reçues</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="form-input num"
                  value={boitesRecues}
                  onChange={e => setBoitesRecues(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Boîtes datées</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="form-input num"
                  value={boitesDatees}
                  onChange={e => setBoitesDatees(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Boîtes non datées</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="form-input num"
                  value={boitesNonDatees}
                  onChange={e => setBoitesNonDatees(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tri non terminé</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="form-input num"
                  value={boitesNonTriees}
                  onChange={e => setBoitesNonTriees(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>
          </div>

          {/* Réceptions de matériel & décharges */}
          <div className="card" style={{ marginTop: '16px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Réceptions de Matériel & Bordereaux de décharge</h4>
              <button
                type="button"
                onClick={handleAddReception}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> + Ajouter une réception
              </button>
            </div>

            {receptions.length === 0 ? (
              <p className="text-muted text-sm">Aucune réception de matériel enregistrée pour cette journée.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {receptions.map((rec, idx) => (
                  <div key={rec.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Provenance (Agence / Site)"
                      value={rec.provenance}
                      onChange={e => handleUpdateReception(idx, { provenance: e.target.value })}
                      style={{ width: '180px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Description du lot"
                      value={rec.description}
                      onChange={e => handleUpdateReception(idx, { description: e.target.value })}
                      style={{ flex: 2, minWidth: '180px' }}
                    />
                    <input
                      type="number"
                      className="form-input num"
                      placeholder="Boîtes"
                      value={rec.boites}
                      onChange={e => handleUpdateReception(idx, { boites: Number(e.target.value) })}
                      style={{ width: '80px', textAlign: 'right' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Statut (ex: Conforme)"
                      value={rec.statut}
                      onChange={e => handleUpdateReception(idx, { statut: e.target.value })}
                      style={{ width: '130px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveReception(idx)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Supprimer la réception"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              Suivant : Tâches & Observations <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Tâches réalisées & Observations du terrain */}
      {step === 4 && (
        <div className="card">
          <h3 className="uba-section-title">Section 4 — Tâches Réalisées & Observations</h3>

          {/* Tableau des tâches */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Tâches & Chronologie de la Journée</h4>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> + Ajouter une tâche
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {taches.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--r-sm)' }}>
                  <span className="badge badge-black" style={{ width: '32px', textAlign: 'center' }}>
                    #{t.numero}
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Horaire (ex: 07h30 – 08h30)"
                    value={t.horaire}
                    onChange={e => handleUpdateTask(idx, { horaire: e.target.value })}
                    style={{ width: '150px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Intitulé de la mission"
                    value={t.titre}
                    onChange={e => handleUpdateTask(idx, { titre: e.target.value })}
                    style={{ width: '220px', fontWeight: 600 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Détails & exécution"
                    value={t.description}
                    onChange={e => handleUpdateTask(idx, { description: e.target.value })}
                    style={{ flex: 1, minWidth: '220px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--danger)' }}
                    title="Supprimer la tâche"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Observations & Constats */}
          <div className="card" style={{ border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Observations du Terrain, Constats & Incidents</h4>
              </div>
              <button
                type="button"
                onClick={handleAddObservation}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> + Ajouter une observation
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {observations.map((obs, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--r-sm)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Point (ex: Conformité, Sécurité, Matériel)"
                    value={obs.point}
                    onChange={e => handleUpdateObservation(idx, { point: e.target.value })}
                    style={{ width: '180px', fontWeight: 600 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Constat opérationnel détaillé"
                    value={obs.constat}
                    onChange={e => handleUpdateObservation(idx, { constat: e.target.value })}
                    style={{ flex: 1, minWidth: '220px' }}
                  />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(obs.estIncident)}
                      onChange={e => handleUpdateObservation(idx, { estIncident: e.target.checked })}
                    />
                    <span>Incident ?</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveObservation(idx)}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--danger)' }}
                    title="Supprimer cette observation"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary">
              Suivant : Personnalisation & Sections <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Personnalisation & Sections à afficher/masquer */}
      {step === 5 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 5 — Personnalisation du Document & Sections Visibles
            </h3>
            <button
              type="button"
              onClick={() => setShowLivePreview(true)}
              className="btn btn-secondary btn-sm"
            >
              <Eye size={15} /> Aperçu en direct
            </button>
          </div>

          {/* Afficher / Masquer des sections */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sliders size={16} color="var(--brand-hi)" />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Sections à Afficher / Masquer sur le Document Final</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { key: 'effectif', label: 'Effectifs & Présences' },
                { key: 'groupes', label: 'Groupes de travail' },
                { key: 'boites', label: 'Suivi volumétrie boîtes' },
                { key: 'mouvements', label: 'Tableau des conventions' },
                { key: 'receptions', label: 'Réceptions & Bordereaux' },
                { key: 'taches', label: 'Tâches majeures' },
                { key: 'observations', label: 'Observations du terrain' },
                { key: 'customFields', label: 'Champs personnalisés' },
                { key: 'images', label: 'Photos & Pièces jointes' },
                { key: 'signatures', label: 'Validation & Signatures' }
              ].map(sec => (
                <label key={sec.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--r-xs)' }}>
                  <input
                    type="checkbox"
                    checked={visibleSections[sec.key] !== false}
                    onChange={() => handleToggleSection(sec.key)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Styles & Couleurs */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Palette size={16} color="var(--brand-hi)" />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Styles & Couleurs d'exportation</h4>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Couleur du bandeau d'en-tête</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={headerColor}
                    onChange={e => setHeaderColor(e.target.value)}
                    style={{ width: '40px', height: '38px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    className="form-input num"
                    value={headerColor}
                    onChange={e => setHeaderColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Couleur d'accent (Titres & bordures)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    style={{ width: '40px', height: '38px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    className="form-input num"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Densité typographique</label>
                <select
                  className="form-select"
                  value={fontScale}
                  onChange={e => setFontScale(e.target.value as any)}
                >
                  <option value="compact">Compacte (plus d'éléments par page)</option>
                  <option value="normal">Normale (standard officiel UBA)</option>
                  <option value="spacious">Aérée</option>
                </select>
              </div>
            </div>
          </div>

          {/* Champs personnalisés */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Champs & Mentions Libres Supplémentaires</h4>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Ajouter un champ libre
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Aucun champ libre supplémentaire. Ajoutez des métriques ou références selon les besoins.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customFields.map(cf => (
                  <div key={cf.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Libellé du champ"
                      value={cf.label}
                      onChange={e => handleUpdateCustomField(cf.id, { label: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Valeur"
                      value={cf.value}
                      onChange={e => handleUpdateCustomField(cf.id, { value: e.target.value })}
                      style={{ flex: 2 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Supprimer ce champ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images & Photographies */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Photographies & Pièces Jointes</h4>
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Téléverser une photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
              </label>
            </div>

            {images.length === 0 ? (
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Aucune image jointe. Utile pour intégrer des photographies des palettes ou des bordereaux signés.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {images.map(img => (
                  <div key={img.id} style={{ border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--surface-2)' }}>
                    <img src={img.url} alt={img.caption || 'Illustration'} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover' }} />
                    <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Légende"
                        value={img.caption || ''}
                        onChange={e => {
                          const cap = e.target.value;
                          setImages(prev => prev.map(im => im.id === img.id ? { ...im, caption: cap } : im));
                        }}
                        style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 6px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(4)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(6)} className="btn btn-primary">
              Suivant : Contrôle & Certification <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Contrôle, Certification & Enregistrement */}
      {step === 6 && (
        <div className="card">
          <h3 className="uba-section-title">Section 6 — Contrôle de Cohérence & Certification Officielle</h3>

          {/* Contrôle qualité */}
          {aEcart ? (
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(255, 69, 58, 0.1)',
                borderColor: 'var(--danger)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <AlertTriangle size={28} color="var(--danger)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
                  Écart constaté : Total déclaré ({formatNumber(totalDeclare)}) ≠ Somme calculée ({formatNumber(totalCalcule)})
                </div>
                <div className="text-muted text-sm" style={{ marginTop: '4px' }}>
                  Écart comptable de <strong style={{ color: 'var(--text-1)' }}>{formatNumber(Math.abs(ecart))} conventions</strong>.
                </div>
                <button
                  type="button"
                  onClick={() => setTotalDeclare(totalCalcule)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                >
                  <Check size={14} /> Aligner automatiquement sur {formatNumber(totalCalcule)} conventions
                </button>
              </div>
            </div>
          ) : (
            <div
              className="card ai-border"
              style={{
                backgroundColor: 'rgba(52, 199, 89, 0.08)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={24} color="var(--success)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                  Contrôle Qualité Validé : Zéro écart !
                </div>
                <div className="text-muted text-sm">
                  Le total déclaré correspond exactement à la somme calculée des transferts ({formatNumber(totalCalcule)} conventions).
                </div>
              </div>
            </div>
          )}

          {/* Récapitulatif avant finalisation */}
          <div className="card" style={{ backgroundColor: 'var(--surface-2)', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
              Récapitulatif de conformité
            </h4>
            <div className="grid-auto text-sm text-muted">
              <div><strong style={{ color: 'var(--text-1)' }}>Période :</strong> {dateDebut} au {dateFin}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Chef d'équipe :</strong> {chefNom || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Effectif :</strong> {presents} / {effectifTotal}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Lignes d'agences :</strong> {transferts.length}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Total conventions :</strong> <span className="num" style={{ color: 'var(--brand-hi)', fontWeight: 800 }}>{formatNumber(totalCalcule)}</span></div>
              <div><strong style={{ color: 'var(--text-1)' }}>Boîtes reçues :</strong> <span className="num">{boitesRecues}</span></div>
              <div><strong style={{ color: 'var(--text-1)' }}>Orientation :</strong> <span>{orientation === 'landscape' ? 'A4 Paysage' : 'A4 Portrait'}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => setStep(5)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowLivePreview(true)}
                className="btn btn-secondary"
              >
                <Eye size={16} /> Prévisualiser A4
              </button>
              <button
                type="button"
                onClick={() => handleSaveReport('brouillon')}
                className="btn btn-secondary"
              >
                <Save size={16} /> Enregistrer Brouillon
              </button>
              <button
                type="button"
                onClick={() => handleSaveReport('valide')}
                className="btn btn-primary"
              >
                <FileCheck size={16} /> Valider le rapport officiel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Sauvegarder comme modèle */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '14px' }}>Sauvegarder comme modèle de rapport</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
              Les horaires, missions, tâches, observations types et mise en page seront mémorisés pour être réutilisés en 1 clic.
            </p>
            <div className="form-group">
              <label className="form-label">Nom du modèle *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Modèle Standard Mazala"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (facultative)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Configuration type pour les équipes de tri Mazala"
                value={newTemplateDesc}
                onChange={e => setNewTemplateDesc(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="btn btn-primary"
              >
                Sauvegarder le modèle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de prévisualisation live du document */}
      {showLivePreview && (
        <DailyReportPrintPreview
          report={currentDraftReport}
          onClose={() => setShowLivePreview(false)}
        />
      )}
    </div>
  );
};
