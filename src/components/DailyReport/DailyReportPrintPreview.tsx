import React, { useRef, useState } from 'react';
import { DailyReport } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, ZoomIn, ZoomOut, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';

interface DailyReportPrintPreviewProps {
  report: DailyReport;
  onClose: () => void;
}

export const DailyReportPrintPreview: React.FC<DailyReportPrintPreviewProps> = ({ report, onClose }) => {
  const { currentUser } = useAuth();
  const canPrintDoc = can.print(currentUser?.role);
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(report.orientation || 'portrait');

  const handleDownloadPdf = async () => {
    if (!canPrintDoc) return;
    await exportElementToPdf(
      'daily-report-printable-doc',
      `Rapport_Journalier_UBA_${report.dateDebut}_${report.dateFin}`,
      currentUser?.role
    );
  };

  const handlePrint = () => {
    if (!canPrintDoc) return;
    window.print();
  };

  const headerBg = report.customStyles?.headerColor || 'var(--brand)';
  const accentBg = report.customStyles?.accentColor || 'var(--brand)';
  const docBg = report.customStyles?.backgroundColor || '#FFFFFF';
  const effectiveChef = report.chefNom || 'Thony OBAKI';

  const distinctYears = Array.from(new Set(report.transferts.map(t => t.exercice))).sort((a, b) => a - b);
  const isMultiYearReport = distinctYears.length > 1;
  const isComptageReport = report.titre.toLowerCase().includes('dossier') || report.titre.toLowerCase().includes('mazala');
  const uniqueAgenciesCount = new Set(report.transferts.map(t => t.agenceNom)).size || report.transferts.length;

  const visibleSections = report.visibleSections || {
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

  const isLandscape = orientation === 'landscape';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 3, 3, 0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'auto',
      padding: 'clamp(10px, 2vw, 20px)'
    }}>
      {/* Top Toolbar */}
      <div className="print-toolbar no-print" style={{
        maxWidth: isLandscape ? '1120px' : '860px',
        width: '100%',
        margin: '0 auto 16px',
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '8px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-red">Aperçu A4 Officiel</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
            {report.titre}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Orientation switch */}
          <button
            type="button"
            onClick={() => setOrientation(prev => (prev === 'portrait' ? 'landscape' : 'portrait'))}
            className="btn btn-secondary btn-sm"
            title="Basculer entre le format Portrait et Paysage"
          >
            <FileText size={14} />
            <span>Format : {isLandscape ? 'A4 Paysage' : 'A4 Portrait'}</span>
          </button>

          {/* Zoom controls */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 4px' }}>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))))}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: '28px', padding: '0 6px' }}
              title="Dézoomer"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '38px', textAlign: 'center', color: '#FFFFFF' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))))}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: '28px', padding: '0 6px' }}
              title="Zoomer"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: '28px', padding: '0 6px', fontSize: '0.72rem' }}
              title="Réinitialiser zoom"
            >
              100%
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Télécharger en PDF'}
          >
            <Download size={14} /> Exporter PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Imprimer'}
          >
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm btn-icon" title="Fermer l'aperçu">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Outer scroll wrapper for mobile & desktop zooming */}
      <div style={{
        overflow: 'auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: '40px'
      }}>
        {/* Printable Sheet (A4 Styled container — Blanc, Rouge, Noir officiel) */}
        <div
          id="daily-report-printable-doc"
          ref={previewRef}
          className={`a4-page doc-light card ${isLandscape ? 'print-landscape' : 'print-portrait'}`}
          style={{
            width: isLandscape ? '297mm' : '210mm',
            minHeight: isLandscape ? '210mm' : '297mm',
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: 'top center',
            backgroundColor: docBg,
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            padding: isLandscape ? '12mm 14mm' : '16mm 14mm',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            color: '#111111',
            fontFamily: 'var(--font-sans), Arial, sans-serif',
            fontSize: report.customStyles?.fontScale === 'compact' ? '8.5pt' : report.customStyles?.fontScale === 'spacious' ? '10.5pt' : '9.5pt',
            lineHeight: '1.45',
            marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * (isLandscape ? 210 : 297))}mm` : undefined
          }}
        >
          {/* BANDEAU ROUGE UBA */}
          <div style={{
            backgroundColor: headerBg,
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, letterSpacing: '0.03em', color: '#FFFFFF' }}>
                RAPPORT D'ACTIVITÉ — ÉQUIPE ARCHIVISTE
              </div>
              <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95, color: '#FFFFFF', marginTop: '2px' }}>
                UBA CONGO · SITES MAYA-MAYA & MAZALA
              </div>
            </div>
            <div style={{
              fontSize: '15pt',
              fontWeight: 900,
              border: '2px solid #FFFFFF',
              padding: '2px 10px',
              borderRadius: '4px',
              color: '#FFFFFF'
            }}>
              UBA
            </div>
          </div>

          {/* ▌SYNTHÈSE DE LA PÉRIODE */}
          {visibleSections.effectif !== false && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#111111',
                marginBottom: '8px'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                SYNTHÈSE DE LA PÉRIODE
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '8px',
                backgroundColor: '#F9FAFB',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 900, color: accentBg }}>
                    {report.presents} / {report.effectifTotal}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                    Présents
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 900, color: '#111111' }}>
                    {report.absents}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                    Absents
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 900, color: accentBg }}>
                    {formatNumber(report.totalCalcule)}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                    {isComptageReport ? 'Dossiers Recensés' : 'Conventions Traitées'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 900, color: '#111111' }}>
                    {isMultiYearReport ? `${distinctYears.length} Années` : `${report.transferts.reduce((sum, t) => sum + t.boites, 0)} Boîtes`}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                    {isMultiYearReport ? 'Exercices Couverts' : 'Boîtes Transférées'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12pt', fontWeight: 900, color: accentBg }}>
                    {uniqueAgenciesCount}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                    Agences Concernées
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ▌1. INFORMATIONS GÉNÉRALES & ÉQUIPES */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10pt',
              fontWeight: 800,
              color: '#111111',
              marginBottom: '6px'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
              1. INFORMATIONS GÉNÉRALES & ÉQUIPES
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <tbody>
                <tr>
                  <td style={{ width: '22%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Période d'activité</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>Du <strong>{formatDate(report.dateDebut)}</strong> au <strong>{formatDate(report.dateFin)}</strong></td>
                  <td style={{ width: '18%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Horaires</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{report.horaires}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Chef d'équipe</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}><strong>{effectiveChef}</strong></td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Superviseurs / Équipe</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>
                    {report.superviseurs && report.superviseurs.length > 0 ? report.superviseurs.join(', ') : '—'}
                  </td>
                </tr>
                {visibleSections.effectif !== false && (
                  <tr>
                    <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Site Mazala</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{report.equipeMazala.length > 0 ? report.equipeMazala.join(', ') : '—'}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Travail Ordinateur</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{report.equipeOrdinateur.length > 0 ? report.equipeOrdinateur.join(', ') : '—'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ▌SUIVI DU TRI ET VOLUMÉTRIE DES BOÎTES */}
          {visibleSections.boites !== false && (Boolean(report.boitesRecues) || Boolean(report.boitesDatees) || Boolean(report.boitesNonDatees) || Boolean(report.boitesNonTriees)) && (
            <div style={{ marginBottom: '14px', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontSize: '9.5pt', fontWeight: 800, color: '#111111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                SUIVI DU TRI ET VOLUMÉTRIE DES BOÎTES
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ padding: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Reçues</div>
                  <div style={{ fontSize: '11pt', fontWeight: 800, color: '#111111' }}>{report.boitesRecues || 0}</div>
                </div>
                <div style={{ padding: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Datées</div>
                  <div style={{ fontSize: '11pt', fontWeight: 800, color: '#111111' }}>{report.boitesDatees || 0}</div>
                </div>
                <div style={{ padding: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Non Datées</div>
                  <div style={{ fontSize: '11pt', fontWeight: 800, color: '#111111' }}>{report.boitesNonDatees || 0}</div>
                </div>
                <div style={{ padding: '6px', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Tri Non Terminé</div>
                  <div style={{ fontSize: '11pt', fontWeight: 800, color: accentBg }}>{report.boitesNonTriees || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* ▌GROUPES DE TRAVAIL */}
          {visibleSections.groupes !== false && report.groupes && report.groupes.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#111111',
                marginBottom: '6px'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                2. GROUPES DE TRAVAIL & MISSIONS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: report.groupes.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '8px', fontSize: '8.5pt' }}>
                {report.groupes.map((grp, idx) => (
                  <div key={idx} style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '8px 12px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 800, color: accentBg, marginBottom: '2px' }}>{grp.nom}</div>
                    <div style={{ color: '#111111' }}><strong>Membres :</strong> {grp.membres.join(', ')}</div>
                    {grp.tachesAssignees && <div style={{ color: '#4B5563', marginTop: '2px' }}><em>Mission :</em> {grp.tachesAssignees}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ▌3. MOUVEMENTS & CONVENTIONS TRIÉES */}
          {visibleSections.mouvements !== false && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '10pt',
                  fontWeight: 800,
                  color: '#111111'
                }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                  3. DÉCOMPTE DÉTAILLÉ DES CONVENTIONS TRIÉES PAR AGENCE
                </div>
                <div style={{ fontSize: '8pt', color: '#4B5563', fontWeight: 700 }}>
                  {report.transferts.length} agence(s) enregistrée(s)
                </div>
              </div>

              <table className="uba-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                <thead>
                  <tr style={{ backgroundColor: accentBg, color: '#FFFFFF' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid ' + accentBg, color: '#FFFFFF' }}>AGENCE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid ' + accentBg, color: '#FFFFFF', width: '65px' }}>CODE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid ' + accentBg, color: '#FFFFFF', width: '75px' }}>EXERCICE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid ' + accentBg, color: '#FFFFFF', width: '90px' }}>CONVENTIONS</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid ' + accentBg, color: '#FFFFFF', width: '75px' }}>BOÎTES</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid ' + accentBg, color: '#FFFFFF', width: '90px' }}>TRAITEMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transferts.map((tr, idx) => (
                    <tr key={tr.id || idx} style={{ backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', fontWeight: 600, color: '#111111' }}>{tr.agenceNom}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#4B5563' }}>{tr.code}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#111111' }}>{tr.exercice}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 800, color: '#111111' }}>{formatNumber(tr.conventions)}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#4B5563' }}>{tr.boites}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#059669', fontWeight: 600 }}>{tr.traitement || 'Trié'}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 800 }}>
                    <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #D1D5DB', textAlign: 'right', color: '#111111' }}>TOTAL GÉNÉRAL :</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #D1D5DB', textAlign: 'right', color: accentBg, fontSize: '9.5pt' }}>{formatNumber(report.totalCalcule)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #D1D5DB', textAlign: 'right', color: '#111111' }}>{report.transferts.reduce((sum, t) => sum + (t.boites || 0), 0)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #D1D5DB', textAlign: 'center', color: '#059669' }}>Certifié</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ▌4. RÉCEPTIONS DE MATÉRIEL */}
          {visibleSections.receptions !== false && report.receptions && report.receptions.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#111111',
                marginBottom: '6px'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                4. RÉCEPTIONS DE MATÉRIEL & BORDEREAUX
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>PROVENANCE</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DESCRIPTION</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #1F2937', color: '#FFFFFF', width: '80px' }}>BOÎTES</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF', width: '90px' }}>STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  {report.receptions.map((rec, i) => (
                    <tr key={rec.id || i} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#FFFFFF', color: '#111111' }}>
                      <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #E5E7EB' }}>{rec.provenance}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB' }}>{rec.description}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, border: '1px solid #E5E7EB', color: accentBg }}>{rec.boites}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #E5E7EB' }}>{rec.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ▌5. TÂCHES MAJEURES */}
          {visibleSections.taches !== false && report.taches && report.taches.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#111111',
                marginBottom: '6px'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                5. TÂCHES MAJEURES RÉALISÉES
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                    <th style={{ width: '6%', padding: '5px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF' }}>N°</th>
                    <th style={{ width: '18%', padding: '5px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>HORAIRE</th>
                    <th style={{ width: '36%', padding: '5px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>INTITULÉ DE LA MISSION</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DÉTAILS & EXÉCUTION</th>
                  </tr>
                </thead>
                <tbody>
                  {report.taches.map(t => (
                    <tr key={t.numero} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#111111' }}>
                      <td style={{ textAlign: 'center', fontWeight: 700, padding: '5px', border: '1px solid #E5E7EB', color: '#111111' }}>{t.numero}</td>
                      <td style={{ padding: '5px 8px', color: '#4B5563', border: '1px solid #E5E7EB', fontWeight: 600 }}>{t.horaire}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: '#111111', border: '1px solid #E5E7EB' }}>{t.titre}</td>
                      <td style={{ padding: '5px 8px', color: '#374151', border: '1px solid #E5E7EB' }}>{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ▌6. OBSERVATIONS & CONSTATS */}
          {visibleSections.observations !== false && Array.isArray(report.observations) && report.observations.length > 0 && (
            <div style={{ marginBottom: '14px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '8px 12px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 800, fontSize: '9pt', color: '#111111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                6. OBSERVATIONS DU TERRAIN & CONSTATS
              </div>
              {report.observations.map((obs, i) => (
                <div key={i} style={{ fontSize: '8pt', marginBottom: '3px', color: '#374151' }}>
                  <strong style={{ color: '#111111' }}>• {obs.point} :</strong> {obs.constat}
                </div>
              ))}
            </div>
          )}

          {/* ▌CHAMPS PERSONNALISÉS */}
          {visibleSections.customFields !== false && report.customFields && report.customFields.length > 0 && (
            <div style={{ marginBottom: '14px', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                INDICATEURS & CHAMPS PERSONNALISÉS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {report.customFields.map(cf => (
                  <div key={cf.id} style={{ fontSize: '8pt', padding: '5px 8px', backgroundColor: '#F9FAFB', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                    <div style={{ color: '#6B7280', fontSize: '7pt', textTransform: 'uppercase', fontWeight: 700 }}>{cf.label}</div>
                    <div style={{ color: '#111111', fontWeight: 700, marginTop: '2px' }}>{cf.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ▌PIÈCES JOINTES & IMAGES */}
          {visibleSections.images !== false && report.images && report.images.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                DOCUMENTS & PHOTOGRAPHIES DU TERRAIN
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {report.images.map(img => (
                  <div key={img.id} style={{ border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                    <img src={img.url} alt={img.caption || 'Illustration rapport'} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }} />
                    {img.caption && (
                      <div style={{ padding: '5px 8px', fontSize: '7.5pt', color: '#4B5563', fontStyle: 'italic', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ▌VALIDATION & SIGNATURES */}
          {visibleSections.signatures !== false && (
            <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '10px 14px', borderRadius: '4px', marginBottom: '14px' }}>
              <div style={{ fontSize: '8pt', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '3px' }}>
                7. CERTIFICATION ET VALIDATION OFFICIELLE
              </div>
              <div style={{ fontSize: '7pt', color: '#6B7280', marginBottom: '10px' }}>
                Certifié exact, régulier et conforme aux procédures d'archivage UBA
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: '6px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>Chef d'équipe des Archives</div>
                  <div style={{ fontWeight: 900, color: accentBg, fontSize: '9pt', marginTop: '3px' }}>
                    {effectiveChef}
                  </div>
                  <div style={{ fontSize: '7pt', fontStyle: 'italic', color: '#9CA3AF', marginTop: '4px' }}>Visa & Signature certifiée</div>
                </div>

                {report.superviseurs && report.superviseurs.map((sup, idx) => (
                  <div key={idx} style={{ borderTop: '1px solid #D1D5DB', paddingTop: '6px' }}>
                    <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>Superviseur / Stagiaire</div>
                    <div style={{ fontWeight: 800, color: '#111111', fontSize: '8.5pt', marginTop: '3px' }}>{sup}</div>
                    <div style={{ fontSize: '7pt', fontStyle: 'italic', color: '#9CA3AF', marginTop: '4px' }}>Visa de conformité</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PIED DE PAGE OFFICIEL UBA */}
          <div style={{
            borderTop: '1px solid ' + accentBg,
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '7.5pt',
            color: '#6B7280'
          }}>
            <span>Équipe Archiviste UBA Congo — Système ARCHIVA</span>
            <span>Rapport officiel certifié conforme</span>
            <span>{isLandscape ? 'A4 Paysage' : 'A4 Portrait'} · Page 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
