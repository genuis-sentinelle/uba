import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar, NavigationTab } from './components/Layout/Sidebar';
import { BottomNav } from './components/Layout/BottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { LoginView } from './components/Auth/LoginView';
import { ProfileModal } from './components/Profile/ProfileModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { can } from './utils/permissions';

// Code Splitting / Lazy Loading des vues pour réduire le bundle initial
const DailyReportView = lazy(() => import('./components/DailyReport/DailyReportView').then(m => ({ default: m.DailyReportView })));
const SynthesisView = lazy(() => import('./components/Synthesis/SynthesisView').then(m => ({ default: m.SynthesisView })));
const TransferSlipsView = lazy(() => import('./components/TransferSlips/TransferSlipsView').then(m => ({ default: m.TransferSlipsView })));
const CartonsView = lazy(() => import('./components/Cartons/CartonsView').then(m => ({ default: m.CartonsView })));
const QuickAttendanceView = lazy(() => import('./components/Attendance/QuickAttendanceView').then(m => ({ default: m.QuickAttendanceView })));
const IncidentsView = lazy(() => import('./components/Incidents/IncidentsView').then(m => ({ default: m.IncidentsView })));
const AgenciesView = lazy(() => import('./components/Agencies/AgenciesView').then(m => ({ default: m.AgenciesView })));
const ConventionsView = lazy(() => import('./components/Conventions/ConventionsView').then(m => ({ default: m.ConventionsView })));
const TeamView = lazy(() => import('./components/Team/TeamView').then(m => ({ default: m.TeamView })));
const AuditLogsView = lazy(() => import('./components/AuditLogs/AuditLogsView').then(m => ({ default: m.AuditLogsView })));
const UsersManagementView = lazy(() => import('./components/Users/UsersManagementView').then(m => ({ default: m.UsersManagementView })));
const SettingsView = lazy(() => import('./components/Settings/SettingsView').then(m => ({ default: m.SettingsView })));
const ArchivesView = lazy(() => import('./components/Archives/ArchivesView').then(m => ({ default: m.ArchivesView })));

const ViewLoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', width: '100%' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="badge badge-red" style={{ marginBottom: '10px', fontSize: '0.85rem' }}>ARCHIVA UBA</div>
      <p className="text-muted text-sm">Chargement du module...</p>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [openedReportId, setOpenedReportId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoOpenAddUser, setAutoOpenAddUser] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sécurité Stagiaire : blocage impression & touches de raccourci (Ctrl+P, Ctrl+S)
  useEffect(() => {
    const isStagiaire = currentUser?.role === 'stagiaire';
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('role-stagiaire', Boolean(isStagiaire));
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isStagiaire && (e.ctrlKey || e.metaKey)) {
        if (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('role-stagiaire');
      }
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [currentUser]);

  // Desktop sidebar collapsed preference
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('uba_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('uba_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="badge badge-red" style={{ marginBottom: '12px' }}>ARCHIVA UBA</div>
          <p className="text-muted text-sm">Chargement sécurisé...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenReportFromDashboard = (reportId: string) => {
    setOpenedReportId(reportId);
    setCurrentTab('daily-reports');
  };

  const handleOpenCreateUser = () => {
    setAutoOpenAddUser(true);
    setCurrentTab('users');
  };

  return (
    <div className="app-layout">
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="app-body">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main className={`app-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentTab}
                onOpenReport={handleOpenReportFromDashboard}
                onOpenCreateUser={handleOpenCreateUser}
              />
            )}

            {currentTab === 'daily-reports' && (
              <DailyReportView openedReportId={openedReportId} />
            )}

            {currentTab === 'synthesis' && (
              <SynthesisView />
            )}

            {currentTab === 'transfer-slips' && (
              <TransferSlipsView />
            )}

            {currentTab === 'cartons' && (
              <CartonsView />
            )}

            {currentTab === 'attendance' && (
              <QuickAttendanceView />
            )}

            {currentTab === 'incidents' && (
              <IncidentsView />
            )}

            {currentTab === 'agencies' && (
              <AgenciesView />
            )}

            {currentTab === 'conventions' && (
              <ConventionsView />
            )}

            {currentTab === 'team' && (
              <TeamView />
            )}

            {currentTab === 'audit-logs' && can.viewAudit(currentUser?.role) && (
              <AuditLogsView />
            )}

            {currentTab === 'archives' && can.viewArchives(currentUser?.role) && (
              <ArchivesView />
            )}

            {currentTab === 'users' && can.manageUsers(currentUser?.role) && (
              <UsersManagementView
                autoOpenAdd={autoOpenAddUser}
                onModalClosed={() => setAutoOpenAddUser(false)}
              />
            )}

            {currentTab === 'settings' && can.editReferentials(currentUser?.role) && (
              <SettingsView />
            )}
          </Suspense>
        </main>
      </div>

      <BottomNav
        current={currentTab}
        onSelect={setCurrentTab}
        onMore={() => setIsMobileMenuOpen(true)}
      />

      {/* Modal de profil utilisateur & changement de mot de passe */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <MainApp />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
