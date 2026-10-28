import React, { useState } from 'react';
import { DailyReport, DailyReportMouvement, ReportCustomField, ReportImageAttachment } from '../../types';
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
  Package
} from 'lucide-react';

interface DailyReportEditorProps {
  initialReport?: DailyReport | null;
  onSave: (report: DailyReport) => void;
  onCancel: () => void;
}

export const DailyReportEditor: React.FC<DailyReportEditorProps> = ({ initialReport, onSave, onCancel }) => {
  const { agencies, teamMembers, getAttendance, dailyReports } = useData();
  const { currentUser, users } = useAuth();
  const { toast } = useFeedback();

  const [step, setStep] = useState(1);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Form State
  const [titre, setTitre] = useState(initialReport?.titre || `Rapport Journalier d'Activité — ${new Date().toLocaleDateString('fr-FR')}`);
  const [dateDebut, setDateDebut] = useState(initialReport?.dateDebut || todayLocal());
  const [dateFin, setDateFin] = useState(initialReport?.dateFin || todayLocal());
  const [horaires, setHoraires] = useState(initialReport?.horaires || '7h30 – 16h30');
  // Conformément aux spécifications, le nom du chef d'équipe par défaut est Thony OBAKI
  const [chefNom, setChefNom] = useState(initialReport?.chefNom || 'Thony OBAKI');
  const [superviseurs, setSuperviseurs] = useState<string[]>(initialReport?.superviseurs || []);

  const [effectifTotal, setEffectifTotal] = useState<number>(initialReport?.effectifTotal || 0);
  const [absents, setAbsents] = useState<number>(initialReport?.absents || 0);
  const [absentsMotifs, setAbsentsMotifs] = useState<string>(initialReport?.absentsMotifs || '');
  const presents = Math.max(0, effectifTotal - absents);

  const [equipeMazala, setEquipeMazala] = useState<string[]>(initialReport?.equipeMazala || []);
  const [equipeOrdinateur, setEquipeOrdinateur] = useState<string[]>(initialReport?.equipeOrdinateur || []);

  const [transferts, setTransferts] = useState<DailyReportMouvement[]>(initialReport?.transferts || []);
  const [totalDeclare, setTotalDeclare] = useState<number>(initialReport?.totalDeclare || 0);

  // Nouveaux indicateurs de boîtes & cartons demandés
  const [boitesDatees, setBoitesDatees] = useState<number>(initialReport?.boitesDatees || 0);
  const [boitesNonDatees, setBoitesNonDatees] = useState<number>(initialReport?.boitesNonDatees || 0);
  const [boitesRecues, setBoitesRecues] = useState<number>(initialReport?.boitesRecues || 0);
  const [boitesNonTriees, setBoitesNonTriees] = useState<number>(initialReport?.boitesNonTriees || 0);

  // Personnalisation des rapports (Styles, couleurs, champs personnalisés, images, suppression matrice)
  const [headerColor, setHeaderColor] = useState<string>(initialReport?.customStyles?.headerColor || '#FF0000');
  const [accentColor, setAccentColor] = useState<string>(initialReport?.customStyles?.accentColor || '#FF0000');
  const [backgroundColor, setBackgroundColor] = useState<string>(initialReport?.customStyles?.backgroundColor || '#FFFFFF');
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'spacious'>(initialReport?.customStyles?.fontScale || 'normal');
  const [hideMatrix, setHideMatrix] = useState<boolean>(initialReport?.hideMatrix ?? true);
  const [customFields, setCustomFields] = useState<ReportCustomField[]>(initialReport?.customFields || []);
  const [images, setImages] = useState<ReportImageAttachment[]>(initialReport?.images || []);

  const [taches, setTaches] = useState(initialReport?.taches || [
    { numero: 1, titre: 'Organisation & répartition', horaire: '07h30 – 08h30', description: 'Briefing du matin et prise de poste' },
    { numero: 2, titre: 'Traitement et tri des conventions', horaire: '08h30 – 13h00', description: 'Vérification de conformité et classement' },
    { numero: 3, titre: 'Conditionnement & transfert', horaire: '13h30 – 16h30', description: 'Mise en cartons et décharge' }
  ]);

  const [receptions, setReceptions] = useState(initialReport?.receptions || []);
  const [observations, setObservations] = useState(initialReport?.observations || [
    { point: 'Conformité', constat: 'Opérations réalisées conformément aux procédures UBA', estIncident: false }
  ]);

  // Dynamic calculations
  const totalCalcule = transferts.reduce((sum, t) => sum + (Number(t.conventions) || 0), 0);
  const ecart = totalDeclare - totalCalcule;
  const aEcart = ecart !== 0;

  // Importer le pointage du jour (C4/C5)
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

    toast(`Pointage du ${dateDebut} importé avec succès (${records.length - abs} présents, ${abs} absent(s)).`, 'success');
  };

  // Add transfer row
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

  const handleSelectAgency = (idx: number, agenceId: string) => {
    const selected = agencies.find(a => a.id === agenceId);
    if (selected) {
      handleUpdateTransfer(idx, {
        agenceId: selected.id,
        agenceNom: selected.nom,
        code: selected.code
      });
    }
  };

  const handleRemoveTransfer = (idx: number) => {
    setTransferts(prev => prev.filter((_, i) => i !== idx));
  };

  // Validation
  const validateReport = (asValid: boolean): string[] => {
    const errors: string[] = [];
    if (parseLocalDate(dateFin) < parseLocalDate(dateDebut)) {
      errors.push('La date de fin est antérieure à la date de début.');
    }
    if (asValid) {
      if (effectifTotal < 1) {
        errors.push("L'effectif total doit être renseigné.");
      }
      if (transferts.some(t => !t.agenceId || !t.exercice)) {
        errors.push('Chaque ligne de transfert doit spécifier une agence et un exercice.');
      }
      if (aEcart) {
        errors.push(`Écart de ${Math.abs(ecart)} convention(s) entre le total déclaré (${totalDeclare}) et le total calculé (${totalCalcule}).`);
      }
      // Vérification doublon de date sur rapport validé
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

  // Image attachments helpers
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
        toast('Image ajoutée avec succès au rapport.', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Objet de prévisualisation en direct
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
    groupes: initialReport?.groupes || [],
    taches,
    transferts,
    receptions,
    chronologie: initialReport?.chronologie || [],
    observations,
    totalDeclare,
    totalCalcule,
    ecart,
    statut: 'brouillon',
    version: 1,
    creePar: currentUser?.nomComplet || 'Archiviste',
    dateCreation: new Date().toISOString(),
    customStyles: {
      headerColor,
      accentColor,
      backgroundColor,
      fontScale
    },
    customFields,
    images,
    hideMatrix,
    boitesDatees: Number(boitesDatees) || 0,
    boitesNonDatees: Number(boitesNonDatees) || 0,
    boitesRecues: Number(boitesRecues) || 0,
    boitesNonTriees: Number(boitesNonTriees) || 0
  };

  // Final submit
  const handleSaveReport = (statut: 'brouillon' | 'valide') => {
    const errors = validateReport(statut === 'valide');
    if (errors.length > 0) {
      toast(errors[0], 'error');
      return;
    }

    const finalReport: DailyReport = {
      id: initialReport?.id || newId('rep'),
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
      groupes: initialReport?.groupes || [],
      taches,
      transferts,
      receptions,
      chronologie: initialReport?.chronologie || [],
      observations,
      totalDeclare,
      totalCalcule,
      ecart,
      statut,
      version: initialReport ? initialReport.version + 1 : 1,
      creePar: currentUser?.nomComplet || 'Archiviste',
      dateCreation: initialReport?.dateCreation || new Date().toISOString(),
      customStyles: {
        headerColor,
        accentColor,
        backgroundColor,
        fontScale
      },
      customFields,
      images,
      hideMatrix,
      boitesDatees: Number(boitesDatees) || 0,
      boitesNonDatees: Number(boitesNonDatees) || 0,
      boitesRecues: Number(boitesRecues) || 0,
      boitesNonTriees: Number(boitesNonTriees) || 0
    };

    onSave(finalReport);
  };

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Retour
          </button>
          <div>
            <h2>Éditeur de Rapport Journalier (R1)</h2>
            <p className="text-muted text-sm">
              Formulaire officiel conforme à l'organisation des archives UBA
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowLivePreview(true)}
            className="btn btn-outline-red btn-sm"
          >
            <Eye size={15} /> Prévisualiser le document
          </button>
          <span className="badge badge-red">Étape {step} / 5</span>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="row" style={{ borderBottom: '1px solid var(--line)', marginBottom: '24px', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { num: 1, label: '1. Période & Horaires' },
          { num: 2, label: '2. Effectif & Équipe' },
          { num: 3, label: '3. Mouvements & Boîtes' },
          { num: 4, label: '4. Personnalisation & Images' },
          { num: 5, label: '5. Certification & Enregistrement' }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`btn btn-sm ${step === s.num ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: Période & Organisation */}
      {step === 1 && (
        <div className="card">
          <h3 className="uba-section-title">Section 1 — Organisation & Horaires</h3>

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
              <label className="form-label">Plage Horaire</label>
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
                placeholder="Sélectionnez ou saisissez le nom du chef"
                value={chefNom}
                onChange={e => setChefNom(e.target.value)}
              />
              <datalist id="chefs-registered-list">
                {currentUser && <option value={currentUser.nomComplet}>{currentUser.nomComplet} (Utilisateur connecté)</option>}
                {users.filter(u => u.id !== currentUser?.id).map(u => (
                  <option key={u.id} value={u.nomComplet}>{u.nomComplet} ({u.titre || u.role})</option>
                ))}
                {teamMembers.map(m => (
                  <option key={m.id} value={m.nomOfficiel}>{m.nomOfficiel}</option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Superviseurs du Jour (séparés par virgule)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Nom 1, Nom 2"
                value={superviseurs.join(', ')}
                onChange={e => setSuperviseurs(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-primary">
              Suivant : Effectif & Équipe <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Effectif & Groupes */}
      {step === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 2 — Effectif & Répartition
            </h3>
            <button
              type="button"
              onClick={handleImportAttendance}
              className="btn btn-secondary btn-sm"
              title="Importer automatiquement les présences du jour"
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
              <label className="form-label">Présents du jour (Calculé)</label>
              <input
                type="number"
                readOnly
                className="form-input num"
                value={presents}
                style={{ backgroundColor: 'var(--surface-2)', fontWeight: 600 }}
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
              <label className="form-label">Motifs des absences</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Maladie, mission, congé"
                value={absentsMotifs}
                onChange={e => setAbsentsMotifs(e.target.value)}
              />
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Équipe affectée sur le Site Mazala</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Duskane, Placy"
                value={equipeMazala.join(', ')}
                onChange={e => setEquipeMazala(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Équipe affectée Travail sur Ordinateur</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Richy, Beni"
                value={equipeOrdinateur.join(', ')}
                onChange={e => setEquipeOrdinateur(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Suivant : Transferts & Mouvements <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Transferts & Mouvements */}
      {step === 3 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 3 — Mouvements vers Mazala
            </h3>
            <button onClick={handleAddTransfer} className="btn btn-outline-red btn-sm">
              <Plus size={15} /> + Ajouter une agence
            </button>
          </div>

          <div className="uba-table-container" style={{ marginBottom: '16px' }}>
            <table className="uba-table uba-table--cards">
              <thead>
                <tr>
                  <th>AGENCE</th>
                  <th style={{ width: '90px' }}>CODE</th>
                  <th style={{ width: '110px' }}>EXERCICE</th>
                  <th style={{ width: '130px' }}>CONVENTIONS</th>
                  <th style={{ width: '90px' }}>BOÎTES</th>
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
                      <td data-label="Agence" style={{ minWidth: '220px' }}>
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
                          placeholder="Choisir une agence..."
                        />
                      </td>
                      <td data-label="Code">
                        <input
                          type="text"
                          className="form-input num"
                          value={tr.code}
                          readOnly
                          style={{ textAlign: 'center', fontWeight: 600, backgroundColor: 'var(--surface-2)' }}
                        />
                      </td>
                      <td data-label="Exercice">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-input num"
                          value={tr.exercice}
                          onChange={e => handleUpdateTransfer(idx, { exercice: Number(e.target.value) })}
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
                          <Trash2 size={16} />
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
              gap: '20px',
              backgroundColor: 'var(--surface-2)'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div className="text-muted text-sm">Somme calculée des lignes :</div>
              <div className="num" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--brand-hi)' }}>
                {formatNumber(totalCalcule)} conventions
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <label className="text-muted text-sm" style={{ display: 'block', marginBottom: '4px' }}>Total déclaré dans le rapport :</label>
              <input
                type="number"
                inputMode="numeric"
                className="form-input num"
                style={{ width: '140px', textAlign: 'right', fontWeight: 700 }}
                value={totalDeclare}
                onChange={e => setTotalDeclare(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Nouveaux indicateurs de gestion des boîtes & cartons */}
          <div className="card" style={{ marginTop: '20px', border: '1px solid var(--line)', backgroundColor: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Package size={18} color="var(--brand-hi)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Suivi des Boîtes & Cartons du jour</h4>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              Suivant : Personnalisation & Images <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Personnalisation & Images */}
      {step === 4 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 4 — Personnalisation du Rapport & Images
            </h3>
            <button
              type="button"
              onClick={() => setShowLivePreview(true)}
              className="btn btn-outline-red btn-sm"
            >
              <Eye size={15} /> Prévisualiser avant validation
            </button>
          </div>

          {/* Styles & Couleurs */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Palette size={18} color="var(--brand-hi)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Thème & Styles d'exportation</h4>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Couleur d'en-tête (Bandeau)</label>
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
                  <option value="normal">Normale (standard UBA)</option>
                  <option value="spacious">Aérée</option>
                </select>
              </div>
            </div>

            {/* Suppression de la matrice */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hideMatrix}
                  onChange={e => setHideMatrix(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }}
                />
                <div>
                  <span style={{ fontWeight: 600 }}>Supprimer le tableau matriciel récapitulatif</span>
                  <div className="text-muted text-sm">
                    Recommandé pour un rapport épuré centré sur le journal des mouvements et les volumes du jour.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Champs personnalisés */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Champs & Mentions personnalisés</h4>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Ajouter un champ
              </button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Aucun champ personnalisé. Vous pouvez ajouter des mentions spécifiques (ex: "Numéro de bordereau", "Audit externe", etc.).
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {customFields.map(cf => (
                  <div key={cf.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Libellé du champ (ex: Réf. Bordereau)"
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
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--danger)' }}
                      title="Supprimer ce champ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images & Pièces jointes */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--brand-hi)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Photographies & Pièces jointes (Max 2 Mo/img)</h4>
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Téléverser une image
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
                Aucune image insérée. Idéal pour joindre des photos des palettes, cartons étiquetés ou décharges signées.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {images.map(img => (
                  <div
                    key={img.id}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--surface-2)'
                    }}
                  >
                    <div style={{ height: '140px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                      <img src={img.url} alt={img.caption || 'Photo rapport'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: '8px' }}>
                      <input
                        type="text"
                        className="form-input text-sm"
                        placeholder="Légende..."
                        value={img.caption || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setImages(prev => prev.map(im => im.id === img.id ? { ...im, caption: val } : im));
                        }}
                        style={{ marginBottom: '6px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-muted text-xs">Section annexe</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)', padding: '4px' }}
                          title="Supprimer la photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary">
              Suivant : Contrôle & Certification <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Contrôle & Validation */}
      {step === 5 && (
        <div className="card">
          <h3 className="uba-section-title">Section 5 — Contrôle de Cohérence & Certification</h3>

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

          {/* Récapitulatif */}
          <div className="card" style={{ backgroundColor: 'var(--surface-2)', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
              Récapitulatif avant enregistrement
            </h4>
            <div className="grid-auto text-sm text-muted">
              <div><strong style={{ color: 'var(--text-1)' }}>Période :</strong> {dateDebut} au {dateFin}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Chef d'équipe :</strong> {chefNom || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Effectif :</strong> {presents} / {effectifTotal}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Lignes d'agences :</strong> {transferts.length}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Total calculé :</strong> <span className="num" style={{ color: 'var(--brand-hi)', fontWeight: 700 }}>{formatNumber(totalCalcule)}</span></div>
              <div><strong style={{ color: 'var(--text-1)' }}>Boîtes reçues :</strong> <span className="num">{boitesRecues}</span></div>
              <div><strong style={{ color: 'var(--text-1)' }}>Images jointes :</strong> <span>{images.length}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => setStep(4)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <div className="row">
              <button
                type="button"
                onClick={() => setShowLivePreview(true)}
                className="btn btn-secondary"
              >
                <Eye size={16} /> Prévisualiser
              </button>
              <button
                type="button"
                onClick={() => handleSaveReport('brouillon')}
                className="btn btn-secondary"
              >
                <Save size={16} /> Enregistrer le brouillon
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
