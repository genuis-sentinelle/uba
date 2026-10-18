import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Files,
  Building2,
  FolderArchive,
  Users,
  History,
  ShieldCheck,
  Settings,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'daily-reports'
  | 'synthesis'
  | 'transfer-slips'
  | 'cartons'
  | 'attendance'
  | 'incidents'
  | 'agencies'
  | 'conventions'
  | 'team'
  | 'audit-logs'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { currentUser } = useAuth();

  // Close drawer on Escape key & lock scroll when mobile drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onCloseMobile) {
          onCloseMobile();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpenMobile, onCloseMobile]);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', shortLabel: 'Bord', icon: LayoutDashboard },
    { id: 'daily-reports', label: 'Rapports Journaliers', shortLabel: 'Rapports', icon: FileText },
    { id: 'synthesis', label: 'Synthèses de Période', shortLabel: 'Synthèse', icon: Files },
    { id: 'transfer-slips', label: 'Bordereaux de Décharge', shortLabel: 'Décharge', icon: Truck },
    { id: 'cartons', label: 'Inventaire Cartons', shortLabel: 'Cartons', icon: Package },
    { id: 'attendance', label: 'Pointage Rapide (7h30)', shortLabel: 'Pointage', icon: CheckCircle2 },
    { id: 'incidents', label: 'Incidents & Anomalies', shortLabel: 'Incidents', icon: AlertTriangle },
    { id: 'agencies', label: 'Agences', shortLabel: 'Agences', icon: Building2 },
    { id: 'conventions', label: 'Conventions & Matrice', shortLabel: 'Matrice', icon: FolderArchive },
    { id: 'team', label: 'Équipe Archiviste', shortLabel: 'Équipe', icon: Users },
    { id: 'audit-logs', label: 'Journal d\'Audit', shortLabel: 'Audit', icon: History },
    { id: 'users', label: 'Utilisateurs & Droits', shortLabel: 'Droits', icon: ShieldCheck, adminOnly: true },
    { id: 'settings', label: 'Paramètres & Données', shortLabel: 'Config', icon: Settings }
  ];

  const sidebarWidth = isCollapsed ? '84px' : '255px';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpenMobile ? 'is-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`app-sidebar ${isOpenMobile ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}
        aria-label="Navigation latérale"
      >
        <div>
          {isOpenMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/images/uba-app-badge.png" alt="UBA Logo" style={{ height: '32px', width: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-1)' }}>ARCHIVA UBA</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn btn-ghost btn-icon"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!isCollapsed && (
              <div style={{
                padding: '4px 12px 8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--uba-silver-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Navigation
              </div>
            )}

            {navItems.map(item => {
              const isStagiaire = currentUser?.role === 'stagiaire';
              // Les stagiaires n'ont pas accès aux logs, aux utilisateurs, ni aux paramètres
              if (isStagiaire && (item.id === 'audit-logs' || item.id === 'users' || item.id === 'settings')) {
                return null;
              }
              if (item.adminOnly && isStagiaire) {
                return null;
              }

              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as NavigationTab);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={item.label}
                  className="nav-item"
                  aria-current={isActive ? 'page' : undefined}
                  style={isCollapsed ? {
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 2px',
                    minHeight: '52px',
                    textAlign: 'center'
                  } : undefined}
                >
                  <Icon size={isCollapsed ? 18 : 19} color="var(--red)" />
                  {isCollapsed ? (
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      lineHeight: 1,
                      color: isActive ? 'var(--white)' : 'var(--white-70)'
                    }}>
                      {item.shortLabel}
                    </span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Collapse toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--uba-anthracite)', paddingTop: '12px' }}>
          {/* Desktop collapse button */}
          {!isOpenMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: '8px 10px',
                background: 'var(--uba-black-smoke)',
                border: '1px solid var(--uba-anthracite)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--uba-silver-metal)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
              title={isCollapsed ? 'Développer le menu' : 'Réduire le menu'}
            >
              {!isCollapsed && <span>Réduire la barre</span>}
              {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}

          {!isCollapsed ? (
            <div style={{
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: 'var(--uba-silver-dark)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--uba-black-smoke)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--uba-anthracite)'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--uba-white-cool)' }}>ARCHIVA v1.3</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--uba-silver-dark)' }}>UBA Congo</div>
              </div>
              <img src="/images/uba-app-badge.png" alt="UBA Badge" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="/images/uba-app-badge.png" alt="UBA Badge" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
