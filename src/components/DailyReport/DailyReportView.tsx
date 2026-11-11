import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DailyReport } from '../../types';
import { can } from '../../utils/permissions';
import { formatNumber, formatDate } from '../../utils/formatters';
import { todayLocal } from '../../utils/dates';
import { DailyReportEditor } from './DailyReportEditor';
import { DailyReportPrintPreview } from './DailyReportPrintPreview';
import { CombineReportsModal } from './CombineReportsModal';
import { CombinedReportsPrintPreview } from './CombinedReportsPrintPreview';
import { isReportArchivable } from '../../services/reportArchives';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Edit2,
  Copy,
  Search,
  Filter,
  Archive,
  RotateCcw,
  Files,
  CheckSquare,
  Square,
  X,
  ChevronRight,
  Eye
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

interface DailyReportViewProps {
  openedReportId?: string | null;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({ openedReportId }) => {
  const {
    dailyReports,
    addDailyReport,
    updateDailyReport,
    deleteDailyReport,
    archiveDocument,
    unarchiveDocument
  } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  const [isEditing, setIsEditing] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');

  // État du module de combinaison de rapports
  const [isCombining, setIsCombining] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [combinedReports, setCombinedReports] = useState<DailyReport[]>([]);

  // Aperçu standard d'un rapport individuel
  const [previewingReport, setPreviewingReport] = useState<DailyReport | null>(() => {
    if (openedReportId) {
      return dailyReports.find(r => r.id === openedReportId) || null;
    }
    return null;
  });

  const handleCreateNew = () => {
    setEditingReport(null);
    setIsEditing(true);
  };

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    setIsEditing(true);
  };

  const handleDuplicate = (source: DailyReport) => {
    const today = todayLocal();
    const duplicated: DailyReport = {
      ...source,
      id: 'rep-' + Date.now(),
      titre: `Rapport Journalier d'Activité — ${formatDate(today)}`,
      dateDebut: today,
      dateFin: today,
      version: 1,
      creePar: currentUser?.nomComplet || source.creePar,
      dateCreation: new Date().toISOString()
    };
    setEditingReport(duplicated);
    setIsEditing(true);
  };

  const handleSave = (report: DailyReport) => {
    const exists = dailyReports.some(r => r.id === report.id);
    if (exists) {
      updateDailyReport(report);
    } else {
      addDailyReport(report);
    }
    setIsEditing(false);
    setEditingReport(null);
    setPreviewingReport(report);
  };

