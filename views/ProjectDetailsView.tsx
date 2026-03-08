import React, { useState, useMemo } from 'react';
import { 
  Calendar, PoundSterling, MapPin, 
  CheckSquare, FileText, 
  Sun, Wind, AlertTriangle, Plus, 
  Camera, Hammer, Clipboard, ChevronRight,
  Sparkles, Loader2, Search,
  Clock, Zap, X, Building2, Info, ScanLine, 
  ChevronLeft, Target, 
  Cpu, Activity, ShieldCheck, 
  Wallet, Check, Receipt, RefreshCw, BrainCircuit, Trash2, 
  HelpCircle, Hash,
  Settings,
  AlertCircle,
  Users,
  LocateFixed,
  Maximize2,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  ClipboardCheck,
  Send,
  Umbrella,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  GitMerge,
  ListTodo,
  ArrowRight,
  Database,
  Box,
  BellRing,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  PlusSquare,
  Tags,
  ToggleLeft,
  ToggleRight,
  User,
  CheckCircle2,
  Circle,
  Compass
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Project, ProjectSettings, Permission, Task, SubTask } from '../types';
import ScheduleView from './ScheduleView';
import DocumentsView from './DocumentsView';
import DrawingsView from './DrawingsView';
import TasksView from './TasksView';
import TeamView from './TeamView';
import InvoicesView from './InvoicesView';
import RFIsView from './RFIsView';
import ChangeOrdersView from './ChangeOrdersView';
import PunchItemsView from './PunchItemsView';
import DailyLogsView from './DailyLogsView';
import DayworksView from './DayworksView';
import ProjectMapView from './ProjectMapView';
import ProjectPhasesView from './ProjectPhasesView';
import { ProjectActionModals } from '../components/ProjectActionModals';
import { useAuth } from '../contexts/AuthContext';

interface ProjectDetailsViewProps {
  projectId: string | null;
  onBack: () => void;
}

type Tab = 'OVERVIEW' | 'MAP' | 'PROJECT_PHASES' | 'DRAWINGS' | 'TASKS' | 'SCHEDULE' | 'TEAM' | 'DAILY_LOGS' | 'DAYWORKS' | 'DOCUMENTS' | 'PHOTOS' | 'INVOICES' | 'RFIS' | 'CHANGE_ORDERS' | 'PUNCH_LIST' | 'SETTINGS';

type ModalType = 'RFI' | 'PUNCH' | 'LOG' | 'DAYWORK' | 'PHOTO' | 'DRAWING' | 'INVOICE' | 'CHANGE_ORDER';

const getWeatherIcon = (condition: string = '') => {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear')) return <Sun size={24} />;
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={24} />;
    if (c.includes('thunder') || c.includes('storm')) return <CloudLightning size={24} />;
    if (c.includes('snow') || c.includes('ice')) return <CloudSnow size={24} />;
    if (c.includes('fog') || c.includes('mist')) return <CloudFog size={24} />;
    if (c.includes('cloud')) return <Cloud size={24} />;
    if (c.includes('wind')) return <Wind size={24} />;
    return <Umbrella size={24} />;
};

