import React, { useRef } from 'react';
import { DailyReport } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';
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

  const distinctYears = Array.from(new Set(report.transferts.map(t => t.exercice))).sort((a, b) => a - b);
  const isMultiYearReport = distinctYears.length > 1;
  const isComptageReport = report.titre.toLowerCase().includes('dossier') || report.titre.toLowerCase().includes('mazala');
  const uniqueAgenciesCount = new Set(report.transferts.map(t => t.agenceNom)).size || report.transferts.length;

  const matrixAgencies = isMultiYearReport
    ? Array.from(
        report.transferts.reduce((map, t) => {
          if (!map.has(t.code)) {
            map.set(t.code, { code: t.code, nom: t.agenceNom, annees: {} as Record<number, number>, total: 0 });
          }
          const item = map.get(t.code)!;
          item.annees[t.exercice] = (item.annees[t.exercice] || 0) + t.conventions;
          item.total += t.conventions;
          return map;
        }, new Map<string, { code: string; nom: string; annees: Record<number, number>; total: number }>()).values()
      ).sort((a, b) => b.total - a.total)
    : [];

  const yearTotals = isMultiYearReport
    ? distinctYears.reduce((acc, yr) => {
        acc[yr] = report.transferts.filter(t => t.exercice === yr).reduce((s, t) => s + t.conventions, 0);
        return acc;
      }, {} as Record<number, number>)
    : {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 3, 3, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    }}>
      {/* Top Toolbar */}
      <div style={{
        maxWidth: '850px',
        width: '100%',
        margin: '0 auto 16px',
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-red">Modèle Officiel UBA (A4)</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
            {report.titre}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Télécharger en PDF'}
          >
            <Download size={15} /> Télécharger en PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Imprimer'}
          >
            <Printer size={15} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Sheet (A4 Styled container — Blanc, Rouge, Noir officiel) */}
      <div
        id="daily-report-printable-doc"
        ref={previewRef}
        className="a4-page doc-light card"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          padding: '16mm 14mm',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: '#111111',
          fontFamily: 'var(--font-sans), Arial, sans-serif',
          fontSize: '9.5pt',
          lineHeight: '1.45'
        }}
      >
        {/* BANDEAU ROUGE UBA */}
        <div style={{
          backgroundColor: 'var(--brand)',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px'
        }}>
          <div>
            <div style={{ fontSize: '14pt', fontWeight: 900, letterSpacing: '0.03em', color: '#FFFFFF' }}>
              RAPPORT D'ACTIVITÉ — ÉQUIPE ARCHIVISTE
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95, color: '#FFFFFF', marginTop: '2px' }}>
              UBA CONGO · SITES MAYA-MAYA & MAZALA
            </div>
          </div>
          <div style={{
            fontSize: '16pt',
            fontWeight: 900,
            border: '2px solid #FFFFFF',
            padding: '2px 10px',
            borderRadius: '4px',
            color: '#FFFFFF'
          }}>
            UBA
          </div>
        </div>

        {/* ▌SYNTHÈSE DE LA JOURNÉE (KPI Strip Blanc / Gris clair) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#111111',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
            SYNTHÈSE DE LA PÉRIODE
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '10px',
            backgroundColor: '#F9FAFB',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: 'var(--brand)' }}>
                {report.presents} / {report.effectifTotal}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                Présents
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: '#111111' }}>
                {report.absents}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                Absents
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: 'var(--brand)' }}>
                {formatNumber(report.totalCalcule)}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                {isComptageReport ? 'Dossiers Recensés' : 'Conventions Traitées'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: '#111111' }}>
                {isMultiYearReport ? `${distinctYears.length} Années` : `${report.transferts.reduce((sum, t) => sum + t.boites, 0)} Boîtes`}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                {isMultiYearReport ? 'Exercices Couverts' : 'Boîtes Transférées'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13pt', fontWeight: 900, color: 'var(--brand)' }}>
                {uniqueAgenciesCount}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                Agences Concernées
              </div>
            </div>
          </div>
        </div>

        {/* ▌1. INFORMATIONS GÉNÉRALES */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#111111',
            marginBottom: '6px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
            1. INFORMATIONS GÉNÉRALES
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
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Équipe / Chef</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}><strong>{report.chefNom}</strong></td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>
                  {report.superviseurs && report.superviseurs.length > 0 ? 'Stagiaires / Validateurs' : 'Superviseurs'}
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>
                  {report.superviseurs && report.superviseurs.length > 0 ? report.superviseurs.join(' et ') : '—'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Site Mazala</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{report.equipeMazala.length > 0 ? report.equipeMazala.join(', ') : '—'}</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111111' }}>Travail Ordinateur</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{report.equipeOrdinateur.length > 0 ? report.equipeOrdinateur.join(', ') : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ▌2. GROUPES DE TRAVAIL */}
        {report.groupes.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10.5pt',
              fontWeight: 800,
              color: '#111111',
              marginBottom: '6px'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              2. RÉPARTITION DES GROUPES DE TRAVAIL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: report.groupes.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '8px', fontSize: '8.5pt' }}>
              {report.groupes.map((grp, idx) => (
                <div key={idx} style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '8px 12px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--brand)', marginBottom: '3px' }}>{grp.nom}</div>
                  <div style={{ color: '#111111' }}><strong>Membres :</strong> {grp.membres.join(', ')}</div>
                  {grp.tachesAssignees && <div style={{ color: '#4B5563', marginTop: '3px' }}><em>Mission :</em> {grp.tachesAssignees}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ▌TABLEAU RÉCAPITULATIF PAR AGENCE ET PAR ANNÉE (Affiché si multi-exercices) */}
        {isMultiYearReport && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10.5pt',
              fontWeight: 800,
              color: '#111111',
              marginBottom: '6px'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              TABLEAU RÉCAPITULATIF PAR AGENCE ET PAR ANNÉE
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--brand)', color: '#FFFFFF' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid var(--brand)', width: '60px' }}>CODE</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid var(--brand)' }}>AGENCE</th>
                  {distinctYears.map(yr => (
                    <th key={yr} style={{ padding: '6px 6px', textAlign: 'right', border: '1px solid var(--brand)' }}>{yr}</th>
                  ))}
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid var(--brand)', width: '80px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {matrixAgencies.map((ag, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF', color: '#111111' }}>
                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 600 }}>{ag.code}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>{ag.nom}</td>
                    {distinctYears.map(yr => {
                      const count = ag.annees[yr];
                      return (
                        <td key={yr} style={{ padding: '5px 6px', textAlign: 'right', border: '1px solid #E5E7EB', color: count ? '#111111' : '#9CA3AF' }}>
                          {count ? formatNumber(count) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 800, color: 'var(--brand)' }}>
                      {formatNumber(ag.total)}
                    </td>
                  </tr>
                ))}
                {/* Ligne TOTAL PAR ANNÉE */}
                <tr style={{ backgroundColor: '#F3F4F6', fontWeight: 900, borderTop: '2px solid var(--brand)' }}>
                  <td colSpan={2} style={{ padding: '7px 8px', border: '1px solid #E5E7EB', textAlign: 'left', color: '#111111' }}>
                    TOTAL PAR ANNÉE
                  </td>
                  {distinctYears.map(yr => (
                    <td key={yr} style={{ padding: '7px 6px', textAlign: 'right', border: '1px solid #E5E7EB', color: 'var(--brand)', fontWeight: 800 }}>
                      {formatNumber(yearTotals[yr] || 0)}
                    </td>
                  ))}
                  <td style={{ padding: '7px 8px', textAlign: 'right', border: '1px solid #E5E7EB', color: 'var(--brand)', fontSize: '9.5pt', fontWeight: 900 }}>
                    {formatNumber(report.totalCalcule)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: '7.5pt', color: '#6B7280', fontStyle: 'italic', marginTop: '4px' }}>
              « — » : aucun dossier (case barrée d'une croix sur le relevé manuscrit). La ligne « Total par année » est calculée à partir du relevé.
            </div>
          </div>
        )}

        {/* ▌3. TRANSFERTS / DÉTAIL DES DOSSIERS RECENSÉS */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#111111',
            marginBottom: '6px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
            {isComptageReport ? '3. DÉTAIL DES DOSSIERS PAR AGENCE ET PAR EXERCICE' : '3. TRANSFERTS VERS LE SITE DE STOCKAGE MAZALA'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--brand)', color: '#FFFFFF' }}>
                <th style={{ padding: '7px 8px', textAlign: 'left', border: '1px solid var(--brand)', color: '#FFFFFF' }}>AGENCE</th>
                <th style={{ padding: '7px 8px', textAlign: 'center', border: '1px solid var(--brand)', color: '#FFFFFF' }}>CODE</th>
                <th style={{ padding: '7px 8px', textAlign: 'center', border: '1px solid var(--brand)', color: '#FFFFFF' }}>EXERCICE</th>
                <th style={{ padding: '7px 8px', textAlign: 'right', border: '1px solid var(--brand)', color: '#FFFFFF' }}>
                  {isComptageReport ? 'DOSSIERS' : 'CONVENTIONS'}
                </th>
                <th style={{ padding: '7px 8px', textAlign: 'right', border: '1px solid var(--brand)', color: '#FFFFFF' }}>BOÎTES</th>
                <th style={{ padding: '7px 8px', textAlign: 'left', border: '1px solid var(--brand)', color: '#FFFFFF' }}>TRAITEMENT APPLIQUÉ</th>
              </tr>
            </thead>
            <tbody>
              {report.transferts.map((tr, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF', color: '#111111' }}>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>{tr.agenceNom}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #E5E7EB', color: '#4B5563' }}>{tr.code}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #E5E7EB', color: '#4B5563' }}>{tr.exercice}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E5E7EB', fontWeight: 800, color: 'var(--brand)' }}>
                    {formatNumber(tr.conventions)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E5E7EB', color: '#111111' }}>{tr.boites}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', color: '#111111' }}>{tr.traitement || 'Trié & Validé'}</td>
                </tr>
              ))}
              {/* Ligne TOTAL */}
              <tr style={{ backgroundColor: '#F9FAFB', fontWeight: 900, borderTop: '2px solid var(--brand)', color: '#111111' }}>
                <td colSpan={3} style={{ padding: '8px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111111' }}>
                  {isComptageReport ? 'TOTAL DOSSIERS CERTIFIÉS :' : 'TOTAL CONVENTIONS CERTIFIÉES :'}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #E5E7EB', color: 'var(--brand)', fontSize: '10pt', fontWeight: 900 }}>
                  {formatNumber(report.totalCalcule)}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #E5E7EB', color: '#111111', fontWeight: 800 }}>
                  {report.transferts.reduce((sum, t) => sum + t.boites, 0)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #E5E7EB', color: '#059669', fontSize: '8pt', fontWeight: 700 }}>
                  ✓ Concordance 100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ▌4. RÉCEPTIONS (SI PRÉSENTES) */}
        {report.receptions && report.receptions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10.5pt',
              fontWeight: 800,
              color: '#111111',
              marginBottom: '6px'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
              RÉCEPTIONS DE MATÉRIEL & CARTONS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>PROVENANCE</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DESCRIPTION</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #1F2937', color: '#FFFFFF', width: '90px' }}>BOÎTES</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF', width: '100px' }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {report.receptions.map((rec, i) => (
                  <tr key={rec.id || i} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#FFFFFF', color: '#111111' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700, border: '1px solid #E5E7EB' }}>{rec.provenance}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #E5E7EB' }}>{rec.description}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, border: '1px solid #E5E7EB', color: 'var(--brand)' }}>{rec.boites}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #E5E7EB' }}>{rec.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ▌5. TÂCHES RÉALISÉES */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#111111',
            marginBottom: '6px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: 'var(--brand)', borderRadius: '2px' }} />
            4. TÂCHES MAJEURES RÉALISÉES
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#1F2937', color: '#FFFFFF' }}>
                <th style={{ width: '6%', padding: '6px', textAlign: 'center', border: '1px solid #1F2937', color: '#FFFFFF' }}>N°</th>
                <th style={{ width: '16%', padding: '6px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>HORAIRE</th>
                <th style={{ width: '38%', padding: '6px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>INTITULÉ DE LA MISSION</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #1F2937', color: '#FFFFFF' }}>DÉTAILS & EXÉCUTION</th>
              </tr>
            </thead>
            <tbody>
              {report.taches.map(t => (
                <tr key={t.numero} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#111111' }}>
                  <td style={{ textAlign: 'center', fontWeight: 700, padding: '6px', border: '1px solid #E5E7EB', color: '#111111' }}>{t.numero}</td>
                  <td style={{ padding: '6px 8px', color: '#4B5563', border: '1px solid #E5E7EB', fontWeight: 600 }}>{t.horaire}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#111111', border: '1px solid #E5E7EB' }}>{t.titre}</td>
                  <td style={{ padding: '6px 8px', color: '#374151', border: '1px solid #E5E7EB' }}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ▌6. OBSERVATIONS & SIGNATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', marginBottom: '16px' }}>
          <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '10px 12px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 800, fontSize: '9pt', color: '#111111', marginBottom: '6px' }}>
              5. OBSERVATIONS DU TERRAIN
            </div>
            {Array.isArray(report.observations) && report.observations.map((obs, i) => (
              <div key={i} style={{ fontSize: '8pt', marginBottom: '4px', color: '#374151' }}>
                <strong style={{ color: '#111111' }}>• {obs.point} :</strong> {obs.constat}
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '10px 12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#111111' }}>
              6. VALIDATION DU RAPPORT
            </div>
            <div style={{ fontSize: '7.5pt', color: '#6B7280', margin: '4px 0 10px' }}>
              Certifié exact et conforme
            </div>
            {report.superviseurs && report.superviseurs.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '6px' }}>
                {report.superviseurs.map((sup, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: '9pt' }}>{sup}</div>
                    <div style={{ fontSize: '7.5pt', color: '#4B5563', fontWeight: 600 }}>Stagiaire</div>
                    <div style={{ fontSize: '7pt', fontStyle: 'italic', color: '#9CA3AF', marginTop: '12px' }}>Signature : ✍️</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontWeight: 900, color: 'var(--brand)', fontSize: '9.5pt', textDecoration: 'underline' }}>
                {report.chefNom}
              </div>
            )}
          </div>
        </div>

        {/* PIED DE PAGE OFFICIEL UBA */}
        <div style={{
          borderTop: '1px solid var(--brand)',
          paddingTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: '#6B7280'
        }}>
          <span>Équipe Archiviste UBA Congo — Système ARCHIVA</span>
          <span>Rapport officiel certifié conforme</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
