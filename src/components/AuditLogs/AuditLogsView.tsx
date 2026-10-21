import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { formatDateTime } from '../../utils/formatters';
import { todayLocal } from '../../utils/dates';
import { Search, Download, Trash2 } from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

export const AuditLogsView: React.FC = () => {
  const { logs, clearLogs } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'auth':
        return <span className="badge badge-black">Connexion</span>;
      case 'rapport':
        return <span className="badge badge-red">Rapport</span>;
      case 'agence':
        return <span className="badge badge-gray" style={{ color: '#E41E26' }}>Agence</span>;
      case 'utilisateur':
        return <span className="badge badge-gray">Utilisateurs</span>;
      default:
        return <span className="badge badge-gray">Système</span>;
    }
  };

  const handleExportCsv = () => {
    const headers = ['Date_Heure', 'Utilisateur', 'Role', 'Categorie', 'Action', 'Details'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      `"${l.userName}"`,
      l.userRole,
      l.category,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_uba_${todayLocal()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Journal d'Audit
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            {filteredLogs.length} action(s) enregistrée(s)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={14} /> Exporter CSV
          </button>
          {can.clearAll(currentUser?.role) && (
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: 'Vider l\'affichage local du journal ?',
                  message: 'Cette action vide uniquement l\'affichage local sur votre écran. Le journal d\'audit serveur en base de données reste protégé et inviolable.',
                  confirmLabel: 'Vider l\'affichage local',
                  danger: true
                });
                if (ok) {
                  clearLogs();
                  toast('Affichage local vidé (les logs serveur restent intacts).', 'info');
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ color: '#DC2626' }}
              title="Vider l'affichage local du journal"
            >
              <Trash2 size={14} /> Vider l'affichage local
            </button>
          )}
        </div>
      </div>

      {/* Filter and search bar — Dark Glass */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '18px',
        backgroundColor: 'rgba(14, 14, 14, 0.85)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="#D9D9D9" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, action ou détail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.92rem',
              backgroundColor: 'transparent',
              color: '#FFFFFF'
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'rapport', label: 'Rapports' },
            { id: 'agence', label: 'Agences' },
            { id: 'auth', label: 'Connexions' },
            { id: 'utilisateur', label: 'Utilisateurs' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat.id ? 'var(--uba-red)' : 'var(--uba-anthracite)',
                color: '#FFFFFF'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="uba-table-container">
        <table className="uba-table">
          <thead>
            <tr>
              <th style={{ width: '170px' }}>Date & Heure</th>
              <th style={{ width: '180px' }}>Utilisateur</th>
              <th style={{ width: '110px' }}>Catégorie</th>
              <th style={{ width: '200px' }}>Action</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#D9D9D9' }}>
                  Aucun log enregistré.
                </td>
              </tr>
            ) : (
              filteredLogs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.85rem', color: '#D9D9D9', fontFamily: 'var(--font-mono)' }}>
                    {formatDateTime(l.timestamp)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.92rem' }}>
                      {l.userName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#A6A6A6' }}>
                      {l.userRole === 'super_admin' ? 'Super Admin' : l.userRole === 'admin' ? 'Admin' : 'Utilisateur'}
                    </div>
                  </td>
                  <td>{getCategoryBadge(l.category)}</td>
                  <td>
                    <strong style={{ color: 'var(--uba-red-bright)', fontSize: '0.92rem' }}>{l.action}</strong>
                  </td>
                  <td style={{ color: '#FFFFFF', fontSize: '0.85rem' }}>
                    {l.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
