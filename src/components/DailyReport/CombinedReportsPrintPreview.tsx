import React, { useRef, useState, useMemo } from 'react';
import { DailyReport } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, ZoomIn, ZoomOut, FileText, Files } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';

interface CombinedReportsPrintPreviewProps {
  reports: DailyReport[];
  onClose: () => void;
}

export const CombinedReportsPrintPreview: React.FC<CombinedReportsPrintPreviewProps> = ({ reports, onClose }) => {
  const { currentUser } = useAuth();
  const canPrintDoc = can.print(currentUser?.role);
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Sort chronologically
  const sortedReports = useMemo(() =>
    [...reports].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()),
    [reports]
  );

  // Aggregate stats
  const stats = useMemo(() => {
    const allDates = sortedReports.flatMap(r => [r.dateDebut, r.dateFin]);
    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0] || '');
    const maxDate = allDates.reduce((max, d) => d > max ? d : max, allDates[0] || '');
    const totalConventions = sortedReports.reduce((s, r) => s + (r.totalCalcule || 0), 0);
    const totalBoites = sortedReports.reduce((s, r) => s + r.transferts.reduce((b, t) => b + (t.boites || 0), 0), 0);
    const avgPresents = sortedReports.length > 0
      ? Math.round(sortedReports.reduce((s, r) => s + (r.presents || 0), 0) / sortedReports.length)
      : 0;
    const avgEffectif = sortedReports.length > 0
      ? Math.round(sortedReports.reduce((s, r) => s + (r.effectifTotal || 0), 0) / sortedReports.length)
      : 0;
    const uniqueAgencies = new Set(sortedReports.flatMap(r => r.transferts.map(t => t.agenceNom)));
    return { minDate, maxDate, totalConventions, totalBoites, avgPresents, avgEffectif, uniqueAgencies: uniqueAgencies.size };
  }, [sortedReports]);

  const handleDownloadPdf = async () => {
    if (!canPrintDoc) return;
    await exportElementToPdf(
      'combined-reports-printable-doc',
      `Rapports_Combines_UBA_${stats.minDate}_${stats.maxDate}`,
      currentUser?.role
    );
  };

  const handlePrint = () => {
    if (!canPrintDoc) return;
    window.print();
  };

  const isLandscape = orientation === 'landscape';
  const accentBg = '#FF0000';
  const docBorderColor = '#E5E7EB';

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
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Files size={12} /> Document Combiné
          </span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>
            {sortedReports.length} rapports · {formatDate(stats.minDate)} → {formatDate(stats.maxDate)}
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
              onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
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
              onClick={() => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: '28px', padding: '0 6px' }}
              title="Zoomer"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(0.85)}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: '28px', padding: '0 6px', fontSize: '0.72rem' }}
              title="Réinitialiser zoom"
            >
              85%
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Export réservé aux administrateurs' : 'Télécharger en PDF'}
          >
            <Download size={14} /> Exporter PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression réservée aux administrateurs' : 'Imprimer'}
          >
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm btn-icon" title="Fermer l'aperçu">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Printable Document */}
      <div style={{
        overflow: 'auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: '40px'
      }}>
        <div
          id="combined-reports-printable-doc"
          ref={previewRef}
          className={`a4-page doc-sheet-isolated ${isLandscape ? 'print-landscape' : 'print-portrait'}`}
          style={{
            width: isLandscape ? '297mm' : '210mm',
            minHeight: isLandscape ? '210mm' : '297mm',
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: 'top center',
            backgroundColor: '#FFFFFF',
            border: `1px solid ${docBorderColor}`,
            borderRadius: '4px',
            color: '#111111',
            fontFamily: 'var(--font-sans), Arial, sans-serif',
            fontSize: '9pt',
            lineHeight: '1.45',
            marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * (isLandscape ? 210 : 297))}mm` : undefined
          }}
        >
          {/* ═══════════ COVER HEADER — GLOBAL ═══════════ */}
          <div style={{
            backgroundColor: accentBg,
            color: '#FFFFFF',
            padding: '16px 22px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, letterSpacing: '0.03em' }}>
                RAPPORTS D'ACTIVITÉ COMBINÉS — ÉQUIPE ARCHIVISTE
              </div>
              <div style={{ fontSize: '9pt', fontWeight: 600, opacity: 0.95, marginTop: '3px' }}>
                UBA CONGO · SITES MAYA-MAYA & MAZALA · Période du {formatDate(stats.minDate)} au {formatDate(stats.maxDate)}
              </div>
            </div>
            <div style={{
              fontSize: '16pt',
              fontWeight: 900,
              border: '2px solid #FFFFFF',
              padding: '3px 12px',
              borderRadius: '4px'
            }}>
              UBA
            </div>
          </div>

          {/* ═══════════ GLOBAL SUMMARY STRIP ═══════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            border: `1px solid ${docBorderColor}`,
            borderRadius: '6px',
            padding: '10px',
            backgroundColor: '#F9FAFB',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: accentBg }}>{sortedReports.length}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Rapports Combinés</div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: accentBg }}>{formatNumber(stats.totalConventions)}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Conventions Totales</div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: '#111111' }}>{formatNumber(stats.totalBoites)}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Boîtes Totales</div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: '#111111' }}>{stats.avgPresents} / {stats.avgEffectif}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Effectif Moyen</div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: accentBg }}>{stats.uniqueAgencies}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Agences Distinctes</div>
            </div>
          </div>

          {/* ═══════════ EACH REPORT — FULL CONTENT ═══════════ */}
          {sortedReports.map((report, reportIndex) => {
            const totalBoitesRep = report.transferts.reduce((s, t) => s + (t.boites || 0), 0);
            const effectiveChef = report.chefNom || 'Thony OBAKI';
            const visibleSections = report.visibleSections || {
              effectif: true, groupes: true, taches: true, boites: true,
              mouvements: true, receptions: true, chronologie: true, observations: true,
              customFields: true, images: true, signatures: true
            };

            return (
              <div key={report.id} style={{ marginBottom: reportIndex < sortedReports.length - 1 ? '10px' : '0' }}>
                {/* ═══ RAPPORT SEPARATOR BANNER ═══ */}
                <div style={{
                  backgroundColor: accentBg,
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  pageBreakBefore: reportIndex > 0 ? 'always' : undefined
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      borderRadius: '4px',
                      padding: '2px 10px',
                      fontSize: '10pt',
                      fontWeight: 900
                    }}>
                      {reportIndex + 1}/{sortedReports.length}
                    </div>
                    <div>
                      <div style={{ fontSize: '10pt', fontWeight: 800 }}>
                        {report.titre}
                      </div>
                      <div style={{ fontSize: '7.5pt', opacity: 0.9 }}>
                        Du {formatDate(report.dateDebut)} au {formatDate(report.dateFin)} · {report.horaires} · v{report.version}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12pt', fontWeight: 900 }}>{formatNumber(report.totalCalcule)}</div>
                    <div style={{ fontSize: '7pt', opacity: 0.8 }}>conventions</div>
                  </div>
                </div>

                {/* 1. INFORMATIONS GÉNÉRALES & ÉQUIPES */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '9.5pt', fontWeight: 800, color: '#111111', marginBottom: '5px'
                  }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                    1. INFORMATIONS GÉNÉRALES & ÉQUIPES
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20%', padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Période</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}>Du <strong>{formatDate(report.dateDebut)}</strong> au <strong>{formatDate(report.dateFin)}</strong></td>
                        <td style={{ width: '16%', padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Horaires</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}>{report.horaires}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Chef d'équipe</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}><strong>{effectiveChef}</strong></td>
                        <td style={{ padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Superviseurs</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}>{report.superviseurs?.length > 0 ? report.superviseurs.join(', ') : '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Effectif</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}><strong>{report.presents}</strong> présents / {report.effectifTotal} total · {report.absents} absent(s){report.absentsMotifs ? ` (${report.absentsMotifs})` : ''}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Mazala</td>
                        <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}` }}>{report.equipeMazala?.length > 0 ? report.equipeMazala.join(', ') : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* BOÎTES */}
                {visibleSections.boites !== false && (Boolean(report.boitesRecues) || Boolean(report.boitesDatees) || Boolean(report.boitesNonDatees) || Boolean(report.boitesNonTriees)) && (
                  <div style={{ marginBottom: '12px', border: `1px solid ${docBorderColor}`, borderRadius: '4px', padding: '6px 10px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      SUIVI DU TRI & VOLUMÉTRIE DES BOÎTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '7pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Reçues</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesRecues || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '7pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Datées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesDatees || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '7pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Non Datées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesNonDatees || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '7pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Non Triées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800, color: accentBg }}>{report.boitesNonTriees || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GROUPES DE TRAVAIL */}
                {visibleSections.groupes !== false && report.groupes?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '9.5pt', fontWeight: 800, color: '#111111', marginBottom: '5px'
                    }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      2. GROUPES DE TRAVAIL & MISSIONS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: report.groupes.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '6px', fontSize: '8pt' }}>
                      {report.groupes.map((grp, idx) => (
                        <div key={idx} style={{ border: `1px solid ${docBorderColor}`, backgroundColor: '#F9FAFB', padding: '6px 10px', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 800, color: accentBg, marginBottom: '2px' }}>{grp.nom}</div>
                          <div><strong>Membres :</strong> {grp.membres.join(', ')}</div>
                          {grp.tachesAssignees && <div style={{ color: '#4B5563', marginTop: '2px' }}><em>Mission :</em> {grp.tachesAssignees}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MOUVEMENTS & CONVENTIONS */}
                {visibleSections.mouvements !== false && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5pt', fontWeight: 800, color: '#111111' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                        3. DÉCOMPTE DES CONVENTIONS TRIÉES PAR AGENCE
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700 }}>{report.transferts.length} agence(s)</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: accentBg, color: '#FFFFFF' }}>
                          <th style={{ padding: '4px 8px', textAlign: 'left', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>AGENCE</th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '60px' }}>CODE</th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '70px' }}>EXERCICE</th>
                          <th style={{ padding: '4px 8px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '85px' }}>CONVENTIONS</th>
                          <th style={{ padding: '4px 8px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '65px' }}>BOÎTES</th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '80px' }}>TRAITEMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.transferts.map((tr, idx) => (
                          <tr key={tr.id || idx} style={{ backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, fontWeight: 600 }}>{tr.agenceNom}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#4B5563' }}>{tr.code}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>{tr.exercice}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontWeight: 800 }}>{formatNumber(tr.conventions)}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: '#4B5563' }}>{tr.boites}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669', fontWeight: 600 }}>{tr.traitement || 'Trié'}</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 800 }}>
                          <td colSpan={3} style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>TOTAL RAPPORT :</td>
                          <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: accentBg, fontSize: '9pt' }}>{formatNumber(report.totalCalcule)}</td>
                          <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>{totalBoitesRep}</td>
                          <td style={{ padding: '5px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669' }}>✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* RÉCEPTIONS */}
                {visibleSections.receptions !== false && report.receptions?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5pt', fontWeight: 800, color: '#111111', marginBottom: '5px' }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      4. RÉCEPTIONS DE MATÉRIEL & BORDEREAUX
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                          <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>PROVENANCE</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DESCRIPTION</th>
                          <th style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #1F2937', color: '#FFFFFF', width: '70px' }}>BOÎTES</th>
                          <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF', width: '80px' }}>STATUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.receptions.map((rec, i) => (
                          <tr key={rec.id || i} style={{ backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                            <td style={{ padding: '4px 8px', fontWeight: 700, border: `1px solid ${docBorderColor}` }}>{rec.provenance}</td>
                            <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}` }}>{rec.description}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, border: `1px solid ${docBorderColor}`, color: accentBg }}>{rec.boites}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'center', border: `1px solid ${docBorderColor}` }}>{rec.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TÂCHES MAJEURES */}
                {visibleSections.taches !== false && report.taches?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5pt', fontWeight: 800, color: '#111111', marginBottom: '5px' }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      5. TÂCHES MAJEURES RÉALISÉES
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                          <th style={{ width: '5%', padding: '4px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF' }}>N°</th>
                          <th style={{ width: '16%', padding: '4px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>HORAIRE</th>
                          <th style={{ width: '34%', padding: '4px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>INTITULÉ</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DÉTAILS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.taches.map(t => (
                          <tr key={t.numero} style={{ backgroundColor: '#FFFFFF' }}>
                            <td style={{ textAlign: 'center', fontWeight: 700, padding: '4px', border: `1px solid ${docBorderColor}` }}>{t.numero}</td>
                            <td style={{ padding: '4px 8px', color: '#4B5563', border: `1px solid ${docBorderColor}`, fontWeight: 600 }}>{t.horaire}</td>
                            <td style={{ padding: '4px 8px', fontWeight: 700, border: `1px solid ${docBorderColor}` }}>{t.titre}</td>
                            <td style={{ padding: '4px 8px', color: '#374151', border: `1px solid ${docBorderColor}` }}>{t.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* OBSERVATIONS */}
                {visibleSections.observations !== false && Array.isArray(report.observations) && report.observations.length > 0 && (
                  <div style={{ marginBottom: '12px', border: `1px solid ${docBorderColor}`, backgroundColor: '#F9FAFB', padding: '6px 10px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      6. OBSERVATIONS & CONSTATS
                    </div>
                    {report.observations.map((obs, i) => (
                      <div key={i} style={{ fontSize: '7.5pt', marginBottom: '2px', color: '#374151' }}>
                        <strong style={{ color: '#111111' }}>• {obs.point} :</strong> {obs.constat}
                      </div>
                    ))}
                  </div>
                )}

                {/* CHAMPS PERSONNALISÉS */}
                {visibleSections.customFields !== false && report.customFields?.length > 0 && (
                  <div style={{ marginBottom: '12px', border: `1px solid ${docBorderColor}`, borderRadius: '4px', padding: '6px 10px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      CHAMPS PERSONNALISÉS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                      {report.customFields.map(cf => (
                        <div key={cf.id} style={{ fontSize: '7.5pt', padding: '4px 6px', backgroundColor: '#F9FAFB', borderRadius: '3px', border: `1px solid ${docBorderColor}` }}>
                          <div style={{ color: '#6B7280', fontSize: '6.5pt', textTransform: 'uppercase', fontWeight: 700 }}>{cf.label}</div>
                          <div style={{ color: '#111111', fontWeight: 700, marginTop: '1px' }}>{cf.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IMAGES */}
                {visibleSections.images !== false && report.images?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      PHOTOGRAPHIES DU TERRAIN
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                      {report.images.map(img => (
                        <div key={img.id} style={{ border: `1px solid ${docBorderColor}`, borderRadius: '4px', overflow: 'hidden' }}>
                          <img src={img.url} alt={img.caption || 'Photo'} style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }} />
                          {img.caption && (
                            <div style={{ padding: '3px 6px', fontSize: '7pt', color: '#4B5563', fontStyle: 'italic', backgroundColor: '#F9FAFB', borderTop: `1px solid ${docBorderColor}` }}>
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thin line separator between reports (not after last) */}
                {reportIndex < sortedReports.length - 1 && (
                  <div style={{ borderBottom: `2px dashed ${docBorderColor}`, margin: '8px 0 0' }} />
                )}
              </div>
            );
          })}

          {/* ═══════════ RÉCAPITULATIF GÉNÉRAL FINAL ═══════════ */}
          <div style={{
            marginTop: '20px',
            border: `2px solid ${accentBg}`,
            borderRadius: '6px',
            padding: '12px 16px',
            pageBreakBefore: 'always'
          }}>
            <div style={{
              fontSize: '11pt', fontWeight: 900, color: accentBg, marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ width: '4px', height: '16px', backgroundColor: accentBg, borderRadius: '2px' }} />
              RÉCAPITULATIF GÉNÉRAL — {sortedReports.length} RAPPORTS COMBINÉS
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <thead>
                <tr style={{ backgroundColor: accentBg, color: '#FFFFFF' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'left', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>RAPPORT</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>PÉRIODE</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>CHEF</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '60px' }}>EFFECTIF</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '90px' }}>CONVENTIONS</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '65px' }}>BOÎTES</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '60px' }}>AGENCES</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((rep, idx) => {
                  const repBoites = rep.transferts.reduce((s, t) => s + (t.boites || 0), 0);
                  const repAgences = new Set(rep.transferts.map(t => t.agenceNom)).size;
                  return (
                    <tr key={rep.id} style={{ backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, fontWeight: 700 }}>
                        R{idx + 1}
                      </td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>
                        {formatDate(rep.dateDebut)}{rep.dateFin !== rep.dateDebut ? ` → ${formatDate(rep.dateFin)}` : ''}
                      </td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>{rep.chefNom}</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', fontWeight: 700 }}>{rep.presents}/{rep.effectifTotal}</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontWeight: 800 }}>{formatNumber(rep.totalCalcule)}</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>{repBoites}</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>{repAgences}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 900 }}>
                  <td colSpan={4} style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontSize: '9pt' }}>
                    TOTAL GÉNÉRAL CUMULÉ :
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: accentBg, fontSize: '10pt' }}>
                    {formatNumber(stats.totalConventions)}
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontSize: '9pt' }}>
                    {formatNumber(stats.totalBoites)}
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669', fontSize: '9pt' }}>
                    {stats.uniqueAgencies}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PIED DE PAGE */}
          <div style={{
            borderTop: `1px solid ${accentBg}`,
            paddingTop: '6px',
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '7pt',
            color: '#6B7280'
          }}>
            <span>Équipe Archiviste UBA Congo — Système ARCHIVA</span>
            <span>Document combiné — {sortedReports.length} rapports du {formatDate(stats.minDate)} au {formatDate(stats.maxDate)}</span>
            <span>{isLandscape ? 'A4 Paysage' : 'A4 Portrait'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

