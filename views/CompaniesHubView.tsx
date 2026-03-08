import React, { useState, useMemo, useRef } from 'react';
import { 
  Building2, Search, Filter, ShieldHalf, 
  PlusCircle, Zap, Signal, Activity, Globe,
  X, RefreshCw, Loader2, Info, Building,
  ChevronDown, Sliders, BrainCircuit, Wand2,
  PoundSterling, ShieldCheck, Eye, BarChart3,
  CheckCircle2, AlertTriangle, Save, ToggleLeft, ToggleRight,
  Mail, Users, User, Check, History, Tag, Layout, Target,
  ArrowRight, Shield, Lock, ShieldAlert,
  Server, Key, Fingerprint, Database, AlertCircle,
  PlayCircle, PauseCircle, Archive, RotateCcw, HelpCircle,
  Gavel, ArrowUpRight, Scale, Sparkles, Copy, FileCheck,
  ChevronLeft, Rocket, Briefcase, Landmark, Crown, ChevronRight,
  MailCheck, ShieldPlus, Box, Clock, Timer, LockKeyhole,
  UserCheck, UserX, Network, DatabaseZap, Gauge, Radio,
  Maximize2, Terminal,
  Cpu, Camera, Trash2, UploadCloud, 
  ChevronUp,
  MailQuestion,
  Smartphone,
  MessageSquare,
  BadgeCheck,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { useControlPlane } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';
import { Company, CompanyStatus, Permission, FeatureEntitlements, SecurityProfile, CompanyLimits, UserProfile } from '../types';
import CompanyCard from '../components/CompanyCard';
import CompanyTimeline from '../components/CompanyTimeline';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

type ViewTab = 'TENANTS' | 'IDENTITY_QUEUE' | 'CLUSTER_TELEMETRY' | 'REGISTRY_MESH';
type ManageMode = 'ENTITLEMENTS' | 'CORE' | 'SECURITY' | 'AUDIT';
type ProvisionStep = 'COMPANY_INFO' | 'OWNER_INFO' | 'PLAN_SELECTION' | 'AI_MISSION' | 'GENESIS';

const CompaniesHubView: React.FC = () => {
    const { 
        companies, isLoading, provisionCompany, 
        updateCompanyStatus, updateCompany, updateCompanyLogo,
        updateCompanyEntitlements, getValidStatusTransitions, 
        getTransitionProtocol, getAuditHistory, updateCompanyLimits,
        pendingUsers, approveUser, rejectUser, globalUsers
    } = useControlPlane();
    const { impersonateTenant, can, user } = useAuth();
    
    const canEditSettings = can(Permission.TENANT_SETTINGS_ADMIN);
    
    const [activeTab, setActiveTab] = useState<ViewTab>('TENANTS');
    const [search, setSearch] = useState('');
    
    const [industryFilter, setIndustryFilter] = useState('All');
    const [planFilter, setPlanFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [provisionStep, setProvisionStep] = useState<ProvisionStep>('COMPANY_INFO');
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [provisionResult, setProvisionResult] = useState<{ 
        companyId: string, 
        token: string,
        infrastructure: { dbCluster: string, blobBucket: string, aiPartition: string }
    } | null>(null);

    const [managingCompanyId, setManagingCompanyId] = useState<string | null>(null);
    const [manageMode, setManageMode] = useState<ManageMode>('ENTITLEMENTS');

    const [provisionForm, setProvisionForm] = useState({
        name: '',
        legalName: '',
        industry: 'Construction',
        ownerEmail: '',
        ownerName: '',
        plan: 'Business' as Company['plan'],
        region: 'EMEA',
        timezone: 'UTC',
        currency: 'GBP',
        brandMission: '',
        operationalGuidelines: '',
        logoUrl: ''
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [setupLogs, setSetupLogs] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const industries = useMemo(() => ['All', ...Array.from(new Set(companies.map(c => c.industry)))], [companies]);

    const validateStep = async (step: ProvisionStep): Promise<boolean> => {
      const errors: Record<string, string> = {};
      if (step === 'COMPANY_INFO' && !provisionForm.name) errors.name = "Entity Brand Name is required.";
      if (step === 'OWNER_INFO') {
        if (!provisionForm.ownerName) errors.ownerName = "Custodian Name is required.";
        if (!provisionForm.ownerEmail) errors.ownerEmail = "Endpoint Email is required.";
      }
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleNextStep = async (next: ProvisionStep) => {
      const isValid = await validateStep(provisionStep);
      if (isValid) setProvisionStep(next);
    };

    const addSetupLog = (msg: string) => {
      setSetupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter(c => {
            const query = search.toLowerCase().trim();
            const matchesSearch = !query || 
                c.name.toLowerCase().includes(query) || 
                c.id.toLowerCase().includes(query) ||
                c.ownerName.toLowerCase().includes(query);
            
            const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
            const matchesPlan = planFilter === 'All' || c.plan === planFilter;
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

            return matchesSearch && matchesIndustry && matchesPlan && matchesStatus;
        });
    }, [companies, search, industryFilter, planFilter, statusFilter]);

    const managedCompany = useMemo(() => 
        companies.find(c => c.id === managingCompanyId)
    , [companies, managingCompanyId]);

    const handleAIGenVision = async () => {
      if (!provisionForm.name || isAIGenerating) return;
      setIsAIGenerating(true);
      try {
        const prompt = `Act as a Brand Strategist. Generate a technical 1-paragraph Mission Statement and 3 core Operational Guidelines for a new construction company named "${provisionForm.name}" in the ${provisionForm.industry} sector. Return as JSON: { "mission": "...", "guidelines": ["...", "...", "..."] }`;
        const result = await runRawPrompt(prompt, { 
          model: 'gemini-flash-lite-latest', 
          responseMimeType: 'application/json'
        });
        const data = parseAIJSON(result);
        setProvisionForm(prev => ({ 
            ...prev, 
            brandMission: data.mission, 
            operationalGuidelines: data.guidelines.join('\n') 
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsAIGenerating(false);
      }
    };

    const handleProvision = async () => {
        setIsProvisioning(true);
        setSetupLogs(["Initializing genesis protocol...", "Allocating global cluster resources..."]);
        
        try {
            await new Promise(r => setTimeout(r, 1000));
            addSetupLog("Shard parameters verified.");
            
            const res = await provisionCompany({
                ...provisionForm,
                idempotencyKey: `gen-${Date.now()}`
            });
            
            addSetupLog(`Identity node provisioned: ${res.companyId}`);
            await new Promise(r => setTimeout(r, 800));
            addSetupLog(`Infrastructure partition synced: ${res.infrastructure.dbCluster}`);
            await new Promise(r => setTimeout(r, 500));
            addSetupLog("Dispatching owner invitation sequence...");
            
            setProvisionResult({ 
                companyId: res.companyId, 
                token: res.invitationToken,
                infrastructure: res.infrastructure
            });
            setProvisionStep('GENESIS');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsProvisioning(false);
        }
    };

    const handleUpdateCore = async (updates: Partial<Company>) => {
        if (!managingCompanyId) return;
        await updateCompany(managingCompanyId, updates, 'Manual update of core registry parameters.');
    };

    const handleStatusTransition = async (targetStatus: CompanyStatus) => {
        if (!managedCompany) return;
        const protocol = getTransitionProtocol(managedCompany.status, targetStatus);
        const reason = window.prompt(`Justification for ${targetStatus.toLowerCase()} transition:`, protocol?.intent || '');
        if (reason) {
            await updateCompanyStatus(managedCompany.id, targetStatus, reason);
        }
    };

    const handleLogoUpload = (id: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateCompanyLogo(id, reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const toggleFeature = async (feature: keyof FeatureEntitlements) => {
        if (!managingCompanyId || !managedCompany) return;
        const currentVal = managedCompany.features[feature];
        await updateCompanyEntitlements(managingCompanyId, { [feature]: !currentVal });
    };

    const getStatusTheme = (status: CompanyStatus) => {
        switch (status) {
            case 'ACTIVE': return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 };
            case 'SUSPENDED': return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: PauseCircle };
            case 'ARCHIVED': return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: Archive };
            case 'DRAFT': return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', icon: RefreshCw };
            default: return { color: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-100', icon: HelpCircle };
        }
    };

    if (isLoading) return (
        <div className="h-full flex flex-col items-center justify-center bg-zinc-50">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-4 animate-pulse">Syncing Shard Core...</p>
        </div>
    );

    return (
        <div className="p-10 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
            
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                <div className="space-y-5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-midnight rounded-[1.5rem] flex items-center justify-center text-primary shadow-2xl border border-primary/20 cortex-glow shrink-0">
                            <ShieldHalf size={40} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Cluster Registry</h1>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <Signal size={12} /> Sovereign Command Node
                                </span>
                                <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{companies.length} Tenants Orchestrated</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-xl shadow-zinc-200/50">
                        {(['TENANTS', 'IDENTITY_QUEUE', 'CLUSTER_TELEMETRY', 'REGISTRY_MESH'] as ViewTab[]).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSearch(''); }}
                                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === tab ? 'bg-midnight text-white shadow-2xl' : 'text-zinc-500 hover:text-zinc-800'}`}
                            >
                                {tab.replace('_', ' ')}
                                {tab === 'IDENTITY_QUEUE' && pendingUsers.length > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white animate-pulse">
                                        {pendingUsers.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {can(Permission.TENANT_PROVISIONING) && (
                        <button 
                            onClick={() => { setShowProvisionModal(true); setProvisionStep('COMPANY_INFO'); }}
                            className="bg-primary text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-3 active:scale-95 group shrink-0"
                        >
                            <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" /> Provision Node
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'TENANTS' && (
                <>
                  <div className="bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex flex-col lg:flex-row gap-6 items-center">
                          <div className="relative flex-1 w-full group">
                              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={22} />
                              <input 
                                  type="text" 
                                  placeholder="Trace tenant name, identifier, or custodian identity..." 
                                  className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-base font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner"
                                  value={search}
                                  onChange={e => setSearch(e.target.value)}
                              />
                          </div>
                          <div className="flex gap-4">
                            <div className="relative">
                                <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="appearance-none pl-10 pr-10 py-4 bg-zinc-100 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-600 focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer">
                                    {industries.map(i => <option key={i} value={i}>{i === 'All' ? 'All Sectors' : i}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            </div>
                            <div className="relative">
                                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="appearance-none pl-10 pr-10 py-4 bg-zinc-100 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-600 focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer">
                                    <option value="All">All Plans</option>
                                    <option value="Starter">Starter</option>
                                    <option value="Business">Business</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      {filteredCompanies.map(company => (
                          <CompanyCard 
                              key={company.id}
                              company={company}
                              onImpersonate={impersonateTenant}
                              onManage={(id) => { setManagingCompanyId(id); setManageMode('ENTITLEMENTS'); }}
                              onStatusTransition={async (id, status, reason) => await updateCompanyStatus(id, status, reason)}
                              onLogoUpload={handleLogoUpload}
                          />
                      ))}
                      {filteredCompanies.length === 0 && (
                          <div className="col-span-full py-40 text-center border-2 border-dashed border-zinc-200 rounded-[3rem] bg-white/50">
                              <Boxes size={48} className="mx-auto mb-4 text-zinc-200" />
                              <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Tenant Trace Exhausted</h3>
                              <p className="text-zinc-400 text-xs mt-2 font-medium uppercase tracking-widest">No matching shard nodes identified in current registry filters.</p>
                          </div>
                      )}
                  </div>
                </>
            )}

            {activeTab === 'IDENTITY_QUEUE' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-inner">
                                <Fingerprint size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Identity Verification Queue</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Authorization required for {pendingUsers.length} node(s)</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pendingUsers.map(u => (
                            <div key={u.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary transition-all flex flex-col h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><UserCheck size={100} /></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-xl font-black shadow-lg ring-4 ring-white shrink-0">
                                        {u.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase border border-amber-100 animate-pulse">PENDING_SYNC</span>
                                </div>
                                <div className="flex-1 relative z-10">
                                    <h4 className="text-2xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-3 truncate">{u.name}</h4>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                                        <Mail size={12} className="text-primary" /> {u.email}
                                    </p>
                                </div>
                                <div className="flex gap-4 relative z-10 pt-6 border-t border-zinc-50">
                                    <button onClick={() => rejectUser(u.id)} className="flex-1 py-4 bg-white border border-red-200 text-red-600 rounded-2xl text-[9px] font-black uppercase hover:bg-red-50 transition-all">Deauthorize</button>
                                    <button onClick={() => approveUser(u.id)} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-[9px] font-black uppercase shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-2 active:scale-95 group/auth">
                                        <UserCheck size={16} className="text-emerald-500 group-hover/auth:scale-110 transition-transform" /> Authorize
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {managingCompanyId && managedCompany && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95">
                        <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-midnight text-primary rounded-2xl shadow-xl border border-primary/20">
                                    <Sliders size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Shard Orchestration</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 flex items-center gap-2">
                                        <Building size={12} /> Entity Identity: {managedCompany.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-inner">
                                    {(['ENTITLEMENTS', 'CORE', 'SECURITY', 'AUDIT'] as ManageMode[]).map(mode => (
                                        <button 
                                            key={mode}
                                            onClick={() => setManageMode(mode)}
                                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${manageMode === mode ? 'bg-white text-midnight shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setManagingCompanyId(null)} className="p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-full transition-all shadow-sm"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-zinc-50/30 custom-scrollbar">
                            {manageMode === 'CORE' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <RotateCcw size={14} className="text-primary" /> Lifecycle Governance Shard
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {getValidStatusTransitions(managedCompany.status).map(targetStatus => {
                                                const theme = getStatusTheme(targetStatus);
                                                const protocol = getTransitionProtocol(managedCompany.status, targetStatus);
                                                return (
                                                    <button 
                                                        key={targetStatus}
                                                        onClick={() => handleStatusTransition(targetStatus)}
                                                        className="p-6 rounded-[2rem] border-2 border-zinc-100 bg-white hover:border-primary transition-all group flex flex-col items-center justify-center text-center gap-3 active:scale-95 hover:shadow-xl hover:-translate-y-1"
                                                    >
                                                        <div className={`p-4 rounded-2xl bg-zinc-50 ${theme.color} group-hover:bg-primary group-hover:text-white transition-all shadow-inner`}>
                                                            {React.createElement(theme.icon, { size: 28 })}
                                                        </div>
                                                        <div className="text-xs font-black uppercase text-zinc-800 group-hover:text-primary transition-colors">{protocol?.name || `Set ${targetStatus}`}</div>
                                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{targetStatus} NODE TRANSITION</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Database size={14} className="text-primary" /> Identity Registry Shard
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Brand Identifier</label>
                                                <input 
                                                    disabled={!canEditSettings}
                                                    className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all uppercase outline-none shadow-inner disabled:opacity-50" 
                                                    value={managedCompany.name}
                                                    onChange={e => handleUpdateCore({ name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Legal Identity Shard</label>
                                                <input 
                                                    disabled={!canEditSettings}
                                                    className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all uppercase outline-none shadow-inner disabled:opacity-50" 
                                                    value={managedCompany.legalName || ''}
                                                    onChange={e => handleUpdateCore({ legalName: e.target.value })}
                                                    placeholder="Legal Entity Name"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {manageMode === 'ENTITLEMENTS' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-10">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-primary/10 text-primary rounded-3xl border border-primary/20 shadow-inner">
                                                <Zap size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Feature Entitlements</h3>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Sovereign Logic Shard Orchestration</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { id: 'aiAssistant', label: 'Neural Architect', icon: BrainCircuit, desc: 'Advanced generative project planning & reasoning.' },
                                                { id: 'imagineStudio', label: 'Forge Studio', icon: Wand2, desc: 'Technical architectural rendering & synthesis engine.' },
                                                { id: 'financials', label: 'Ledger Matrix', icon: PoundSterling, desc: 'Enterprise-grade budget orchestration & auditing.' },
                                                { id: 'advancedRBAC', label: 'Sovereign RBAC', icon: ShieldCheck, desc: 'Multi-tenant identity mesh & granular permissions.' },
                                                { id: 'liveVision', label: 'Vision Shard', icon: Eye, desc: 'Real-time site engineering & safety telemetry.' },
                                                { id: 'bimAnalytics', label: 'BIM Logic Hub', icon: BarChart3, desc: 'Forensic BIM quantity extraction & drift analysis.' }
                                            ].map((feature) => {
                                                const isEnabled = managedCompany.features[feature.id as keyof FeatureEntitlements];
                                                const canToggle = can(Permission.PLATFORM_GOVERNANCE);
                                                return (
                                                    <div 
                                                        key={feature.id} 
                                                        onClick={() => canToggle && toggleFeature(feature.id as keyof FeatureEntitlements)}
                                                        className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group ${
                                                            isEnabled 
                                                            ? 'bg-white border-primary shadow-xl ring-8 ring-primary/5 scale-[1.02]' 
                                                            : 'bg-white/60 border-zinc-100 hover:border-zinc-200 grayscale opacity-60'
                                                        } ${canToggle ? 'cursor-pointer' : 'cursor-default'}`}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                                                                isEnabled ? 'bg-primary border-primary text-white shadow-lg' : 'bg-zinc-50 border-zinc-100 text-zinc-300'
                                                            }`}>
                                                                {React.createElement(feature.icon, { size: 32 })}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h5 className={`font-black uppercase tracking-tight text-base ${isEnabled ? 'text-zinc-900' : 'text-zinc-500'}`}>{feature.label}</h5>
                                                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed max-w-[200px] italic">"{feature.desc}"</p>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 transition-transform group-active:scale-90">
                                                            {isEnabled ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-zinc-300" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group/policy mt-10 shadow-2xl border border-white/5">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/policy:scale-150 transition-transform duration-[3000ms]"><ShieldCheck size={100} /></div>
                                            <div className="relative z-10 space-y-4">
                                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Info size={14} className="text-primary animate-pulse" /> Global Policy Synchronization
                                                </h4>
                                                <p className="text-xs text-zinc-300 leading-relaxed font-medium italic pr-20">
                                                    "Changes to feature entitlements propagate across the global logic mesh in &lt;100ms. All associated identity nodes will receive a protocol sync signal immediately."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {manageMode === 'SECURITY' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-10">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-red-50 text-red-600 rounded-3xl border border-red-100 shadow-inner">
                                                <LockKeyhole size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Hardening Protocols</h3>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Tenant-Specific Security Governance</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-2xl group hover:bg-white hover:border-primary transition-all cursor-pointer shadow-sm">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-white border border-zinc-200 text-zinc-400 group-hover:text-primary transition-colors rounded-xl">
                                                        <Fingerprint size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-800 uppercase tracking-tight">Sovereign SSO Sharding</h4>
                                                        <p className="text-[10px] text-zinc-400 italic">Enable SAML/OIDC identity synchronization.</p>
                                                    </div>
                                                </div>
                                                {managedCompany.securityProfile.ssoEnabled ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-zinc-300" />}
                                            </div>

                                            <div className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-2xl group hover:bg-white hover:border-primary transition-all cursor-pointer shadow-sm">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-white border border-zinc-200 text-zinc-400 group-hover:text-primary transition-colors rounded-xl">
                                                        <ShieldAlert size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-800 uppercase tracking-tight">Enforce Logic MFA</h4>
                                                        <p className="text-[10px] text-zinc-400 italic">Require secondary shard verification for all nodes.</p>
                                                    </div>
                                                </div>
                                                {managedCompany.securityProfile.mfaRequired ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-zinc-300" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {manageMode === 'AUDIT' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><History size={16} className="text-primary" /> Forensic Shard Ledger</h4>
                                    <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
                                        <CompanyTimeline logs={getAuditHistory(managedCompany.id)} />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-10 border-t bg-zinc-50/50 flex justify-end gap-4 shrink-0">
                            <button 
                                onClick={() => setManagingCompanyId(null)} 
                                className="px-12 py-5 bg-zinc-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all active:scale-95 flex items-center gap-3"
                            >
                                <CheckCircle2 size={20} className="text-emerald-500" /> Close Orchestration Hub
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'REGISTRY_MESH' && (
                <div className="p-10 bg-zinc-950 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group min-h-[600px] flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-700">
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-[3000ms]"><Globe size={400} className="text-primary" /></div>
                    
                    <div className="relative z-10 max-w-2xl space-y-10">
                        <div className="w-24 h-24 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary shadow-[0_0_80px_rgba(14,165,233,0.3)] mx-auto animate-pulse">
                            <Network size={48} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Global Registry Mesh</h2>
                            <p className="text-zinc-500 font-bold uppercase text-sm tracking-[0.4em]">Visualizing multi-tenant node density & cross-shard logic propagation</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-10 border-t border-white/10 pt-12">
                             <div className="space-y-1">
                                 <div className="text-3xl font-black text-white tracking-tighter">{companies.length}</div>
                                 <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Shards</div>
                             </div>
                             <div className="space-y-1">
                                 <div className="text-3xl font-black text-primary tracking-tighter">1.2ms</div>
                                 <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sync Latency</div>
                             </div>
                             <div className="space-y-1">
                                 <div className="text-3xl font-black text-emerald-500 tracking-tighter">100%</div>
                                 <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Shard Integrity</div>
                             </div>
                        </div>

                        <button className="mt-12 px-10 py-5 bg-white text-midnight rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-4 mx-auto">
                            <RefreshCw size={20} /> Re-Calculate Global State
                        </button>
                    </div>
                </div>
            )}

            {showProvisionModal && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-3xl z-[400] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-primary text-white rounded-[1.75rem] shadow-2xl shadow-blue-900/30">
                                    <Rocket size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Genesis Protocol</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest flex items-center gap-2">
                                        <RefreshCw size={12} className="animate-spin-slow" /> Entity Shard Provisioning Wizard
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowProvisionModal(false)} className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-full transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
                            {provisionStep === 'COMPANY_INFO' && (
                                <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4">
                                        <h4 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Entity Identity</h4>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">"Initialize the structural identity of the new tenant shard within the global registry."</p>
                                    </div>

                                    <div className="space-y-8 bg-zinc-50/50 p-10 rounded-[3rem] border border-zinc-100 shadow-inner">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Entity Brand Name *</label>
                                            <input 
                                                className={`w-full p-5 bg-white border rounded-[2rem] text-lg font-black uppercase tracking-tight focus:ring-8 focus:ring-primary/5 transition-all outline-none ${validationErrors.name ? 'border-red-500' : 'border-zinc-200'}`}
                                                placeholder="e.g. SKYLINE GLOBAL"
                                                value={provisionForm.name}
                                                onChange={e => setProvisionForm({...provisionForm, name: e.target.value.toUpperCase()})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Industry Sector</label>
                                                <select 
                                                    className="w-full p-5 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer"
                                                    value={provisionForm.industry}
                                                    onChange={e => setProvisionForm({...provisionForm, industry: e.target.value})}
                                                >
                                                    <option>Construction</option>
                                                    <option>Infrastructure</option>
                                                    <option>Residential Development</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Region Hub</label>
                                                <select 
                                                    className="w-full p-5 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer"
                                                    value={provisionForm.region}
                                                    onChange={e => setProvisionForm({...provisionForm, region: e.target.value})}
                                                >
                                                    <option value="EMEA">EMEA Hub</option>
                                                    <option value="NA">NA Hub</option>
                                                    <option value="APAC">APAC Hub</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {provisionStep === 'OWNER_INFO' && (
                                <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4">
                                        <h4 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Custodian Node</h4>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">"Provision the primary administrative custody node for this entity shard."</p>
                                    </div>

                                    <div className="space-y-8 bg-zinc-50/50 p-10 rounded-[3rem] border border-zinc-100 shadow-inner">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Custodian Identity *</label>
                                            <div className="relative">
                                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                              <input 
                                                  className="w-full pl-12 pr-4 py-5 bg-white border border-zinc-200 rounded-[2rem] text-base font-black focus:ring-8 focus:ring-primary/5 transition-all outline-none uppercase tracking-tight"
                                                  placeholder="Full Name"
                                                  value={provisionForm.ownerName}
                                                  onChange={e => setProvisionForm({...provisionForm, ownerName: e.target.value})}
                                              />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Endpoint Email (Auth) *</label>
                                            <div className="relative">
                                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                              <input 
                                                  type="email"
                                                  className={`w-full pl-12 pr-4 py-5 bg-white border rounded-[2rem] text-base font-black focus:ring-8 focus:ring-primary/5 transition-all outline-none ${validationErrors.ownerEmail ? 'border-red-500' : 'border-zinc-200'}`}
                                                  placeholder="admin@entity.io"
                                                  value={provisionForm.ownerEmail}
                                                  onChange={e => setProvisionForm({...provisionForm, ownerEmail: e.target.value})}
                                              />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {provisionStep === 'PLAN_SELECTION' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4 text-center max-w-xl mx-auto">
                                        <h4 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Protocol Matrix</h4>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">"Allocate logic quotas and feature bundles to the shard."</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {(['Starter', 'Business', 'Enterprise'] as Company['plan'][]).map(plan => (
                                            <div 
                                                key={plan}
                                                onClick={() => setProvisionForm({...provisionForm, plan})}
                                                className={`p-10 rounded-[3.5rem] border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col group ${provisionForm.plan === plan ? 'bg-zinc-950 border-primary shadow-2xl scale-[1.05]' : 'bg-white border-zinc-100 hover:border-primary/40'}`}
                                            >
                                                {provisionForm.plan === plan && <div className="absolute top-0 right-0 p-6 text-primary animate-pulse-glow"><Zap size={32} /></div>}
                                                <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${provisionForm.plan === plan ? 'text-primary' : 'text-zinc-400'}`}>{plan} SHARD</div>
                                                <div className={`text-4xl font-black tracking-tighter mb-8 ${provisionForm.plan === plan ? 'text-white' : 'text-zinc-900'}`}>
                                                    {plan === 'Starter' ? '£5k' : plan === 'Business' ? '£20k' : '£50k'}
                                                    <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${provisionForm.plan === plan ? 'text-zinc-500' : 'text-zinc-300'}`}>/ yr</span>
                                                </div>
                                                
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Users size={14} className={provisionForm.plan === plan ? 'text-primary' : 'text-zinc-300'} />
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${provisionForm.plan === plan ? 'text-zinc-300' : 'text-zinc-500'}`}>{plan === 'Starter' ? '5' : plan === 'Business' ? '50' : '500'} Seats</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Database size={14} className={provisionForm.plan === plan ? 'text-primary' : 'text-zinc-300'} />
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${provisionForm.plan === plan ? 'text-zinc-300' : 'text-zinc-500'}`}>{plan === 'Starter' ? '10GB' : plan === 'Business' ? '100GB' : '1TB'} Storage</span>
                                                    </div>
                                                </div>

                                                {provisionForm.plan === plan && (
                                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-2 text-emerald-400">
                                                        <Check size={16} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Protocol Selected</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {provisionStep === 'AI_MISSION' && (
                                <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4">
                                        <h4 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Neural Shard Synthesis</h4>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">"Synthesize the entity's operational baseline using the reasoning engine."</p>
                                    </div>

                                    <div className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><BrainCircuit size={150} className="text-primary" /></div>
                                        <div className="relative z-10 space-y-10">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-primary shadow-xl">
                                                      <Zap size={24} className="fill-current animate-pulse" />
                                                  </div>
                                                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Brand Strategist Synthesis</span>
                                                </div>
                                                <button 
                                                    onClick={handleAIGenVision}
                                                    disabled={isAIGenerating}
                                                    className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isAIGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Execute Synthesis
                                                </button>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Mission Shard Narrative</label>
                                                    <textarea 
                                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-zinc-300 h-32 outline-none italic resize-none"
                                                        value={provisionForm.brandMission}
                                                        onChange={e => setProvisionForm({...provisionForm, brandMission: e.target.value})}
                                                        placeholder="Initialize mission protocol..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {provisionStep === 'GENESIS' && (
                                <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-12 py-10 animate-in zoom-in-95 duration-700">
                                    {isProvisioning ? (
                                        <>
                                            <div className="relative">
                                                <div className="w-48 h-48 border-[6px] border-zinc-100 border-t-primary rounded-full animate-spin" />
                                                <Rocket className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={72} />
                                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-slow" />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Genesis protocol Active</h3>
                                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">Allocating Global Cluster Infrastructure...</p>
                                            </div>
                                            <div className="w-full bg-zinc-950 p-10 rounded-[3rem] shadow-2xl border border-white/5 text-left font-mono text-[11px] text-zinc-500 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                {setupLogs.map((log, i) => <div key={i} className="flex gap-4 animate-in slide-in-from-left duration-300"><span className="text-primary font-black shrink-0">»</span> {log}</div>)}
                                            </div>
                                        </>
                                    ) : provisionResult ? (
                                        <>
                                            <div className="relative">
                                                <div className="w-32 h-32 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border-4 border-emerald-100 shadow-2xl text-emerald-500 animate-in zoom-in-95 duration-1000">
                                                    <ShieldCheck size={64} strokeWidth={3} />
                                                </div>
                                                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-lg border border-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce">
                                                    <Check size={24} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none">Shard Established</h3>
                                                <p className="text-zinc-500 text-lg font-medium italic">"Entity node ${provisionResult.companyId} committed to master ledger."</p>
                                            </div>
                                            <div className="w-full bg-zinc-50 border border-zinc-200 p-6 rounded-3xl flex items-center justify-between group cursor-pointer" onClick={() => { navigator.clipboard.writeText(provisionResult.token); alert("Token committed to local buffer."); }}>
                                                <div className="text-left">
                                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Invitation Shard Node</div>
                                                    <code className="text-xs font-mono font-black text-primary truncate max-w-[250px]">{provisionResult.token}</code>
                                                </div>
                                                <Copy size={20} className="text-zinc-300 group-hover:text-primary transition-colors" />
                                            </div>
                                            <button 
                                                onClick={() => setShowProvisionModal(false)}
                                                className="w-full py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-95"
                                            >
                                                Finalize Genesis Sequence
                                            </button>
                                        </>
                                    ) : (
                                        <div className="space-y-10">
                                            <h3 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none">Commit Registry Entry</h3>
                                            <p className="text-zinc-500 text-sm font-medium leading-relaxed italic max-w-lg mx-auto">Authorize the genesis protocol for <span className="text-zinc-900 font-bold uppercase">{provisionForm.name}</span>. Shard propagation is immutable.</p>
                                            <div className="p-10 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[3.5rem] flex items-center justify-center group/confirm cursor-pointer hover:border-primary transition-all" onClick={handleProvision}>
                                               <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover/confirm:bg-primary group-hover/confirm:text-white transition-all active:scale-90 ring-8 ring-transparent group-hover/confirm:ring-primary/5">
                                                  <Fingerprint size={48} />
                                               </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                <Lock size={12} /> Root Authorization Required
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {provisionStep !== 'GENESIS' && (
                            <div className="p-10 border-t bg-zinc-50/50 flex justify-between items-center shrink-0">
                                <button 
                                    disabled={provisionStep === 'COMPANY_INFO'}
                                    onClick={() => {
                                        const steps: ProvisionStep[] = ['COMPANY_INFO', 'OWNER_INFO', 'PLAN_SELECTION', 'AI_MISSION', 'GENESIS'];
                                        setProvisionStep(steps[steps.indexOf(provisionStep) - 1]);
                                    }}
                                    className="px-10 py-5 bg-white border border-zinc-200 text-zinc-500 rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-zinc-100 disabled:opacity-0 transition-all flex items-center gap-3"
                                >
                                    <ChevronLeft size={18} /> Protocol Return
                                </button>
                                <button 
                                    onClick={() => {
                                        const steps: ProvisionStep[] = ['COMPANY_INFO', 'OWNER_INFO', 'PLAN_SELECTION', 'AI_MISSION', 'GENESIS'];
                                        handleNextStep(steps[steps.indexOf(provisionStep) + 1]);
                                    }}
                                    className="px-12 py-5 bg-zinc-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center gap-4 active:scale-95 group/next"
                                >
                                    Protocol Advance <ChevronRight size={18} className="group-hover/next:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesHubView;
