import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DailyReport } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import { DailyReportEditor } from './DailyReportEditor';
import { DailyReportPrintPreview } from './DailyReportPrintPreview';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Edit2,
  Copy,
  Search,
  Filter
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

interface DailyReportViewProps {
  openedReportId?: string | null;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({ openedReportId }) => {
  const { dailyReports, addDailyReport, updateDailyReport, deleteDailyReport } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  const [isEditing, setIsEditing] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
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
    const today = new Date().toISOString().split('T')[0];
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
    setPreviewingReport(report); // Open printable preview immediately!
  };

  const filteredReports = dailyReports.filter(r => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.titre.toLowerCase().includes(q) ||
      r.chefNom.toLowerCase().includes(q) ||
      r.transferts.some(t => t.agenceNom.toLowerCase().includes(q))
    );
  });

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
    <div style={{ padding: '28px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Clean Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Rapports Journaliers d'Activité (R1)
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {dailyReports.length} rapport(s) d'activité enregistré(s)
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
                  <Copy size={16} /> Dupliquer le dernier rapport
                </button>
              )}

              <button onClick={handleCreateNew} className="btn btn-primary">
                <Plus size={18} /> + Nouveau Rapport
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="#D9D9D9" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Filtrer par titre, superviseur ou agence..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            style={{ paddingLeft: '40px', height: '46px', fontSize: '0.98rem' }}
          />
        </div>
        {searchFilter && (
          <button onClick={() => setSearchFilter('')} className="btn btn-secondary btn-sm">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
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
                <td colSpan={8} style={{ textAlign: 'center', padding: '42px', color: '#D9D9D9', fontSize: '1.05rem' }}>
                  {searchFilter ? 'Aucun rapport correspondant au filtre.' : 'Aucun rapport journalier enregistré. Cliquez sur "+ Nouveau Rapport" ou "Dupliquer" pour commencer.'}
                </td>
              </tr>
            ) : (
              filteredReports.map(rep => (
                <tr key={rep.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.02rem' }}>{rep.titre}</div>
                    <div style={{ fontSize: '0.82rem', color: '#D9D9D9', marginTop: '2px' }}>
                      Version {rep.version} · {rep.creePar}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>{formatDate(rep.dateDebut)} au {formatDate(rep.dateFin)}</div>
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
                    <span className="badge badge-white">Validé</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => setPreviewingReport(rep)}
                        className="btn btn-secondary btn-sm"
                        title="Imprimer / Exporter PDF"
                      >
                        <Printer size={15} /> Imprimer
                      </button>

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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Preview A4 */}
      {previewingReport && (
        <DailyReportPrintPreview
          report={previewingReport}
          onClose={() => setPreviewingReport(null)}
        />
      )}
    </div>
  );
};
