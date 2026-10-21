import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../ui/Feedback';
import {
  listArchives,
  downloadArchive,
  archiveNow,
  verifyArchiveIntegrity,
  getArchivePayload,
  ArchiveSnapshotMeta
} from '../../services/archives';
import {
  buildArchivedList
} from '../../services/reportArchives';
import { todayLocal, toISODateLocal } from '../../utils/dates';
import {
  ArchivedDocument,
  ArchivableKind,
  DailyReport,
  TransferSlip,
  SynthesisReport
} from '../../types';
import {
  Archive,
  Download,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Search,
  Eye,
  Printer,
  RotateCcw,
  FileText,
  Files,
  Truck,
  X,
  Copy,
  Check,
  Calendar,
  Lock
} from 'lucide-react';
import { can } from '../../utils/permissions';
import { formatDate, formatNumber } from '../../utils/formatters';
import { DailyReportPrintPreview } from '../DailyReport/DailyReportPrintPreview';
import { TransferSlipPrintPreview } from '../TransferSlips/TransferSlipPrintPreview';

export const ArchivesView: React.FC = () => {
  const { currentUser } = useAuth();
  const { dailyReports, synthesisReports, transferSlips, unarchiveDocument } = useData();
  const { toast, confirm } = useFeedback();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'documents' | 'snapshots'>('documents');

  // Tab 1: Documents Archivés
  const [docFilterType, setDocFilterType] = useState<'all' | ArchivableKind>('all');
  const [docSearch, setDocSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<ArchivedDocument | null>(null);

  // Tab 2: Clichés Hebdomadaires
  const [archives, setArchives] = useState<ArchiveSnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean>>({});

  // Modals Tab 2
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'week' | 'custom'>('week');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return toISODateLocal(d);
  });
  const [customEnd, setCustomEnd] = useState(() => todayLocal());

  const [inspectedSnapshot, setInspectedSnapshot] = useState<ArchiveSnapshotMeta | null>(null);
  const [inspectedPayload, setInspectedPayload] = useState<Record<string, unknown> | null>(null);
  const [loadingPayload, setLoadingPayload] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const canManageSnapshots = can.manageSnapshots(currentUser?.role);
  const canUnarchive = can.unarchive(currentUser?.role);
  const canPrint = can.print(currentUser?.role);

  // Compile archived documents list
  const allArchivedDocs = buildArchivedList(dailyReports, synthesisReports, transferSlips);

  const filteredDocs = allArchivedDocs.filter(doc => {
    if (docFilterType !== 'all' && doc.kind !== docFilterType) return false;
    if (!docSearch.trim()) return true;
    const q = docSearch.toLowerCase();
    return (
      doc.titre.toLowerCase().includes(q) ||
      (doc.archivedBy && doc.archivedBy.toLowerCase().includes(q)) ||
      (doc.archiveNote && doc.archiveNote.toLowerCase().includes(q))
    );
  });

  const fetchSnapshotList = async () => {
    setLoading(true);
    try {
      const data = await listArchives();
      setArchives(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'snapshots' && canManageSnapshots) {
      fetchSnapshotList();
    }
  }, [activeTab, canManageSnapshots]);

  const handleArchiveNow = async () => {
    if (!canManageSnapshots) {
      toast('Action réservée aux administrateurs.', 'error');
      return;
    }

    const ok = await confirm({
      title: 'Créer une archive maintenant ?',
      message: 'Un cliché complet et immuable de toutes les activités de la semaine sera scellé avec calcul d\'empreinte SHA-256.',
      confirmLabel: 'Archiver maintenant'
    });

    if (!ok) return;

    setArchiving(true);
    try {
      const res = await archiveNow();
      if (res.success) {
        toast(res.message, 'success');
        await fetchSnapshotList();
      } else {
        toast(`Échec de l'archivage : ${res.message}`, 'error');
      }
    } finally {
      setArchiving(false);
    }
  };

  const handleInspectSnapshot = async (arch: ArchiveSnapshotMeta) => {
    setInspectedSnapshot(arch);
    setInspectedPayload(null);
    setLoadingPayload(true);
    setCopiedHash(false);
    try {
      const payload = await getArchivePayload(arch.id);
      setInspectedPayload(payload);
    } finally {
      setLoadingPayload(false);
    }
  };

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast('Empreinte SHA-256 copiée dans le presse-papiers.', 'info');
    } catch {
      toast('Impossible de copier l\'empreinte.', 'error');
    }
  };

  const handleCreateCustomSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSnapshots) return;

    const pStart = createMode === 'custom' ? customStart : undefined;
    const pEnd = createMode === 'custom' ? customEnd : undefined;

    setArchiving(true);
    setShowCreateModal(false);
    try {
      const res = await archiveNow(pStart, pEnd);
      if (res.success) {
        toast(res.message, 'success');
        await fetchSnapshotList();
      } else {
        toast(`Échec de l'archivage : ${res.message}`, 'error');
      }
    } finally {
      setArchiving(false);
    }
  };

  const handleDownloadSnapshot = async (arch: ArchiveSnapshotMeta) => {
    toast('Préparation du téléchargement de l\'archive...', 'info');
    const ok = await downloadArchive(arch.id);
    if (ok) {
      toast('Archive téléchargée avec succès.', 'success');
    } else {
      toast('Impossible de télécharger l\'archive.', 'error');
    }
  };

  const handleVerifySnapshot = async (id: string) => {
    setVerifyingId(id);
    try {
      const isValid = await verifyArchiveIntegrity(id);
      setIntegrityStatus(prev => ({ ...prev, [id]: isValid }));
      if (isValid) {
        toast('Empreinte SHA-256 valide : intégrité cryptographique confirmée.', 'success');
      } else {
        toast('Attention : discordance d\'empreinte détectée sur l\'archive !', 'error');
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const handleUnarchiveDoc = async (doc: ArchivedDocument) => {
    if (!canUnarchive) {
      toast('Désarchivage réservé au Super Administrateur.', 'error');
      return;
    }

    const ok = await confirm({
      title: 'Désarchiver ce document ?',
      message: `Voulez-vous restaurer "${doc.titre}" dans les documents actifs ?`,
      confirmLabel: 'Désarchiver'
    });

    if (ok) {
      const res = await unarchiveDocument(doc.kind, doc.id);
      if (res.success) {
        toast('Document restauré dans les actifs avec succès.', 'success');
      } else {
        toast(res.message, 'error');
      }
    }
  };

  const totalSnapshotSizeKb = Math.round(archives.reduce((sum, a) => sum + (a.sizeBytes || 0), 0) / 1024);

  const getKindBadge = (kind: ArchivableKind) => {
    switch (kind) {
      case 'daily':
        return (
          <span className="badge badge-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} color="var(--uba-red-bright)" /> Rapport R1
          </span>
        );
      case 'synthesis':
        return (
          <span className="badge badge-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Files size={12} color="#60A5FA" /> Synthèse
          </span>
        );
      case 'slip':
        return (
          <span className="badge badge-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={12} color="#34D399" /> Bordereau
          </span>
        );
    }
  };

  return (
    <div className="page" style={{ padding: '28px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-category">GOUVERNANCE & CONSERVATION LÉGALE</div>
          <h1 className="page-title">Archives Centrales UBA</h1>
          <p className="text-muted text-sm">
            Documents opérationnels archivés et clichés hebdomadaires scellés cryptographiquement.
          </p>
        </div>

        {/* Top-level Navigation Tabs */}
        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--uba-anthracite)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, padding: '10px 18px', fontWeight: 700 }}
          >
            <Archive size={16} style={{ marginRight: '6px' }} />
            Documents archivés ({allArchivedDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`btn ${activeTab === 'snapshots' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, padding: '10px 18px', fontWeight: 700 }}
          >
            <ShieldCheck size={16} style={{ marginRight: '6px' }} />
            Clichés hebdomadaires
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1 : DOCUMENTS ARCHIVÉS UNITAIRES                                  */}
      {/* ==================================================================== */}
      {activeTab === 'documents' && (
        <div>
          {/* Quick Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="card stat-card">
              <div className="stat-label">TOTAL DOCUMENTS SCELLÉS</div>
              <div className="stat-value">{allArchivedDocs.length}</div>
              <div className="stat-sub">Protégés contre toute modification</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">RAPPORTS JOURNALIERS (R1)</div>
              <div className="stat-value" style={{ color: 'var(--uba-red-bright)' }}>
                {allArchivedDocs.filter(d => d.kind === 'daily').length}
              </div>
              <div className="stat-sub">Rapports d'activité quotidiens</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">SYNTHÈSES DE PÉRIODE</div>
              <div className="stat-value" style={{ color: '#60A5FA' }}>
                {allArchivedDocs.filter(d => d.kind === 'synthesis').length}
              </div>
              <div className="stat-sub">Bilans périodiques consolidés</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">BORDEREAUX DE DÉCHARGE</div>
              <div className="stat-value" style={{ color: '#34D399' }}>
                {allArchivedDocs.filter(d => d.kind === 'slip').length}
              </div>
              <div className="stat-sub">Traçabilité navettes inter-sites</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
              <Search size={18} color="#D9D9D9" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Rechercher par titre, auteur ou note..."
                value={docSearch}
                onChange={e => setDocSearch(e.target.value)}
                style={{ paddingLeft: '40px', height: '42px', fontSize: '0.95rem' }}
              />
            </div>

            {/* Kind Filter */}
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--uba-anthracite)' }}>
              <button
                type="button"
                onClick={() => setDocFilterType('all')}
                className={`btn btn-sm ${docFilterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
              >
                Tous ({allArchivedDocs.length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilterType('daily')}
                className={`btn btn-sm ${docFilterType === 'daily' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
              >
                Rapports R1 ({allArchivedDocs.filter(d => d.kind === 'daily').length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilterType('synthesis')}
                className={`btn btn-sm ${docFilterType === 'synthesis' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
              >
                Synthèses ({allArchivedDocs.filter(d => d.kind === 'synthesis').length})
              </button>
              <button
                type="button"
                onClick={() => setDocFilterType('slip')}
                className={`btn btn-sm ${docFilterType === 'slip' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, height: '42px', padding: '0 14px' }}
              >
                Bordereaux ({allArchivedDocs.filter(d => d.kind === 'slip').length})
              </button>
            </div>

            {docSearch && (
              <button onClick={() => setDocSearch('')} className="btn btn-secondary btn-sm" style={{ height: '42px' }}>
                Réinitialiser
              </button>
            )}
          </div>

          {/* Documents Table */}
          <div className="uba-table-container">
            <table className="uba-table">
              <thead>
                <tr>
                  <th>Type & Titre</th>
                  <th>Période / Date</th>
                  <th>Archivé le</th>
                  <th>Archivé par</th>
                  <th>Note / Motif</th>
                  <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '42px', color: '#D9D9D9', fontSize: '1rem' }}>
                      {allArchivedDocs.length === 0
                        ? 'Aucun document n\'a encore été archivé. Les administrateurs peuvent archiver les rapports et bordereaux depuis leurs listes respectives.'
                        : 'Aucun document archivé ne correspond à votre filtre.'}
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(doc => (
                    <tr key={`${doc.kind}-${doc.id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {getKindBadge(doc.kind)}
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(220, 38, 38, 0.2)',
                              color: '#F87171',
                              border: '1px solid rgba(220, 38, 38, 0.4)',
                              fontSize: '0.72rem'
                            }}
                          >
                            Immuable
                          </span>
                        </div>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.98rem' }}>{doc.titre}</strong>
                      </td>
                      <td style={{ color: '#FFFFFF', fontSize: '0.92rem' }}>
                        {doc.dateDoc}
                      </td>
                      <td style={{ color: '#D9D9D9', fontSize: '0.88rem' }}>
                        {formatDate(doc.archivedAt)}
                      </td>
                      <td style={{ color: '#D9D9D9', fontSize: '0.88rem' }}>
                        {doc.archivedBy || 'Administrateur'}
                      </td>
                      <td style={{ color: '#9CA3AF', fontSize: '0.85rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.archiveNote || ''}>
                        {doc.archiveNote || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 10px' }}
                            title="Consulter le document archivé"
                          >
                            <Eye size={14} /> Consulter
                          </button>

                          {canPrint && (
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 10px' }}
                              title="Imprimer / Exporter PDF"
                            >
                              <Printer size={14} />
                            </button>
                          )}

                          {canUnarchive && (
                            <button
                              onClick={() => handleUnarchiveDoc(doc)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 10px', color: '#60A5FA' }}
                              title="Désarchiver (Super Admin uniquement)"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2 : CLICHÉS HEBDOMADAIRES (SNAPSHOTS)                             */}
      {/* ==================================================================== */}
      {activeTab === 'snapshots' && (
        <div>
          {!canManageSnapshots ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center', marginTop: '20px' }}>
              <ShieldCheck size={40} color="var(--uba-red-bright)" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Accès Restreint</h2>
              <p className="text-muted" style={{ maxWidth: '480px', margin: '0 auto' }}>
                La création et la gestion des clichés hebdomadaires sont réservées aux Administrateurs et au Super Administrateur.
                Consultez l'onglet <strong>Documents archivés</strong> pour accéder aux archives unitaires.
              </p>
            </div>
          ) : (
            <>
              {/* Actions row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '18px' }}>
                <button
                  onClick={fetchSnapshotList}
                  className="btn btn-ghost"
                  title="Rafraîchir la liste"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  <span>Actualiser</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                  disabled={archiving}
                >
                  <Archive size={16} />
                  <span>{archiving ? 'Génération...' : 'Créer un Cliché'}</span>
                </button>
              </div>

              {/* Cartes statistiques */}
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="card stat-card">
                  <div className="stat-label">TOTAL ARCHIVES SCELLÉES</div>
                  <div className="stat-value">{archives.length}</div>
                  <div className="stat-sub">Clichés immuables en base</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">AUTOMATISATION (PG_CRON)</div>
                  <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--brand-hi)' }}>Dimanche 23h00</div>
                  <div className="stat-sub">Fuseau Africa/Brazzaville (UTC+1)</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">VOLUME STOCKÉ</div>
                  <div className="stat-value">{totalSnapshotSizeKb} <span style={{ fontSize: '0.9rem' }}>Ko</span></div>
                  <div className="stat-sub">Données JSON compactées</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">INTÉGRITÉ SERVEUR</div>
                  <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={24} /> Conforme
                  </div>
                  <div className="stat-sub">Hachage cryptographique SHA-256</div>
                </div>
              </div>

              {/* Tableau des archives snapshots */}
              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Registre des Clichés Hebdomadaires ({archives.length})
                  </h2>
                  <span className="text-muted text-xs">
                    Protection PostgreSQL : UPDATE et DELETE formellement interdits
                  </span>
                </div>

                {loading ? (
                  <div style={{ padding: '30px', textAlign: 'center' }} className="text-muted">
                    Chargement des archives scellées...
                  </div>
                ) : archives.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }} className="card">
                    <Archive size={40} className="text-muted" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Aucune archive hebdomadaire pour le moment</h3>
                    <p className="text-muted text-sm" style={{ maxWidth: '440px', margin: '0 auto 16px' }}>
                      Le planificateur automatique s'exécutera chaque dimanche soir à 23h00. Vous pouvez également déclencher un cliché immédiat.
                    </p>
                    <button onClick={handleArchiveNow} className="btn btn-primary" style={{ margin: '0 auto' }}>
                      <Archive size={16} />
                      <span>Générer le premier cliché</span>
                    </button>
                  </div>
                ) : (
                  <div className="uba-table-container">
                    <table className="uba-table">
                      <thead>
                        <tr>
                          <th>Type & Période</th>
                          <th>Semaine ISO</th>
                          <th>Objets Archivés</th>
                          <th>Taille & Empreinte</th>
                          <th>Date & Auteur</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archives.map(arch => {
                          const counts = arch.rowCounts || {};
                          const isVerified = integrityStatus[arch.id];
                          return (
                            <tr key={arch.id}>
                              <td>
                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={`badge ${arch.kind === 'weekly' ? 'badge-red' : 'badge-black'}`}>
                                    {arch.kind === 'weekly' ? 'Automatique' : 'Manuel'}
                                  </span>
                                </div>
                                <div className="text-muted text-xs" style={{ marginTop: '4px' }}>
                                  Du {arch.periodStart} au {arch.periodEnd}
                                </div>
                              </td>
                              <td>
                                <strong style={{ fontFamily: 'monospace' }}>
                                  {arch.isoWeek || 'Période personnalisée'}
                                </strong>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {counts.daily_reports !== undefined && (
                                    <span className="badge badge-silver" title="Rapports journaliers">
                                      {counts.daily_reports} rapports
                                    </span>
                                  )}
                                  {counts.cartons !== undefined && (
                                    <span className="badge badge-silver" title="Cartons inventoriés">
                                      {counts.cartons} cartons
                                    </span>
                                  )}
                                  {counts.transfer_slips !== undefined && (
                                    <span className="badge badge-silver" title="Bordereaux de transfert">
                                      {counts.transfer_slips} bordereaux
                                    </span>
                                  )}
                                  {counts.audit_logs !== undefined && (
                                    <span className="badge badge-silver" title="Entrées de journal d'audit">
                                      {counts.audit_logs} logs
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                  {(arch.sizeBytes / 1024).toFixed(1)} Ko
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    color: 'var(--text-3)',
                                    maxWidth: '130px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={`SHA-256: ${arch.checksum}`}
                                >
                                  SHA: {arch.checksum.slice(0, 12)}…
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem' }}>
                                  {new Date(arch.createdAt).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <div className="text-muted text-xs">
                                  {arch.createdBy ? 'Par administrateur' : 'Système automatique'}
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                  <button
                                    onClick={() => handleInspectSnapshot(arch)}
                                    className="btn btn-secondary btn-sm"
                                    title="Inspecter le contenu et le scellement cryptographique"
                                  >
                                    <Eye size={14} />
                                    <span>Détails</span>
                                  </button>
                                  <button
                                    onClick={() => handleVerifySnapshot(arch.id)}
                                    className="btn btn-ghost btn-sm"
                                    disabled={verifyingId === arch.id}
                                    title="Recalculer et vérifier l'empreinte SHA-256"
                                  >
                                    <FileCheck size={14} color={isVerified ? 'var(--success)' : 'inherit'} />
                                    <span>{verifyingId === arch.id ? 'Vérif...' : isVerified ? 'Scellé' : 'Vérifier'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSnapshot(arch)}
                                    className="btn btn-primary btn-sm"
                                    title="Télécharger l'archive au format JSON"
                                  >
                                    <Download size={14} />
                                    <span>JSON</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview Modals for Archived Documents */}
      {previewDoc && previewDoc.kind === 'daily' && (
        <DailyReportPrintPreview
          report={previewDoc.raw as DailyReport}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {previewDoc && previewDoc.kind === 'slip' && (
        <TransferSlipPrintPreview
          slip={previewDoc.raw as TransferSlip}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {previewDoc && previewDoc.kind === 'synthesis' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-black" style={{ marginRight: '6px' }}>ARCHIVE SCELLÉE</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
                  {previewDoc.titre}
                </h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}>
                <X size={20} />
              </button>
            </div>

            {(() => {
              const syn = previewDoc.raw as SynthesisReport;
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="text-muted text-xs">DOSSIERS TRAITÉS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uba-red-bright)' }}>
                        {formatNumber(syn.dossiersTraites)}
                      </div>
                    </div>
                    <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="text-muted text-xs">DOSSIERS EN ATTENTE</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B' }}>
                        {formatNumber(syn.dossiersEnAttente)}
                      </div>
                    </div>
                    <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="text-muted text-xs">TOTAL BOÎTES</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {formatNumber(syn.boitesTotal)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                      Points clés & Observations archivées :
                    </h4>
                    {syn.pointsAConfirmer && syn.pointsAConfirmer.length > 0 ? (
                      <ul style={{ paddingLeft: '20px', color: '#D9D9D9', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {syn.pointsAConfirmer.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-sm">Aucun point particulier consigné.</p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--uba-anthracite)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="text-muted text-xs">
                      Archivé par {previewDoc.archivedBy || 'Système'} le {formatDate(previewDoc.archivedAt)}
                    </div>
                    <button onClick={() => setPreviewDoc(null)} className="btn btn-secondary btn-sm">
                      Fermer
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Création Cliché */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={20} color="var(--uba-red-bright)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Générer un Cliché d'Archive
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomSnapshot}>
              <p className="text-muted text-sm" style={{ marginBottom: '18px' }}>
                Le cliché scellera l'ensemble des données de la période spécifiée avec calcul d'empreinte SHA-256 et écriture immuable en base.
              </p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Type de période</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#FFFFFF' }}>
                    <input
                      type="radio"
                      name="createMode"
                      value="week"
                      checked={createMode === 'week'}
                      onChange={() => setCreateMode('week')}
                    />
                    Semaine en cours (Standard)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#FFFFFF' }}>
                    <input
                      type="radio"
                      name="createMode"
                      value="custom"
                      checked={createMode === 'custom'}
                      onChange={() => setCreateMode('custom')}
                    />
                    Période personnalisée
                  </label>
                </div>
              </div>

              {createMode === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                  <div className="form-group">
                    <label className="form-label">Date de début</label>
                    <input
                      type="date"
                      className="form-input"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date de fin</label>
                    <input
                      type="date"
                      className="form-input"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={archiving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={archiving}
                >
                  <Archive size={15} />
                  <span>{archiving ? 'Scellement...' : 'Sceller le Cliché'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inspection Cliché */}
      {inspectedSnapshot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span className={`badge ${inspectedSnapshot.kind === 'weekly' ? 'badge-red' : 'badge-black'}`} style={{ marginRight: '8px' }}>
                  {inspectedSnapshot.kind === 'weekly' ? 'CLICHÉ HEBDOMADAIRE' : 'CLICHÉ MANUEL'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
                  Cliché du {inspectedSnapshot.periodStart} au {inspectedSnapshot.periodEnd}
                </h3>
              </div>
              <button onClick={() => setInspectedSnapshot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9' }}>
                <X size={20} />
              </button>
            </div>

            {/* Cryptographic SHA-256 seal box */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid var(--uba-anthracite)',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em' }}>
                  EMPREINTE CRYPTOGRAPHIQUE SHA-256 DU PAYLOAD
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {integrityStatus[inspectedSnapshot.id] ? (
                    <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> Intégrité confirmée
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifySnapshot(inspectedSnapshot.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ height: '26px', padding: '0 8px', fontSize: '0.75rem' }}
                      disabled={verifyingId === inspectedSnapshot.id}
                    >
                      <FileCheck size={12} /> Vérifier maintenant
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyHash(inspectedSnapshot.checksum)}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '26px', padding: '0 8px', fontSize: '0.75rem' }}
                    title="Copier l'empreinte complète"
                  >
                    {copiedHash ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    <span style={{ marginLeft: '4px' }}>{copiedHash ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: 'var(--uba-red-bright)',
                wordBreak: 'break-all',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '8px',
                borderRadius: '4px'
              }}>
                {inspectedSnapshot.checksum}
              </div>
            </div>

            {/* Counts breakdown */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>
                Répartition des enregistrements scellés :
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {Object.entries(inspectedSnapshot.rowCounts || {}).map(([key, count]) => (
                  <div key={key} className="card" style={{ padding: '10px 14px' }}>
                    <div className="text-muted text-xs" style={{ textTransform: 'uppercase' }}>
                      {key.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON inspection */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Aperçu des données scellées (JSON) :
                </div>
                <button
                  onClick={() => handleDownloadSnapshot(inspectedSnapshot)}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={13} style={{ marginRight: '4px' }} />
                  Télécharger le fichier complet ({(inspectedSnapshot.sizeBytes / 1024).toFixed(1)} Ko)
                </button>
              </div>

              {loadingPayload ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  Chargement des données du cliché...
                </div>
              ) : inspectedPayload ? (
                <pre style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid var(--uba-anthracite)',
                  borderRadius: '6px',
                  padding: '14px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#E5E7EB',
                  margin: 0
                }}>
                  {JSON.stringify(inspectedPayload, null, 2)}
                </pre>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF' }}>
                  Aperçu non disponible directement. Utilisez le bouton Télécharger.
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--uba-anthracite)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="text-muted text-xs">
                Cliché généré le {new Date(inspectedSnapshot.createdAt).toLocaleString('fr-FR')} {inspectedSnapshot.createdBy ? `par ${inspectedSnapshot.createdBy}` : '(Système automatique)'}
              </div>
              <button onClick={() => setInspectedSnapshot(null)} className="btn btn-secondary btn-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
