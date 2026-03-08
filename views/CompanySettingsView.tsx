import React, { useState, useMemo } from 'react';
import { 
  Building2, Sliders, ShieldCheck, Zap, Globe, 
  BrainCircuit, Wand2, PoundSterling, Eye, BarChart3, 
  ToggleLeft, ToggleRight, Save, Loader2, Info, Tag, 
  ShieldAlert, ScanLine, Activity, CheckCircle2, Building,
  Layout, Target, Camera, Lock, Terminal, Shield, 
  Settings, Key, Fingerprint, Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { Company, FeatureEntitlements, Permission, UserRole, ROLE_PERMISSIONS } from '../types';
import { db } from '../services/db';

const CompanySettingsView: React.FC = () => {
    const { user, can } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'FEATURES' | 'PERMISSIONS'>('PROFILE');

    const canEditSettings = can(Permission.TENANT_SETTINGS_ADMIN);
    const isOwner = user?.role === UserRole.COMPANY_OWNER;
    const isPlatformStaff = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.SUPPORT_ADMIN;
    
    // Only Owners or SuperAdmins can toggle features and critical brand info
    const canManageSovereignOps = can(Permission.TENANT_SOVEREIGN_OPS) || isPlatformStaff;

    React.useEffect(() => {
        const fetchCompany = async () => {
            if (user?.companyId) {
                const data = await db.getById<Company>('companies', user.companyId);
                setCompany(data);
            }
            setIsLoading(false);
        };
        fetchCompany();
    }, [user?.companyId]);

    const handleUpdate = async (updates: Partial<Company>) => {
        if (!company || !canEditSettings) return;
        setIsSaving(true);
        try {
            await db.update('companies', company.id, updates);
            setCompany(prev => prev ? { ...prev, ...updates } : null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFeature = async (feature: keyof FeatureEntitlements) => {
        if (!company || !canManageSovereignOps) return;
        const newFeatures = { ...company.features, [feature]: !company.features[feature] };
        await handleUpdate({ features: newFeatures });
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading Company Shard...</p>
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="p-8 max-w-5xl auto space-y-10 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-5 leading-none">
                        <Building2 className="text-primary" size={40} /> Entity Orchestration
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.4em] flex items-center gap-2">
                            <Globe size={14} className="text-primary" /> Shard: {company.id}
                        </span>
                        <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            Subscription: {company.plan}
                        </span>
                    </div>
                </div>
                
                <div className="bg-zinc-100 p-1.5 rounded-2xl flex border border-zinc-200 shadow-inner">
                    {(['PROFILE', 'FEATURES', 'PERMISSIONS'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {activeTab === 'PROFILE' && (
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="p-4 bg-zinc-50 rounded-3xl border-2 border-zinc-100 shadow-inner relative group/logo cursor-pointer overflow-hidden">
                                {company.logoUrl ? (
                                    <img src={company.logoUrl} className="w-16 h-16 object-cover rounded-xl" alt="Logo" />
                                ) : (
                                    <Building size={32} className="text-zinc-200" />
                                )}
                                {canManageSovereignOps && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                        <Camera size={20} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Identity Registry</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Shard Identification Parameters</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex justify-between px-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Shard Label</label>
                                    {!canManageSovereignOps && <Lock size={12} className="text-red-400" />}
                                </div>
                                <input 
                                    disabled={!canManageSovereignOps}
                                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-60" 
                                    value={company.name}
                                    onChange={e => handleUpdate({ name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2">Deployment Hub (Region)</label>
                                <select 
                                    disabled={!canEditSettings}
                                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-60 cursor-pointer"
                                    value={company.region}
                                    onChange={e => handleUpdate({ region: e.target.value })}
                                >
                                    <option value="EMEA">EMEA Hub</option>
                                    <option value="NA">NA Hub</option>
                                    <option value="APAC">APAC Hub</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl border border-white/5">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000"><ScanLine size={80} /></div>
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-400" /> Identity Synchronization Integrity
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">"Operational nodes maintain shard connectivity while sovereign nodes manage global entity logic."</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FEATURES' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { id: 'aiAssistant', label: 'Neural Architect', icon: BrainCircuit, desc: 'Generative planning logic.' },
                                { id: 'imagineStudio', label: 'Forge Studio', icon: Wand2, desc: 'Architectural synthesis.' },
                                { id: 'financials', label: 'Ledger Hub', icon: PoundSterling, desc: 'Enterprise budget orchestration.' },
                                { id: 'advancedRBAC', label: 'Sovereign RBAC', icon: ShieldCheck, desc: 'Multi-layer security mesh.' },
                                { id: 'liveVision', icon: Eye, label: 'Vision Agent', desc: 'Real-time engineering guidance.' },
                                { id: 'bimAnalytics', icon: BarChart3, label: 'BIM Analytics', desc: 'Forensic structural extraction.' }
                            ].map((feature) => {
                                const isEnabled = company.features[feature.id as keyof FeatureEntitlements];
                                return (
                                    <div 
                                        key={feature.id} 
                                        onClick={() => canManageSovereignOps && toggleFeature(feature.id as keyof FeatureEntitlements)}
                                        className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group ${
                                            isEnabled ? 'bg-white border-primary shadow-xl ring-8 ring-primary/5 scale-[1.02]' : 'bg-white/60 border-zinc-100 hover:border-zinc-200 grayscale'
                                        } ${canManageSovereignOps ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
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
                    </div>
                )}

                {activeTab === 'PERMISSIONS' && (
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-midnight uppercase tracking-[0.4em] flex items-center gap-2"><Crown size={16} /> CompanyOwner (Sovereign)</h4>
                                <div className="space-y-3">
                                    {ROLE_PERMISSIONS[UserRole.COMPANY_OWNER].map(p => (
                                        <div key={p} className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{p.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2"><Briefcase size={16} /> CompanyAdmin (Operational)</h4>
                                <div className="space-y-3">
                                    {ROLE_PERMISSIONS[UserRole.COMPANY_ADMIN].map(p => (
                                        <div key={p} className="flex items-center gap-4 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                            <ShieldCheck size={14} className="text-indigo-50" />
                                            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{p.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-10 border-t border-zinc-200">
                <button 
                    onClick={() => handleUpdate({})}
                    disabled={isSaving || !canEditSettings}
                    className="px-12 py-5 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3 group"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />}
                    Commit Shard State
                </button>
            </div>
        </div>
    );
};

const Crown = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);

export default CompanySettingsView;
