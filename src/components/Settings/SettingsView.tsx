import React, { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../ui/Feedback';
import { can } from '../../utils/permissions';
import {
  Trash2,
  Download,
  Upload,
  Database,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    agencies,
    teamMembers,
    dailyReports,
    synthesisReports,
    logs,
    clearAllData,
    clearLogs,
    exportDataToJson,
    importDataFromJson
  } = useData();

  const { currentUser } = useAuth();
  const { toast, confirm } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearAll = async () => {
    if (currentUser?.role !== 'super_admin') {
      toast('Action réservée au Super Administrateur.', 'error');
      return;
    }

    const ok = await confirm({
      title: 'Effacer les données locales ?',
      message: 'ATTENTION : Cette action réinitialise la mémoire locale de ce navigateur. Les données distantes archivées sur Supabase sont conservées.',
      confirmLabel: 'Réinitialiser la mémoire locale',
      danger: true
    });

    if (ok) {
      const res = clearAllData();
      toast(res.message, res.success ? 'success' : 'error');
    }
  };

  const handleClearLogs = async () => {
    const ok = await confirm({
      title: 'Vider le journal d\'audit ?',
      message: 'Voulez-vous réinitialiser le journal d\'audit local ? Une ligne de traçabilité sera enregistrée.',
      confirmLabel: 'Vider le journal',
      danger: true
    });

    if (ok) {
      clearLogs();
      toast('Journal d\'audit local réinitialisé.', 'info');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content);
      toast(res.message, res.success ? 'success' : 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div className="page-head">
        <div>
          <h1>Paramètres & Données</h1>
          <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
            Contrôle des volumes de données, sauvegardes JSON et maintenance.
          </p>
        </div>
      </div>

      {/* Grid: Actions */}
      <div className="stack">
        {/* Card: Export / Import JSON */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Layers size={20} color="var(--brand-hi)" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sauvegardes & Restauration</h2>
          </div>
          <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
            Sauvegardez l'intégralité des données en fichier JSON ou importez une archive précédente.
          </p>

          <div className="row">
            <button onClick={exportDataToJson} className="btn btn-primary btn-sm">
              <Download size={14} /> Exporter la sauvegarde (JSON)
            </button>

            {can.manageUsers(currentUser?.role) && (
              <>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                  <Upload size={14} /> Importer une sauvegarde
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </>
            )}

            <button onClick={handleClearLogs} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
              Vider le journal d'audit
            </button>
          </div>
        </div>

        {/* Card: Réinitialisation (Super Admin Only) */}
        {can.clearAll(currentUser?.role) && (
          <div className="card" style={{ borderColor: 'rgba(255, 69, 58, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={20} color="var(--danger)" />
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--danger)' }}>Zone d'Administration Sensible</h2>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
              Réservé au Super Administrateur. Permet d'effacer les données mises en cache sur cet appareil.
            </p>

            <button onClick={handleClearAll} className="btn btn-danger btn-sm">
              <Trash2 size={14} /> Vider le stockage local de l'appareil
            </button>
          </div>
        )}

        {/* Current Volume Stats */}
        <div className="card">
          <h3 className="uba-section-title">Statistiques de la base de données</h3>
          <div className="grid-auto">
            <div className="card" style={{ backgroundColor: 'var(--surface-2)', padding: '14px' }}>
              <div className="text-muted text-sm">Agences</div>
              <div className="num" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-hi)', marginTop: '4px' }}>{agencies.length}</div>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--surface-2)', padding: '14px' }}>
              <div className="text-muted text-sm">Rapports journaliers</div>
              <div className="num" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{dailyReports.length}</div>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--surface-2)', padding: '14px' }}>
              <div className="text-muted text-sm">Synthèses</div>
              <div className="num" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-hi)', marginTop: '4px' }}>{synthesisReports.length}</div>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--surface-2)', padding: '14px' }}>
              <div className="text-muted text-sm">Membres d'équipe</div>
              <div className="num" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{teamMembers.length}</div>
            </div>
            <div className="card" style={{ backgroundColor: 'var(--surface-2)', padding: '14px' }}>
              <div className="text-muted text-sm">Entrées d'audit</div>
              <div className="num" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{logs.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
