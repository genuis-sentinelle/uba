import React, { useState, useMemo } from 'react';
import { DailyReport } from '../../types';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Files, X, CheckSquare, Square, ChevronRight, Calendar, User, Hash } from 'lucide-react';

interface CombineReportsModalProps {
  reports: DailyReport[];
  onCombine: (selectedReports: DailyReport[]) => void;
  onClose: () => void;
}

export const CombineReportsModal: React.FC<CombineReportsModalProps> = ({
  reports,
  onCombine,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only show non-archived reports, sorted by dateDebut descending for selection
  const availableReports = useMemo(() =>
    [...reports]
      .filter(r => !r.archived)
      .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()),
    [reports]
  );

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

  const toggleAll = () => {
    if (selectedIds.size === availableReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableReports.map(r => r.id)));
    }
  };

  const handleCombine = () => {
    // Sort selected reports chronologically (ascending by dateDebut)
    const selected = availableReports
      .filter(r => selectedIds.has(r.id))
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    onCombine(selected);
  };

  const selectedCount = selectedIds.size;
  const isAllSelected = selectedIds.size === availableReports.length && availableReports.length > 0;

  // Quick stats for selected reports
  const selectedReports = availableReports.filter(r => selectedIds.has(r.id));
  const totalConventions = selectedReports.reduce((s, r) => s + (r.totalCalcule || 0), 0);
  const totalBoites = selectedReports.reduce((s, r) => s + r.transferts.reduce((b, t) => b + (t.boites || 0), 0), 0);

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Files size={20} color="var(--uba-red-bright)" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Combiner des Rapports Journaliers
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '2px 0 0' }}>
                Sélectionnez les rapports à réunir dans un document combiné ordonné par date
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon" title="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Select All Bar */}
        <div style={{
          padding: '10px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)'
        }}>
          <button
            type="button"
            onClick={toggleAll}
            className="btn btn-ghost btn-sm"
            style={{ gap: '6px', color: '#D9D9D9' }}
          >
            {isAllSelected ? <CheckSquare size={16} color="var(--uba-red-bright)" /> : <Square size={16} />}
            {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: selectedCount >= 2 ? 'var(--uba-red-bright)' : '#9CA3AF' }}>
            {selectedCount} rapport{selectedCount !== 1 ? 's' : ''} sélectionné{selectedCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Reports List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px'
        }}>
          {availableReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              Aucun rapport actif disponible pour la combinaison.
            </div>
          ) : (
            availableReports.map(rep => {
              const isSelected = selectedIds.has(rep.id);
              const totalBoitesRep = rep.transferts.reduce((s, t) => s + (t.boites || 0), 0);

              return (
                <div
                  key={rep.id}
                  onClick={() => toggleReport(rep.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: isSelected
                      ? '1.5px solid var(--uba-red-bright)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected
                      ? 'rgba(216, 30, 5, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ flexShrink: 0 }}>
                    {isSelected
                      ? <CheckSquare size={20} color="var(--uba-red-bright)" />
                      : <Square size={20} color="#6B7280" />
                    }
                  </div>

                  {/* Report Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {rep.titre}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        <Calendar size={12} /> {formatDate(rep.dateDebut)}
                        {rep.dateFin !== rep.dateDebut && <> → {formatDate(rep.dateFin)}</>}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        <User size={12} /> {rep.chefNom}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                        <Hash size={12} /> {rep.presents}/{rep.effectifTotal} présents
                      </span>
                    </div>
                  </div>

                  {/* Right stats */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--uba-red-bright)' }}>
                      {formatNumber(rep.totalCalcule)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      conv. · {totalBoitesRep} boîte{totalBoitesRep !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Summary & Actions */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)'
        }}>
          {/* Quick preview stats when 2+ selected */}
          {selectedCount >= 2 && (
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(216, 30, 5, 0.06)',
              border: '1px solid rgba(216, 30, 5, 0.15)'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                <strong style={{ color: 'var(--uba-red-bright)' }}>{selectedCount}</strong> rapports
              </div>
              <div style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                <strong style={{ color: 'var(--uba-red-bright)' }}>{formatNumber(totalConventions)}</strong> conventions cumulées
              </div>
              <div style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>
                <strong style={{ color: 'var(--uba-red-bright)' }}>{formatNumber(totalBoites)}</strong> boîtes cumulées
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button
              onClick={handleCombine}
              className="btn btn-primary"
              disabled={selectedCount < 2}
              title={selectedCount < 2 ? 'Sélectionnez au moins 2 rapports' : `Combiner ${selectedCount} rapports`}
              style={{ gap: '6px' }}
            >
              <Files size={16} />
              Aperçu combiné
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