const ProjectSettingsView: React.FC<{ project: Project; onUpdate: (updates: Partial<Project>) => void }> = ({ project, onUpdate }) => {
  const { user, can } = useAuth();
  const { projects } = useProjects();
  const canEditSettings = can(Permission.TENANT_SETTINGS_ADMIN);

  const settings = project.settings || {
    budgetAlertThreshold: 90,
    budgetAlertEnabled: true,
    notifications: { email: true, push: true, slack: false, criticalOnly: false },
    customFields: []
  };

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    onUpdate({ settings: { ...settings, ...newSettings } });
  };

  const toggleNotification = (key: keyof ProjectSettings['notifications']) => {
    updateSettings({
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] }
    });
  };

  const addCustomField = () => {
    const newField = { id: `cf-${Date.now()}`, key: 'NEW_KEY', value: '' };
    updateSettings({ customFields: [...settings.customFields, newField] });
  };

  const removeCustomField = (id: string) => {
    updateSettings({ customFields: settings.customFields.filter(f => f.id !== id) });
  };

  const updateCustomField = (id: string, updates: any) => {
    updateSettings({
      customFields: settings.customFields.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const handleGenerateCode = () => {
    if (!project.name) return;
    
    const namePart = project.name.trim().split(' ')[0].substring(0, 3).toUpperCase();
    const typeMap: Record<string, string> = {
        'Commercial': 'COM',
        'Residential': 'RES',
        'Industrial': 'IND',
        'Infrastructure': 'INF',
        'Healthcare': 'MED'
    };
    const typePart = typeMap[project.type] || 'PRJ';
    const yearPart = new Date(project.startDate).getFullYear().toString().slice(-2);
    
    let baseCode = `${namePart}-${typePart}-${yearPart}`;
    let finalCode = baseCode;
    let counter = 1;
    
    // Ensure uniqueness within the existing projects list
    while (projects.some(p => p.code === finalCode && p.id !== project.id)) {
        finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
        counter++;
    }
    
    onUpdate({ code: finalCode });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-zinc-900 rounded-2xl text-primary shadow-2xl border border-white/5">
                    <Settings size={32} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Project Governance</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-2">Sovereign Control Shard • Configuration Deck</p>
                </div>
            </div>
            {!canEditSettings && (
                <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                    <ShieldAlert size={14} /> Read-Only Node Clearance
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-8 h-fit relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Database size={150} /></div>
                <div className="flex items-center gap-3 border-b border-zinc-50 pb-5 relative z-10">
                    <Database size={18} className="text-primary" />
                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Shard Identity Registry</h4>
                </div>
                <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Identifier Label</label>
                        <input 
                            disabled={!canEditSettings}
                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50" 
                            value={project.name}
                            onChange={e => onUpdate({ name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
                            Project Registry Code
                            {canEditSettings && (
                                <button 
                                    onClick={handleGenerateCode}
                                    className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200"
                                    title="Auto-generate from Name, Sector and Year"
                                >
                                    <RefreshCw size={10} /> Regenerate Shard Code
                                </button>
                            )}
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input 
                                disabled={!canEditSettings}
                                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 font-mono" 
                                value={project.code}
                                onChange={e => onUpdate({ code: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Authority Custodian</label>
                        <input 
                            disabled={!canEditSettings}
                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50" 
                            value={project.manager}
                            onChange={e => onUpdate({ manager: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Technical Abstract</label>
                        <textarea 
                            disabled={!canEditSettings}
                            className="w-full p-5 h-32 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all italic disabled:opacity-50" 
                            value={project.description}
                            onChange={e => onUpdate({ description: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-8 h-fit relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Wallet size={150} /></div>
                    <div className="flex items-center justify-between border-b border-zinc-50 pb-5 relative z-10">
                        <div className="flex items-center gap-3">
                            <Wallet size={18} className="text-emerald-500" />
                            <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Financial Safeguards</h4>
                        </div>
                        <button 
                            disabled={!canEditSettings}
                            onClick={() => updateSettings({ budgetAlertEnabled: !settings.budgetAlertEnabled })}
                            className={`w-12 h-6 rounded-full transition-all relative disabled:opacity-30 ${settings.budgetAlertEnabled ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.budgetAlertEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    <div className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                                <span className="text-zinc-400">Alert Threshold</span>
                                <span className="text-emerald-600">{settings.budgetAlertThreshold}%</span>
                            </div>
                            <input 
                                type="range" min="50" max="100"
                                disabled={!canEditSettings || !settings.budgetAlertEnabled}
                                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                                value={settings.budgetAlertThreshold}
                                onChange={e => updateSettings({ budgetAlertThreshold: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-zinc-400 font-medium italic">Triggers an emergency logic pulse when burn rate exceeds threshold.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-8 h-fit relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><BellRing size={150} /></div>
                    <div className="flex items-center gap-3 border-b border-zinc-50 pb-5 relative z-10">
                        <BellRing size={18} className="text-primary" />
                        <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Notification Routing</h4>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {[
                            { key: 'email', label: 'Identity Endpoint (Email)', icon: Mail },
                            { key: 'push', label: 'Mobile Device Push', icon: Smartphone },
                            { key: 'slack', label: 'Slack Webhook Link', icon: MessageSquare },
                            { key: 'criticalOnly', label: 'Critical Protocol Only', icon: ShieldAlert }
                        ].map(({ key, label, icon: Icon }) => (
                            <div 
                                key={key}
                                onClick={() => canEditSettings && toggleNotification(key as any)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${canEditSettings ? 'cursor-pointer' : 'opacity-50'} ${settings.notifications[key as keyof typeof settings.notifications] ? 'bg-primary/5 border-primary/20' : 'bg-zinc-50 border-transparent hover:border-zinc-100'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl border transition-all ${settings.notifications[key as keyof typeof settings.notifications] ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-300 border-zinc-100'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tight text-zinc-700">{label}</span>
                                </div>
                                {settings.notifications[key as keyof typeof settings.notifications] ? <ToggleRight size={24} className="text-primary" /> : <ToggleLeft size={24} className="text-zinc-300" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Tags size={150} /></div>
            <div className="flex items-center justify-between border-b border-zinc-50 pb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <Tags size={18} className="text-purple-500" />
                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Custom Metadata Shards</h4>
                </div>
                <button 
                    disabled={!canEditSettings}
                    onClick={addCustomField}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30"
                >
                    <PlusSquare size={14} /> Append Node
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {settings.customFields.map(field => (
                    <div key={field.id} className="flex gap-4 items-center bg-zinc-50 p-4 rounded-[1.75rem] border border-zinc-100 group/field hover:border-primary/30 transition-all">
                        <input 
                            disabled={!canEditSettings}
                            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary w-32 focus:ring-4 focus:ring-primary/5 outline-none disabled:opacity-50"
                            value={field.key}
                            onChange={e => updateCustomField(field.id, { key: e.target.value })}
                        />
                        <input 
                            disabled={!canEditSettings}
                            className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 focus:ring-4 focus:ring-primary/5 outline-none disabled:opacity-50"
                            placeholder="Value node..."
                            value={field.value}
                            onChange={e => updateCustomField(field.id, { value: e.target.value })}
                        />
                        <button 
                            disabled={!canEditSettings}
                            onClick={() => removeCustomField(field.id)}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover/field:opacity-100 disabled:opacity-0"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {settings.customFields.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-300 italic text-xs uppercase tracking-widest">No custom nodes defined.</div>
                )}
            </div>
        </div>
    </div>
  );
};

const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({ projectId, onBack }) => {
  const { getProject, updateProject, tasks, drawings, teamMembers, photos, invoices, rfis, punchItems, dailyLogs, dayworks } = useProjects();
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  const project = useMemo(() => projectId ? getProject(projectId) : null, [projectId, getProject]);

  if (!project) return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Locating project shard in mesh...</p>
      </div>
  );

  const handleUpdateProject = (updates: Partial<Project>) => {
    updateProject(project.id, updates);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutGrid },
    { id: 'TASKS', label: 'Objectives', icon: ListTodo },
    { id: 'PROJECT_PHASES', label: 'Phases', icon: Layers },
    { id: 'SCHEDULE', label: 'Timeline', icon: Calendar },
    { id: 'MAP', label: 'Spatial HUD', icon: MapIcon },
    { id: 'TEAM', label: 'Identity Mesh', icon: Users },
    { id: 'DRAWINGS', label: 'Blueprints', icon: Box },
    { id: 'PHOTOS', label: 'Site Visuals', icon: Camera },
    { id: 'DAILY_LOGS', label: 'Daily Logs', icon: Clipboard },
    { id: 'DAYWORKS', label: 'Variation Ledger', icon: Hammer },
    { id: 'INVOICES', label: 'Ledger Hub', icon: Receipt },
    { id: 'RFIS', label: 'Inquiries', icon: HelpCircle },
    { id: 'PUNCH_LIST', label: 'Punch List', icon: ClipboardCheck },
    { id: 'DOCUMENTS', label: 'Project Vault', icon: FileText },
    { id: 'SETTINGS', label: 'Governance', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-white relative animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="bg-zinc-950 text-white px-10 py-12 relative overflow-hidden shrink-0 border-b border-white/5">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 size={300} /></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-6 flex-1">
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-white transition-all group"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Clusters
                </button>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40">{project.status} HUB</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Hash size={12} className="text-primary" /> {project.code}
                        </span>
                        <div className="h-1 w-1 bg-zinc-700 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={12} className="text-primary" /> {project.type} Node
                        </span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">{project.name}</h1>
                    <div className="flex items-center gap-6 text-zinc-400 font-medium pt-2">
                        <span className="flex items-center gap-2 text-sm uppercase tracking-tight"><MapPin size={16} className="text-primary" /> {project.location}</span>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="flex items-center gap-2 text-sm uppercase tracking-tight"><User size={16} className="text-primary" /> Custodian: {project.manager}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-6 shrink-0">
                <div className="flex gap-4">
                    {project.weatherLocation && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] px-8 py-4 flex items-center gap-6 shadow-2xl">
                            <div className="text-primary">{getWeatherIcon(project.weatherLocation.condition)}</div>
                            <div className="text-right">
                                <div className="text-2xl font-black tracking-tighter">{project.weatherLocation.temp}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{project.weatherLocation.condition}</div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] px-8 py-4 flex items-center gap-6 shadow-2xl">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shadow-inner border border-emerald-500/20"><Wallet size={20} /></div>
                        <div className="text-right">
                            <div className="text-2xl font-black tracking-tighter">£{(project.spent / 1000).toFixed(0)}k <span className="text-zinc-600">/ £{(project.budget / 1000000).toFixed(1)}M</span></div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Resource Burn</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tab Navigation Hub */}
      <div className="h-16 bg-white border-b border-zinc-100 flex items-center px-10 gap-2 overflow-x-auto no-scrollbar sticky top-0 z-30 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap group ${
              activeTab === tab.id 
                ? 'bg-zinc-900 text-white shadow-xl scale-105' 
                : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <tab.icon size={14} className={`transition-transform duration-500 ${activeTab === tab.id ? 'scale-125' : 'group-hover:scale-110'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-10 custom-scrollbar">
        {activeTab === 'OVERVIEW' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* AI Insights HUD */}
                <div className="bg-gradient-to-br from-midnight to-[#0f5c82] rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-[3000ms]"><BrainCircuit size={300} /></div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30 shadow-2xl"><Zap size={24} className="text-yellow-400 fill-current" /></div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Neural Status Briefing</h3>
                                </div>
                                <p className="text-lg text-zinc-200 leading-relaxed font-medium italic pr-12">"{project.aiAnalysis || 'Synthesizing real-time site telemetry for comprehensive project health assessment. Logic nodes are aligning with baseline benchmarks.'}"</p>
                            </div>

                            <div className="grid grid-cols-3 gap-8 pt-6 border-t border-white/10">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logic Alignment</div>
                                    <div className="text-3xl font-black tracking-tighter text-primary">98.2%</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Temporal Drift</div>
                                    <div className="text-3xl font-black tracking-tighter text-emerald-400">-2.4d</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Risk Index</div>
                                    <div className="text-3xl font-black tracking-tighter text-blue-400">L-04</div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col justify-between items-center text-center p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                    <circle 
                                        cx="80" cy="80" r="70" 
                                        fill="none" 
                                        stroke="#0ea5e9" 
                                        strokeWidth="12" 
                                        strokeDasharray="440" 
                                        strokeDashoffset={440 - (440 * project.progress) / 100} 
                                        strokeLinecap="round"
                                        className="transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black tracking-tighter">{project.progress}%</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Matrix Sync</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Health State</div>
                                <div className={`text-xl font-black uppercase tracking-tight ${project.health === 'Good' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {project.health} Condition
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical HUD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm space-y-8 flex flex-col group hover:border-primary transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-zinc-50 rounded-2xl shadow-inner border border-zinc-100 group-hover:bg-primary/10 group-hover:text-primary transition-all"><ListTodo size={28} /></div>
                            <button onClick={() => setActiveTab('TASKS')} className="text-zinc-300 hover:text-primary transition-all"><ArrowRight size={20} /></button>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Field Objectives</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Pending Site Mission Shards</p>
                        </div>
                        <div className="space-y-4 flex-1">
                            {tasks.filter(t => t.projectId === project.id).slice(0, 3).map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group/task hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-green-500' : 'bg-primary'}`} />
                                    <span className="text-xs font-bold text-zinc-700 truncate uppercase tracking-tight group-hover/task:text-primary transition-colors">{task.title}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setActiveModal('RFI')} className="w-full py-4 bg-zinc-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-2">
                             Raise Technical Inquiry
                        </button>
                    </div>

                    <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm space-y-8 flex flex-col group hover:border-emerald-500 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-zinc-50 rounded-2xl shadow-inner border border-zinc-100 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all"><Receipt size={28} /></div>
                            <button onClick={() => setActiveTab('INVOICES')} className="text-zinc-300 hover:text-emerald-500 transition-all"><ArrowRight size={20} /></button>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Ledger Matrix</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Financial Settlement Telemetry</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-inner">
                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pending</div>
                                <div className="text-xl font-black text-zinc-900 tracking-tighter">£{(invoices.filter(i => i.projectId === project.id && i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0) / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-inner">
                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Approved</div>
                                <div className="text-xl font-black text-zinc-900 tracking-tighter">£{(invoices.filter(i => i.projectId === project.id && i.status === 'Approved').reduce((acc, i) => acc + i.amount, 0) / 1000).toFixed(1)}k</div>
                            </div>
                        </div>
                        <button onClick={() => setActiveModal('INVOICE')} className="w-full py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                             Provision Ledger Node
                        </button>
                    </div>

                    <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm space-y-8 flex flex-col group hover:border-primary transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-zinc-50 rounded-2xl shadow-inner border border-zinc-100 group-hover:bg-primary/10 group-hover:text-primary transition-all"><Layers size={28} /></div>
                            <button onClick={() => setActiveTab('DRAWINGS')} className="text-zinc-300 hover:text-primary transition-all"><ArrowRight size={20} /></button>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Technical Vault</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Multi-Version Blueprint Registry</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-50 pb-3">
                                <span>Recent Blueprints</span>
                                <span className="text-primary">{drawings.filter(d => d.projectId === project.id).length} SHARDS</span>
                            </div>
                            {drawings.filter(d => d.projectId === project.id).slice(0, 2).map(drawing => (
                                <div key={drawing.id} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group/draw hover:border-primary/30 transition-all cursor-pointer">
                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover/draw:text-primary transition-all"><FileText size={16} /></div>
                                    <span className="text-[10px] font-black text-zinc-700 truncate uppercase tracking-tight group-hover/draw:text-primary transition-all">{drawing.name}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setActiveModal('DRAWING')} className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex items-center justify-center gap-2">
                             Initialize Blueprint Set
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'MAP' && (
            <ProjectMapView 
                project={project} 
                tasks={tasks.filter(t => t.projectId === project.id)} 
            />
        )}

        {activeTab === 'PROJECT_PHASES' && (
            <ProjectPhasesView 
                project={project}
                phases={project.phases || []}
                onUpdate={handleUpdateProject}
            />
        )}

        {activeTab === 'TASKS' && (
            <TasksView projectId={project.id} />
        )}

        {activeTab === 'SCHEDULE' && (
            <ScheduleView projectId={project.id} />
        )}

        {activeTab === 'TEAM' && (
            <TeamView projectId={project.id} />
        )}

        {activeTab === 'DRAWINGS' && (
            <DrawingsView 
                projectId={project.id} 
                onAddRevision={(d) => setActiveModal('DRAWING')}
                onUploadNew={() => setActiveModal('DRAWING')}
            />
        )}

        {activeTab === 'DAILY_LOGS' && (
            <DailyLogsView 
                projectId={project.id} 
                onAdd={() => setActiveModal('LOG')}
            />
        )}

        {activeTab === 'DAYWORKS' && (
            <DayworksView 
                projectId={project.id} 
                onAdd={() => setActiveModal('DAYWORK')}
            />
        )}

        {activeTab === 'INVOICES' && (
            <InvoicesView 
                projectId={project.id} 
                onAdd={() => setActiveModal('INVOICE')}
            />
        )}

        {activeTab === 'RFIS' && (
            <RFIsView 
                projectId={project.id} 
                onAdd={() => setActiveModal('RFI')}
            />
        )}

        {activeTab === 'CHANGE_ORDERS' && (
            <ChangeOrdersView 
                projectId={project.id} 
                onAdd={() => setActiveModal('CHANGE_ORDER')}
            />
        )}

        {activeTab === 'PUNCH_LIST' && (
            <PunchItemsView 
                projectId={project.id} 
                onAdd={() => setActiveModal('PUNCH')}
            />
        )}

        {activeTab === 'DOCUMENTS' && (
            <DocumentsView projectId={project.id} />
        )}

        {activeTab === 'PHOTOS' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in pb-32">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Site Visual Matrix</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] mt-2">Historical and Current Shard Documentation</p>
                    </div>
                    <button 
                        onClick={() => setActiveModal('PHOTO')}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        <Camera size={18} /> Capture Site Node
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {photos.filter(p => p.projectId === project.id).map(photo => (
                        <div key={photo.id} className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all relative aspect-square shadow-sm cursor-pointer">
                            <img src={photo.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={photo.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{photo.date}</div>
                                <h4 className="text-white font-black text-sm uppercase truncate">{photo.name}</h4>
                                <p className="text-zinc-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Custodian: {photo.uploader}</p>
                            </div>
                        </div>
                    ))}
                    {photos.filter(p => p.projectId === project.id).length === 0 && (
                        <div className="col-span-full py-40 text-center border-2 border-dashed border-zinc-200 rounded-[3rem] bg-zinc-50/50 flex flex-col items-center gap-6">
                            <Camera size={48} className="text-zinc-200" />
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No visual artifacts in project mesh.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'SETTINGS' && (
            <ProjectSettingsView project={project} onUpdate={handleUpdateProject} />
        )}
      </div>

      <ProjectActionModals 
        type={activeModal} 
        projectId={project.id} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  );
};

export default ProjectDetailsView;