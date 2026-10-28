import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../ui/Feedback';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { todayLocal } from '../../utils/dates';
import { can } from '../../utils/permissions';
import {
  Download,
  Printer,
  Sparkles,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Edit2,
  Archive,
  RotateCcw
} from 'lucide-react';

export const SynthesisView: React.FC = () => {
  const {
    synthesisReports,
    compileSynthesisFromReports,
    updateSynthesisReport,
    archiveDocument,
    unarchiveDocument
  } = useData();
  const { currentUser } = useAuth();
  const { toast, confirm } = useFeedback();

  const isStagiaire = currentUser?.role === 'stagiaire';
  const [selectedReportId, setSelectedReportId] = useState<string>(() => {
    return synthesisReports[0]?.id || '';
  });

  const [activeMode, setActiveMode] = useState<'chef_confidentiel' | 'equipe_public'>(
    isStagiaire ? 'equipe_public' : 'chef_confidentiel'
  );
  const [showCompilerModal, setShowCompilerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitre, setEditTitre] = useState('');
  const [editTraites, setEditTraites] = useState(0);
  const [editAttente, setEditAttente] = useState(0);
  const [editBoites, setEditBoites] = useState(0);
  const [editPoints, setEditPoints] = useState('');
  // Suppression de la matrice par défaut selon spécifications
  const [hideMatrix, setHideMatrix] = useState<boolean>(true);

  // Dynamic default dates for current month
  const [dateDebutCompil, setDateDebutCompil] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateFinCompil, setDateFinCompil] = useState(todayLocal());

  const currentSynthesis = synthesisReports.find(s => s.id === selectedReportId) || synthesisReports[0];

  const openEditModal = () => {
    if (!currentSynthesis) return;
    setEditTitre(currentSynthesis.titre);
    setEditTraites(currentSynthesis.dossiersTraites);
    setEditAttente(currentSynthesis.dossiersEnAttente);
    setEditBoites(currentSynthesis.boitesTotal);
    setEditPoints((currentSynthesis.pointsAConfirmer || []).join('\n'));
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSynthesis) return;
    const totalGlobal = Number(editTraites) + Number(editAttente);
    const updated = {
      ...currentSynthesis,
      titre: editTitre,
      dossiersTraites: Number(editTraites),
      dossiersEnAttente: Number(editAttente),
      totalGlobal,
      boitesTotal: Number(editBoites),
      pointsAConfirmer: editPoints.split('\n').map(p => p.trim()).filter(Boolean)
    };
    updateSynthesisReport(updated);
    toast('Synthèse mise à jour avec succès.', 'success');
    setShowEditModal(false);
  };

  const handleDownloadPdf = async () => {
    if (isStagiaire) {
      toast('Export PDF non autorisé pour ce profil (Lecture Seule).', 'error');
      return;
    }
    if (!currentSynthesis) return;
    const filename = activeMode === 'chef_confidentiel'
      ? `Synthese_Archives_UBA_CHEF_${currentSynthesis.dateDebut}_${currentSynthesis.dateFin}`
      : `Synthese_Archives_UBA_EQUIPE_${currentSynthesis.dateDebut}_${currentSynthesis.dateFin}`;

    toast('Génération du PDF en cours...', 'info');
    const ok = await exportElementToPdf('synthesis-printable-doc', filename, currentUser?.role);
    if (ok) {
      toast('Document PDF généré et téléchargé.', 'success');
    } else {
      toast('Échec de la génération directe. Utilisez l\'impression (Enregistrer en PDF).', 'error');
    }
  };

  const handleExportWord = () => {
    if (isStagiaire) {
      toast('Export Word non autorisé pour ce profil (Lecture Seule).', 'error');
      return;
    }
    if (!currentSynthesis) return;
    const element = document.getElementById('synthesis-printable-doc');
    if (!element) return;

    // Clean white document for Word (A4 style, dark text, no dark theme inversion)
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Synthèse Archives UBA</title>
<style>
  body { font-family: Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 20px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { border: 1px solid #d0d0d0; padding: 6px 10px; font-size: 10pt; }
  th { background-color: #E41E26; color: #ffffff; }
  .badge { border: 1px solid #999; padding: 2px 6px; }
</style>
</head>
<body>`;
    const footer = `</body></html>`;
    const sourceHTML = header + element.innerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synthese_UBA_${currentSynthesis.dateDebut}_${currentSynthesis.dateFin}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Document Word généré avec succès.', 'success');
  };

  const handlePrint = () => {
    if (isStagiaire) {
      toast('Impression non autorisée pour ce profil (Lecture Seule).', 'error');
      return;
    }
    window.print();
  };

  const handleCompile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = compileSynthesisFromReports(dateDebutCompil, dateFinCompil, activeMode);
    if (res.success) {
      if (res.reportId) setSelectedReportId(res.reportId);
      toast(res.message, 'success');
      setShowCompilerModal(false);
    } else {
      toast(res.message, 'error');
    }
  };

  const handleArchive = async () => {
    if (!currentSynthesis) return;
    const ok = await confirm({
      title: 'Archiver cette synthèse ?',
      message: `Voulez-vous archiver la synthèse "${currentSynthesis.titre}" ? Une fois archivée, elle deviendra immuable (non modifiable).`,
      confirmLabel: 'Archiver'
    });
    if (ok) {
      const note = window.prompt('Note ou motif d\'archivage (optionnel) :') || undefined;
      const res = await archiveDocument('synthesis', currentSynthesis.id, note);
      if (res.success) {
        toast('Synthèse archivée avec succès.', 'success');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const handleUnarchive = async () => {
    if (!currentSynthesis) return;
    const ok = await confirm({
      title: 'Désarchiver cette synthèse ?',
      message: `Restaurer la synthèse "${currentSynthesis.titre}" dans les synthèses actives ?`,
      confirmLabel: 'Désarchiver'
    });
    if (ok) {
      const res = await unarchiveDocument('synthesis', currentSynthesis.id);
      if (res.success) {
        toast('Synthèse restaurée dans les actives avec succès.', 'success');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  return (
    <div className="page">
      {/* Header & Controls */}
      <div className="page-head no-print">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>Synthèse d'Activité des Archives</h1>
            {currentSynthesis?.archived && (
              <span
                className="badge"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.2)',
                  color: '#F87171',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 800
                }}
              >
                <Archive size={12} /> ARCHIVÉ
              </span>
            )}
          </div>
          {currentSynthesis && (
            <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
              Période officielle du {formatDate(currentSynthesis.dateDebut)} au {formatDate(currentSynthesis.dateFin)}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Multiple reports selector if more than 1 */}
          {synthesisReports.length > 1 && (
            <select
              className="form-select"
              value={selectedReportId}
              onChange={e => setSelectedReportId(e.target.value)}
              style={{ width: 'auto', minWidth: '200px' }}
            >
              {synthesisReports.map(s => (
                <option key={s.id} value={s.id}>
                  {s.archived ? '[ARCHIVÉ] ' : ''}{s.titre} ({formatDate(s.dateDebut)} - {formatDate(s.dateFin)})
                </option>
              ))}
            </select>
          )}

          {/* Dual Mode Switcher */}
          <div className="card" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => {
                if (isStagiaire) {
                  toast("Accès confidentiel réservé au Chef d'équipe et aux administrateurs.", 'error');
                  return;
                }
                setActiveMode('chef_confidentiel');
              }}
              className={`btn btn-sm ${activeMode === 'chef_confidentiel' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: '34px' }}
            >
              Confidentiel (Chef)
            </button>
            <button
              onClick={() => setActiveMode('equipe_public')}
              className={`btn btn-sm ${activeMode === 'equipe_public' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: '34px' }}
            >
              Équipe (Stagiaires)
            </button>
          </div>

          {/* Bouton pour afficher/masquer la matrice */}
          {currentSynthesis && (
            <button
              onClick={() => setHideMatrix(!hideMatrix)}
              className={`btn btn-sm ${hideMatrix ? 'btn-secondary' : 'btn-outline-red'}`}
              title={hideMatrix ? "Afficher le tableau matriciel récapitulatif" : "Masquer la section matricielle"}
            >
              {hideMatrix ? "Matrice masquée" : "Matrice affichée"}
            </button>
          )}

          {currentSynthesis?.archived ? (
            can.unarchive(currentUser?.role) && (
              <button
                onClick={handleUnarchive}
                className="btn btn-secondary btn-sm"
                title="Désarchiver la synthèse (Restaurer dans les actives)"
              >
                <RotateCcw size={15} /> Désarchiver
              </button>
            )
          ) : (
            <>
              {!isStagiaire && currentSynthesis && (
                <button
                  onClick={openEditModal}
                  className="btn btn-secondary btn-sm"
                  title="Modifier directement les données de la synthèse"
                >
                  <Edit2 size={15} /> Modifier
                </button>
              )}
              {can.archive(currentUser?.role) && currentSynthesis && (
                <button
                  onClick={handleArchive}
                  className="btn btn-secondary btn-sm"
                  title="Archiver cette synthèse (Scellement immuable)"
                >
                  <Archive size={15} /> Archiver
                </button>
              )}
            </>
          )}

          {!isStagiaire && (
            <button
              onClick={() => setShowCompilerModal(true)}
              className="btn btn-ai ai-border btn-sm"
            >
              <Sparkles size={15} /> Compiler une synthèse
            </button>
          )}

          {currentSynthesis && (
            <>
              <button
                onClick={handlePrint}
                className="btn btn-secondary btn-sm"
                disabled={isStagiaire}
                title={isStagiaire ? "Impression réservée aux administrateurs" : "Imprimer le document A4 officiel"}
              >
                <Printer size={15} /> Imprimer
              </button>
              <button
                onClick={handleDownloadPdf}
                className="btn btn-secondary btn-sm"
                disabled={isStagiaire}
                title={isStagiaire ? "Export PDF réservé aux administrateurs" : "Télécharger en PDF"}
              >
                <Download size={15} /> PDF
              </button>
              <button
                onClick={handleExportWord}
                className="btn btn-secondary btn-sm"
                disabled={isStagiaire}
                title={isStagiaire ? "Export Word réservé aux administrateurs" : "Exporter au format Word"}
              >
                <FileCode size={15} /> Word
              </button>
            </>
          )}
        </div>
      </div>

      {!currentSynthesis ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '16px' }}>
            Aucune synthèse n'est encore enregistrée pour cette période.
          </p>
          {!isStagiaire && (
            <button onClick={() => setShowCompilerModal(true)} className="btn btn-primary">
              <Sparkles size={16} /> Compiler automatiquement depuis les rapports
            </button>
          )}
        </div>
      ) : (
        /* Printable A4 Document with clean white .doc-light theme */
        <div
          id="synthesis-printable-doc"
          className="doc-light card"
          style={{
            maxWidth: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: 'clamp(16mm, 4vw, 20mm)',
            backgroundColor: '#ffffff',
            color: '#111111',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-2)',
            fontFamily: 'var(--font-sans)',
            fontSize: '9.5pt',
            lineHeight: 1.45
          }}
        >
          {/* BANDEAU EN-TÊTE ROUGE UBA */}
          <div style={{
            backgroundColor: 'var(--brand)',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                RAPPORT DE SYNTHÈSE DES ARCHIVES UBA
              </div>
              <div style={{ fontSize: '8.5pt', opacity: 0.95, marginTop: '2px', color: '#ffffff' }}>
                PÉRIODE : DU {formatDate(currentSynthesis.dateDebut)} AU {formatDate(currentSynthesis.dateFin)} · MAYA-MAYA & MAZALA
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '15pt',
                fontWeight: 900,
                border: '2px solid #ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'inline-block',
                color: '#ffffff'
              }}>
                UBA
              </div>
              {activeMode === 'chef_confidentiel' && (
                <div style={{
                  marginTop: '4px',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  fontSize: '6.5pt',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '2px'
                }}>
                  CONFIDENTIEL — DIRECTION
                </div>
              )}
            </div>
          </div>

          {/* ALERTE JOURS OUVRÉS MANQUANTS (Uniquement mode chef) */}
          {activeMode === 'chef_confidentiel' && currentSynthesis.joursManquants && currentSynthesis.joursManquants.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '8px 14px',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={18} color="#DC2626" />
              <div style={{ fontSize: '8.5pt', color: '#991B1B' }}>
                <strong>{currentSynthesis.joursManquants.length} jour(s) ouvré(s) sans rapport validé</strong> sur la période : {currentSynthesis.joursManquants.map(j => formatDate(j)).join(', ')}.
              </div>
            </div>
          )}

          {/* 1. INFORMATIONS GÉNÉRALES */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5pt', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              1. INFORMATIONS GÉNÉRALES
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Structure</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>United Bank for Africa (UBA)</td>
                  <td style={{ width: '22%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Service</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>Archives / Équipe archiviste</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Rapporteur</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111', fontWeight: 700 }}>{currentSynthesis.creePar || currentUser?.nomComplet || 'Chef Archiviste'}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Période couverte</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>Du {formatDate(currentSynthesis.dateDebut)} au {formatDate(currentSynthesis.dateFin)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Jours ouvrés couverts</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111', fontWeight: 700 }}>{currentSynthesis.joursCouverts} jour(s)</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Date d'édition</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{formatDate(currentSynthesis.dateCreation.split('T')[0])}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Statut</td>
                  <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>
                    <strong style={{ color: 'var(--brand)' }}>Définitif</strong> {activeMode === 'chef_confidentiel' && '(Volet Confidentiel Direction)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. RÉSUMÉ GÉNÉRAL DES ACTIVITÉS */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5pt', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              2. RÉSUMÉ GÉNÉRAL DES ACTIVITÉS
            </div>
            <p style={{ fontSize: '8pt', color: '#6B7280', margin: '0 0 8px 0', fontStyle: 'italic' }}>
              Trois indicateurs essentiels du traitement réalisé sur la période.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--brand)', color: '#ffffff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--brand)', width: '70%', color: '#ffffff' }}>INDICATEUR MAJEUR</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid var(--brand)', width: '30%', color: '#ffffff' }}>QUANTITÉ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>
                    Dossiers traités ou transmis (sur la période)
                  </td>
                  <td className="num" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 800, color: 'var(--brand)', fontSize: '10.5pt' }}>
                    {formatNumber(currentSynthesis.dossiersTraites)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>
                    Dossiers en attente globale restante
                  </td>
                  <td className="num" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 700, color: '#4B5563', fontSize: '10.5pt' }}>
                    {formatNumber(currentSynthesis.dossiersEnAttente)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#F9FAFB', borderTop: '2px solid var(--brand)' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #E5E7EB', fontWeight: 800, color: '#111111' }}>
                    TOTAL GÉNÉRAL
                  </td>
                  <td className="num" style={{ padding: '8px 12px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 900, color: '#111111', fontSize: '11pt' }}>
                    {formatNumber(currentSynthesis.totalGlobal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. AVANCEMENT PAR AGENCE */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5pt', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              3. AVANCEMENT PAR AGENCE
            </div>

              <div className="uba-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--red)', color: '#FFFFFF' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>AGENCE</th>
                      <th style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>CODE</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>TRAITÉ</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>EN ATTENTE</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>TOTAL</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>TAUX</th>
                    </tr>
                  </thead>
                <tbody>
                  {currentSynthesis.repartitionAgences.map((ag, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                      <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', fontWeight: 600, color: '#111111' }}>{ag.nom}</td>
                      <td className="num" style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E5E7EB', color: '#6B7280' }}>{ag.code}</td>
                      <td className="num" style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 700, color: 'var(--brand)' }}>
                        {formatNumber(ag.traite)}
                      </td>
                      <td className="num" style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E5E7EB', color: '#4B5563' }}>
                        {formatNumber(ag.attente)}
                      </td>
                      <td className="num" style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 600, color: '#111111' }}>
                        {formatNumber(ag.total)}
                      </td>
                      <td className="num" style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>
                        {ag.taux}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. MATRICE STATUT OU VOLUMÉTRIQUE PAR EXERCICE (Supprimée par défaut selon spécifications) */}
          {!hideMatrix && currentSynthesis.matrice && currentSynthesis.matrice.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              {(() => {
                const isNumericMatrix = currentSynthesis.matrice.some(r =>
                  Object.values(r.annees).some(v => v !== 'T' && v !== 'A' && v !== 'O' && v !== '-' && v !== '—' && v !== '')
                );
                const yearsList = Object.keys(currentSynthesis.matrice[0]?.annees || {});

                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5pt', fontWeight: 700, color: '#111111' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
                        {isNumericMatrix
                          ? '4. TABLEAU RÉCAPITULATIF PAR AGENCE ET PAR ANNÉE'
                          : '4. MATRICE STATUT PAR EXERCICE (T / A / O)'}
                      </div>
                      <div style={{ fontSize: '7.5pt', display: 'flex', gap: '10px', fontWeight: 700 }}>
                        {isNumericMatrix ? (
                          <span style={{ color: '#6B7280', fontStyle: 'italic' }}>« — » : Aucun dossier (case barrée manuscrite)</span>
                        ) : (
                          <>
                            <span><strong style={{ color: 'var(--brand)' }}>● T</strong> = Traité</span>
                            <span><strong style={{ color: '#4B5563' }}>● A</strong> = En Attente</span>
                            <span><strong style={{ color: 'var(--red)' }}>● O</strong> = Oublié</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="uba-table-container uba-table--scroll">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'center' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--red)', color: '#FFFFFF' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', width: '140px', position: 'sticky', left: 0, backgroundColor: 'var(--red)', color: '#FFFFFF' }}>
                              AGENCE
                            </th>
                            {yearsList.map(yr => (
                              <th key={yr} style={{ padding: '6px', color: '#FFFFFF' }}>{yr}</th>
                            ))}
                            {isNumericMatrix && (
                              <th style={{ padding: '6px 8px', textAlign: 'right', color: '#FFFFFF', width: '80px' }}>TOTAL</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {currentSynthesis.matrice.map((row, idx) => {
                            const rowNumericTotal = isNumericMatrix
                              ? Object.values(row.annees).reduce((sum, v) => {
                                  const num = parseInt(String(v).replace(/\s/g, ''), 10);
                                  return sum + (isNaN(num) ? 0 : num);
                                }, 0)
                              : 0;

                            return (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                                <td style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, border: '1px solid #E5E7EB', position: 'sticky', left: 0, backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                                  {row.agenceNom} <span style={{ color: '#9CA3AF', fontSize: '7pt' }}>({row.code})</span>
                                </td>
                                {yearsList.map(yr => {
                                  const st = row.annees[Number(yr)] ?? '—';
                                  let bg = '#F3F4F6';
                                  let color = '#4B5563';

                                  if (st === 'T') {
                                    bg = 'var(--brand)';
                                    color = '#ffffff';
                                  } else if (st === 'A') {
                                    bg = '#E5E7EB';
                                    color = '#111111';
                                  } else if (st === 'O') {
                                    bg = '#DC2626';
                                    color = '#ffffff';
                                  } else if (st !== '-' && st !== '—' && st !== '0') {
                                    bg = 'rgba(228, 30, 38, 0.08)';
                                    color = 'var(--brand)';
                                  }

                                  return (
                                    <td key={yr} style={{ padding: '4px', border: '1px solid #E5E7EB' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        minWidth: isNumericMatrix ? '26px' : '18px',
                                        padding: isNumericMatrix ? '2px 5px' : '0',
                                        height: '18px',
                                        lineHeight: '18px',
                                        borderRadius: '3px',
                                        backgroundColor: bg,
                                        color,
                                        fontWeight: 700,
                                        fontSize: '7.5pt',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {st}
                                      </span>
                                    </td>
                                  );
                                })}
                                {isNumericMatrix && (
                                  <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 800, color: 'var(--brand)' }}>
                                    {formatNumber(rowNumericTotal)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}

                          {/* Ligne TOTAL PAR ANNÉE si matrice numérique */}
                          {isNumericMatrix && (
                            <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 900, borderTop: '2px solid var(--brand)' }}>
                              <td style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid #E5E7EB', position: 'sticky', left: 0, backgroundColor: '#F3F4F6', color: '#111111' }}>
                                TOTAL PAR ANNÉE
                              </td>
                              {yearsList.map(yr => {
                                const colTotal = currentSynthesis.matrice.reduce((sum, r) => {
                                  const num = parseInt(String(r.annees[Number(yr)] || '').replace(/\s/g, ''), 10);
                                  return sum + (isNaN(num) ? 0 : num);
                                }, 0);
                                return (
                                  <td key={yr} style={{ padding: '6px', textAlign: 'center', border: '1px solid #E5E7EB', color: 'var(--brand)', fontWeight: 800 }}>
                                    {colTotal > 0 ? formatNumber(colTotal) : '—'}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E5E7EB', color: 'var(--brand)', fontSize: '9pt', fontWeight: 900 }}>
                                {formatNumber(currentSynthesis.totalGlobal)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* 5. POINTS CRITIQUES / OBSERVATIONS */}
          <div style={{
            border: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ fontWeight: 700, fontSize: '9pt', color: 'var(--brand)', marginBottom: '6px' }}>
              {activeMode === 'chef_confidentiel' ? 'POINTS DE GOUVERNANCE & CONFORMITÉ' : 'AVANCEMENT GÉNÉRAL'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8.5pt', color: '#374151', lineHeight: 1.5 }}>
              {currentSynthesis.pointsAConfirmer.map((pt, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>{pt}</li>
              ))}
            </ul>
          </div>

          {/* 6. SIGNATURES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '20px',
            borderTop: '1px solid #E5E7EB',
            paddingTop: '14px'
          }}>
            <div style={{ fontSize: '8pt', color: '#6B7280' }}>
              Compilé par : <strong style={{ color: '#111111' }}>{currentSynthesis.creePar}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8.5pt', fontWeight: 700, color: '#111111' }}>
                {currentSynthesis.creePar.toLowerCase().includes('stagiaire')
                  ? 'VALIDATION DES STAGIAIRES ARCHIVISTES'
                  : "LE CHEF D'ÉQUIPE DES ARCHIVES"}
              </div>
              <div style={{ fontSize: '9pt', color: 'var(--brand)', fontWeight: 700, marginTop: '16px' }}>
                {currentSynthesis.creePar.toLowerCase().includes('stagiaire')
                  ? (currentUser?.nomComplet || currentSynthesis.creePar)
                  : 'Thony OBAKI'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compiler */}
      {showCompilerModal && (
        <div className="modal-overlay" onClick={() => setShowCompilerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--brand-hi)" />
                <h3 style={{ margin: 0 }}>Compilateur Automatique</h3>
              </div>
              <button onClick={() => setShowCompilerModal(false)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
            </div>

            <p className="text-muted text-sm" style={{ marginBottom: '18px' }}>
              Sélectionnez une période. Les calculs agrègent l'intégralité des rapports journaliers validés et déduisent les conventions traitées de l'attente globale.
            </p>

            <form onSubmit={handleCompile}>
              <div className="grid-2" style={{ marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label">Date Début *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateDebutCompil}
                    onChange={e => setDateDebutCompil(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date Fin *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateFinCompil}
                    onChange={e => setDateFinCompil(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCompilerModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Sparkles size={15} /> Lancer la compilation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Éditer la Synthèse */}
      {showEditModal && currentSynthesis && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="var(--red)" />
                <h3 style={{ margin: 0 }}>Modifier la Synthèse Opérationnelle</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
            </div>

            <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
              Modifiez les chiffres et observations clés. Les modifications sont sauvegardées immédiatement en base de données et synchronisées en backend.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Titre de la Synthèse *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitre}
                  onChange={e => setEditTitre(e.target.value)}
                  required
                />
              </div>

              <div className="grid-3" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Dossiers Traités *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editTraites}
                    onChange={e => setEditTraites(Number(e.target.value))}
                    required
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dossiers en Attente *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editAttente}
                    onChange={e => setEditAttente(Number(e.target.value))}
                    required
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Boîtes Total *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editBoites}
                    onChange={e => setEditBoites(Number(e.target.value))}
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Points d'attention & Observations (1 par ligne)</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={editPoints}
                  onChange={e => setEditPoints(e.target.value)}
                  placeholder="Inscrivez les observations clés, une par ligne..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <CheckCircle2 size={15} /> Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
