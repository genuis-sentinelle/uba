import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { getPendingSyncCount, flushSyncQueue } from '../../services/sync';
import {
  LogOut,
  ChevronDown,
  Menu,
  UserPlus,
  Search,
  X,
  User as UserIcon,
  WifiOff,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface NavbarProps {
  currentTab?: string;
  onToggleMobileMenu?: () => void;
  onNavigate?: (tab: any) => void;
  onOpenCreateUser?: () => void;
  onOpenProfile?: () => void;
}

const TAB_MODULE_NAMES: Record<string, string> = {
  dashboard: 'Tableau de Bord',
  'daily-reports': 'Rapports Journaliers',
  synthesis: 'Synthèse de Période',
  'transfer-slips': 'Bordereaux de Décharge',
  cartons: 'Inventaire Cartons',
  attendance: 'Pointage 7h30',
  incidents: 'Incidents & Anomalies',
  agencies: 'Agences',
  conventions: 'Matrice Conventions',
  team: 'Équipe Archiviste',
  'audit-logs': 'Journal d\'Audit',
  users: 'Utilisateurs & Droits',
  settings: 'Paramètres'
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onToggleMobileMenu,
  onNavigate,
  onOpenCreateUser,
  onOpenProfile
}) => {
  const { currentUser, logout } = useAuth();
  const { agencies, dailyReports, cartons, teamMembers } = useData();
  const { theme, toggleTheme, textScale, increaseTextSize, decreaseTextSize, resetTextSize, bgDim, toggleBgDim, density, cycleDensity } = useTheme();

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSync, setPendingSync] = useState<number>(getPendingSyncCount());
  const [isFlushing, setIsFlushing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setPendingSync(getPendingSyncCount());
    };
    const handleOffline = () => setIsOnline(false);
    const handleSyncStatus = (e: any) => {
      if (typeof e.detail?.pendingCount === 'number') {
        setPendingSync(e.detail.pendingCount);
      } else {
        setPendingSync(getPendingSyncCount());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('archiva:sync-status', handleSyncStatus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('archiva:sync-status', handleSyncStatus);
    };
  }, []);

  const handleTriggerSync = async () => {
    if (!isOnline || isFlushing) return;
    setIsFlushing(true);
    await flushSyncQueue();
    setPendingSync(getPendingSyncCount());
    setIsFlushing(false);
  };

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="badge-role">SUPER ADMIN</span>;
      case 'admin':
        return <span className="badge-role">ADMIN</span>;
      default:
        return <span className="badge-role">ARCHIVISTE</span>;
    }
  };

  // Quick universal search results
  const matchingAgencies = searchQuery.trim()
    ? agencies.filter(a => a.nom.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.includes(searchQuery))
    : [];

  const matchingReports = searchQuery.trim()
    ? dailyReports.filter(r => r.titre.toLowerCase().includes(searchQuery.toLowerCase()) || r.chefNom.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const matchingCartons = searchQuery.trim()
    ? cartons.filter(c => c.numeroCarton.toLowerCase().includes(searchQuery.toLowerCase()) || c.emplacement.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const matchingMembers = searchQuery.trim()
    ? teamMembers.filter(m => m.nomOfficiel.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const hasResults = matchingAgencies.length > 0 || matchingReports.length > 0 || matchingCartons.length > 0 || matchingMembers.length > 0;

  return (
    <>
      <header className="app-header">
        {/* Brand & Identity avec logo officiel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="btn btn-ghost btn-icon mobile-only"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <img
              src="/images/uba-app-badge.png"
              alt="Logo UBA"
              style={{
                height: '38px',
                width: '38px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)'
              }}
            />
            <div className="desktop-only" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: '12px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                ARCHIVA <span style={{ color: 'var(--uba-red-bright)', fontSize: '0.78rem', fontWeight: 800 }}>| SUPERVISION DES ARCHIVES</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A0A0A0' }}>
                Sites Maya-Maya & Mazala
              </div>
            </div>
            {currentTab && TAB_MODULE_NAMES[currentTab] && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                <span className="badge-role" style={{ fontSize: '0.6875rem', padding: '3px 8px' }}>
                  {TAB_MODULE_NAMES[currentTab]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search button & User bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Indicateur de synchronisation multi-appareils */}
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={!isOnline || isFlushing}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={!isOnline ? 'Hors-ligne : les modifications sont conservées localement' : pendingSync > 0 ? `${pendingSync} modification(s) en attente. Cliquez pour synchroniser.` : 'Synchronisé en temps réel avec le serveur central'}
          >
            {!isOnline ? (
              <>
                <WifiOff size={14} color="var(--warning)" />
                <span className="desktop-only" style={{ color: 'var(--warning)' }}>Hors-ligne</span>
              </>
            ) : pendingSync > 0 ? (
              <>
                <RefreshCw size={13} style={{ animation: isFlushing ? 'spin 1s linear infinite' : 'none', color: '#F59E0B' }} />
                <span style={{ color: '#F59E0B' }}>{pendingSync} en attente</span>
              </>
            ) : (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                <span className="desktop-only" style={{ color: 'var(--text-2)' }}>Synchronisé</span>
              </>
            )}
          </button>

          {/* Commandes d'Accessibilité : Taille du texte (A- / A / A+) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              padding: '2px',
              gap: '2px'
            }}
            title="Ajuster la taille du texte (Réduire / Standard / Agrandir)"
            aria-label="Réglage de la taille de texte"
          >
            <button
              type="button"
              onClick={decreaseTextSize}
              disabled={textScale === 'sm'}
              style={{
                background: textScale === 'sm' ? 'var(--red-tint)' : 'transparent',
                color: textScale === 'sm' ? 'var(--red-hi)' : 'var(--text-1)',
                border: 'none',
                padding: '3px 7px',
                borderRadius: 'var(--r-xs)',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: textScale === 'sm' ? 'default' : 'pointer'
              }}
              title="Réduire la taille du texte"
              aria-label="Réduire la taille du texte"
            >
              A-
            </button>
            <button
              type="button"
              onClick={resetTextSize}
              style={{
                background: textScale === 'base' ? 'var(--red-tint)' : 'transparent',
                color: textScale === 'base' ? 'var(--red-hi)' : 'var(--text-1)',
                border: 'none',
                padding: '3px 7px',
                borderRadius: 'var(--r-xs)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Taille de texte normale (100%)"
              aria-label="Taille normale"
            >
              A
            </button>
            <button
              type="button"
              onClick={increaseTextSize}
              disabled={textScale === 'lg'}
              style={{
                background: textScale === 'lg' ? 'var(--red-tint)' : 'transparent',
                color: textScale === 'lg' ? 'var(--red-hi)' : 'var(--text-1)',
                border: 'none',
                padding: '3px 7px',
                borderRadius: 'var(--r-xs)',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: textScale === 'lg' ? 'default' : 'pointer'
              }}
              title="Agrandir la taille du texte"
              aria-label="Agrandir la taille du texte"
            >
              A+
            </button>
          </div>

          {/* Atténuation de la luminosité de fond (Normal / Doux / Profond) */}
          <button
            type="button"
            onClick={toggleBgDim}
            className="btn btn-ghost btn-icon"
            style={{
              minHeight: '36px',
              width: '36px',
              position: 'relative',
              border: bgDim !== 'normal' ? '1px solid var(--red-soft)' : '1px solid transparent'
            }}
            title={`Luminosité d'arrière-plan : ${bgDim === 'normal' ? 'Standard (100%)' : bgDim === 'soft' ? 'Atténuée douce (88%)' : 'Confort profond (72%)'}`}
            aria-label="Changer la luminosité du fond"
          >
            <Eye size={16} color={bgDim !== 'normal' ? 'var(--red-hi)' : 'var(--text-2)'} />
            {bgDim !== 'normal' && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--red)'
                }}
              />
            )}
          </button>

          {/* Sélecteur de Densité (Normal / Compact / Ultra-Compact / Micro) */}
          <button
            type="button"
            onClick={cycleDensity}
            className="btn btn-ghost btn-sm"
            style={{
              minHeight: '34px',
              padding: '0 8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              gap: '4px',
              border: '1px solid var(--line)'
            }}
            aria-label="Changer la densite d'affichage"
            title={`Densite : ${density.toUpperCase()} (Cliquer pour basculer : Normal -> Compact -> Ultra-Compact -> Micro)`}
          >
            <span style={{ color: density === 'micro' ? 'var(--red)' : 'var(--text-1)' }}>
              {density === 'micro' ? '🔬 Micro' : density === 'ultra-compact' ? '⚡ Ultra' : density === 'compact' ? '📐 Compact' : '🖥️ Normal'}
            </span>
          </button>

          {/* Sélecteur de Thème Clair / Sombre */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon"
            style={{ minHeight: '36px', width: '36px' }}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} color="var(--brand)" />}
          </button>

          {/* Quick Universal Search Trigger */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Search size={15} />
            <span className="desktop-only">Rechercher...</span>
            <kbd className="desktop-only" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Add User button (for Admins) */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <button
              onClick={onOpenCreateUser ? onOpenCreateUser : () => onNavigate?.('users')}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 800 }}
              title="Créer un nouvel utilisateur"
            >
              <UserPlus size={16} /> + Utilisateur
            </button>
          )}

          {/* User Account Dropdown */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--uba-black-smoke)',
                  border: '1px solid var(--uba-anthracite)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: currentUser.role === 'super_admin' ? 'var(--uba-red)' : 'var(--uba-anthracite)',
                  color: 'var(--uba-white-pure)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.92rem'
                }}>
                  {currentUser.nomComplet.charAt(0)}
                </div>
                <div style={{ textAlign: 'left' }} className="desktop-only">
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--uba-white-cool)', lineHeight: 1.2 }}>
                    {currentUser.nomComplet}
                  </div>
                  <div style={{ fontSize: '0.72rem' }}>
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>
                <ChevronDown size={15} color="var(--uba-silver-dark)" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  backgroundColor: 'var(--uba-black-smoke)',
                  border: '1px solid var(--uba-graphite)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  width: '270px',
                  padding: '8px',
                  zIndex: 100
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--uba-anthracite)', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--uba-white-cool)' }}>
                      {currentUser.nomComplet}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--uba-silver-dark)' }}>
                      {currentUser.email}
                    </div>
                  </div>

                  {/* Profile action */}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--uba-white-cool)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--uba-anthracite)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserIcon size={16} color="var(--uba-red-bright)" />
                    <span>Mon Profil & Sécurité</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--line)', margin: '6px 0' }} />
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--uba-red-bright)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 700
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--uba-red-tint)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Universal Search Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--uba-anthracite)', paddingBottom: '16px', marginBottom: '16px' }}>
              <Search size={22} color="var(--uba-red-bright)" />
              <input
                type="text"
                autoFocus
                placeholder="Rechercher une agence, un carton, un rapport, un membre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.15rem',
                  color: 'var(--uba-white-cool)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => setShowSearchModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--uba-silver-metal)' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {!searchQuery.trim() ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--uba-silver-dark)', fontSize: '0.95rem' }}>
                  Tapez le code ou nom d'une agence (ex: 901, City-Center), un numéro de carton (ex: CARTON-001) ou un mot-clé...
                </div>
              ) : !hasResults ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--uba-silver-dark)', fontSize: '0.95rem' }}>
                  Aucun résultat trouvé pour « {searchQuery} ».
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {matchingAgencies.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--uba-silver-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Agences ({matchingAgencies.length})
                      </div>
                      {matchingAgencies.map(a => (
                        <div
                          key={a.id}
                          onClick={() => {
                            if (onNavigate) onNavigate('agencies');
                            setShowSearchModal(false);
                          }}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--uba-black-glass)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--uba-anthracite)',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--uba-white-cool)' }}>{a.nom}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)', marginLeft: '8px' }}>Code {a.code}</span>
                          </div>
                          <span className="badge badge-silver">{a.conventionsCount} conventions</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingCartons.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--uba-silver-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Cartons d'archives ({matchingCartons.length})
                      </div>
                      {matchingCartons.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (onNavigate) onNavigate('cartons');
                            setShowSearchModal(false);
                          }}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--uba-black-glass)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--uba-anthracite)',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--uba-white-cool)' }}>{c.numeroCarton}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)', marginLeft: '8px' }}>Emplacement: {c.emplacement}</span>
                          </div>
                          <span className="badge badge-black">{c.site}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingReports.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--uba-silver-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Rapports ({matchingReports.length})
                      </div>
                      {matchingReports.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            if (onNavigate) onNavigate('daily-reports');
                            setShowSearchModal(false);
                          }}
                          style={{
                            padding: '10px',
                            backgroundColor: 'var(--uba-black-glass)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--uba-anthracite)',
                            marginBottom: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--uba-white-cool)' }}>{r.titre}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)' }}>Chef: {r.chefNom} · {r.totalCalcule} conventions</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
