import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../ui/Feedback';
import {
  listArchives,
  downloadArchive,
  archiveNow,
  verifyArchiveIntegrity,
  ArchiveSnapshotMeta
} from '../../services/archives';
import {
  Archive,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  HardDrive,
  FileCheck
} from 'lucide-react';
import { can } from '../../utils/permissions';

export const ArchivesView: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast, confirm } = useFeedback();

  const [archives, setArchives] = useState<ArchiveSnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean>>({});

  const isAuthorized = can.manageArchives(currentUser?.role);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await listArchives();
      setArchives(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchList();
    }
  }, [isAuthorized]);

  const handleArchiveNow = async () => {
    if (!isAuthorized) {
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
        await fetchList();
      } else {
        toast(`Échec de l'archivage : ${res.message}`, 'error');
      }
    } finally {
      setArchiving(false);
    }
  };

  const handleDownload = async (arch: ArchiveSnapshotMeta) => {
    toast('Préparation du téléchargement de l\'archive...', 'info');
    const ok = await downloadArchive(arch.id);
    if (ok) {
      toast('Archive téléchargée avec succès.', 'success');
    } else {
      toast('Impossible de télécharger l\'archive.', 'error');
    }
  };

  const handleVerify = async (id: string) => {
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

  if (!isAuthorized) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '30px', textAlign: 'center', marginTop: '40px' }}>
          <AlertTriangle size={36} color="var(--brand-hi)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Accès Restreint</h2>
          <p className="text-muted">
            La consultation et la gestion des archives hebdomadaires sont strictement réservées aux Administrateurs et au Super Administrateur.
          </p>
        </div>
      </div>
    );
  }

  const totalSizeKb = Math.round(archives.reduce((sum, a) => sum + (a.sizeBytes || 0), 0) / 1024);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-category">GOUVERNANCE & SÉCURITÉ</div>
          <h1 className="page-title">Archives Hebdomadaires Scellées</h1>
          <p className="text-muted text-sm">
            Clichés complets, idempotents et immuables de l'ensemble des activités UBA (Sites Maya-Maya & Mazala).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchList}
            className="btn btn-ghost"
            title="Rafraîchir la liste"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleArchiveNow}
            className="btn btn-primary"
            disabled={archiving}
          >
            <Archive size={16} />
            <span>{archiving ? 'Génération...' : 'Archiver la semaine'}</span>
          </button>
        </div>
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
          <div className="stat-value">{totalSizeKb} <span style={{ fontSize: '0.9rem' }}>Ko</span></div>
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

      {/* Tableau des archives */}
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
                            onClick={() => handleVerify(arch.id)}
                            className="btn btn-ghost btn-sm"
                            disabled={verifyingId === arch.id}
                            title="Recalculer et vérifier l'empreinte SHA-256"
                          >
                            <FileCheck size={15} color={isVerified ? 'var(--success)' : 'inherit'} />
                            <span>{verifyingId === arch.id ? 'Vérif...' : isVerified ? 'Scellé' : 'Vérifier'}</span>
                          </button>
                          <button
                            onClick={() => handleDownload(arch)}
                            className="btn btn-primary btn-sm"
                            title="Télécharger l'archive au format JSON"
                          >
                            <Download size={15} />
                            <span>Télécharger</span>
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
    </div>
  );
};
