import React, { useState } from 'react';
import { ReportCustomStyles } from '../../types';
import {
  X,
  Palette,
  Type,
  Table,
  FileText,
  Sliders,
  Check,
  RotateCcw,
  Layout,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DocumentCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customStyles: ReportCustomStyles;
  onUpdateStyles: (styles: ReportCustomStyles) => void;
  defaultTitle?: string;
}

export const DocumentCustomizerModal: React.FC<DocumentCustomizerModalProps> = ({
  isOpen,
  onClose,
  customStyles,
  onUpdateStyles,
  defaultTitle
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'titles' | 'tables' | 'colors' | 'typography' | 'signatures'>('titles');
  const [localStyles, setLocalStyles] = useState<ReportCustomStyles>({ ...customStyles });

  const updateField = <K extends keyof ReportCustomStyles>(key: K, value: ReportCustomStyles[K]) => {
    setLocalStyles(prev => ({ ...prev, [key]: value }));
  };

  const updateCustomLabel = (key: string, value: string) => {
    setLocalStyles(prev => ({
      ...prev,
      customLabels: {
        ...(prev.customLabels || {}),
        [key]: value
      }
    }));
  };

  const updateColumnVisibility = (colKey: string, visible: boolean) => {
    setLocalStyles(prev => ({
      ...prev,
      columnVisibility: {
        ...(prev.columnVisibility || {}),
        [colKey]: visible
      }
    }));
  };

  const handleApply = () => {
    onUpdateStyles(localStyles);
    onClose();
  };

  const handleResetDefaults = () => {
    const defaults: ReportCustomStyles = {
      headerColor: '#FF0000',
      headerTextColor: '#FFFFFF',
      headerTitleText: "RAPPORT D'ACTIVITÉ — ÉQUIPE ARCHIVISTE",
      headerSubtitleText: 'UBA CONGO · SITES MAYA-MAYA & MAZALA',
      headerLogoText: 'UBA',
      accentColor: '#FF0000',
      backgroundColor: '#FFFFFF',
      textColor: '#111111',
      borderColor: '#E5E7EB',
      tableZebraColor: '#F9FAFB',
      fontFamily: 'var(--font-sans)',
      fontScale: 'normal',
      tableDensity: 'normal',
      pageMargin: 'normal',
      customLabels: {},
      columnVisibility: {},
      signatory1Title: 'Le Chef de Mission / Responsable Archiviste',
      signatory1Name: 'Thony OBAKI',
      signatory2Title: 'Le Superviseur / Contrôle Qualité UBA',
      signatory2Name: 'Direction des Opérations',
      footerNote: 'Document interne confidentiel — UBA Congo. Reproduction et diffusion interdites sans autorisation.'
    };
    setLocalStyles(defaults);
  };

  const presetColors = [
    { name: 'Rouge UBA Officiel', bg: '#FF0000', text: '#FFFFFF' },
    { name: 'Rouge Rubis Sombre', bg: '#8A0000', text: '#FFFFFF' },
    { name: 'Noir & Graphite', bg: '#111111', text: '#FFFFFF' },
    { name: 'Bleu Institutionnel', bg: '#0A2540', text: '#FFFFFF' },
    { name: 'Bordeaux Banque', bg: '#6B0F1A', text: '#FFFFFF' }
  ];

  const presetBackgrounds = [
    { name: 'Blanc Pur Officiel (Recommandé)', color: '#FFFFFF' },
    { name: 'Blanc Ivoire Doux', color: '#FAFAF8' },
    { name: 'Papier Écru Léger', color: '#F8F9FA' }
  ];

  const fontOptions = [
    { label: 'Chakra Petch (Identité UBA)', value: 'var(--font-ui), "Chakra Petch", sans-serif' },
    { label: 'Inter (Haute lisibilité)', value: '"Inter", -apple-system, system-ui, sans-serif' },
    { label: 'JetBrains Mono (Technique / Chiffres)', value: 'var(--font-mono), monospace' },
    { label: 'Arial / Helvetica (Standard Bureau)', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia / Times (Serif Solennel)', value: 'Georgia, "Times New Roman", serif' }
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '780px',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--black-raised)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} style={{ color: 'var(--red)' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--white)', margin: 0 }}>
                Personnalisation Intégrale du Document
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--white-70)', margin: '2px 0 0' }}>
                Modifiez librement chaque titre, en-tête de tableau, couleur, police et densité d'impression.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon" title="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--black-panel)',
          overflowX: 'auto',
          padding: '4px 8px'
        }}>
          {[
            { id: 'titles', label: 'Titres & En-têtes', icon: Type },
            { id: 'tables', label: 'Tableaux & Colonnes', icon: Table },
            { id: 'colors', label: 'Couleurs & Fond', icon: Palette },
            { id: 'typography', label: 'Polices & Densité', icon: Sliders },
            { id: 'signatures', label: 'Signatures & Bas de page', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: active ? 800 : 600,
                  color: active ? 'var(--white)' : 'var(--white-70)',
                  backgroundColor: active ? 'var(--surface-2)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} style={{ color: active ? 'var(--red)' : 'inherit' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: TITRES & EN-TÊTES */}
          {activeTab === 'titles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Titre du Bandeau d'En-tête Officiel</label>
                <input
                  type="text"
                  className="form-input"
                  value={localStyles.headerTitleText ?? "RAPPORT D'ACTIVITÉ — ÉQUIPE ARCHIVISTE"}
                  onChange={e => updateField('headerTitleText', e.target.value)}
                  placeholder="RAPPORT D'ACTIVITÉ — ÉQUIPE ARCHIVISTE"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Sous-titre du Bandeau</label>
                <input
                  type="text"
                  className="form-input"
                  value={localStyles.headerSubtitleText ?? "UBA CONGO · SITES MAYA-MAYA & MAZALA"}
                  onChange={e => updateField('headerSubtitleText', e.target.value)}
                  placeholder="UBA CONGO · SITES MAYA-MAYA & MAZALA"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>Sigle / Acronyme En-tête</label>
                  <input
                    type="text"
                    className="form-input"
                    value={localStyles.headerLogoText ?? "UBA"}
                    onChange={e => updateField('headerLogoText', e.target.value)}
                    placeholder="UBA"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>Titre de la Section Synthèse</label>
                  <input
                    type="text"
                    className="form-input"
                    value={localStyles.customLabels?.['synthese_title'] ?? "SYNTHÈSE DE LA PÉRIODE"}
                    onChange={e => updateCustomLabel('synthese_title', e.target.value)}
                    placeholder="SYNTHÈSE DE LA PÉRIODE"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px', color: 'var(--red)' }}>
                  Intitulés des Sections (Modifiables à volonté)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Section 1</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec1_title'] ?? "1. INFORMATIONS GÉNÉRALES & ÉQUIPES"}
                      onChange={e => updateCustomLabel('sec1_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Section 2 (Groupes)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec2_title'] ?? "2. GROUPES DE TRAVAIL & COMPOSITION"}
                      onChange={e => updateCustomLabel('sec2_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Section 3 (Tâches)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec3_title'] ?? "3. TÂCHES RÉALISÉES DURANT LA MISSION"}
                      onChange={e => updateCustomLabel('sec3_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Section 4 (Mouvements)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec4_title'] ?? "4. RÉCAPITULATIF DES MOUVEMENTS PAR AGENCE"}
                      onChange={e => updateCustomLabel('sec4_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Section 5 (Observations)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec5_title'] ?? "5. OBSERVATIONS & REMARQUES PARTICULIÈRES"}
                      onChange={e => updateCustomLabel('sec5_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Section 6 (Signatures)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['sec6_title'] ?? "6. VALIDATION & SIGNATURES OFFICIELLES"}
                      onChange={e => updateCustomLabel('sec6_title', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLEAUX & COLONNES */}
          {activeTab === 'tables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Densité d'Affichage du Tableau A4</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'micro', label: 'Micro-Densité (Super compact)', desc: 'Padding 3px · Police 7pt' },
                    { id: 'compact', label: 'Compact (Optimisé A4)', desc: 'Padding 5px · Police 8pt' },
                    { id: 'normal', label: 'Normal (Standard)', desc: 'Padding 7px · Police 9pt' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updateField('tableDensity', d.id as any)}
                      className={`btn ${localStyles.tableDensity === d.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px 10px', height: 'auto' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{d.label}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px' }}>
                  Renommer les En-têtes de Colonnes du Tableau des Mouvements
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <label className="form-label">Colonne 1 (Exercice)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['col_exercice'] ?? "Exercice"}
                      onChange={e => updateCustomLabel('col_exercice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Colonne 2 (Agence)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['col_agence'] ?? "Agence"}
                      onChange={e => updateCustomLabel('col_agence', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Colonne 3 (Type / Traitement)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['col_type'] ?? "Type de Traitement"}
                      onChange={e => updateCustomLabel('col_type', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Colonne 4 (Boîtes)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['col_boites'] ?? "Boîtes Transférées"}
                      onChange={e => updateCustomLabel('col_boites', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Colonne 5 (Conventions)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.customLabels?.['col_conventions'] ?? "Conventions Traitées"}
                      onChange={e => updateCustomLabel('col_conventions', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px' }}>
                  Couleur des Lignes Alternées (Zébrures)
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={localStyles.tableZebraColor || '#F9FAFB'}
                    onChange={e => updateField('tableZebraColor', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ maxWidth: '140px' }}
                    value={localStyles.tableZebraColor || '#F9FAFB'}
                    onChange={e => updateField('tableZebraColor', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('tableZebraColor', '#FFFFFF')}
                    className="btn btn-secondary btn-sm"
                  >
                    Désactiver zébrures (100% Blanc)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COULEURS & FOND */}
          {activeTab === 'colors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Arrière-plan du Document (Papier Blanc Pur)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {presetBackgrounds.map(p => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => updateField('backgroundColor', p.color)}
                      className={`btn ${localStyles.backgroundColor === p.color ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', gap: '8px' }}
                    >
                      <span style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: p.color, border: '1px solid #ccc' }} />
                      <span style={{ fontSize: '0.78rem' }}>{p.name}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--white-70)' }}>Ou couleur libre :</span>
                  <input
                    type="color"
                    value={localStyles.backgroundColor || '#FFFFFF'}
                    onChange={e => updateField('backgroundColor', e.target.value)}
                    style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ maxWidth: '120px' }}
                    value={localStyles.backgroundColor || '#FFFFFF'}
                    onChange={e => updateField('backgroundColor', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Couleur du Bandeau d'En-tête</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {presetColors.map(c => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => {
                        updateField('headerColor', c.bg);
                        updateField('headerTextColor', c.text);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: c.bg }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Fond de l'en-tête</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="color"
                        value={localStyles.headerColor || '#FF0000'}
                        onChange={e => updateField('headerColor', e.target.value)}
                        style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={localStyles.headerColor || '#FF0000'}
                        onChange={e => updateField('headerColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Texte de l'en-tête</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="color"
                        value={localStyles.headerTextColor || '#FFFFFF'}
                        onChange={e => updateField('headerTextColor', e.target.value)}
                        style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={localStyles.headerTextColor || '#FFFFFF'}
                        onChange={e => updateField('headerTextColor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>Couleur d'Accentuation</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={localStyles.accentColor || '#FF0000'}
                      onChange={e => updateField('accentColor', e.target.value)}
                      style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.accentColor || '#FF0000'}
                      onChange={e => updateField('accentColor', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>Couleur des Bordures</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={localStyles.borderColor || '#E5E7EB'}
                      onChange={e => updateField('borderColor', e.target.value)}
                      style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.borderColor || '#E5E7EB'}
                      onChange={e => updateField('borderColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: POLICES & DENSITÉ */}
          {activeTab === 'typography' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Police de Caractères Principale</label>
                <select
                  className="form-select"
                  value={localStyles.fontFamily || 'var(--font-sans)'}
                  onChange={e => updateField('fontFamily', e.target.value)}
                >
                  {fontOptions.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Échelle de Taille de Texte A4</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'micro', label: 'Micro (6.5pt)', desc: 'Ultra-dense' },
                    { id: 'compact', label: 'Compact (8pt)', desc: 'Économique' },
                    { id: 'normal', label: 'Normal (9.5pt)', desc: 'Standard UBA' },
                    { id: 'spacious', label: 'Spacieux (10.5pt)', desc: 'Grand confort' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateField('fontScale', s.id as any)}
                      className={`btn ${localStyles.fontScale === s.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.label}</span>
                      <span style={{ fontSize: '0.66rem', opacity: 0.8 }}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Marges de la Page A4</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'narrow', label: 'Étroites (8mm)', desc: 'Plus de données' },
                    { id: 'normal', label: 'Normales (14mm)', desc: 'Équilibré' },
                    { id: 'wide', label: 'Larges (20mm)', desc: 'Formel' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateField('pageMargin', m.id as any)}
                      className={`btn ${localStyles.pageMargin === m.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{m.label}</span>
                      <span style={{ fontSize: '0.66rem', opacity: 0.8 }}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SIGNATURES & BAS DE PAGE */}
          {activeTab === 'signatures' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                <div style={{ border: '1px solid var(--line)', padding: '12px', borderRadius: '6px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--red)', marginBottom: '8px' }}>
                    Signataire 1 (Chef d'Équipe)
                  </h4>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="form-label">Titre / Fonction</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.signatory1Title ?? "Le Chef de Mission / Responsable Archiviste"}
                      onChange={e => updateField('signatory1Title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Nom du signataire</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.signatory1Name ?? "Thony OBAKI"}
                      onChange={e => updateField('signatory1Name', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--line)', padding: '12px', borderRadius: '6px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--red)', marginBottom: '8px' }}>
                    Signataire 2 (Superviseur / Direction)
                  </h4>
                  <div style={{ marginBottom: '8px' }}>
                    <label className="form-label">Titre / Fonction</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.signatory2Title ?? "Le Superviseur / Contrôle Qualité UBA"}
                      onChange={e => updateField('signatory2Title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Nom du signataire</label>
                    <input
                      type="text"
                      className="form-input"
                      value={localStyles.signatory2Name ?? "Direction des Opérations"}
                      onChange={e => updateField('signatory2Name', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Mention Légale & Note de Bas de Page</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={localStyles.footerNote ?? "Document interne confidentiel — UBA Congo. Reproduction et diffusion interdites sans autorisation."}
                  onChange={e => updateField('footerNote', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--line)',
          backgroundColor: 'var(--black-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>Réinitialiser par défaut</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Annuler
            </button>
            <button type="button" onClick={handleApply} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Check size={14} />
              <span>Appliquer les modifications</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
