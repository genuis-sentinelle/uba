import React, { useRef } from 'react';
import { TransferSlip } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';

interface TransferSlipPrintPreviewProps {
  slip: TransferSlip;
  onClose: () => void;
}

export const TransferSlipPrintPreview: React.FC<TransferSlipPrintPreviewProps> = ({ slip, onClose }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    await exportElementToPdf(
      'transfer-slip-printable-doc',
      `Bordereau_Decharge_UBA_${slip.numeroBordereau}`
    );
  };

  const handlePrint = () => {
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
          <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm">
            <Download size={14} /> Télécharger PDF
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={14} /> Imprimer
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* A4 Printable Sheet — Noir, Rouge, Blanc */}
      <div
        id="transfer-slip-printable-doc"
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
            <div style={{ fontSize: '14pt', fontWeight: 900, letterSpacing: '0.04em' }}>
              BORDEREAU OFFICIEL DE TRANSFERT & DÉCHARGE D'ARCHIVES
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95 }}>
              ROTATION LOGISTIQUE SÉCURISÉE · MAYA-MAYA ⇄ MAZALA
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

        {/* Cadre Métadonnées Bordereau */}
        <div style={{
          border: '1px solid #303030',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#121212'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '9pt' }}>
            <div>
              <strong>N° Bordereau :</strong> <span style={{ color: 'var(--uba-red-bright)', fontWeight: 800 }}>{slip.numeroBordereau}</span>
            </div>
            <div>
              <strong>Date d'expédition :</strong> {formatDate(slip.dateTransfert)}
            </div>
            <div>
              <strong>Statut :</strong> <span className="badge badge-white">Conforme & Certifié</span>
            </div>
            <div>
              <strong>Site d'Origine (Départ) :</strong> {slip.siteDepart}
            </div>
            <div>
              <strong>Site de Destination (Arrivée) :</strong> {slip.siteArrivee}
            </div>
            <div>
              <strong>Véhicule / Immat. :</strong> {slip.vehicule}
            </div>
            <div>
              <strong>Transporteur / Chauffeur :</strong> {slip.chauffeurNom}
            </div>
            <div>
              <strong>Total Boîtes Transférées :</strong> <strong>{slip.totalBoites} cartons</strong>
            </div>
            <div>
              <strong>Total Conventions :</strong> <strong style={{ color: 'var(--uba-red-bright)' }}>{formatNumber(slip.totalConventions)}</strong>
            </div>
          </div>
        </div>

        {/* Détail des Liasses & Boîtes */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '10px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '16px', backgroundColor: '#E41E26' }} />
            LOTS ET AGENCES TRANSFÉRÉS
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#E41E26', color: '#FFFFFF' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid #E41E26' }}>AGENCE</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E41E26', width: '70px' }}>CODE</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E41E26', width: '80px' }}>EXERCICE</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26', width: '90px' }}>BOÎTES</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26', width: '120px' }}>CONVENTIONS</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid #E41E26' }}>CONTRÔLE / ÉTAT</th>
              </tr>
            </thead>
            <tbody>
              {slip.lignes.map((l, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#141414' : '#0B0B0B', color: '#FFFFFF' }}>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', fontWeight: 700 }}>{l.agenceNom}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', textAlign: 'center', color: '#D9D9D9' }}>{l.code}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', textAlign: 'center', color: '#D9D9D9' }}>{l.exercice}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', textAlign: 'right', fontWeight: 700 }}>{l.boites}</td>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', textAlign: 'right', fontWeight: 800, color: 'var(--uba-red-bright)' }}>
                    {formatNumber(l.conventions)}
                  </td>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', color: '#FFFFFF' }}>{l.traitement}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#141414', fontWeight: 900, borderTop: '2px solid #E41E26', color: '#FFFFFF' }}>
                <td colSpan={3} style={{ padding: '8px 10px', border: '1px solid #282828', textAlign: 'right' }}>
                  TOTAL CHARGEMENT :
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #282828', textAlign: 'right', fontSize: '9.5pt' }}>
                  {slip.totalBoites}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #282828', textAlign: 'right', color: 'var(--uba-red-bright)', fontSize: '10pt' }}>
                  {formatNumber(slip.totalConventions)}
                </td>
                <td style={{ padding: '8px 10px', border: '1px solid #282828', color: '#FFFFFF' }}>
                  ✓ Validé à la sortie
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {slip.observations && (
          <div style={{
            border: '1px solid #303030',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '28px',
            backgroundColor: '#121212',
            fontSize: '8.5pt',
            color: '#D9D9D9'
          }}>
            <strong style={{ color: '#FFFFFF' }}>Observations de transport :</strong> {slip.observations}
          </div>
        )}

        {/* BLOC DES SIGNATURES OFFICIELLES (3 VOLETS) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginTop: '36px',
          marginBottom: '30px'
        }}>
          {/* Départ */}
          <div style={{ border: '1px solid #303030', backgroundColor: '#121212', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#FFFFFF' }}>
              EXPÉDITION (MAYA-MAYA)
            </div>
            <div style={{ fontSize: '7.5pt', color: '#A6A6A6', marginTop: '2px' }}>
              Visa du Chef d'équipe
            </div>
            <div style={{ height: '45px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: 'var(--uba-red-bright)', borderTop: '1px dashed #303030', paddingTop: '4px' }}>
              {slip.responsableDepart}
            </div>
          </div>

          {/* Transporteur */}
          <div style={{ border: '1px solid #303030', backgroundColor: '#121212', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#FFFFFF' }}>
              PRISE EN CHARGE CHAUFFEUR
            </div>
            <div style={{ fontSize: '7.5pt', color: '#A6A6A6', marginTop: '2px' }}>
              Signature du transporteur
            </div>
            <div style={{ height: '45px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: '#FFFFFF', borderTop: '1px dashed #303030', paddingTop: '4px' }}>
              {slip.chauffeurNom}
            </div>
          </div>

          {/* Réception */}
          <div style={{ border: '1px solid #303030', backgroundColor: '#121212', borderRadius: '4px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#FFFFFF' }}>
              DÉCHARGE / RÉCEPTION (MAZALA)
            </div>
            <div style={{ fontSize: '7.5pt', color: '#A6A6A6', marginTop: '2px' }}>
              Contrôle et émargement
            </div>
            <div style={{ height: '45px' }} />
            <div style={{ fontWeight: 700, fontSize: '8.5pt', color: '#FFFFFF', borderTop: '1px dashed #303030', paddingTop: '4px' }}>
              {slip.responsableArrivee}
            </div>
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid #E41E26',
          paddingTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: '#A6A6A6'
        }}>
          <span>ARCHIVA — Gestion des Archives UBA Congo</span>
          <span>Bordereau officiel de décharge juridique</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
};
