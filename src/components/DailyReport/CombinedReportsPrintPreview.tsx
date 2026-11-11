import React, { useRef, useState, useMemo } from 'react';
import { DailyReport, ReportCustomStyles } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, ZoomIn, ZoomOut, FileText, Files, CheckCircle2 } from 'lucide-react';
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

  // Ordonnancement chronologique strict par date de début (ascendant)
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }, [reports]);

  // Calculs consolidés globaux
  const stats = useMemo(() => {
    const allDates = sortedReports.flatMap(r => [r.dateDebut, r.dateFin]);
    const minDate = allDates.reduce((min, d) => (d < min ? d : min), allDates[0] || '');
    const maxDate = allDates.reduce((max, d) => (d > max ? d : max), allDates[0] || '');
    const totalConventions = sortedReports.reduce((s, r) => s + (r.totalCalcule || 0), 0);
    const totalBoites = sortedReports.reduce(
      (s, r) => s + r.transferts.reduce((b, t) => b + (t.boites || 0), 0),
      0
    );
    const avgPresents = sortedReports.length > 0
      ? Math.round(sortedReports.reduce((s, r) => s + (r.presents || 0), 0) / sortedReports.length)
      : 0;
    const avgEffectif = sortedReports.length > 0
      ? Math.round(sortedReports.reduce((s, r) => s + (r.effectifTotal || 0), 0) / sortedReports.length)
      : 0;
    const uniqueAgencies = new Set(sortedReports.flatMap(r => r.transferts.map(t => t.agenceNom)));
    const totalIncidents = sortedReports.reduce(
      (sum, r) => sum + (r.observations?.filter(o => o.estIncident)?.length || 0),
      0
    );

    return {
      minDate,
      maxDate,
      totalConventions,
      totalBoites,
      avgPresents,
      avgEffectif,
      uniqueAgencies: uniqueAgencies.size,
      totalIncidents
    };
  }, [sortedReports]);

  const handleDownloadPdf = async () => {
    if (!canPrintDoc) return;
    await exportElementToPdf(
      'combined-reports-printable-doc',
      `Rapports_Combines_UBA_${stats.minDate}_au_${stats.maxDate}`,
      currentUser?.role
    );
  };

  const handlePrint = () => {
    if (!canPrintDoc) return;
    window.print();
  };

  const isLandscape = orientation === 'landscape';
  const headerBg = '#D81E05';
  const accentBg = '#D81E05';
  const docBorderColor = '#E5E7EB';
  const zebraBg = '#F9FAFB';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 3, 3, 0.94)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1100,
      overflow: 'auto',
      padding: 'clamp(10px, 2vw, 20px)'
    }}>
      {/* Barre d'outils supérieure fixe */}
      <div className="print-toolbar no-print" style={{
        maxWidth: isLandscape ? '1120px' : '880px',
        width: '100%',
        margin: '0 auto 16px',
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '8px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 4px 25px rgba(0,0,0,0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}>
            <Files size={14} /> LIASSE COMBINÉE A4
          </span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
            {sortedReports.length} rapports réunis · Du {formatDate(stats.minDate)} au {formatDate(stats.maxDate)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Format Portrait / Paysage */}
          <button
            type="button"
            onClick={() => setOrientation(prev => (prev === 'portrait' ? 'landscape' : 'portrait'))}
            className="btn btn-secondary btn-sm"
            title="Basculer format Portrait / Paysage"
          >
            <FileText size={14} />
            <span>Format : {isLandscape ? 'A4 Paysage' : 'A4 Portrait'}</span>
          </button>

          {/* Zoom */}
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
              title="Zoom par défaut"
            >
              85%
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Réservé aux administrateurs' : 'Télécharger en PDF'}
            style={{ gap: '6px' }}
          >
            <Download size={14} /> Exporter PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Réservé aux administrateurs' : 'Imprimer'}
            style={{ gap: '6px' }}
          >
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm btn-icon" title="Fermer l'aperçu">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Conteneur imprimable centré avec échelle */}
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
            fontSize: '8.8pt',
            lineHeight: '1.42',
            padding: isLandscape ? '12mm 15mm' : '15mm 14mm',
            boxSizing: 'border-box',
            marginBottom: zoomLevel < 1 ? `-${Math.round((1 - zoomLevel) * (isLandscape ? 210 : 297))}mm` : undefined
          }}
        >
          {/* ============================================================ */}
          {/* BANDEAU GÉNÉRAL DE LA LIASSE DE RAPPORTS COMBINÉS             */}
          {/* ============================================================ */}
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
              <div style={{ fontSize: '13pt', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                LIASSE DE RAPPORTS D'ACTIVITÉ COMBINÉS
              </div>
              <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95, marginTop: '2px' }}>
                UBA CONGO · SITES MAYA-MAYA & MAZALA · Période du {formatDate(stats.minDate)} au {formatDate(stats.maxDate)} ({sortedReports.length} rapports)
              </div>
            </div>
            <div style={{
              fontSize: '15pt',
              fontWeight: 900,
              border: '2px solid #FFFFFF',
              padding: '2px 10px',
              borderRadius: '4px'
            }}>
              UBA
            </div>
          </div>

          {/* TABLEAU RÉCAPITULATIF SYNTHÉTIQUE INITIAL DE LA LIASSE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            border: `1px solid ${docBorderColor}`,
            borderRadius: '6px',
            padding: '10px 8px',
            backgroundColor: '#F9FAFB',
            textAlign: 'center',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: accentBg }}>{sortedReports.length}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Rapports Inclus</div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: accentBg }}>{formatNumber(stats.totalConventions)}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Conventions Triées</div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: '#111111' }}>{formatNumber(stats.totalBoites)}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Boîtes Traitées</div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: '#111111' }}>{stats.avgPresents} / {stats.avgEffectif}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Effectif Moyen</div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: accentBg }}>{stats.uniqueAgencies}</div>
              <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Agences Couvertes</div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CORPS DE CHAQUE RAPPORT CONSERVANT 100% DE SES INFORMATIONS   */}
          {/* ============================================================ */}
          {sortedReports.map((report, reportIndex) => {
            const totalBoitesRep = report.transferts.reduce((s, t) => s + (t.boites || 0), 0);
            const effectiveChef = report.chefNom || 'Thony OBAKI';
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

            return (
              <div
                key={report.id}
                style={{
                  pageBreakBefore: reportIndex > 0 ? 'always' : undefined,
                  marginBottom: reportIndex < sortedReports.length - 1 ? '16px' : '0',
                  breakInside: 'avoid-page'
                }}
              >
                {/* BANDEAU SÉPARATEUR DE JOURNÉE NUMÉROTÉ */}
                <div style={{
                  backgroundColor: accentBg,
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      color: accentBg,
                      fontWeight: 900,
                      fontSize: '9.5pt',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      JOURNALIER N° {reportIndex + 1} / {sortedReports.length}
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5pt', fontWeight: 900 }}>
                        {report.titre}
                      </div>
                      <div style={{ fontSize: '7.5pt', opacity: 0.95, marginTop: '1px' }}>
                        Date : {formatDate(report.dateDebut)}{report.dateFin !== report.dateDebut ? ` au ${formatDate(report.dateFin)}` : ''} · Horaires : {report.horaires} · Version {report.version}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12pt', fontWeight: 900 }}>
                      {formatNumber(report.totalCalcule)} conv.
                    </div>
                    <div style={{ fontSize: '7pt', opacity: 0.9 }}>
                      {totalBoitesRep} boîte{totalBoitesRep > 1 ? 's' : ''} · Statut : {report.statut === 'valide' ? 'Validé' : 'Brouillon'}
                    </div>
                  </div>
                </div>

                {/* 1. INFORMATIONS GÉNÉRALES & ÉQUIPES */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '4px'
                  }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                    1. INFORMATIONS GÉNÉRALES & ÉQUIPES
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20%', padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Période d'activité</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>Du <strong>{formatDate(report.dateDebut)}</strong> au <strong>{formatDate(report.dateFin)}</strong></td>
                        <td style={{ width: '16%', padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Horaires</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>{report.horaires}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Chef d'équipe</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}><strong>{effectiveChef}</strong></td>
                        <td style={{ padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Superviseurs</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>
                          {report.superviseurs?.length > 0 ? report.superviseurs.join(', ') : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Effectif Présent</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>
                          <strong>{report.presents}</strong> présents sur {report.effectifTotal} (Absents : {report.absents}{report.absentsMotifs ? ` - ${report.absentsMotifs}` : ''})
                        </td>
                        <td style={{ padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Site Mazala</td>
                        <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>
                          {report.equipeMazala?.length > 0 ? report.equipeMazala.join(', ') : 'Aucun'}
                        </td>
                      </tr>
                      {report.equipeOrdinateur?.length > 0 && (
                        <tr>
                          <td style={{ padding: '4px 6px', fontWeight: 700, backgroundColor: '#F3F4F6', border: `1px solid ${docBorderColor}` }}>Travail Ordinateur</td>
                          <td colSpan={3} style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}` }}>
                            {report.equipeOrdinateur.join(', ')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* SUIVI DU TRI ET VOLUMÉTRIE DES BOÎTES */}
                {visibleSections.boites !== false && (Boolean(report.boitesRecues) || Boolean(report.boitesDatees) || Boolean(report.boitesNonDatees) || Boolean(report.boitesNonTriees)) && (
                  <div style={{ marginBottom: '10px', border: `1px solid ${docBorderColor}`, borderRadius: '4px', padding: '6px 10px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      SUIVI DU TRI ET VOLUMÉTRIE DES BOÎTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '6.8pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Reçues</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesRecues || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '6.8pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Datées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesDatees || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '6.8pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Boîtes Non Datées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800 }}>{report.boitesNonDatees || 0}</div>
                      </div>
                      <div style={{ padding: '4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                        <div style={{ fontSize: '6.8pt', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Non Triées</div>
                        <div style={{ fontSize: '10pt', fontWeight: 800, color: accentBg }}>{report.boitesNonTriees || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. GROUPES DE TRAVAIL */}
                {visibleSections.groupes !== false && report.groupes && report.groupes.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '4px'
                    }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      2. GROUPES DE TRAVAIL & MISSIONS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: report.groupes.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '6px', fontSize: '7.8pt' }}>
                      {report.groupes.map((grp, idx) => (
                        <div key={idx} style={{ border: `1px solid ${docBorderColor}`, backgroundColor: '#F9FAFB', padding: '5px 8px', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 800, color: accentBg }}>{grp.nom}</div>
                          <div><strong>Membres :</strong> {grp.membres.join(', ')}</div>
                          {grp.tachesAssignees && <div style={{ color: '#4B5563', marginTop: '1px' }}><em>Mission :</em> {grp.tachesAssignees}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. DÉCOMPTE DÉTAILLÉ DES CONVENTIONS TRIÉES PAR AGENCE */}
                {visibleSections.mouvements !== false && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9pt', fontWeight: 800, color: '#111111' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                        3. DÉCOMPTE DÉTAILLÉ DES CONVENTIONS TRIÉES PAR AGENCE
                      </div>
                      <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700 }}>
                        {report.transferts.length} agence(s) enregistrée(s)
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: accentBg, color: '#FFFFFF' }}>
                          <th style={{ padding: '4px 6px', textAlign: 'left', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>AGENCE</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '55px' }}>CODE</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '65px' }}>EXERCICE</th>
                          <th style={{ padding: '4px 6px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '85px' }}>CONVENTIONS</th>
                          <th style={{ padding: '4px 6px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '60px' }}>BOÎTES</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '80px' }}>TRAITEMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.transferts.map((tr, idx) => (
                          <tr key={tr.id || idx} style={{ backgroundColor: idx % 2 === 1 ? zebraBg : '#FFFFFF' }}>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, fontWeight: 600 }}>{tr.agenceNom}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#4B5563' }}>{tr.code}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>{tr.exercice}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontWeight: 800 }}>{formatNumber(tr.conventions)}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: '#4B5563' }}>{tr.boites}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669', fontWeight: 600 }}>{tr.traitement || 'Trié'}</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 800 }}>
                          <td colSpan={3} style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>SOUS-TOTAL DU JOUR :</td>
                          <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: accentBg, fontSize: '9pt' }}>{formatNumber(report.totalCalcule)}</td>
                          <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>{totalBoitesRep}</td>
                          <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669' }}>Certifié</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. RÉCEPTIONS DE MATÉRIEL & BORDEREAUX */}
                {visibleSections.receptions !== false && report.receptions && report.receptions.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      4. RÉCEPTIONS DE MATÉRIEL & BORDEREAUX
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                          <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>PROVENANCE</th>
                          <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DESCRIPTION</th>
                          <th style={{ padding: '4px 6px', textAlign: 'right', border: '1px solid #1F2937', color: '#FFFFFF', width: '70px' }}>BOÎTES</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF', width: '75px' }}>STATUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.receptions.map((rec, i) => (
                          <tr key={rec.id || i} style={{ backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                            <td style={{ padding: '3px 6px', fontWeight: 700, border: `1px solid ${docBorderColor}` }}>{rec.provenance}</td>
                            <td style={{ padding: '3px 6px', border: `1px solid ${docBorderColor}` }}>{rec.description}</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, border: `1px solid ${docBorderColor}`, color: accentBg }}>{rec.boites}</td>
                            <td style={{ padding: '3px 6px', textAlign: 'center', border: `1px solid ${docBorderColor}` }}>{rec.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 5. TÂCHES MAJEURES RÉALISÉES */}
                {visibleSections.taches !== false && report.taches && report.taches.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9pt', fontWeight: 800, color: '#111111', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-block', width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      5. TÂCHES MAJEURES RÉALISÉES
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                          <th style={{ width: '5%', padding: '4px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF' }}>N°</th>
                          <th style={{ width: '15%', padding: '4px 6px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>HORAIRE</th>
                          <th style={{ width: '32%', padding: '4px 6px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>INTITULÉ DE LA MISSION</th>
                          <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DÉTAILS & EXÉCUTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.taches.map(t => (
                          <tr key={t.numero} style={{ backgroundColor: '#FFFFFF' }}>
                            <td style={{ textAlign: 'center', fontWeight: 700, padding: '3px', border: `1px solid ${docBorderColor}` }}>{t.numero}</td>
                            <td style={{ padding: '3px 6px', color: '#4B5563', border: `1px solid ${docBorderColor}`, fontWeight: 600 }}>{t.horaire}</td>
                            <td style={{ padding: '3px 6px', fontWeight: 700, border: `1px solid ${docBorderColor}` }}>{t.titre}</td>
                            <td style={{ padding: '3px 6px', color: '#374151', border: `1px solid ${docBorderColor}` }}>{t.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 6. OBSERVATIONS DU TERRAIN & CONSTATS */}
                {visibleSections.observations !== false && Array.isArray(report.observations) && report.observations.length > 0 && (
                  <div style={{ marginBottom: '10px', border: `1px solid ${docBorderColor}`, backgroundColor: '#F9FAFB', padding: '6px 10px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#111111', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      6. OBSERVATIONS DU TERRAIN & CONSTATS
                    </div>
                    {report.observations.map((obs, i) => (
                      <div key={i} style={{ fontSize: '7.5pt', marginBottom: '2px', color: '#374151' }}>
                        <strong style={{ color: '#111111' }}>• {obs.point} :</strong> {obs.constat}
                        {obs.estIncident && (
                          <span style={{ marginLeft: '6px', color: '#DC2626', fontWeight: 800, fontSize: '6.8pt' }}>
                            [INCIDENT REPORTÉ]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* CHAMPS PERSONNALISÉS */}
                {visibleSections.customFields !== false && report.customFields && report.customFields.length > 0 && (
                  <div style={{ marginBottom: '10px', border: `1px solid ${docBorderColor}`, borderRadius: '4px', padding: '6px 10px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      INDICATEURS & CHAMPS PERSONNALISÉS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                      {report.customFields.map(cf => (
                        <div key={cf.id} style={{ fontSize: '7.5pt', padding: '3px 6px', backgroundColor: '#F9FAFB', borderRadius: '3px', border: `1px solid ${docBorderColor}` }}>
                          <div style={{ color: '#6B7280', fontSize: '6.5pt', textTransform: 'uppercase', fontWeight: 700 }}>{cf.label}</div>
                          <div style={{ color: '#111111', fontWeight: 700, marginTop: '1px' }}>{cf.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PIÈCES JOINTES & PHOTOGRAPHIES */}
                {visibleSections.images !== false && report.images && report.images.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', backgroundColor: accentBg, borderRadius: '2px' }} />
                      PHOTOGRAPHIES DU TERRAIN & PREUVES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                      {report.images.map(img => (
                        <div key={img.id} style={{ border: `1px solid ${docBorderColor}`, borderRadius: '4px', overflow: 'hidden' }}>
                          <img src={img.url} alt={img.caption || 'Photo'} style={{ width: '100%', maxHeight: '110px', objectFit: 'cover', display: 'block' }} />
                          {img.caption && (
                            <div style={{ padding: '2px 4px', fontSize: '6.8pt', color: '#4B5563', fontStyle: 'italic', backgroundColor: '#F9FAFB', borderTop: `1px solid ${docBorderColor}` }}>
                              {img.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. VALIDATION & SIGNATURES DU RAPPORT DU JOUR */}
                {visibleSections.signatures !== false && (
                  <div style={{ border: `1px solid ${docBorderColor}`, backgroundColor: '#F9FAFB', padding: '8px 12px', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '7.5pt', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '2px' }}>
                      VALIDATION & VISAS DU RAPPORT #{reportIndex + 1}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', textAlign: 'center', marginTop: '6px' }}>
                      <div style={{ borderTop: `1px solid ${docBorderColor}`, paddingTop: '4px' }}>
                        <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>
                          Chef d'équipe des Archives
                        </div>
                        <div style={{ fontWeight: 900, color: accentBg, fontSize: '8.5pt', marginTop: '1px' }}>
                          {effectiveChef}
                        </div>
                        <div style={{ fontSize: '6.5pt', fontStyle: 'italic', color: '#9CA3AF' }}>Visa certifié exact</div>
                      </div>

                      <div style={{ borderTop: `1px solid ${docBorderColor}`, paddingTop: '4px' }}>
                        <div style={{ fontSize: '7pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>
                          Superviseur de garde
                        </div>
                        <div style={{ fontWeight: 800, color: '#111111', fontSize: '8.2pt', marginTop: '1px' }}>
                          {(report.superviseurs && report.superviseurs[0]) || 'Superviseur'}
                        </div>
                        <div style={{ fontSize: '6.5pt', fontStyle: 'italic', color: '#9CA3AF' }}>Visa de conformité</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ============================================================ */}
          {/* RÉCAPITULATIF GÉNÉRAL CUMULÉ DE LA LIASSE (SUR PAGE DÉDIÉE)   */}
          {/* ============================================================ */}
          <div style={{
            marginTop: '18px',
            border: `2px solid ${accentBg}`,
            borderRadius: '6px',
            padding: '12px 14px',
            pageBreakBefore: 'always',
            breakInside: 'avoid-page'
          }}>
            <div style={{
              fontSize: '11pt', fontWeight: 900, color: accentBg, marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ width: '4px', height: '16px', backgroundColor: accentBg, borderRadius: '2px' }} />
              RÉCAPITULATIF GÉNÉRAL CONSOLIDÉ — {sortedReports.length} RAPPORTS
            </div>
            <p style={{ fontSize: '7.8pt', color: '#4B5563', margin: '0 0 10px' }}>
              Tableau d'assemblage chronologique des rapports journaliers composant la présente liasse.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginBottom: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: accentBg, color: '#FFFFFF' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'left', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>N°</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>TITRE DU RAPPORT</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>PÉRIODE</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF' }}>CHEF D'ÉQUIPE</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '55px' }}>EFFECTIF</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '85px' }}>CONVENTIONS</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '60px' }}>BOÎTES</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', border: `1px solid ${accentBg}`, color: '#FFFFFF', width: '65px' }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((rep, idx) => {
                  const repBoites = rep.transferts.reduce((s, t) => s + (t.boites || 0), 0);
                  return (
                    <tr key={rep.id} style={{ backgroundColor: idx % 2 === 1 ? zebraBg : '#FFFFFF' }}>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center', fontWeight: 800 }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, fontWeight: 700 }}>
                        {rep.titre}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>
                        {formatDate(rep.dateDebut)}{rep.dateFin !== rep.dateDebut ? ` au ${formatDate(rep.dateFin)}` : ''}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>
                        {rep.chefNom}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center' }}>
                        {rep.presents}/{rep.effectifTotal}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontWeight: 800 }}>
                        {formatNumber(rep.totalCalcule)}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'right' }}>
                        {repBoites}
                      </td>
                      <td style={{ padding: '4px 6px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: rep.statut === 'valide' ? '#059669' : '#D97706', fontWeight: 700 }}>
                        {rep.statut === 'valide' ? 'Validé' : 'Brouillon'}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 900 }}>
                  <td colSpan={5} style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontSize: '9pt' }}>
                    TOTAL GÉNÉRAL CUMULÉ DE LA LIASSE :
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', color: accentBg, fontSize: '10pt' }}>
                    {formatNumber(stats.totalConventions)}
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'right', fontSize: '9pt' }}>
                    {formatNumber(stats.totalBoites)}
                  </td>
                  <td style={{ padding: '6px 8px', border: `1px solid ${docBorderColor}`, textAlign: 'center', color: '#059669', fontSize: '9pt' }}>
                    Certifié
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ATTESTATION OFFICIELLE FINALE DE LA LIASSE */}
            <div style={{ border: `1px solid ${docBorderColor}`, backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '4px' }}>
              <div style={{ fontSize: '8pt', fontWeight: 800, color: '#111111', textTransform: 'uppercase', marginBottom: '3px' }}>
                CERTIFICATION DE LA LIASSE DE RAPPORTS COMBINÉS
              </div>
              <div style={{ fontSize: '7pt', color: '#6B7280', marginBottom: '10px' }}>
                La présente liasse comprenant {sortedReports.length} rapports journaliers a été assemblée et certifiée conforme aux registres d'archivage UBA Congo.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div style={{ borderTop: `1px solid ${docBorderColor}`, paddingTop: '6px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>
                    Chef d'équipe des Archives UBA
                  </div>
                  <div style={{ fontWeight: 900, color: accentBg, fontSize: '9pt', marginTop: '2px' }}>
                    Thony OBAKI
                  </div>
                  <div style={{ fontSize: '6.8pt', fontStyle: 'italic', color: '#9CA3AF', marginTop: '2px' }}>Signature & Date de clôture</div>
                </div>

                <div style={{ borderTop: `1px solid ${docBorderColor}`, paddingTop: '6px' }}>
                  <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase' }}>
                    Direction des Opérations & Contrôle
                  </div>
                  <div style={{ fontWeight: 800, color: '#111111', fontSize: '8.5pt', marginTop: '2px' }}>
                    Visa de Réception & Archivage
                  </div>
                  <div style={{ fontSize: '6.8pt', fontStyle: 'italic', color: '#9CA3AF', marginTop: '2px' }}>Visa officiel de la Direction</div>
                </div>
              </div>
            </div>
          </div>

          {/* PIED DE PAGE OFFICIEL */}
          <div style={{
            borderTop: `1px solid ${accentBg}`,
            paddingTop: '6px',
            marginTop: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '7pt',
            color: '#6B7280'
          }}>
            <span>Équipe Archiviste UBA Congo — Plateforme ARCHIVA</span>
            <span>Document officiel d'assemblage — Période du {formatDate(stats.minDate)} au {formatDate(stats.maxDate)}</span>
            <span>{isLandscape ? 'A4 Paysage' : 'A4 Portrait'} · Liasse certifiée</span>
          </div>
        </div>
      </div>
    </div>
  );
};
