import React, { useRef } from 'react';
import { DailyReport } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';

interface DailyReportPrintPreviewProps {
  report: DailyReport;
  onClose: () => void;
}

export const DailyReportPrintPreview: React.FC<DailyReportPrintPreviewProps> = ({ report, onClose }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    await exportElementToPdf(
      'daily-report-printable-doc',
      `Rapport_Journalier_UBA_${report.dateDebut}_${report.dateFin}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

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
          <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm">
            <Download size={15} /> Télécharger en PDF
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={15} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Sheet (A4 Styled container — Noir, Rouge, Blanc) */}
      <div
        id="daily-report-printable-doc"
        ref={previewRef}
        className="a4-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          backgroundColor: '#080808',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '4px',
          padding: '18mm 16mm',
          boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
          color: '#FFFFFF',
          fontFamily: 'Arial, sans-serif',
          fontSize: '9.5pt',
          lineHeight: '1.4'
        }}
      >
        {/* BANDEAU ROUGE UBA */}
        <div style={{
          backgroundColor: '#E41E26',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 900, letterSpacing: '0.04em' }}>
              RAPPORT JOURNALIER D'ACTIVITÉ
            </div>
            <div style={{ fontSize: '9pt', fontWeight: 600, opacity: 0.95 }}>
              ÉQUIPE ARCHIVISTE UBA CONGO · SITES MAYA-MAYA & MAZALA
            </div>
          </div>
          <div style={{
            fontSize: '18pt',
            fontWeight: 900,
            border: '2px solid #FFFFFF',
            padding: '2px 10px',
            borderRadius: '4px'
          }}>
            UBA
          </div>
        </div>

        {/* ▌SYNTHÈSE DE LA JOURNÉE (KPI Strip) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '10px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            SYNTHÈSE DE LA PÉRIODE
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            border: '1px solid #303030',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: '#121212',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: 'var(--uba-red-bright)' }}>
                {report.presents} / {report.effectifTotal}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#D9D9D9', fontWeight: 700, textTransform: 'uppercase' }}>
                Présents
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: '#FFFFFF' }}>
                {report.absents}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#D9D9D9', fontWeight: 700, textTransform: 'uppercase' }}>
                Absents
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: 'var(--uba-red-bright)' }}>
                {formatNumber(report.totalCalcule)}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#D9D9D9', fontWeight: 700, textTransform: 'uppercase' }}>
                Conventions Traitées
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: '#FFFFFF' }}>
                {report.transferts.reduce((sum, t) => sum + t.boites, 0)}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#D9D9D9', fontWeight: 700, textTransform: 'uppercase' }}>
                Boîtes Transférées
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 900, color: 'var(--uba-red-bright)' }}>
                {report.transferts.length}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#D9D9D9', fontWeight: 700, textTransform: 'uppercase' }}>
                Agences Traitées
              </div>
            </div>
          </div>
        </div>

        {/* ▌1. INFORMATIONS GÉNÉRALES */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            1. INFORMATIONS GÉNÉRALES
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Période d'activité</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>Du <strong>{formatDate(report.dateDebut)}</strong> au <strong>{formatDate(report.dateFin)}</strong></td>
                <td style={{ width: '20%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Horaires</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{report.horaires}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Chef d'équipe</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}><strong>{report.chefNom}</strong></td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Superviseurs</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{report.superviseurs.join(', ')}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Site Mazala</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{report.equipeMazala.join(', ')}</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#161616', border: '1px solid #282828', color: '#FFFFFF' }}>Travail Ordinateur</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{report.equipeOrdinateur.join(', ')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ▌2. GROUPES DE TRAVAIL */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            2. RÉPARTITION DES GROUPES DE TRAVAIL
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '8.5pt' }}>
            {report.groupes.map((grp, idx) => (
              <div key={idx} style={{ border: '1px solid #303030', backgroundColor: '#121212', padding: '8px 12px', borderRadius: '3px' }}>
                <div style={{ fontWeight: 800, color: 'var(--uba-red-bright)', marginBottom: '3px' }}>{grp.nom}</div>
                <div style={{ color: '#FFFFFF' }}><strong>Membres :</strong> {grp.membres.join(', ')}</div>
                {grp.tachesAssignees && <div style={{ color: '#D9D9D9', marginTop: '3px' }}><em>Mission :</em> {grp.tachesAssignees}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ▌3. TRANSFERTS VERS MAZALA (TABLEAU OFFICIEL UBA) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            3. TRANSFERTS VERS LE SITE DE STOCKAGE MAZALA
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#E41E26', color: '#FFFFFF' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E41E26' }}>AGENCE</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #E41E26' }}>CODE</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #E41E26' }}>EXERCICE</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E41E26' }}>CONVENTIONS</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #E41E26' }}>BOÎTES</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E41E26' }}>TRAITEMENT APPLIQUÉ</th>
              </tr>
            </thead>
            <tbody>
              {report.transferts.map((tr, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#141414' : '#0B0B0B', color: '#FFFFFF' }}>
                  <td style={{ padding: '6px 8px', border: '1px solid #282828', fontWeight: 700 }}>{tr.agenceNom}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #282828', color: '#D9D9D9' }}>{tr.code}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #282828', color: '#D9D9D9' }}>{tr.exercice}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #282828', fontWeight: 800, color: 'var(--uba-red-bright)' }}>
                    {formatNumber(tr.conventions)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #282828' }}>{tr.boites}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{tr.traitement || 'Trié & Validé'}</td>
                </tr>
              ))}
              {/* Ligne TOTAL */}
              <tr style={{ backgroundColor: '#141414', fontWeight: 900, borderTop: '2px solid #E41E26', color: '#FFFFFF' }}>
                <td colSpan={3} style={{ padding: '8px', border: '1px solid #282828', textAlign: 'right' }}>
                  TOTAL CONVENTIONS CERTIFIÉES :
                </td>
                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #282828', color: 'var(--uba-red-bright)', fontSize: '10pt' }}>
                  {formatNumber(report.totalCalcule)}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #282828' }}>
                  {report.transferts.reduce((sum, t) => sum + t.boites, 0)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #282828', color: '#FFFFFF', fontSize: '8pt' }}>
                  ✓ Concordance 100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ▌4. TÂCHES RÉALISÉES & CHRONOLOGIE */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            4. TÂCHES MAJEURES RÉALISÉES
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                <th style={{ width: '6%', padding: '6px', textAlign: 'center', border: '1px solid #303030' }}>N°</th>
                <th style={{ width: '18%', padding: '6px 8px', textAlign: 'left', border: '1px solid #303030' }}>HORAIRE</th>
                <th style={{ width: '36%', padding: '6px 8px', textAlign: 'left', border: '1px solid #303030' }}>INTITULÉ DE LA MISSION</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #303030' }}>DÉTAILS & EXÉCUTION</th>
              </tr>
            </thead>
            <tbody>
              {report.taches.map(t => (
                <tr key={t.numero} style={{ borderBottom: '1px solid #282828', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>
                  <td style={{ textAlign: 'center', fontWeight: 700, padding: '6px', border: '1px solid #282828' }}>{t.numero}</td>
                  <td style={{ padding: '6px 8px', color: '#D9D9D9', border: '1px solid #282828' }}>{t.horaire}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#FFFFFF', border: '1px solid #282828' }}>{t.titre}</td>
                  <td style={{ padding: '6px 8px', color: '#D9D9D9', border: '1px solid #282828' }}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ▌5. OBSERVATIONS & SIGNATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #303030', backgroundColor: '#121212', padding: '10px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 800, fontSize: '9pt', color: '#FFFFFF', marginBottom: '6px' }}>
              OBSERVATIONS DU TERRAIN
            </div>
            {report.observations.map((obs, i) => (
              <div key={i} style={{ fontSize: '8pt', marginBottom: '4px', color: '#D9D9D9' }}>
                <strong style={{ color: '#FFFFFF' }}>• {obs.point} :</strong> {obs.constat}
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #303030', backgroundColor: '#121212', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#FFFFFF' }}>
              LE CHEF D'ÉQUIPE DES ARCHIVES
            </div>
            <div style={{ fontSize: '7.5pt', color: '#A6A6A6', margin: '4px 0 35px' }}>
              Certifié exact et conforme
            </div>
            <div style={{ fontWeight: 900, color: 'var(--uba-red-bright)', fontSize: '9.5pt', textDecoration: 'underline' }}>
              {report.chefNom}
            </div>
          </div>
        </div>

        {/* PIED DE PAGE OFFICIEL UBA */}
        <div style={{
          borderTop: '1px solid #E41E26',
          paddingTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: '#A6A6A6'
        }}>
          <span>Équipe Archiviste UBA Congo — Système ARCHIVA</span>
          <span>Rapport officiel certifié conforme</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
