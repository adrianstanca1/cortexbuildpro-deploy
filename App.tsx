import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import AIToolsView from './views/AIToolsView';
import ReportsView from './views/ReportsView';
import ScheduleView from './views/ScheduleView';
import ChatView from './views/ChatView';
import LiveView from './views/LiveView';
import DashboardView from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import ProjectDetailsView from './views/ProjectDetailsView';
import TasksView from './views/TasksView';
import TeamView from './views/TeamView';
import TimesheetsView from './views/TimesheetsView';
import DocumentsView from './views/DocumentsView';
import SafetyView from './views/SafetyView';
import EquipmentView from './views/EquipmentView';
import FinancialsView from './views/FinancialsView';
import TeamChatView from './views/TeamChatView';
import MLInsightsView from './views/MLInsightsView';
import ComplianceView from './views/ComplianceView';
import ProcurementView from './views/ProcurementView';
import CustomDashView from './views/CustomDashView';
import WorkforceView from './views/WorkforceView';
import IntegrationsView from './views/IntegrationsView';
import SecurityView from './views/SecurityView';
import ExecutiveView from './views/ExecutiveView';
import MapView from './views/MapView';
import ClientsView from './views/ClientsView';
import InventoryView from './views/InventoryView';
import DevSandboxView from './views/DevSandboxView';
import MarketplaceView from './views/MarketplaceView';
import ImagineView from './views/ImagineView';
import MyDesktopView from './views/MyDesktopView';
import LiveProjectMapView from './views/LiveProjectMapView';
import CompaniesHubView from './views/CompaniesHubView';
import SystemConsoleView from './views/SystemConsoleView';
import PlatformPulseView from './views/PlatformPulseView';
import CompanySettingsView from './views/CompanySettingsView';
import VisionView from './views/VisionView';
import ArchitectureView from './views/ArchitectureView';
import MeshView from './views/MeshView';
import { Page, UserRole } from './types';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { Loader2, BrainCircuit, X, ShieldAlert } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user, isLoading, isImpersonating, stopImpersonating, impersonatedTenantName } = useAuth();
  
  const isPlatformStaff = user?.role === UserRole.SUPER_ADMIN || 
                         user?.role === UserRole.SUPPORT_ADMIN || 
                         user?.role === UserRole.AUDITOR;
  
  const [page, setPage] = useState<Page>(isPlatformStaff ? Page.COMPANIES_HUB : Page.DASHBOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [installedApps, setInstalledApps] = useState<string[]>(['Procore', 'Slack', 'QuickBooks']);

  // Protocol: Handle landing page based on identity rank after successful link sync
  useEffect(() => {
    if (user) {
        if (isPlatformStaff) {
            setPage(Page.COMPANIES_HUB);
        } else {
            setPage(Page.DASHBOARD);
        }
    }
  }, [user?.role, isPlatformStaff]);

  const toggleAppInstall = (appName: string) => {
    if (installedApps.includes(appName)) {
        setInstalledApps(prev => prev.filter(n => n !== appName));
    } else {
        setInstalledApps(prev => [...prev, appName]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPage(Page.PROJECT_DETAILS);
  };

  if (isLoading) {
    return (
        <div className="h-screen w-full bg-midnight flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <div className="w-32 h-32 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
                <BrainCircuit size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Synchronizing Neural Hub</h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Establishing Sovereign Link...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    return <LoginView setPage={setPage} />;
  }

  return (
      <div className={`flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden relative ${isImpersonating ? 'ring-8 ring-red-600/50 ring-inset' : ''}`}>
        {isImpersonating && (
            <div className="absolute top-0 left-0 right-0 h-10 z-[1000] bg-red-600 flex items-center justify-between px-10 shadow-2xl animate-in slide-in-from-top">
                <div className="flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-[0.2em]">
                    <ShieldAlert size={18} className="animate-pulse" />
                    <span>Active Impersonation Protocol: {impersonatedTenantName}</span>
                </div>
                <button 
                    onClick={stopImpersonating}
                    className="flex items-center gap-2 bg-white text-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase hover:bg-zinc-100 transition-all active:scale-95"
                >
                    <X size={14} /> Close Shard Session
                </button>
            </div>
        )}
        
        <Sidebar currentPage={page} setPage={setPage} />

        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          <TopBar setPage={setPage} />
          
          <main className="flex-1 overflow-y-auto bg-zinc-50/50 relative custom-scrollbar">
              {page === Page.PLATFORM_PULSE && <PlatformPulseView />}
              {page === Page.DASHBOARD && <DashboardView setPage={setPage} />}
              {page === Page.EXECUTIVE && <ExecutiveView />}
              {page === Page.SYSTEM_CONSOLE && <SystemConsoleView />}
              {page === Page.LIVE_PROJECT_MAP && <LiveProjectMapView projectId={selectedProjectId || undefined} />}
              {page === Page.PROJECT_LAUNCHPAD && <ProjectsView onProjectSelect={handleProjectSelect} setPage={setPage} autoLaunch={true} />}
              {page === Page.PROJECTS && <ProjectsView onProjectSelect={handleProjectSelect} setPage={setPage} />}
              {page === Page.PROJECT_DETAILS && (
                <ProjectDetailsView 
                  projectId={selectedProjectId} 
                  onBack={() => setPage(Page.PROJECTS)} 
                />
              )}
              {page === Page.TASKS && <TasksView projectId={selectedProjectId || undefined} />}
              {page === Page.TEAM && <TeamView projectId={selectedProjectId || undefined} />}
              {page === Page.TIMESHEETS && <TimesheetsView />}
              {page === Page.DOCUMENTS && <DocumentsView projectId={selectedProjectId || undefined} />}
              {page === Page.SAFETY && <SafetyView projectId={selectedProjectId || undefined} />}
              {page === Page.EQUIPMENT && <EquipmentView projectId={selectedProjectId || undefined} />}
              {page === Page.FINANCIALS && <FinancialsView />}
              {page === Page.TEAM_CHAT && <TeamChatView />}
              {page === Page.AI_TOOLS && <AIToolsView setPage={setPage} />}
              {page === Page.ML_INSIGHTS && <MLInsightsView />}
              {page === Page.COMPLIANCE && <ComplianceView />}
              {page === Page.PROCUREMENT && <ProcurementView />}
              {page === Page.SCHEDULE && <ScheduleView projectId={selectedProjectId || undefined} />}
              {page === Page.CUSTOM_DASH && <CustomDashView />}
              {page === Page.REPORTS && <ReportsView />}
              {page === Page.WORKFORCE && <WorkforceView />}
              {page === Page.INTEGRATIONS && <IntegrationsView />}
              {page === Page.SECURITY && <SecurityView />}
              {page === Page.PROFILE && <ProfileView />}
              {page === Page.MAP_VIEW && <MapView />}
              {page === Page.CLIENTS && <ClientsView />}
              {page === Page.INVENTORY && <InventoryView />}
              {page === Page.CHAT && <ChatView setPage={setPage} />}
              {page === Page.LIVE && <LiveView setPage={setPage} />}
              {page === Page.DEV_SANDBOX && <DevSandboxView />}
              {page === Page.COMPANIES_HUB && <CompaniesHubView />}
              {page === Page.COMPANY_SETTINGS && <CompanySettingsView />}
              {page === Page.VISION && <VisionView />}
              {page === Page.ARCHITECTURE && <ArchitectureView />}
              {page === Page.MESH && <MeshView />}
              {page === Page.MARKETPLACE && (
                  <MarketplaceView 
                      installedApps={installedApps} 
                      toggleInstall={toggleAppInstall} 
                  />
              )}
              {page === Page.IMAGINE && <ImagineView />}
              {page === Page.MY_DESKTOP && (
                  <MyDesktopView 
                      installedApps={installedApps}
                      setPage={setPage}
                  />
              )}
          </main>
        </div>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <SuperAdminProvider>
            <AuthenticatedApp />
        </SuperAdminProvider>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;
