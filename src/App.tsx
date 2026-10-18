import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar, NavigationTab } from './components/Layout/Sidebar';
import { BottomNav } from './components/Layout/BottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { DailyReportView } from './components/DailyReport/DailyReportView';
import { SynthesisView } from './components/Synthesis/SynthesisView';
import { TransferSlipsView } from './components/TransferSlips/TransferSlipsView';
import { CartonsView } from './components/Cartons/CartonsView';
import { QuickAttendanceView } from './components/Attendance/QuickAttendanceView';
import { IncidentsView } from './components/Incidents/IncidentsView';
import { AgenciesView } from './components/Agencies/AgenciesView';
import { ConventionsView } from './components/Conventions/ConventionsView';
import { TeamView } from './components/Team/TeamView';
import { AuditLogsView } from './components/AuditLogs/AuditLogsView';
import { UsersManagementView } from './components/Users/UsersManagementView';
import { SettingsView } from './components/Settings/SettingsView';
import { LoginView } from './components/Auth/LoginView';
import { ProfileModal } from './components/Profile/ProfileModal';
import { can } from './utils/permissions';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [openedReportId, setOpenedReportId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoOpenAddUser, setAutoOpenAddUser] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    setCurrentTab('users');
    setAutoOpenAddUser(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar
        currentTab={currentTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={setCurrentTab}
        onOpenCreateUser={handleOpenCreateUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="app-shell">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main className="app-main">
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

          {currentTab === 'users' && can.manageUsers(currentUser?.role) && (
            <UsersManagementView
              autoOpenAdd={autoOpenAddUser}
              onModalClosed={() => setAutoOpenAddUser(false)}
            />
          )}

          {currentTab === 'settings' && can.editReferentials(currentUser?.role) && (
            <SettingsView />
          )}
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
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
