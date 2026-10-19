import React, { useRef } from 'react';
import { TransferSlip } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';

interface TransferSlipPrintPreviewProps {
  slip: TransferSlip;
  onClose: () => void;
}

export const TransferSlipPrintPreview: React.FC<TransferSlipPrintPreviewProps> = ({ slip, onClose }) => {
  const { currentUser } = useAuth();
  const canPrintDoc = can.print(currentUser?.role);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!canPrintDoc) return;
    await exportElementToPdf(
      'transfer-slip-printable-doc',
      `Bordereau_Decharge_UBA_${slip.numeroBordereau}`,
      currentUser?.role
    );
  };

  const handlePrint = () => {
    if (!canPrintDoc) return;
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 3, 3, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    }}>
      {/* Top Bar */}
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
          <span className="badge badge-red">Bordereau Officiel de Décharge</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
            N° {slip.numeroBordereau}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Télécharger PDF'}
          >
            <Download size={14} /> Télécharger PDF
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            disabled={!canPrintDoc}
            title={!canPrintDoc ? 'Impression et export réservés aux administrateurs' : 'Imprimer'}
          >
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* A4 Printable Sheet — Blanc, Rouge, Noir officiel */}
      <div
        id="transfer-slip-printable-doc"
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
            <div style={{ fontSize: '13pt', fontWeight: 900, letterSpacing: '0.03em', color: '#FFFFFF' }}>
              BORDEREAU OFFICIEL DE TRANSFERT & DÉCHARGE D'ARCHIVES
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95, color: '#FFFFFF', marginTop: '2px' }}>
              ROTATION LOGISTIQUE SÉCURISÉE · MAYA-MAYA ⇄ MAZALA
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

        {/* Cadre Métadonnées Bordereau */}
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '18px',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '9pt' }}>
            <div>
              <strong style={{ color: '#4B5563' }}>N° Bordereau :</strong> <span style={{ color: 'var(--brand)', fontWeight: 800 }}>{slip.numeroBordereau}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Date d'expédition :</strong> <span style={{ color: '#111111' }}>{formatDate(slip.dateTransfert)}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Statut :</strong> <span className="badge badge-black">Conforme & Certifié</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Site d'Origine (Départ) :</strong> <span style={{ color: '#111111' }}>{slip.siteDepart}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Site de Destination (Arrivée) :</strong> <span style={{ color: '#111111' }}>{slip.siteArrivee}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Véhicule / Immat. :</strong> <span style={{ color: '#111111' }}>{slip.vehicule}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Transporteur / Chauffeur :</strong> <span style={{ color: '#111111' }}>{slip.chauffeurNom}</span>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Total Boîtes Transférées :</strong> <strong style={{ color: '#111111' }}>{slip.totalBoites} cartons</strong>
            </div>
            <div>
              <strong style={{ color: '#4B5563' }}>Total Conventions :</strong> <strong style={{ color: 'var(--brand)' }}>{formatNumber(slip.totalConventions)}</strong>
            </div>
          </div>
        </div>

        {/* Détail des Liasses & Boîtes */}
        <div style={{ marginBottom: '20px' }}>
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
            LOTS ET AGENCES TRANSFÉRÉS
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--brand)', color: '#FFFFFF' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid var(--brand)', color: '#FFFFFF' }}>AGENCE</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid var(--brand)', width: '70px', color: '#FFFFFF' }}>CODE</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid var(--brand)', width: '80px', color: '#FFFFFF' }}>EXERCICE</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid var(--brand)', width: '90px', color: '#FFFFFF' }}>BOÎTES</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid var(--brand)', width: '120px', color: '#FFFFFF' }}>CONVENTIONS</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid var(--brand)', color: '#FFFFFF' }}>CONTRÔLE / ÉTAT</th>
              </tr>
            </thead>
            <tbody>
              {slip.lignes.map((l, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF', color: '#111111' }}>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', fontWeight: 700, color: '#111111' }}>{l.agenceNom}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#4B5563' }}>{l.code}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#4B5563' }}>{l.exercice}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 700, color: '#111111' }}>{l.boites}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 800, color: 'var(--brand)' }}>
                    {formatNumber(l.conventions)}
                  </td>
                  <td style={{ padding: '7px 10px', border: '1px solid #E5E7EB', color: '#111111' }}>{l.traitement}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#F9FAFB', fontWeight: 900, borderTop: '2px solid var(--brand)', color: '#111111' }}>
                <td colSpan={3} style={{ padding: '8px 10px', border: '1px solid #E5E7EB', textAlign: 'right', color: '#111111' }}>
                  TOTAL CHARGEMENT :
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #E5E7EB', textAlign: 'right', fontSize: '9.5pt', color: '#111111', fontWeight: 800 }}>
                  {slip.totalBoites}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #E5E7EB', textAlign: 'right', color: 'var(--brand)', fontSize: '10pt', fontWeight: 900 }}>
                  {formatNumber(slip.totalConventions)}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #E5E7EB', color: '#059669', fontWeight: 700 }}>
                  ✓ Validé à la sortie
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {slip.observations && (
          <div style={{
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '24px',
            backgroundColor: '#F9FAFB',
            fontSize: '8.5pt',
            color: '#374151'
          }}>
            <strong style={{ color: '#111111' }}>Observations de transport :</strong> {slip.observations}
          </div>
        )}

        {/* BLOC DES SIGNATURES OFFICIELLES (3 VOLETS) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginTop: '28px',
          marginBottom: '24px'
        }}>
          {/* Départ */}
          <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#111111' }}>
              EXPÉDITION (MAYA-MAYA)
            </div>
            <div style={{ fontSize: '7.5pt', color: '#6B7280', marginTop: '2px' }}>
              Visa du Chef d'équipe
            </div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: 'var(--brand)', borderTop: '1px dashed #D1D5DB', paddingTop: '4px' }}>
              {slip.responsableDepart}
            </div>
          </div>

          {/* Transporteur */}
          <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#111111' }}>
              PRISE EN CHARGE CHAUFFEUR
            </div>
            <div style={{ fontSize: '7.5pt', color: '#6B7280', marginTop: '2px' }}>
              Signature du transporteur
            </div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: '#111111', borderTop: '1px dashed #D1D5DB', paddingTop: '4px' }}>
              {slip.chauffeurNom}
            </div>
          </div>

          {/* Réception */}
          <div style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#111111' }}>
              DÉCHARGE / RÉCEPTION (MAZALA)
            </div>
            <div style={{ fontSize: '7.5pt', color: '#6B7280', marginTop: '2px' }}>
              Contrôle et émargement
            </div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: '#111111', borderTop: '1px dashed #D1D5DB', paddingTop: '4px' }}>
              {slip.responsableArrivee}
            </div>
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--brand)',
          paddingTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: '#6B7280'
        }}>
          <span>ARCHIVA — Gestion des Archives UBA Congo</span>
          <span>Bordereau officiel de décharge juridique</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
