import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar, NavigationTab } from './components/Layout/Sidebar';
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

const MainApp: React.FC = () => {
  const { currentUser } = useAuth();
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' }}>
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={setCurrentTab}
        onOpenCreateUser={handleOpenCreateUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main style={{ flex: 1, overflowX: 'hidden', paddingBottom: '30px' }}>
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

          {currentTab === 'audit-logs' && currentUser?.role !== 'stagiaire' && currentUser?.role !== 'user' && (
            <AuditLogsView />
          )}

          {currentTab === 'users' && currentUser?.role !== 'stagiaire' && currentUser?.role !== 'user' && (
            <UsersManagementView
              autoOpenAdd={autoOpenAddUser}
              onModalClosed={() => setAutoOpenAddUser(false)}
            />
          )}

          {currentTab === 'settings' && currentUser?.role !== 'stagiaire' && currentUser?.role !== 'user' && (
            <SettingsView />
          )}
        </main>
      </div>

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
