import React from 'react';
import { 
  Monitor, LayoutDashboard, FolderOpen, CheckSquare, Users, Clock, FileText,
  Shield, Wrench, PoundSterling, MessageSquare, Map, Cpu, LineChart,
  HardHat, Zap, Lock, Code, Store, Wand2, Navigation, LogOut,
  BrainCircuit, ShieldCheck, Globe, Activity, Rocket, Building2,
  Settings, Network, Crown, Terminal, ShieldHalf, Layout, Radio, Server,
  BarChart3, DatabaseZap, Fingerprint, ScanLine, Layers, Eye
} from 'lucide-react';
import { Page, UserRole, FeatureEntitlements, Permission } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

interface MenuItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  permissions?: Permission[];
  feature?: keyof FeatureEntitlements;
  severity?: 'critical' | 'normal';
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  const { user, logout, checkFeature, can } = useAuth();

  const isPlatformStaff = user?.role === UserRole.SUPER_ADMIN || 
                         user?.role === UserRole.SUPPORT_ADMIN || 
                         user?.role === UserRole.AUDITOR;

  const sovereignHUD: MenuItem[] = [
    { id: Page.PLATFORM_PULSE, label: 'Platform Pulse', icon: Radio, roles: [UserRole.SUPER_ADMIN] },
    { id: Page.SYSTEM_CONSOLE, label: 'Prime Terminal', icon: Terminal, roles: [UserRole.SUPER_ADMIN] },
    { 
      id: Page.COMPANIES_HUB, 
      label: 'Cluster Registry', 
      icon: Server, 
      roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN],
      permissions: [Permission.TENANT_LIFECYCLE_MGMT]
    },
    { 
      id: Page.SECURITY, 
      label: 'Forensic Audit', 
      icon: Fingerprint, 
      roles: [UserRole.SUPER_ADMIN, UserRole.AUDITOR],
      permissions: [Permission.SYSTEM_DIAGNOSTICS] 
    },
    { id: Page.MESH, label: 'Global Mesh', icon: Network, roles: [UserRole.SUPER_ADMIN] },
  ];

  const operationalMesh: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Navigation Nodes',
      items: [
          { id: Page.DASHBOARD, label: 'Control Deck', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.AUDITOR, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE] },
          { id: Page.PROJECTS, label: 'Project Matrix', icon: FolderOpen, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.AUDITOR, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE] },
          { id: Page.TASKS, label: 'Field Objectives', icon: CheckSquare, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.AUDITOR, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE] },
      ]
    },
    {
      title: 'Neural Ops',
      items: [
        { id: Page.VISION, label: 'Vision Shard', icon: ScanLine, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN], feature: 'liveVision' },
        { id: Page.ARCHITECTURE, label: 'Logic Arch', icon: Layers, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN], feature: 'aiAssistant' },
        { id: Page.INTELLIGENCE_HUB, label: 'Intel Lens', icon: Eye, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], feature: 'liveVision' },
        { id: Page.LIVE, label: 'Vision Agent', icon: Zap, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], feature: 'liveVision' },
        { id: Page.CHAT, label: 'Architect AI', icon: BrainCircuit, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], feature: 'aiAssistant' },
        { id: Page.IMAGINE, label: 'Forge Studio', icon: Wand2, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN], feature: 'imagineStudio' },
      ]
    },
    {
      title: 'Enterprise Infrastructure',
      items: [
        { 
          id: Page.FINANCIALS, 
          label: 'Ledger Hub', 
          icon: PoundSterling, 
          roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.AUDITOR, UserRole.COMPANY_OWNER], 
          permissions: [Permission.TENANT_FINANCIAL_ADMIN],
          feature: 'financials' 
        },
        { id: Page.TEAM, label: 'Identity Mesh', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.AUDITOR, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN] },
        { id: Page.MARKETPLACE, label: 'App Forge', icon: Store, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN] },
        { 
          id: Page.COMPANY_SETTINGS, 
          label: 'Company Settings', 
          icon: Settings, 
          roles: [UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN],
          permissions: [Permission.TENANT_SETTINGS_ADMIN]
        },
      ]
    }
  ];

  const isVisible = (item: MenuItem) => {
      if (!user) return false;
      const roleMatch = item.roles.includes(user.role);
      const permMatch = !item.permissions || item.permissions.some(p => can(p));
      const featureMatch = !item.feature || checkFeature(item.feature);
      return roleMatch && permMatch && featureMatch;
  };

  const renderItem = (item: MenuItem) => (
    <button
      key={item.id}
      onClick={() => setPage(item.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
        currentPage === item.id 
          ? (isPlatformStaff ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(14,165,233,0.2)]')
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      <item.icon 
        size={18} 
        strokeWidth={currentPage === item.id ? 2.5 : 2}
        className={`transition-all ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`} 
      />
      <span className={`text-[11px] font-bold uppercase tracking-wider transition-all ${currentPage === item.id ? 'tracking-[0.1em]' : ''}`}>
        {item.label}
      </span>
      {currentPage === item.id && (
        <div className={`ml-auto w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isPlatformStaff ? 'bg-emerald-400' : 'bg-primary'}`} />
      )}
    </button>
  );

  return (
    <div className="w-64 h-screen bg-midnight border-r border-white/5 flex flex-col flex-shrink-0 overflow-y-auto hide-scrollbar shadow-[20px_0_40px_rgba(0,0,0,0.4)] z-50">
      <div className="p-8 flex items-center gap-4 sticky top-0 bg-midnight/80 backdrop-blur-xl z-20 border-b border-white/5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all ${isPlatformStaff ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-primary/20 border-primary/40 text-primary'}`}>
            <BrainCircuit size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
            <span className="font-black text-lg text-white tracking-tighter uppercase leading-none">Cortex</span>
            <span className={`font-bold text-[9px] uppercase tracking-[0.4em] mt-1 block leading-none ${isPlatformStaff ? 'text-emerald-400' : 'text-primary'}`}>
                {isPlatformStaff ? 'Platform Shard' : 'Operational'}
            </span>
        </div>
      </div>

      <nav className="flex-1 py-8 px-5 space-y-9">
        {isPlatformStaff && (
            <div className="space-y-2">
                <div className="px-3 mb-4 text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 flex items-center gap-2">
                    <Crown size={12} className="fill-emerald-500" /> Sovereign HUD
                </div>
                <div className="space-y-1">
                    {sovereignHUD.filter(isVisible).map(renderItem)}
                </div>
            </div>
        )}

        {operationalMesh.map((group, groupIndex) => {
          const visibleItems = group.items.filter(isVisible);
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIndex} className="space-y-2">
              <div className="px-3 mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 border-l-2 border-zinc-800 ml-1 pl-2">
                {group.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map(renderItem)}
              </div>
            </div>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-white/5 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 py-4 text-[10px] font-black text-red-400 hover:text-red-300 transition-all uppercase tracking-[0.3em] bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 active:scale-95"
        >
           <LogOut size={16} strokeWidth={3} />
           <span>Shutdown Link</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