  const handleArchive = async (rep: DailyReport) => {
    const { eligible, reason } = isReportArchivable('daily', rep);
    if (!eligible) {
      toast(reason || 'Ce rapport ne peut pas être archivé.', 'error');
      return;
    }
    const ok = await confirm({
      title: 'Archiver ce rapport ?',
      message: `Voulez-vous archiver le rapport "${rep.titre}" ? Une fois archivé, il deviendra immuable (non modifiable et non supprimable).`,
      confirmLabel: 'Archiver'
    });
    if (ok) {
      const note = window.prompt('Note ou motif d\'archivage (optionnel) :') || undefined;
      const res = await archiveDocument('daily', rep.id, note);
      if (res.success) {
        toast('Rapport archivé avec succès.', 'success');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const handleUnarchive = async (rep: DailyReport) => {
    const ok = await confirm({
      title: 'Désarchiver ce rapport ?',
      message: `Restaurer le rapport "${rep.titre}" dans les rapports actifs ?`,
      confirmLabel: 'Désarchiver'
    });
    if (ok) {
      const res = await unarchiveDocument('daily', rep.id);
      if (res.success) {
        toast('Rapport restauré dans les actifs avec succès.', 'success');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const activeReports = useMemo(() => dailyReports.filter(r => !r.archived), [dailyReports]);
  const activeReportsCount = activeReports.length;
  const archivedReportsCount = dailyReports.filter(r => r.archived).length;

  const filteredReports = useMemo(() => {
    return dailyReports.filter(r => {
      if (archiveFilter === 'active' && r.archived) return false;
      if (archiveFilter === 'archived' && !r.archived) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        r.titre.toLowerCase().includes(q) ||
        r.chefNom.toLowerCase().includes(q) ||
        r.transferts.some(t => t.agenceNom.toLowerCase().includes(q))
      );
    });
  }, [dailyReports, archiveFilter, searchFilter]);

  // Gestion des cases à cocher directes dans le tableau
  const toggleRowSelection = (id: string) => {
    setSelectedReportIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const currentSelectableReports = filteredReports.filter(r => !r.archived);
  const isAllCurrentSelected =
    currentSelectableReports.length > 0 &&
    currentSelectableReports.every(r => selectedReportIds.has(r.id));

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      setSelectedReportIds(new Set());
    } else {
      setSelectedReportIds(new Set(currentSelectableReports.map(r => r.id)));
    }
  };

  // Calculs sur les rapports cochés directement
  const directlySelectedReports = useMemo(() => {
    return dailyReports.filter(r => selectedReportIds.has(r.id));
  }, [dailyReports, selectedReportIds]);

  const selectedConventionsSum = directlySelectedReports.reduce((s, r) => s + (r.totalCalcule || 0), 0);
  const selectedBoitesSum = directlySelectedReports.reduce(
    (s, r) => s + r.transferts.reduce((b, t) => b + (t.boites || 0), 0),
    0
  );

  const handleOpenCombinedDirect = () => {
    if (directlySelectedReports.length < 2) {
      toast('Veuillez cocher au moins 2 rapports pour générer une combinaison.', 'info');
      return;
    }
    // Tri chronologique ascendant strict
    const sorted = [...directlySelectedReports].sort(
      (a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
    );
    setCombinedReports(sorted);
  };

  if (isEditing) {
    return (
      <DailyReportEditor
        initialReport={editingReport}
        onSave={handleSave}
        onCancel={() => {
          setIsEditing(false);
          setEditingReport(null);
        }}
      />
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {/* En-tête de la vue */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Rapports Journaliers d'Activité (R1)
            </h1>
            <span className="badge badge-black" style={{ border: '1px solid rgba(255,255,255,0.14)', fontSize: '0.8rem' }}>
              {activeReportsCount} disponible{activeReportsCount > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {activeReportsCount} actif(s) · {archivedReportsCount} archivé(s) · Détection automatique des rapports prêts à être combinés
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isStagiaire ? (
            <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '0.85rem', border: '1px solid var(--uba-anthracite)' }}>
              Mode Consultation (Lecture seule)
            </span>
          ) : (
            <>
              {dailyReports.length > 0 && (
                <button
                  onClick={() => handleDuplicate(dailyReports[0])}
                  className="btn btn-secondary"
                  title="Copie le dernier rapport avec les présents et superviseurs pré-remplis pour aujourd'hui"
                >
                  <Copy size={16} /> Dupliquer le dernier
                </button>
              )}

              {/* Bouton Système de Combinaison de Rapports */}
              {activeReportsCount >= 2 && (
                <button
                  onClick={() => setIsCombining(true)}
                  className="btn btn-secondary"
                  style={{
                    borderColor: 'var(--uba-red-bright)',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(216, 30, 5, 0.12)',
                    gap: '8px',
                    fontWeight: 800
                  }}
                  title="Ouvrir le module automatique de combinaison de rapports ordonnés par date"
                >
                  <Files size={17} color="var(--uba-red-bright)" />
                  <span>Combiner des rapports</span>
                  <span className="badge badge-red" style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px' }}>
                    {activeReportsCount}
                  </span>
                </button>
              )}

              <button onClick={handleCreateNew} className="btn btn-primary">
                <Plus size={18} /> + Nouveau Rapport
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={18} color="#D9D9D9" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Filtrer par titre, superviseur ou agence..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            style={{ paddingLeft: '40px', height: '42px', fontSize: '0.95rem' }}
          />
        </div>

        {/* Sélecteur Actifs / Archivés */}
        <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--uba-anthracite)' }}>
          <button
            type="button"
            onClick={() => setArchiveFilter('active')}
            className={`btn btn-sm ${archiveFilter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
          >
            Actifs ({activeReportsCount})
          </button>
          <button
            type="button"
            onClick={() => setArchiveFilter('archived')}
            className={`btn btn-sm ${archiveFilter === 'archived' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
          >
            <Archive size={14} style={{ marginRight: '4px' }} /> Archivés ({archivedReportsCount})
          </button>
          <button
            type="button"
            onClick={() => setArchiveFilter('all')}
            className={`btn btn-sm ${archiveFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
          >
            Tous ({dailyReports.length})
          </button>
        </div>

        {searchFilter && (
          <button onClick={() => setSearchFilter('')} className="btn btn-secondary btn-sm" style={{ height: '42px' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau des Rapports avec Sélection Intégrée */}
      <div className="uba-table-container">
        <table className="uba-table uba-table--cards">
          <thead>
            <tr>
              {/* Colonne de case à cocher pour sélection / combinaison */}
              <th style={{ width: '42px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={isAllCurrentSelected}
                  onChange={toggleSelectAllCurrent}
                  title="Tout cocher / décocher pour la combinaison"
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--uba-red-bright)' }}
                />
              </th>
              <th>Titre du rapport</th>
              <th>Période</th>
              <th>Chef d'équipe</th>
              <th>Effectif</th>
              <th style={{ textAlign: 'right' }}>Conventions</th>
              <th style={{ textAlign: 'right' }}>Boîtes</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right', width: '280px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '42px', color: '#D9D9D9', fontSize: '1.05rem' }}>
                  {searchFilter
                    ? 'Aucun rapport correspondant au filtre.'
                    : 'Aucun rapport journalier enregistré. Cliquez sur "+ Nouveau Rapport" ou "Dupliquer" pour commencer.'}
                </td>
              </tr>
            ) : (
              filteredReports.map(rep => {
                const isSelected = selectedReportIds.has(rep.id);
                return (
                  <tr
                    key={rep.id}
                    style={{
                      backgroundColor: isSelected ? 'rgba(216, 30, 5, 0.08)' : undefined
                    }}
                  >
                    {/* Case à cocher de ligne */}
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {!rep.archived ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rep.id)}
                          style={{ cursor: 'pointer', width: '17px', height: '17px', accentColor: 'var(--uba-red-bright)' }}
                          title="Cocher pour inclure dans la liasse combinée"
                        />
                      ) : (
                        <span style={{ opacity: 0.3 }}>—</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.02rem' }}>{rep.titre}</div>
                      <div style={{ fontSize: '0.82rem', color: '#D9D9D9', marginTop: '2px' }}>
                        Version {rep.version} · {rep.creePar}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                        {formatDate(rep.dateDebut)} au {formatDate(rep.dateFin)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#D9D9D9' }}>{rep.horaires}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.98rem' }}>{rep.chefNom}</span>
                    </td>
                    <td>
                      <span className="badge badge-black" style={{ fontSize: '0.88rem' }}>
                        {rep.presents} / {rep.effectifTotal}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--uba-red-bright)', fontSize: '1.15rem' }}>
                      {formatNumber(rep.totalCalcule)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.02rem', color: '#FFFFFF' }}>
                      {rep.transferts.reduce((sum, t) => sum + t.boites, 0)}
                    </td>
                    <td>
                      {rep.archived ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.2)',
                            color: '#F87171',
                            border: '1px solid rgba(220, 38, 38, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 800
                          }}
                        >
                          <Archive size={12} /> ARCHIVÉ
                        </span>
                      ) : (
                        <span className="badge badge-white">
                          {rep.statut === 'brouillon' ? 'Brouillon' : 'Validé'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setPreviewingReport(rep)}
                          className="btn btn-secondary btn-sm"
                          title="Imprimer / Exporter PDF ce rapport individuel"
                        >
                          <Printer size={15} /> Imprimer
                        </button>

                        {rep.archived ? (
                          can.unarchive(currentUser?.role) && (
                            <button
                              onClick={() => handleUnarchive(rep)}
                              className="btn btn-secondary btn-sm"
                              title="Désarchiver le rapport (Restaurer dans les actifs)"
                            >
                              <RotateCcw size={15} /> Désarchiver
                            </button>
                          )
                        ) : (
                          <>
                            {can.archive(currentUser?.role) && (
                              <button
                                onClick={() => handleArchive(rep)}
                                className="btn btn-secondary btn-sm"
                                title="Archiver ce document (Scellement immuable)"
                              >
                                <Archive size={15} /> Archiver
                              </button>
                            )}

                            {!isStagiaire && (
                              <>
                                <button
                                  onClick={() => handleDuplicate(rep)}
                                  className="btn btn-secondary btn-sm"
                                  title="Dupliquer pour aujourd'hui"
                                >
                                  <Copy size={15} />
                                </button>
                                <button
                                  onClick={() => handleEdit(rep)}
                                  className="btn btn-secondary btn-sm"
                                  title="Modifier"
                                >
                                  <Edit2 size={15} />
                                </button>
                                {can.deleteData(currentUser?.role) && (
                                  <button
                                    onClick={async () => {
                                      const ok = await confirm({
                                        title: 'Supprimer ce rapport ?',
                                        message: `Supprimer définitivement le rapport "${rep.titre}" ?`,
                                        confirmLabel: 'Supprimer',
                                        danger: true
                                      });
                                      if (ok) {
                                        deleteDailyReport(rep.id);
                                        toast(`Rapport "${rep.titre}" supprimé.`, 'info');
                                      }
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: '#DC2626' }}
                                    title="Supprimer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barre d'action flottante de sélection directe */}
      {selectedReportIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#121212',
          border: '1.5px solid var(--uba-red-bright)',
          borderRadius: '50px',
          padding: '10px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.85)',
          zIndex: 950,
          backdropFilter: 'blur(10px)',
          maxWidth: '92vw',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-red" style={{ fontSize: '0.82rem', padding: '3px 10px', borderRadius: '20px' }}>
              {selectedReportIds.size} sélectionné{selectedReportIds.size > 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#D9D9D9' }}>
              <strong style={{ color: 'var(--uba-red-bright)' }}>{formatNumber(selectedConventionsSum)}</strong> conv. · {selectedBoitesSum} btes
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleOpenCombinedDirect}
              className="btn btn-primary btn-sm"
              disabled={selectedReportIds.size < 2}
              style={{ borderRadius: '20px', gap: '6px', padding: '6px 14px' }}
              title={selectedReportIds.size < 2 ? 'Cochez au moins 2 rapports' : 'Générer directement la liasse A4 ordonnée'}
            >
              <Eye size={15} />
              <span>Aperçu Combiné A4</span>
            </button>

            <button
              onClick={() => setIsCombining(true)}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '20px', gap: '6px', padding: '6px 12px' }}
              title="Ouvrir le panneau complet avec filtres et détection automatique"
            >
              <Files size={15} />
              <span>Gérer le lot</span>
            </button>

            <button
              onClick={() => setSelectedReportIds(new Set())}
              className="btn btn-ghost btn-sm btn-icon"
              style={{ borderRadius: '50%', width: '32px', height: '32px' }}
              title="Désélectionner tout"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview A4 individuel */}
      {previewingReport && (
        <DailyReportPrintPreview
          report={previewingReport}
          onClose={() => setPreviewingReport(null)}
        />
      )}

      {/* Modal Détection Automatique et Sélection de Combinaison */}
      {isCombining && (
        <CombineReportsModal
          reports={dailyReports}
          initialSelectedIds={Array.from(selectedReportIds)}
          onCombine={(selected) => {
            setIsCombining(false);
            setCombinedReports(selected);
          }}
          onClose={() => setIsCombining(false)}
        />
      )}

      {/* Modal Aperçu Imprimable de la Liasse Combinée A4 */}
      {combinedReports.length > 0 && (
        <CombinedReportsPrintPreview
          reports={combinedReports}
          onClose={() => setCombinedReports([])}
        />
      )}
    </div>
  );
};
