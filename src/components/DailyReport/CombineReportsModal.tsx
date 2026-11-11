import React, { useState, useMemo } from 'react';
import { DailyReport } from '../../types';
import { formatDate, formatNumber } from '../../utils/formatters';
import {
  Files,
  X,
  CheckSquare,
  Square,
  ChevronRight,
  Calendar,
  User,
  Hash,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter
} from 'lucide-react';

interface CombineReportsModalProps {
  reports: DailyReport[];
  initialSelectedIds?: string[];
  onCombine: (selectedReports: DailyReport[]) => void;
  onClose: () => void;
}

export const CombineReportsModal: React.FC<CombineReportsModalProps> = ({
  reports,
  initialSelectedIds = [],
  onCombine,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valide' | 'brouillon'>('all');

  // Détection automatique de tous les rapports disponibles (tri chronologique par date d'activité)
  const availableReports = useMemo(() => {
    return [...reports]
      .filter(r => !r.archived)
      .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
  }, [reports]);

  // Filtrage intelligent selon la recherche et le statut
  const filteredReports = useMemo(() => {
    return availableReports.filter(r => {
      if (statusFilter !== 'all' && r.statut !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.titre.toLowerCase().includes(q) ||
        r.chefNom.toLowerCase().includes(q) ||
        (r.superviseurs && r.superviseurs.some(s => s.toLowerCase().includes(q))) ||
        (r.transferts && r.transferts.some(t => t.agenceNom.toLowerCase().includes(q))) ||
        formatDate(r.dateDebut).includes(q)
      );
    });
  }, [availableReports, searchQuery, statusFilter]);

  const toggleReport = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredReports.map(r => r.id);
    const areAllSelected = allFilteredIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Sélections rapides intelligentes
  const selectRecent = (count: number) => {
    const recentIds = availableReports.slice(0, count).map(r => r.id);
    setSelectedIds(new Set(recentIds));
  };

  const selectValidatedOnly = () => {
    const valIds = availableReports.filter(r => r.statut === 'valide').map(r => r.id);
    setSelectedIds(new Set(valIds));
  };

  const handleCombine = () => {
    // Ordonnancement chronologique strict par date croissante (du plus ancien au plus récent)
    const selected = availableReports
      .filter(r => selectedIds.has(r.id))
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    onCombine(selected);
  };

  const selectedCount = selectedIds.size;
  const isAllFilteredSelected = filteredReports.length > 0 && filteredReports.every(r => selectedIds.has(r.id));

  // Statistiques en direct du lot sélectionné
  const selectedReports = availableReports.filter(r => selectedIds.has(r.id));
  const totalConventions = selectedReports.reduce((s, r) => s + (r.totalCalcule || 0), 0);
  const totalBoites = selectedReports.reduce((s, r) => s + r.transferts.reduce((b, t) => b + (t.boites || 0), 0), 0);
  const distinctAgencies = new Set(selectedReports.flatMap(r => r.transferts.map(t => t.agenceNom))).size;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 3, 3, 0.90)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '12px',
        maxWidth: '820px',
        width: '100%',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 50px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#171717',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(216, 30, 5, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(216, 30, 5, 0.3)'
            }}>
              <Files size={22} color="var(--uba-red-bright)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Combiner les Rapports Journaliers
                </h2>
                <span className="badge badge-red" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  A4 Intégral
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF', margin: '2px 0 0' }}>
                Détection automatique de <strong style={{ color: '#FFFFFF' }}>{availableReports.length}</strong> rapports disponibles. Concaténation chronologique sans synthèse.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon" title="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#141414',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Champ recherche */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Filtrer par date, superviseur, titre, agence..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.88rem' }}
            />
          </div>

          {/* Raccourcis de sélection automatique */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="btn btn-secondary btn-sm"
              style={{ height: '38px', fontSize: '0.82rem', gap: '5px' }}
            >
              {isAllFilteredSelected ? <CheckSquare size={15} color="var(--uba-red-bright)" /> : <Square size={15} />}
              {isAllFilteredSelected ? 'Désélectionner' : 'Tout cocher'}
            </button>

            {availableReports.length >= 3 && (
              <button
                type="button"
                onClick={() => selectRecent(3)}
                className="btn btn-ghost btn-sm"
                style={{ height: '38px', fontSize: '0.8rem', color: '#D9D9D9' }}
                title="Sélectionner les 3 derniers rapports"
              >
                <Sparkles size={14} style={{ marginRight: '4px', color: 'var(--uba-red-bright)' }} />
                Derniers 3
              </button>
            )}

            {availableReports.length >= 5 && (
              <button
                type="button"
                onClick={() => selectRecent(5)}
                className="btn btn-ghost btn-sm"
                style={{ height: '38px', fontSize: '0.8rem', color: '#D9D9D9' }}
                title="Sélectionner les 5 derniers rapports"
              >
                Derniers 5
              </button>
            )}

            <button
              type="button"
              onClick={selectValidatedOnly}
              className="btn btn-ghost btn-sm"
              style={{ height: '38px', fontSize: '0.8rem', color: '#D9D9D9' }}
              title="Sélectionner uniquement les rapports au statut validé"
            >
              Validés seuls
            </button>
          </div>
        </div>

        {/* Liste des Rapports Détectés */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
              <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF' }}>Aucun rapport trouvé</div>
              <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>Modifiez vos critères de recherche.</p>
            </div>
          ) : (
            filteredReports.map(rep => {
              const isSelected = selectedIds.has(rep.id);
              const totalBoitesRep = rep.transferts.reduce((s, t) => s + (t.boites || 0), 0);
              const agencesRep = Array.from(new Set(rep.transferts.map(t => t.agenceNom)));

              return (
                <div
                  key={rep.id}
                  onClick={() => toggleReport(rep.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: isSelected
                      ? '1.5px solid var(--uba-red-bright)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected
                      ? 'rgba(216, 30, 5, 0.09)'
                      : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Case à cocher */}
                  <div style={{ flexShrink: 0 }}>
                    {isSelected
                      ? <CheckSquare size={22} color="var(--uba-red-bright)" />
                      : <Square size={22} color="#6B7280" />
                    }
                  </div>

                  {/* Date Badge */}
                  <div style={{
                    minWidth: '95px',
                    textAlign: 'center',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'rgba(216, 30, 5, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '1px solid rgba(216, 30, 5, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {formatDate(rep.dateDebut)}
                    </div>
                    {rep.dateFin !== rep.dateDebut && (
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                        au {formatDate(rep.dateFin)}
                      </div>
                    )}
                  </div>

                  {/* Détails du Rapport */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: '#FFFFFF'
                      }}>
                        {rep.titre}
                      </span>
                      <span className={`badge ${rep.statut === 'valide' ? 'badge-white' : 'badge-black'}`} style={{ fontSize: '0.7rem' }}>
                        {rep.statut === 'valide' ? 'Validé' : 'Brouillon'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#9CA3AF' }}>
                        <User size={13} color="var(--uba-red-bright)" /> Chef : <strong style={{ color: '#E5E7EB' }}>{rep.chefNom}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#9CA3AF' }}>
                        <Hash size={13} /> {rep.presents}/{rep.effectifTotal} présents
                      </span>
                      {agencesRep.length > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                          Agences : <span style={{ color: '#D9D9D9' }}>{agencesRep.slice(0, 3).join(', ')}{agencesRep.length > 3 ? ` (+${agencesRep.length - 3})` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chiffres à droite */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--uba-red-bright)' }}>
                      {formatNumber(rep.totalCalcule)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                      conv. · {totalBoitesRep} boîte{totalBoitesRep !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer avec Synthèse des Sélections & Boutons */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#171717',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Indicateurs cumulés en direct */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700 }}>
              <span style={{ color: selectedCount >= 2 ? 'var(--uba-red-bright)' : '#9CA3AF', fontSize: '1.1rem', fontWeight: 900 }}>
                {selectedCount}
              </span> rapport{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>

            {selectedCount >= 2 && (
              <div style={{ display: 'inline-flex', gap: '14px', padding: '4px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                  Total conventions : <strong style={{ color: 'var(--uba-red-bright)' }}>{formatNumber(totalConventions)}</strong>
                </span>
                <span style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                  Total boîtes : <strong style={{ color: '#FFFFFF' }}>{formatNumber(totalBoites)}</strong>
                </span>
                <span style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                  Agences : <strong style={{ color: '#FFFFFF' }}>{distinctAgencies}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button
              onClick={handleCombine}
              className="btn btn-primary"
              disabled={selectedCount < 2}
              title={selectedCount < 2 ? 'Sélectionnez au moins 2 rapports à combiner' : `Générer le document combiné (${selectedCount} rapports)`}
              style={{ gap: '8px', padding: '9px 18px' }}
            >
              <Files size={17} />
              Générer l'aperçu combiné
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
