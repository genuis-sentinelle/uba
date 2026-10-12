import React, { useState } from 'react';
import { DailyReport, DailyReportMouvement } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../utils/formatters';
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
  FileCheck
} from 'lucide-react';

interface DailyReportEditorProps {
  initialReport?: DailyReport | null;
  onSave: (report: DailyReport) => void;
  onCancel: () => void;
}

export const DailyReportEditor: React.FC<DailyReportEditorProps> = ({ initialReport, onSave, onCancel }) => {
  const { agencies, teamMembers, addDailyReport } = useData();
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);

  // Form State
  const [titre, setTitre] = useState(initialReport?.titre || `Rapport Journalier d'Activité — ${new Date().toLocaleDateString('fr-FR')}`);
  const [dateDebut, setDateDebut] = useState(initialReport?.dateDebut || new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(initialReport?.dateFin || new Date().toISOString().split('T')[0]);
  const [horaires, setHoraires] = useState(initialReport?.horaires || '7h30 – 16h30');
  const [chefNom, setChefNom] = useState(initialReport?.chefNom || 'Thony Obaki');
  const [superviseurs, setSuperviseurs] = useState<string[]>(initialReport?.superviseurs || ['Yoka', 'Foundou Fredich']);

  const [presents, setPresents] = useState<number>(initialReport?.presents || 19);
  const [effectifTotal, setEffectifTotal] = useState<number>(initialReport?.effectifTotal || 19);
  const [absents, setAbsents] = useState<number>(initialReport?.absents || 0);

  const [equipeMazala, setEquipeMazala] = useState<string[]>(initialReport?.equipeMazala || ['Duskane', 'Placy']);
  const [equipeOrdinateur, setEquipeOrdinateur] = useState<string[]>(initialReport?.equipeOrdinateur || ['Richy', 'Beni']);

  const [transferts, setTransferts] = useState<DailyReportMouvement[]>(initialReport?.transferts || [
    { id: '1', agenceId: 'ag-904', agenceNom: 'Bacongo', code: '904', exercice: 2017, conventions: 1322, boites: 12, traitement: 'Trié' },
    { id: '2', agenceId: 'ag-902', agenceNom: 'Poto-Poto', code: '902', exercice: 2018, conventions: 741, boites: 8, traitement: 'Mis de côté' },
    { id: '3', agenceId: 'ag-907', agenceNom: 'Moungali', code: '907', exercice: 2019, conventions: 3550, boites: 25, traitement: 'Transmis' }
  ]);

  const [totalDeclare, setTotalDeclare] = useState<number>(initialReport?.totalDeclare || 5613);

  const [taches, setTaches] = useState(initialReport?.taches || [
    { numero: 1, titre: 'Purification de l\'espace de travail', horaire: '07h30 – 08h00', description: 'Nettoyage des allées, évacuation des cartons vides' },
    { numero: 2, titre: 'Checking et comptage des liasses', horaire: '08h00 – 12h00', description: 'Contrôle minutieux de conformité' },
    { numero: 3, titre: 'Transfert vers site Mazala', horaire: '14h00 – 16h30', description: 'Conditionnement sécurisé' }
  ]);

  const [receptions, setReceptions] = useState(initialReport?.receptions || [
    { id: '1', description: 'Cartons de régularisation Bacongo', boites: 85, provenance: 'Site Mazala', statut: 'Reçu' }
  ]);

  const [observations, setObservations] = useState(initialReport?.observations || [
    { point: 'Conditionnement', constat: 'Bon état général des boîtes d\'archives répertoriées', estIncident: false }
  ]);

  // Dynamic calculations
  const totalCalcule = transferts.reduce((sum, t) => sum + (Number(t.conventions) || 0), 0);
  const ecart = totalDeclare - totalCalcule;
  const aEcart = ecart !== 0;

  // Add transfer row
  const handleAddTransfer = () => {
    const newTr: DailyReportMouvement = {
      id: `tr-${Date.now()}`,
      agenceId: agencies[0]?.id || 'ag-901',
      agenceNom: agencies[0]?.nom || 'City-Center',
      code: agencies[0]?.code || '901',
      exercice: 2019,
      conventions: 0,
      boites: 0,
      traitement: 'Trié'
    };
    setTransferts([...transferts, newTr]);
  };

  const handleUpdateTransfer = (idx: number, field: keyof DailyReportMouvement, value: any) => {
    const updated = [...transferts];
    if (field === 'agenceNom') {
      const selected = agencies.find(a => a.nom === value);
      if (selected) {
        updated[idx].agenceId = selected.id;
        updated[idx].agenceNom = selected.nom;
        updated[idx].code = selected.code;
      }
    } else {
      (updated[idx] as any)[field] = value;
    }
    setTransferts(updated);
  };

  const handleRemoveTransfer = (idx: number) => {
    setTransferts(transferts.filter((_, i) => i !== idx));
  };

  // Final submit
  const handleFinalSave = () => {
    const finalReport: DailyReport = {
      id: initialReport?.id || `rep-${Date.now()}`,
      titre,
      dateDebut,
      dateFin,
      horaires,
      chefNom,
      superviseurs,
      effectifTotal,
      presents,
      absents,
      equipeMazala,
      equipeOrdinateur,
      groupes: [
        { nom: 'Groupe 1', membres: ['Yoka', 'Parfait', 'Lauria', 'Déo'], tachesAssignees: 'Comptage & Vérification' },
        { nom: 'Groupe 2', membres: ['Foundou Fredich', 'Christ', 'Gaston'], tachesAssignees: 'Classement & Conditionnement' },
        { nom: 'Groupe Mazala', membres: equipeMazala, tachesAssignees: 'Réception & Stockage sécurisé' }
      ],
      taches,
      transferts,
      receptions,
      chronologie: [
        { heure: '07h30', evenement: 'Appel et prise de service' },
        { heure: '12h00', evenement: 'Pointage intermédiaire' },
        { heure: '16h30', evenement: 'Clôture et consolidation' }
      ],
      observations,
      totalDeclare,
      totalCalcule,
      ecart,
      statut: 'valide',
      version: initialReport ? initialReport.version + 1 : 1,
      creePar: currentUser?.nomComplet || 'Archiviste',
      dateCreation: new Date().toISOString()
    };

    onSave(finalReport);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={onCancel} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Retour à la liste
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', margin: 0 }}>
            Éditeur de Rapport Journalier (R1)
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Formulaire guidé conforme au modèle officiel UBA en 9 sections
          </span>
        </div>
        <div style={{ width: '120px', textAlign: 'right' }}>
          <span className="badge badge-red">Étape {step} / 4</span>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #E5E7EB',
        marginBottom: '24px',
        background: '#FFFFFF',
        borderRadius: '8px 8px 0 0',
        padding: '8px 12px 0'
      }}>
        {[
          { num: 1, label: '1. Période & Organisation' },
          { num: 2, label: '2. Effectif & Groupes' },
          { num: 3, label: '3. Transferts & Mouvements' },
          { num: 4, label: '4. Contrôle & Validation' }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: step === s.num ? '3px solid #E41E26' : '3px solid transparent',
              background: 'transparent',
              fontWeight: step === s.num ? 800 : 500,
              color: step === s.num ? '#E41E26' : '#6B7280',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: Période & Organisation */}
      {step === 1 && (
        <div className="card" style={{ padding: '24px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Date Début (relevé)</label>
              <input
                type="date"
                className="form-input"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date Fin (si sur 2 jours)</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Chef d'équipe des Archives</label>
              <input
                type="text"
                className="form-input"
                value={chefNom}
                onChange={e => setChefNom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Superviseurs du Jour (séparés par virgule)</label>
              <input
                type="text"
                className="form-input"
                value={superviseurs.join(', ')}
                onChange={e => setSuperviseurs(e.target.value.split(',').map(s => s.trim()))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-primary">
              Suivant : Effectif & Groupes <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Effectif & Groupes */}
      {step === 2 && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="uba-section-title">Section 2 — Effectif & Répartition de l'Équipe</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Effectif Total Attendu</label>
              <input
                type="number"
                className="form-input"
                value={effectifTotal}
                onChange={e => setEffectifTotal(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Présents du jour</label>
              <input
                type="number"
                className="form-input"
                value={presents}
                onChange={e => setPresents(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Absents</label>
              <input
                type="number"
                className="form-input"
                value={absents}
                onChange={e => setAbsents(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Équipe affectée sur le Site Mazala</label>
              <input
                type="text"
                className="form-input"
                value={equipeMazala.join(', ')}
                onChange={e => setEquipeMazala(e.target.value.split(',').map(s => s.trim()))}
              />
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Ex: Duskane, Placy</span>
            </div>
            <div className="form-group">
              <label className="form-label">Équipe affectée Travail sur Ordinateur</label>
              <input
                type="text"
                className="form-input"
                value={equipeOrdinateur.join(', ')}
                onChange={e => setEquipeOrdinateur(e.target.value.split(',').map(s => s.trim()))}
              />
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Ex: Richy, Beni</span>
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
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="uba-section-title" style={{ margin: 0 }}>
              Section 3 — Mouvements vers Mazala
            </h3>
            <button onClick={handleAddTransfer} className="btn btn-outline-red btn-sm">
              <Plus size={15} /> + Ajouter une agence
            </button>
          </div>

          <table className="uba-table" style={{ marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>AGENCE</th>
                <th style={{ width: '90px' }}>CODE</th>
                <th style={{ width: '100px' }}>EXERCICE</th>
                <th style={{ width: '130px' }}>CONVENTIONS</th>
                <th style={{ width: '90px' }}>BOÎTES</th>
                <th>TRAITEMENT</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {transferts.map((tr, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="form-select"
                      value={tr.agenceNom}
                      onChange={e => handleUpdateTransfer(idx, 'agenceNom', e.target.value)}
                    >
                      {agencies.map(ag => (
                        <option key={ag.id} value={ag.nom}>{ag.nom} (Code {ag.code})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      value={tr.code}
                      readOnly
                      style={{ backgroundColor: '#F9FAFB', textAlign: 'center', fontWeight: 700 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={tr.exercice}
                      onChange={e => handleUpdateTransfer(idx, 'exercice', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={tr.conventions}
                      onChange={e => handleUpdateTransfer(idx, 'conventions', Number(e.target.value))}
                      style={{ fontWeight: 800, color: '#E41E26', textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      value={tr.boites}
                      onChange={e => handleUpdateTransfer(idx, 'boites', Number(e.target.value))}
                      style={{ textAlign: 'right' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      value={tr.traitement}
                      onChange={e => handleUpdateTransfer(idx, 'traitement', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveTransfer(idx)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Somme dynamique & total déclaré */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '24px',
            backgroundColor: '#FDF1F1',
            padding: '12px 18px',
            borderRadius: '6px',
            border: '1px solid #F8B4B7'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Somme calculée des lignes :</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#E41E26' }}>
                {formatNumber(totalCalcule)} conventions
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Total déclaré dans le texte :</label>
              <input
                type="number"
                className="form-input"
                style={{ width: '130px', textAlign: 'right', fontWeight: 800 }}
                value={totalDeclare}
                onChange={e => setTotalDeclare(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              Suivant : Contrôle de Cohérence <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Contrôle & Validation */}
      {step === 4 && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="uba-section-title">Section 4 — Contrôle de Cohérence & Certification</h3>

          {/* Contrôle qualité bloquant */}
          {aEcart ? (
            <div style={{
              backgroundColor: 'rgba(227, 30, 36, 0.12)',
              border: '2px solid var(--uba-red)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <AlertTriangle size={32} color="var(--uba-red-bright)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--uba-red-bright)', fontSize: '1rem' }}>
                  Validation bloquée : Total déclaré ({formatNumber(totalDeclare)}) ≠ Somme calculée ({formatNumber(totalCalcule)})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--uba-silver-light)', marginTop: '4px' }}>
                  Écart comptable constaté de <strong style={{ color: '#FFFFFF' }}>{formatNumber(Math.abs(ecart))} conventions</strong>. Conformément aux règles d'audit, la certification requiert un écart nul.
                </div>
                <button
                  onClick={() => setTotalDeclare(totalCalcule)}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '10px' }}
                >
                  <Check size={14} /> Aligner automatiquement sur {formatNumber(totalCalcule)} conventions
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={26} color="#10B981" />
              <div>
                <div style={{ fontWeight: 800, color: '#34D399' }}>
                  Contrôle Qualité Validé : Zéro écart !
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--uba-silver-light)' }}>
                  Le total déclaré est strictement certifié conforme à la somme des {transferts.length} agences ({formatNumber(totalCalcule)} conventions).
                </div>
              </div>
            </div>
          )}

          {/* Quick Recap */}
          <div style={{
            border: '1px solid var(--hairline-strong)',
            borderRadius: '6px',
            padding: '16px',
            backgroundColor: 'var(--surface-1)',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '8px' }}>
              Récapitulatif certifié avant publication
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem', color: 'var(--text-2)' }}>
              <div><strong style={{ color: 'var(--text-1)' }}>Période :</strong> {dateDebut} au {dateFin}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Chef d'équipe :</strong> {chefNom}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Effectif :</strong> {presents} / {effectifTotal}</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Lots d'agences :</strong> {transferts.length} traités</div>
              <div><strong style={{ color: 'var(--text-1)' }}>Total certifié :</strong> <span className="num" style={{ color: 'var(--uba-red-bright)', fontWeight: 800 }}>{formatNumber(totalCalcule)}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <ArrowLeft size={16} /> Précédent
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {aEcart && (
                <span style={{ fontSize: '0.8rem', color: 'var(--uba-red-bright)' }}>
                  Veuillez résorber l'écart avant de certifier
                </span>
              )}
              <button
                onClick={handleFinalSave}
                disabled={aEcart}
                className="btn btn-primary"
                style={{ opacity: aEcart ? 0.5 : 1, cursor: aEcart ? 'not-allowed' : 'pointer' }}
              >
                <FileCheck size={18} /> Valider & Générer le Rapport Officiel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
