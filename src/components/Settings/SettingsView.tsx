import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  RotateCcw,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Database,
  Layers
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    agencies,
    teamMembers,
    dailyReports,
    synthesisReports,
    logs,
    clearAllData,
    loadDemoData,
    clearLogs,
    exportDataToJson,
    importDataFromJson
  } = useData();

  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClearAll = () => {
    if (window.confirm('ATTENTION : Voulez-vous vraiment effacer TOUTES les données (agences, rapports, équipe) pour obtenir un logiciel entièrement VIERGE ?')) {
      clearAllData();
      setMessage({ type: 'success', text: 'Toutes les données de test ont été supprimées. L\'application est désormais vierge.' });
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm('Recharger le jeu de données d\'exemple UBA (rapports du 28/09 au 09/10, agences 901, 902, 904, 907) ?')) {
      loadDemoData();
      setMessage({ type: 'success', text: 'Modèle de démonstration UBA rechargé avec succès.' });
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Vider l\'historique des logs d\'audit ?')) {
      clearLogs();
      setMessage({ type: 'success', text: 'Historique des logs réinitialisé.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
          Paramètres & Gestion des Données
        </h1>
        <div style={{ fontSize: '0.95rem', color: '#D9D9D9', marginTop: '4px' }}>
          Contrôle des volumes de données, réinitialisation à l'état vierge et sauvegardes.
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--uba-anthracite)',
          color: '#FFFFFF',
          border: '1px solid var(--uba-silver-dark)'
        }}>
          {message.type === 'success' ? <CheckCircle size={16} color="var(--uba-red-bright)" /> : <AlertTriangle size={16} color="var(--uba-red)" />}
          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#FFFFFF' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card: État vierge vs Démo */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Database size={20} color="var(--uba-red-bright)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Initialisation & État du Logiciel
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#D9D9D9', marginBottom: '20px' }}>
            Permet de basculer entre une base entièrement neuve sans aucune donnée de test, ou de recharger le jeu d'exemple UBA.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              border: '1px solid rgba(227, 30, 36, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              backgroundColor: 'rgba(227, 30, 36, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--uba-red-bright)', marginBottom: '6px' }}>
                  Vider toutes les données (Logiciel Vierge)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#D9D9D9', marginBottom: '16px', lineHeight: 1.4 }}>
                  Supprime l'intégralité des agences, rapports, équipes et historiques pour démarrer une utilisation réelle.
                </div>
              </div>
              <button onClick={handleClearAll} className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Trash2 size={14} /> Réinitialiser à zéro
              </button>
            </div>

            <div style={{
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px',
              backgroundColor: 'rgba(14, 14, 14, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '6px' }}>
                  Recharger le modèle de démonstration
                </div>
                <div style={{ fontSize: '0.82rem', color: '#D9D9D9', marginBottom: '16px', lineHeight: 1.4 }}>
                  Recharge les agences (901, 902, 904, 907) et les rapports types pour tester le fonctionnement.
                </div>
              </div>
              <button onClick={handleLoadDemo} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <RotateCcw size={14} /> Recharger la démo
              </button>
            </div>
          </div>
        </div>

        {/* Card: Export / Import JSON */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Layers size={20} color="var(--uba-red-bright)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Sauvegardes & Restauration
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#D9D9D9', marginBottom: '20px' }}>
            Sauvegardez l'état complet du logiciel sur votre disque dur ou restaurez une sauvegarde précédente.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={exportDataToJson} className="btn btn-primary btn-sm">
              <Download size={14} /> Exporter la sauvegarde (JSON)
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
              <Upload size={14} /> Importer un fichier JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <button onClick={handleClearLogs} className="btn btn-secondary btn-sm" style={{ color: '#DC2626' }}>
              Vider uniquement les logs
            </button>
          </div>
        </div>

        {/* Current Volume Stats */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#D9D9D9', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Statistiques actuelles de la base locale
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(6, 6, 6, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D9D9D9' }}>Agences</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '2px' }}>{agencies.length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(6, 6, 6, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D9D9D9' }}>Rapports journaliers</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{dailyReports.length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(6, 6, 6, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D9D9D9' }}>Synthèses</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '2px' }}>{synthesisReports.length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(6, 6, 6, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D9D9D9' }}>Membres d'équipe</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{teamMembers.length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(6, 6, 6, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D9D9D9' }}>Entrées d'audit</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '2px' }}>{logs.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
