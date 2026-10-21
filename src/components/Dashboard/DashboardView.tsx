import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  FileText,
  Building2,
  Plus,
  ArrowRight,
  Printer,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

import { useFeedback } from '../ui/Feedback';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onOpenCreateUser?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenReport,
  onOpenCreateUser
}) => {
  const { agencies, dailyReports, synthesisReports, cartons, incidents, teamMembers, loadDemoData, deleteDailyReport } = useData();
  const { currentUser } = useAuth();
  const { confirm, toast } = useFeedback();
  const isStagiaire = currentUser?.role === 'stagiaire';

  // Dynamic calculations from actual data
  const totalConventionsAgences = agencies.reduce((acc, a) => acc + (a.conventionsCount || 0), 0);
  const totalBoites = agencies.reduce((acc, a) => acc + (a.cartonsCount || 0), 0);
  const totalRapports = dailyReports.length;

  const latestSynthesis = synthesisReports[0];
  const dossiersTraites = latestSynthesis ? latestSynthesis.dossiersTraites : totalConventionsAgences;
  const dossiersAttente = latestSynthesis ? latestSynthesis.dossiersEnAttente : 0;
  const totalGlobal = dossiersTraites + dossiersAttente;
  const tauxGlobal = totalGlobal > 0 ? Math.round((dossiersTraites / totalGlobal) * 100) : 0;

  const incidentsOuverts = incidents.filter(i => i.statut !== 'resolu');
  const incidentsCritiques = incidentsOuverts.filter(i => i.severite === 'critique');

  const isEmpty = agencies.length === 0 && dailyReports.length === 0;

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Clean Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--uba-white-cool)', margin: 0 }}>
            Poste de Pilotage des Archives UBA
          </h1>
          <div style={{ fontSize: '0.92rem', color: 'var(--uba-silver-light)', marginTop: '4px' }}>
            Session active : <strong>{currentUser?.nomComplet}</strong> ({currentUser?.titre || currentUser?.role})
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isEmpty && !isStagiaire && (
            <button onClick={loadDemoData} className="btn btn-secondary">
              <RotateCcw size={16} /> Charger modèle UBA
            </button>
          )}
          {!isStagiaire ? (
            <button onClick={() => onNavigate('daily-reports')} className="btn btn-primary">
              <Plus size={16} /> + Rapport Journalier
            </button>
          ) : (
            <span className="badge badge-black" style={{ padding: '7px 12px', fontSize: '0.82rem', border: '1px solid var(--uba-anthracite)' }}>
              Mode Consultation (Lecture seule)
            </span>
          )}
          <button onClick={() => onNavigate('attendance')} className="btn btn-secondary">
            <CheckCircle2 size={16} /> Pointage 7h30
          </button>
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <button
              onClick={onOpenCreateUser || (() => onNavigate('users'))}
              className="btn btn-black"
              title="Créer un compte d'accès"
            >
              + Créer Utilisateur
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards — Pure typography, large readable metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Dossiers Traités */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-red)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uba-silver-metal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Dossiers Traités
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '4px', lineHeight: 1.1 }}>
            {formatNumber(dossiersTraites)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--uba-white-cool)', fontWeight: 700, marginTop: '6px' }}>
            {tauxGlobal > 0 ? `${tauxGlobal}% du volume total` : '0 convention'}
          </div>
        </div>

        {/* En Attente */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-silver-metal)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uba-silver-metal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            En Attente de Tri
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--uba-white-cool)', marginTop: '4px', lineHeight: 1.1 }}>
            {formatNumber(dossiersAttente)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--uba-silver-dark)', marginTop: '6px' }}>
            Exercices programmés
          </div>
        </div>

        {/* Boîtes Conditionnées */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-graphite)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uba-silver-metal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Boîtes Conditionnées
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--uba-white-cool)', marginTop: '4px', lineHeight: 1.1 }}>
            {formatNumber(totalBoites)}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--uba-silver-dark)', marginTop: '6px' }}>
            Site de Mazala
          </div>
        </div>

        {/* Agences Référencées */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--uba-red-dark)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uba-silver-metal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Agences Référencées
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--uba-white-cool)', marginTop: '4px', lineHeight: 1.1 }}>
            {agencies.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--uba-silver-dark)', marginTop: '6px' }}>
            Points de tri actifs
          </div>
        </div>

        {/* Incidents & Anomalies */}
        <div
          className="card"
          style={{ padding: '18px 20px', borderLeft: `4px solid ${incidentsCritiques.length > 0 ? 'var(--uba-red)' : 'var(--uba-anthracite)'}`, cursor: 'pointer' }}
          onClick={() => onNavigate('incidents')}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--uba-silver-metal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Incidents en cours
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: incidentsCritiques.length > 0 ? 'var(--uba-red-bright)' : 'var(--uba-white-cool)', marginTop: '4px', lineHeight: 1.1 }}>
            {incidentsOuverts.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: incidentsCritiques.length > 0 ? 'var(--uba-red-bright)' : 'var(--uba-silver-dark)', marginTop: '6px', fontWeight: 700 }}>
            {incidentsCritiques.length > 0 ? `${incidentsCritiques.length} critique(s)` : 'Tous maîtrisés'}
          </div>
        </div>
      </div>

      {/* Raccourcis Rapides Métier (Actions directes) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '26px'
      }}>
        <button
          onClick={() => onNavigate('daily-reports')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <FileText size={17} color="var(--uba-red-bright)" />
          <span>Rapports R1</span>
        </button>

        <button
          onClick={() => onNavigate('transfer-slips')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <Truck size={17} color="var(--uba-silver-light)" />
          <span>Bordereaux Décharge</span>
        </button>

        <button
          onClick={() => onNavigate('cartons')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <Package size={17} color="var(--uba-silver-light)" />
          <span>Inventaire Cartons</span>
        </button>

        <button
          onClick={() => onNavigate('synthesis')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <FileText size={17} color="var(--uba-red-bright)" />
          <span>Synthèse Période</span>
        </button>

        <button
          onClick={() => onNavigate('incidents')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <AlertTriangle size={17} color="var(--uba-red-bright)" />
          <span>Déclarer Incident</span>
        </button>

        <button
          onClick={() => onNavigate('team')}
          className="btn btn-secondary"
          style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
        >
          <UserCheck size={17} color="var(--uba-silver-light)" />
          <span>Équipe ({teamMembers.length})</span>
        </button>
      </div>

      {isEmpty ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--uba-black-deep)',
            border: '1px solid var(--uba-anthracite)',
            color: 'var(--uba-red-bright)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Building2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--uba-white-cool)', marginBottom: '6px' }}>
            Base de données d'archives vierge
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--uba-silver-dark)', maxWidth: '420px', margin: '0 auto 20px' }}>
            Aucune agence ni rapport enregistré. Vous pouvez démarrer une saisie vierge ou charger le référentiel UBA.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => onNavigate('agencies')} className="btn btn-primary btn-sm">
              <Plus size={15} /> Créer une agence
            </button>
            <button onClick={loadDemoData} className="btn btn-secondary btn-sm">
              Charger le modèle UBA
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left Block: Agencies list & volume breakdown */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="uba-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Répartition par Agence
              </h2>
              <button
                onClick={() => onNavigate('agencies')}
                style={{ background: 'none', border: 'none', color: 'var(--uba-red-bright)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Voir tout ({agencies.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {agencies.slice(0, 6).map(ag => {
                const totalRef = totalConventionsAgences > 0 ? totalConventionsAgences : 1;
                const pct = Math.min(100, Math.round((ag.conventionsCount / totalRef) * 100));

                return (
                  <div key={ag.id} style={{ borderBottom: '1px solid var(--uba-anthracite)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--uba-white-cool)' }}>{ag.nom}</span>
                        <span className="badge badge-black" style={{ fontSize: '0.75rem' }}>Code {ag.code}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--uba-white-cool)' }}>
                        {formatNumber(ag.conventionsCount)} <span style={{ color: 'var(--uba-silver-dark)', fontWeight: 400 }}>conventions</span>
                      </div>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--uba-black-deep)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--uba-red)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Block: Recent Reports */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="uba-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                Derniers Rapports Enregistrés
              </h2>
              <button
                onClick={() => onNavigate('daily-reports')}
                style={{ background: 'none', border: 'none', color: 'var(--uba-red-bright)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tous les rapports ({dailyReports.length})
              </button>
            </div>

            {dailyReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--uba-silver-dark)', fontSize: '0.92rem' }}>
                Aucun rapport journalier enregistré.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dailyReports.slice(0, 5).map(rep => (
                  <div
                    key={rep.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--uba-anthracite)',
                      backgroundColor: 'var(--uba-black-glass)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--uba-white-cool)' }}>
                        {rep.titre}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--uba-silver-dark)', marginTop: '2px' }}>
                        {formatDate(rep.dateDebut)} · {formatNumber(rep.totalCalcule)} conventions · Chef : {rep.chefNom}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          onNavigate('daily-reports');
                          onOpenReport(rep.id);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="Imprimer / Exporter PDF"
                      >
                        <Printer size={14} />
                      </button>
                      {can.deleteData(currentUser?.role) && (
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Supprimer ce rapport ?',
                              message: `Supprimer le rapport "${rep.titre}" ?`,
                              confirmLabel: 'Supprimer',
                              danger: true
                            });
                            if (ok) {
                              deleteDailyReport(rep.id);
                              toast(`Rapport "${rep.titre}" supprimé.`, 'info');
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: 'var(--brand-hi)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
