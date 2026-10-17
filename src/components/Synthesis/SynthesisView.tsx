import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatNumber, formatDate } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  Download,
  Printer,
  FileText,
  Lock,
  Users,
  Sparkles,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SynthesisView: React.FC = () => {
  const { synthesisReports, compileSynthesisFromReports } = useData();
  const { currentUser } = useAuth();
  const isStagiaire = currentUser?.role === 'stagiaire' || currentUser?.role === 'user';

  const [activeMode, setActiveMode] = useState<'chef_confidentiel' | 'equipe_public'>(isStagiaire ? 'equipe_public' : 'chef_confidentiel');
  const [showCompilerModal, setShowCompilerModal] = useState(false);

  // Compiler form states
  const [dateDebutCompil, setDateDebutCompil] = useState('2026-09-28');
  const [dateFinCompil, setDateFinCompil] = useState('2026-10-09');
  const [compilFeedback, setCompilFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const synthesis = synthesisReports[0];

  const handleDownloadPdf = async () => {
    if (!synthesis) return;
    const filename = activeMode === 'chef_confidentiel'
      ? `Synthese_Archives_UBA_CHEF_CONFIDENTIEL_${synthesis.dateDebut}_${synthesis.dateFin}`
      : `Synthese_Archives_UBA_EQUIPE_STAGIAIRES_${synthesis.dateDebut}_${synthesis.dateFin}`;
    await exportElementToPdf('synthesis-printable-doc', filename);
  };

  const handleExportWord = () => {
    if (!synthesis) return;
    const element = document.getElementById('synthesis-printable-doc');
    if (!element) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Synthese UBA</title></head><body style="font-family: Arial, sans-serif; background-color: #080808; color: #FFFFFF;">`;
    const footer = `</body></html>`;
    const sourceHTML = header + element.innerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synthese_UBA_${synthesis.dateDebut}_${synthesis.dateFin}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCompile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = compileSynthesisFromReports(dateDebutCompil, dateFinCompil, activeMode);
    if (res.success) {
      setCompilFeedback({ type: 'success', message: res.message });
      setShowCompilerModal(false);
    } else {
      setCompilFeedback({ type: 'error', message: res.message });
    }
  };

  if (!synthesis) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Synthèses de Période
            </h1>
            <div style={{ fontSize: '0.95rem', color: '#D9D9D9', marginTop: '4px' }}>
              0 synthèse enregistrée
            </div>
          </div>
          {!isStagiaire && (
            <button onClick={() => setShowCompilerModal(true)} className="btn btn-primary btn-sm">
              <Sparkles size={16} /> + Compiler automatiquement depuis les rapports
            </button>
          )}
        </div>
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#D9D9D9' }}>
          Aucune synthèse disponible. Cliquez sur le bouton ci-dessus pour compiler les rapports journaliers.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header & Controls — Noir Verre, Rouge, Blanc */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: 'rgba(14, 14, 14, 0.85)',
        padding: '16px 22px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Synthèse d'Activité des Archives
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            Période officielle du {formatDate(synthesis.dateDebut)} au {formatDate(synthesis.dateFin)}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Dual Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(6, 6, 6, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <button
              onClick={() => {
                if (isStagiaire) {
                  alert("Accès confidentiel réservé au Chef d'équipe.");
                  return;
                }
                setActiveMode('chef_confidentiel');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isStagiaire ? 'not-allowed' : 'pointer',
                background: activeMode === 'chef_confidentiel' ? 'var(--uba-red)' : 'transparent',
                color: '#FFFFFF',
                opacity: isStagiaire ? 0.45 : 1
              }}
            >
              <Lock size={14} /> Chef (Confidentiel)
            </button>
            <button
              onClick={() => setActiveMode('equipe_public')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: activeMode === 'equipe_public' ? 'var(--uba-anthracite)' : 'transparent',
                color: '#FFFFFF'
              }}
            >
              <Users size={14} /> Équipe (Public)
            </button>
          </div>

          {!isStagiaire && (
            <button onClick={() => setShowCompilerModal(true)} className="btn btn-secondary btn-sm">
              <Sparkles size={15} /> Compiler automatique
            </button>
          )}
          <button onClick={handleExportWord} className="btn btn-secondary btn-sm">
            <FileCode size={15} /> Export Word (.doc)
          </button>
          <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm">
            <Download size={15} /> Télécharger PDF
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={15} /> Imprimer
          </button>
        </div>
      </div>

      {compilFeedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          backgroundColor: 'var(--uba-anthracite)',
          border: '1px solid var(--uba-silver-dark)',
          color: '#FFFFFF',
          fontSize: '0.92rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="var(--uba-red-bright)" />
          <span>{compilFeedback.message}</span>
          <button onClick={() => setCompilFeedback(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* A4 Document — Design Strict : NOIR, ROUGE, ÉCRITS EN BLANC */}
      <div
        id="synthesis-printable-doc"
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
          lineHeight: '1.35'
        }}
      >
        {/* BANDEAU EN-TÊTE ROUGE UBA */}
        <div style={{
          backgroundColor: '#E41E26',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '14pt', fontWeight: 900, letterSpacing: '0.03em' }}>
              RAPPORT DE SYNTHÈSE DES ARCHIVES UBA
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 600, opacity: 0.95, marginTop: '2px' }}>
              PÉRIODE : DU {formatDate(synthesis.dateDebut)} AU {formatDate(synthesis.dateFin)} · MAYA-MAYA & MAZALA
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '16pt',
              fontWeight: 900,
              border: '2px solid #FFFFFF',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              UBA
            </div>
            {activeMode === 'chef_confidentiel' && (
              <div style={{
                marginTop: '4px',
                backgroundColor: '#080808',
                color: '#FFFFFF',
                fontSize: '6.5pt',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '2px',
                letterSpacing: '0.05em',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                CONFIDENTIEL — CHEF
              </div>
            )}
          </div>
        </div>

        {/* ALERTE JOURS OUVRÉS MANQUANTS */}
        {synthesis.joursManquants && synthesis.joursManquants.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(227, 30, 36, 0.12)',
            border: '1px solid var(--uba-red)',
            borderRadius: '4px',
            padding: '8px 14px',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={18} color="var(--uba-red-bright)" />
            <div style={{ fontSize: '8pt', color: 'var(--uba-silver-light)' }}>
              <strong style={{ color: 'var(--uba-red-bright)' }}>{synthesis.joursManquants.length} jour(s) ouvré(s) sans rapport</strong> détecté(s) sur la période : {synthesis.joursManquants.map(j => formatDate(j)).join(', ')}.
            </div>
          </div>
        )}

        {/* 1. INFORMATIONS GÉNÉRALES (Modèle Officiel UBA) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#E41E26' }} />
            1. INFORMATIONS GÉNÉRALES
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Structure</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>United Bank for Africa (UBA)</td>
                <td style={{ width: '22%', padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Service</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>Archives / Équipe archiviste</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Rapporteur</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF', fontWeight: 700 }}>{synthesis.creePar || currentUser?.nomComplet || 'Chef Archiviste'}</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Période couverte</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>Du {formatDate(synthesis.dateDebut)} au {formatDate(synthesis.dateFin)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Nombre de jours ouvrés</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF', fontWeight: 700 }}>{synthesis.joursCouverts} jour(s) ouvré(s)</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Date de rédaction</td>
                <td style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>{formatDate(synthesis.dateCreation.split('T')[0])}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, backgroundColor: '#141414', border: '1px solid #282828', color: '#FFFFFF' }}>Statut du rapport</td>
                <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #282828', color: '#FFFFFF' }}>
                  <strong style={{ color: 'var(--uba-red-bright)' }}>Définitif</strong> {activeMode === 'chef_confidentiel' && '(Volet Confidentiel Chef)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. RÉSUMÉ GÉNÉRAL DES ACTIVITÉS (3 Indicateurs Essentiels) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '4px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#E41E26' }} />
            2. RÉSUMÉ GÉNÉRAL DES ACTIVITÉS
          </div>
          <p style={{ fontSize: '7.8pt', color: '#D9D9D9', margin: '0 0 8px 0', fontStyle: 'italic' }}>
            Présentation des trois indicateurs essentiels du travail effectué sur la période.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#E41E26', color: '#FFFFFF' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #E41E26', width: '70%' }}>INDICATEUR MAJEUR</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #E41E26', width: '30%' }}>QUANTITÉ</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', fontWeight: 700 }}>
                  Dossiers traités ou transmis
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', textAlign: 'right', fontWeight: 900, color: 'var(--uba-red-bright)', fontSize: '10.5pt' }}>
                  {formatNumber(synthesis.dossiersTraites)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#0B0B0B', color: '#FFFFFF' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', fontWeight: 700 }}>
                  Dossiers en attente
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', textAlign: 'right', fontWeight: 900, color: '#D9D9D9', fontSize: '10.5pt' }}>
                  {formatNumber(synthesis.dossiersEnAttente)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#161616', color: '#FFFFFF', borderTop: '2px solid #E41E26' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', fontWeight: 900 }}>
                  TOTAL GÉNÉRAL
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #282828', textAlign: 'right', fontWeight: 900, color: '#FFFFFF', fontSize: '11pt' }}>
                  {formatNumber(synthesis.totalGlobal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABLEAU PAR AGENCE — NOIR & ROUGE & BLANC */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10pt',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#E41E26' }} />
            AVANCEMENT PAR AGENCE
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#E41E26', color: '#FFFFFF' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', border: '1px solid #E41E26' }}>AGENCE</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E41E26' }}>CODE</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26' }}>TRAITÉ</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26' }}>EN ATTENTE</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26' }}>TOTAL</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #E41E26' }}>TAUX</th>
              </tr>
            </thead>
            <tbody>
              {synthesis.repartitionAgences.map((ag, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? '#141414' : '#0B0B0B', color: '#FFFFFF' }}>
                  <td style={{ padding: '7px 10px', border: '1px solid #282828', fontWeight: 700 }}>{ag.nom}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #282828', color: '#D9D9D9' }}>{ag.code}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #282828', fontWeight: 800, color: 'var(--uba-red-bright)' }}>
                    {formatNumber(ag.traite)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #282828', color: '#D9D9D9' }}>
                    {formatNumber(ag.attente)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #282828', fontWeight: 700, color: '#FFFFFF' }}>
                    {formatNumber(ag.total)}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', border: '1px solid #282828', fontWeight: 800, color: '#FFFFFF' }}>
                    {ag.taux}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MATRICE T / A / O (Uniquement mode chef) — NOIR & ROUGE & BLANC */}
        {activeMode === 'chef_confidentiel' && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10pt',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: '#E41E26' }} />
                MATRICE STATUT PAR EXERCICE (T / A / O)
              </div>
              <div style={{ fontSize: '7.5pt', display: 'flex', gap: '10px', fontWeight: 700, color: '#FFFFFF' }}>
                <span><span style={{ color: 'var(--uba-red-bright)' }}>● T</span> = Traité</span>
                <span><span style={{ color: '#A6A6A6' }}>● A</span> = En Attente</span>
                <span><span style={{ color: '#8F1015' }}>● O</span> = Oublié</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#181818', color: '#FFFFFF' }}>
                  <th style={{ padding: '6px', textAlign: 'left', width: '140px', border: '1px solid #303030' }}>AGENCE</th>
                  {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].map(yr => (
                    <th key={yr} style={{ padding: '6px', border: '1px solid #303030' }}>{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {synthesis.matrice.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #282828', backgroundColor: idx % 2 === 1 ? '#141414' : '#0B0B0B' }}>
                    <td style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, border: '1px solid #282828', color: '#FFFFFF' }}>
                      {row.agenceNom} <span style={{ color: '#A6A6A6', fontSize: '7pt' }}>({row.code})</span>
                    </td>
                    {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].map(yr => {
                      const st = row.annees[yr] || '-';
                      let color = '#D9D9D9';
                      let bg = 'transparent';
                      let label = '-';

                      if (st === 'T') {
                        color = '#FFFFFF';
                        bg = 'var(--uba-red)';
                        label = 'T';
                      } else if (st === 'A') {
                        color = '#D9D9D9';
                        bg = 'var(--uba-anthracite)';
                        label = 'A';
                      } else if (st === 'O') {
                        color = '#FFFFFF';
                        bg = 'var(--uba-red-dark)';
                        label = 'O';
                      }

                      return (
                        <td key={yr} style={{ padding: '6px', border: '1px solid #282828' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            lineHeight: '20px',
                            borderRadius: '3px',
                            backgroundColor: bg,
                            color,
                            fontWeight: 800,
                            fontSize: '8pt',
                            border: bg !== 'transparent' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                          }}>
                            {label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* POINTS CRITIQUES (Uniquement mode chef) */}
        {activeMode === 'chef_confidentiel' && (
          <div style={{
            border: '1px solid #E41E26',
            backgroundColor: 'rgba(227, 30, 36, 0.1)',
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '9pt', color: 'var(--uba-red-bright)', marginBottom: '6px' }}>
              POINTS CRITIQUES DE GOUVERNANCE
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8.5pt', color: '#FFFFFF', lineHeight: 1.5 }}>
              {synthesis.pointsAConfirmer.map((pt, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>{pt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* SIGNATURES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginTop: '18px',
          borderTop: '1px solid #303030',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '8pt', color: '#D9D9D9' }}>
            Compilé par : <strong style={{ color: '#FFFFFF' }}>{synthesis.creePar}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#FFFFFF' }}>
              LE CHEF D'ÉQUIPE DES ARCHIVES
            </div>
            <div style={{ fontSize: '9pt', color: 'var(--uba-red-bright)', fontWeight: 800, marginTop: '16px' }}>
              {currentUser?.nomComplet || synthesis.creePar || 'Le Chef d\'équipe'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Compiler */}
      {showCompilerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--uba-red-bright)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Compilateur Automatique
                </h3>
              </div>
              <button onClick={() => setShowCompilerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#D9D9D9', marginBottom: '18px' }}>
              Sélectionnez une période. Le logiciel calcule automatiquement les totaux et produit la synthèse officielle UBA.
            </p>

            <form onSubmit={handleCompile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label">Date Début</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateDebutCompil}
                    onChange={e => setDateDebutCompil(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateFinCompil}
                    onChange={e => setDateFinCompil(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCompilerModal(false)} className="btn btn-secondary btn-sm">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Sparkles size={15} /> Compiler la synthèse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
