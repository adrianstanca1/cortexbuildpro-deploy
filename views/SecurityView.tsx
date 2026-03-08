import React, { useState, useMemo } from 'react';
import { 
  Shield, Lock, Activity, Database, Search, Filter, 
  Calendar, User, Globe, AlertTriangle, ShieldCheck,
  ChevronDown, ArrowRight, Download, RefreshCw, FileText,
  Clock, Hash, FilterX, Terminal, ShieldAlert, Key, 
  Eye, Zap, ShieldHalf, LayoutGrid, List as ListIcon,
  Maximize2, Plus, Trash2, Ban, CheckCircle2, Copy, X,
  Building2, EyeOff, Check, Info, LockKeyhole, KeyRound,
  ShieldEllipsis, ExternalLink, BarChart3, TrendingUp,
  AlertOctagon, Timer, ShieldPlus, ToggleLeft, ToggleRight,
  Fingerprint, ShieldQuestion, DatabaseZap,
  PlusCircle, Sparkles, History, BrainCircuit, Loader2
} from 'lucide-react';
import { useControlPlane } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';
import { AuditLog, Company, ApiKey, Permission, UserRole, SystemConfig } from '../types';
import { runRawPrompt } from '../services/geminiService';

type SecuritySection = 'AUDIT_LOGS' | 'API_KEYS' | 'POLICIES';

const SecurityView: React.FC = () => {
    const { 
        auditLogs, isLoading, systemConfig, updateSystemConfig, 
        companies, updateCompany, toggleGlobalFlag
    } = useControlPlane();
    const { can, user } = useAuth();
    
    const [activeSection, setActiveSection] = useState<SecuritySection>('AUDIT_LOGS');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<AuditLog['targetType'] | 'ALL'>('ALL');
    const [companyFilter, setCompanyFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

    // Key Generation State
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [keyLabel, setKeyLabel] = useState('');
    const [keyTtl, setKeyTtl] = useState('365');

    // AI Audit State
    const [isAiAuditing, setIsAiAuditing] = useState(false);
    const [aiSecurityBrief, setAiSecurityBrief] = useState<string | null>(null);

    // Permissions
    const canManageDiagnostics = can(Permission.SYSTEM_DIAGNOSTICS);
    const canManageGovernance = can(Permission.PLATFORM_GOVERNANCE);
    const canViewTenantAudit = can(Permission.TENANT_AUDIT_VIEW);
    const isPlatformStaff = canManageDiagnostics || canManageGovernance;

    const filteredLogs = useMemo(() => {
        // Multi-tenant isolation: Platform staff see all, tenant admins see their own
        const baseLogs = isPlatformStaff 
            ? auditLogs 
            : auditLogs.filter(log => log.tenantId === user?.companyId || log.targetId === user?.companyId);

        return baseLogs.filter(log => {
            const matchesSearch = 
                log.action.toLowerCase().includes(search.toLowerCase()) || 
                log.actorName.toLowerCase().includes(search.toLowerCase()) ||
                log.targetId.toLowerCase().includes(search.toLowerCase()) ||
                (log.reason && log.reason.toLowerCase().includes(search.toLowerCase()));
            
            const matchesType = typeFilter === 'ALL' || log.targetType === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [auditLogs, search, typeFilter, isPlatformStaff, user?.companyId]);

    const allApiKeys = useMemo(() => {
        const keys: (ApiKey & { companyName: string, companyId: string, logo?: string })[] = [];
        
        // Scope API key visibility
        const visibleCompanies = isPlatformStaff 
            ? companies 
            : companies.filter(c => c.id === user?.companyId);

        visibleCompanies.forEach(c => {
            if (c.apiKeys) {
                c.apiKeys.forEach(k => {
                    keys.push({ ...k, companyName: c.name, companyId: c.id, logo: c.logoUrl });
                });
            }
        });

        return keys.filter(k => {
            const matchesSearch = 
                k.label.toLowerCase().includes(search.toLowerCase()) || 
                k.companyName.toLowerCase().includes(search.toLowerCase()) ||
                k.keyPrefix.toLowerCase().includes(search.toLowerCase());
            
            const matchesCompany = companyFilter === 'ALL' || k.companyId === companyFilter;
            
            return matchesSearch && matchesCompany;
        });
    }, [companies, search, companyFilter, isPlatformStaff, user?.companyId]);

    const stats = useMemo(() => {
        const totalLogs = filteredLogs.length;
        const activeKeys = allApiKeys.filter(k => k.status === 'ACTIVE');
        const expiringSoon = activeKeys.filter(k => {
            const expiry = new Date(k.expiresAt).getTime();
            const now = Date.now();
            return expiry - now < 1000 * 60 * 60 * 24 * 30; // 30 days
        }).length;
        const totalRequests = allApiKeys.reduce((acc, k) => acc + (k.usageCount || 0), 0);

        return { 
            totalLogs, 
            activeKeysCount: activeKeys.length, 
            expiringSoon, 
            totalRequests 
        };
    }, [filteredLogs, allApiKeys]);

    const handleAIAuditKeys = async () => {
        setIsAiAuditing(true);
        setAiSecurityBrief(null);
        try {
            const keyData = allApiKeys.map(k => ({
                label: k.label,
                prefix: k.keyPrefix,
                company: k.companyName,
                created: k.createdAt,
                lastUsed: k.lastUsedAt,
                usage: k.usageCount,
                status: k.status
            }));

            const prompt = `
                Act as a Sovereign Security Auditor for the CortexBuildPro mesh.
                Analyze this API Key registry for structural risks, stale credentials, and anomalous usage patterns:
                ${JSON.stringify(keyData)}

                Provide a 3-sentence technical security briefing. Focus on immediate deauthorization recommendations if necessary.
            `;
            
            const response = await runRawPrompt(prompt, { 
                model: 'gemini-3-pro-preview',
                thinkingConfig: { thinkingBudget: 4096 }
            });
            setAiSecurityBrief(response);
        } catch (e) {
            setAiSecurityBrief("Inference link failed. Please reconcile cluster states manually.");
        } finally {
            setIsAiAuditing(false);
        }
    };

    const handleGenerateKey = async () => {
        // Owners can generate keys for their company, superadmins for anyone
        const targetCid = isPlatformStaff ? selectedCompanyId : user?.companyId;
        if (!targetCid || !keyLabel) return;
        
        const secretSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const prefix = `pk_live_${Math.random().toString(36).substring(2, 10)}`; 
        const fullKey = `${prefix}_${secretSuffix}`;

        const newKey: ApiKey = {
            id: `ak-${Date.now()}`,
            label: keyLabel,
            keyPrefix: prefix,
            createdAt: new Date().toISOString(),
            expiresAt: keyTtl === '0' 
                ? '9999-12-31T23:59:59Z' 
                : new Date(Date.now() + parseInt(keyTtl) * 86400000).toISOString(),
            lastUsedAt: 'Never',
            usageCount: 0,
            status: 'ACTIVE'
        };

        const company = companies.find(c => c.id === targetCid);
        if (!company) return;

        const updatedKeys = [...(company.apiKeys || []), newKey];
        await updateCompany(targetCid, { apiKeys: updatedKeys }, `Provisioned API Access Shard: ${keyLabel}`);
        setNewlyCreatedKey(fullKey);
    };

    const handleCloseModal = () => {
        setShowKeyModal(false);
        setNewlyCreatedKey(null);
        setSelectedCompanyId('');
        setKeyLabel('');
        setKeyTtl('365');
    };

    const handleRevokeKey = async (companyId: string, keyId: string) => {
        // Cross-tenant check
        if (!isPlatformStaff && companyId !== user?.companyId) return;

        const reason = window.prompt("Confirm Protocol Revocation: This credential node will lose cluster connectivity immediately. Forensic Reason:");
        if (reason === null) return;

        const company = companies.find(c => c.id === companyId);
        if (!company || !company.apiKeys) return;

        const updatedKeys = company.apiKeys.map(k => 
            k.id === keyId ? { ...k, status: 'REVOKED' as const } : k
        );

        await updateCompany(companyId, { apiKeys: updatedKeys }, `Revoked API Key Shard [${keyId}]. Reason: ${reason || 'Manual override'}`);
    };

    if (isLoading) return (
        <div className="h-full flex items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="animate-spin text-primary" size={48} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Syncing Security Core...</span>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-6 leading-none">
                        <ShieldHalf className="text-primary" size={48} /> {isPlatformStaff ? 'Governance Deck' : 'Security Shard'}
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                        <Activity size={14} className="text-primary animate-pulse" /> {isPlatformStaff ? 'Platform-Wide Forensic Oversight' : `Forensic Oversight: ${user?.companyId}`}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-inner">
                        {(['AUDIT_LOGS', 'API_KEYS', 'POLICIES'] as SecuritySection[]).map(section => (
                            <button 
                                key={section}
                                onClick={() => { setActiveSection(section); setSearch(''); }}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === section ? 'bg-midnight text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            >
                                {section.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    {canManageDiagnostics && (
                        <button 
                            onClick={() => updateSystemConfig({ ...systemConfig!, maintenanceMode: !systemConfig?.maintenanceMode })}
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${
                                systemConfig?.maintenanceMode 
                                ? 'bg-red-600 text-white shadow-red-900/20 animate-pulse' 
                                : 'bg-zinc-950 text-white hover:bg-red-600 shadow-zinc-900/20 active:scale-95'
                            }`}
                        >
                            <Terminal size={18} /> {systemConfig?.maintenanceMode ? 'Exit Genesis Lock' : 'Enable Genesis Lock'}
                        </button>
                    )}
                </div>
            </div>

            {/* Platform Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm flex flex-col justify-between group hover:border-primary transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Database size={150} /></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-50 text-primary rounded-2xl shadow-inner"><History size={28} /></div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Audit Depth</span>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">{stats.totalLogs.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest">Forensic Event Nodes</p>
                    </div>
                </div>
                
                <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><KeyRound size={150} /></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner"><Key size={28} /></div>
                        {stats.expiringSoon > 0 && (
                            <div className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 border border-red-100 animate-pulse">
                                <AlertTriangle size={12} /> {stats.expiringSoon} Expiring
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">{stats.activeKeysCount}</div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest">Active Credentials</p>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm flex flex-col justify-between group hover:border-emerald-500 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Zap size={150} /></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><Activity size={28} /></div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Logical Activity</span>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">{(stats.totalRequests / 1000).toFixed(1)}k</div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest">Cumulative Hits</p>
                    </div>
                </div>

                <div className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-white/5 ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 animate-pulse-glow transition-all duration-[3000ms]"><Globe size={180} className="text-primary" /></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-2xl shadow-blue-900/40"><ShieldCheck size={28} /></div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Sentinel HUD</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Posture: Optimal</div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cluster Synchronized</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[4rem] border border-zinc-200 shadow-sm space-y-10 flex-1 flex flex-col overflow-hidden">
                {/* Module Search & Controls */}
                <div className="flex flex-col lg:flex-row gap-6 items-center shrink-0">
                    <div className="relative flex-1 w-full group">
                        <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder={
                                activeSection === 'AUDIT_LOGS' ? "Trace actor identity, action code, or reference node..." : 
                                activeSection === 'API_KEYS' ? "Search credentials by label, prefix..." :
                                "Filter security policies..."
                            }
                            className="w-full pl-16 pr-8 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-primary/5 transition-all outline-none shadow-inner" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 w-full lg:w-auto">
                        {activeSection === 'API_KEYS' && isPlatformStaff && (
                            <div className="relative shrink-0">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <select 
                                    className="appearance-none pl-12 pr-12 py-5 bg-zinc-100 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-600 focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer hover:bg-zinc-200 transition-all"
                                    value={companyFilter}
                                    onChange={e => setCompanyFilter(e.target.value)}
                                >
                                    <option value="ALL">All Shards</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                            </div>
                        )}
                        
                        {activeSection === 'API_KEYS' && can(Permission.TENANT_SETTINGS_ADMIN) && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleAIAuditKeys}
                                    disabled={isAiAuditing}
                                    className="px-6 py-5 bg-zinc-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl active:scale-95 group"
                                >
                                    {isAiAuditing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} className="text-primary" />} AI Audit
                                </button>
                                <button 
                                    onClick={() => setShowKeyModal(true)}
                                    className="px-10 py-5 bg-primary text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#0c4a6e] transition-all shadow-2xl shadow-blue-900/30 active:scale-95 group shrink-0"
                                >
                                    <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" /> New Key
                                </button>
                            </div>
                        )}
                        
                        <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-inner shrink-0">
                            <button onClick={() => setViewMode('LIST')} className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-white text-primary shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}><ListIcon size={20} /></button>
                            <button onClick={() => setViewMode('GRID')} className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-white text-primary shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}><LayoutGrid size={20} /></button>
                        </div>
                    </div>
                </div>

                {/* AI Briefing Panel */}
                {activeSection === 'API_KEYS' && aiSecurityBrief && (
                    <div className="p-8 bg-midnight text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5 animate-in slide-in-from-top-4">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-[3000ms]"><Zap size={120} className="text-primary" /></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                                 <ShieldCheck size={32} />
                             </div>
                             <div className="flex-1">
                                 <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                     <Sparkles size={12} className="text-yellow-400" /> AI Forensic Briefing
                                 </h4>
                                 <p className="text-sm font-medium italic leading-relaxed text-zinc-200 pr-12">"{aiSecurityBrief}"</p>
                             </div>
                             <button onClick={() => setAiSecurityBrief(null)} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {activeSection === 'AUDIT_LOGS' && (
                        <div className="flex-1 overflow-auto custom-scrollbar border border-zinc-100 rounded-[2.5rem]">
                            <table className="w-full text-left text-sm relative">
                                <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-20">
                                    <tr>
                                        <th className="px-10 py-6 text-center w-24">Type</th>
                                        <th className="px-10 py-6">Timestamp / Source</th>
                                        <th className="px-10 py-6">Actor Identity</th>
                                        <th className="px-10 py-6">Protocol Action</th>
                                        <th className="px-10 py-6">Contextual Reason</th>
                                        <th className="px-10 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-50/50 transition-all group">
                                            <td className="px-10 py-8 text-center">
                                                <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                                                    log.targetType === 'SECURITY_POLICY' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' :
                                                    log.targetType === 'API_KEY' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    {log.targetType === 'SECURITY_POLICY' ? <Lock size={20} /> : 
                                                     log.targetType === 'API_KEY' ? <Key size={20} /> : 
                                                     <Building2 size={20} />}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="font-mono text-xs font-black text-zinc-900 tracking-tighter uppercase">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-[10px] font-black shadow-lg border border-white/10 shrink-0">
                                                        {log.actorName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-black text-zinc-900 uppercase text-xs tracking-tight truncate">{log.actorName}</div>
                                                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">SHARD: {log.tenantId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-200 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="text-sm text-zinc-600 font-medium italic leading-relaxed line-clamp-2 max-w-sm">
                                                    "{log.reason || 'Logic pulse event logged.'}"
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary rounded-xl transition-all shadow-sm active:scale-90">
                                                    <Maximize2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLogs.length === 0 && (
                                <div className="py-48 text-center flex flex-col items-center gap-6 bg-zinc-50/50">
                                    <ShieldQuestion size={48} className="text-zinc-200" />
                                    <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">No Forensic Shards Identified</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'API_KEYS' && (
                        <div className="flex-1 overflow-auto custom-scrollbar border border-zinc-100 rounded-[2.5rem]">
                            <table className="w-full text-left text-sm relative">
                                <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-20">
                                    <tr>
                                        <th className="px-10 py-6">Label / Shard Prefix</th>
                                        <th className="px-10 py-6">Created</th>
                                        <th className="px-10 py-6">Expiry Lock</th>
                                        <th className="px-10 py-6 text-center">Last Registry Pulse</th>
                                        <th className="px-10 py-6 text-center">Usage Shards</th>
                                        <th className="px-10 py-6">Status Node</th>
                                        <th className="px-10 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {allApiKeys.map((key) => {
                                        const now = Date.now();
                                        const expiry = new Date(key.expiresAt).getTime();
                                        const isExpiring = key.status === 'ACTIVE' && (expiry - now < 1000 * 60 * 60 * 24 * 30);

                                        return (
                                            <tr key={key.id} className="hover:bg-zinc-50/50 transition-all group">
                                                <td className="px-10 py-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border-2 border-amber-100 shadow-inner shrink-0 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition-all`}>
                                                            <KeyRound size={28} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-black text-zinc-900 text-lg uppercase tracking-tighter leading-none mb-2">{key.label}</div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <code className="text-[10px] bg-zinc-100 px-2 py-1 rounded-lg text-zinc-500 font-mono border border-zinc-200 shadow-inner uppercase font-black">{key.keyPrefix}</code>
                                                                <button onClick={() => { navigator.clipboard.writeText(key.keyPrefix); }} className="p-1 text-zinc-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100" title="Copy Prefix"><Copy size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-zinc-800 text-xs uppercase tracking-tight">{new Date(key.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Genesis Sync</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className={`flex items-center gap-2 text-sm font-black tracking-tight uppercase ${isExpiring ? 'text-red-600' : 'text-zinc-800'}`}>
                                                            <Calendar size={16} className={isExpiring ? 'text-red-500' : 'text-primary'} />
                                                            {new Date(key.expiresAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-6">Temporal Lockout</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="text-xs font-mono font-black text-zinc-900 tracking-tighter uppercase mb-1">{key.lastUsedAt}</div>
                                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Registry Hub Pulse</div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="text-lg font-black text-primary tracking-tighter leading-none">{(key.usageCount || 0).toLocaleString()}</div>
                                                        <div className="text-[8px] font-black text-zinc-400 uppercase mt-1 tracking-widest">Logic Hits</div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-10">
                                                    <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase border flex items-center gap-3 w-fit shadow-inner transition-all ${
                                                        key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20' : 'bg-red-50 text-red-700 border-red-500/20 opacity-50 grayscale'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${key.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-50'}`} />
                                                        {key.status} NODE
                                                    </span>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                        {key.status === 'ACTIVE' && can(Permission.TENANT_SETTINGS_ADMIN) && (
                                                            <button 
                                                                onClick={(e) => handleRevokeKey(key.companyId, key.id)} 
                                                                className="p-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-xl shadow-red-900/10 active:scale-90" 
                                                                title="Revoke Shard Protocol"
                                                            >
                                                                <Ban size={22} />
                                                            </button>
                                                        )}
                                                        <button className="p-3.5 bg-zinc-900 text-white rounded-2xl hover:bg-primary transition-all shadow-2xl active:scale-90 border border-white/10">
                                                            <Maximize2 size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {allApiKeys.length === 0 && (
                                <div className="py-48 text-center flex flex-col items-center gap-6 bg-zinc-50/50">
                                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-100 shadow-inner ring-8 ring-zinc-50">
                                        <ShieldQuestion size={48} className="opacity-20" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">Credential Store Empty</p>
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Generate an access key to initialize third-party logic nodes.</p>
                                    </div>
                                    {can(Permission.TENANT_SETTINGS_ADMIN) && (
                                        <button onClick={() => setShowKeyModal(true)} className="px-10 py-5 bg-midnight text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all active:scale-95">Initialize Genesis Key</button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'POLICIES' && (
                        <div className="flex-1 overflow-auto custom-scrollbar space-y-12 animate-in slide-in-from-right-4 duration-500">
                            {isPlatformStaff ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* PLATFORM WIDE SECURITY */}
                                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10 group hover:border-primary transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-red-50 text-red-600 rounded-3xl border border-red-100 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all">
                                                <LockKeyhole size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Global Hardening</h3>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Sovereign Governance Overrides</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div 
                                                className={`flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] transition-all group/toggle ${canManageGovernance ? 'cursor-pointer hover:bg-white hover:border-primary' : 'opacity-80'}`}
                                                onClick={() => canManageGovernance && updateSystemConfig({ ...systemConfig!, enforceMFAAcrossPlatform: !systemConfig!.enforceMFAAcrossPlatform })}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-white rounded-xl border border-zinc-100 text-zinc-400 group-hover/toggle:text-primary transition-colors">
                                                        <Fingerprint size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-800 uppercase tracking-tight">Enforce Platform-wide MFA</h4>
                                                        <p className="text-[10px] text-zinc-400 italic">Overrides tenant-level MFA hibernation settings.</p>
                                                    </div>
                                                </div>
                                                {systemConfig!.enforceMFAAcrossPlatform ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-zinc-300" />}
                                            </div>

                                            <div 
                                                className={`flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] transition-all group/toggle ${canManageGovernance ? 'cursor-pointer hover:bg-white hover:border-primary' : 'opacity-80'}`}
                                                onClick={() => canManageGovernance && updateSystemConfig({ ...systemConfig!, allowNewRegistrations: !systemConfig!.allowNewRegistrations })}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-white rounded-xl border border-zinc-100 text-zinc-400 group-hover/toggle:text-primary transition-colors">
                                                        <ShieldPlus size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-800 uppercase tracking-tight">Allow Node Genesis</h4>
                                                        <p className="text-[10px] text-zinc-400 italic">Toggle public landing registration capability.</p>
                                                    </div>
                                                </div>
                                                {systemConfig!.allowNewRegistrations ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-zinc-300" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RESOURCE SHARDING POLICIES */}
                                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10 group hover:border-primary transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <DatabaseZap size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Resource Sharding</h3>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Global AI & Logic Quotas</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-500">Global AI Token Threshold</span>
                                                    <span className="text-primary font-mono text-xs">{systemConfig!.aiTokenLimitPerTenant.toLocaleString()}</span>
                                                </div>
                                                <input 
                                                    disabled={!canManageGovernance}
                                                    type="range"
                                                    min="1000000" max="10000000" step="500000"
                                                    className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                                                    value={systemConfig!.aiTokenLimitPerTenant}
                                                    onChange={e => updateSystemConfig({ ...systemConfig!, aiTokenLimitPerTenant: parseInt(e.target.value) })}
                                                />
                                                <p className="text-[10px] text-zinc-400 font-medium italic">Handshake quota applied to all non-enterprise shards.</p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-500">Session Logic TTL (Min)</span>
                                                    <span className="text-primary font-mono text-xs">{systemConfig!.globalSessionTTL}m</span>
                                                </div>
                                                <input 
                                                    disabled={!canManageGovernance}
                                                    type="range"
                                                    min="15" max="480" step="15"
                                                    className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                                                    value={systemConfig!.globalSessionTTL}
                                                    onChange={e => updateSystemConfig({ ...systemConfig!, globalSessionTTL: parseInt(e.target.value) })}
                                                />
                                                <p className="text-[10px] text-zinc-400 font-medium italic">Temporal duration before identity shard requires re-sync.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-zinc-200 rounded-[3rem] p-16 text-center space-y-8 shadow-sm">
                                    <ShieldAlert size={64} className="text-zinc-200 mx-auto" />
                                    <div>
                                        <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Governance Restricted</h3>
                                        <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">Platform-wide policy orchestration is limited to SuperAdmin nodes. Contact your shard architect for global configuration changes.</p>
                                    </div>
                                </div>
                            )}
                            
                            {canManageGovernance && (
                            <div className="bg-zinc-950 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5 ring-1 ring-white/10">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Zap size={150} className="text-primary" /></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="space-y-4 max-w-2xl">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-primary">Protocol Deployment</h3>
                                        <p className="text-lg text-zinc-300 leading-relaxed font-medium italic">"Governance changes propagate via the global logic mesh across all active nodes in &lt;100ms. Immutable audit traces are synchronized for regulatory compliance."</p>
                                    </div>
                                    <button 
                                        onClick={() => { alert("Protocol Handshake Initialized: Synchronization Committed."); }}
                                        className="px-12 py-6 bg-white text-zinc-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-3 shrink-0"
                                    >
                                        <ShieldCheck size={24} className="text-emerald-500" /> Commit Platform Logic
                                    </button>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* API Key Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-900/20">
                                    <KeyRound size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Credential Genesis</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Initialize access shard</p>
                                </div>
                            </div>
                            <button onClick={handleCloseModal} className="p-3 bg-white border border-zinc-100 hover:bg-red-50 hover:text-red-500 text-zinc-400 rounded-full transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="p-10 space-y-8">
                            {newlyCreatedKey ? (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] text-center space-y-6">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                                            <CheckCircle2 size={32} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Shard Provisioned</h4>
                                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-2">Capture this node immediately. It will not be revealed again.</p>
                                        </div>
                                        <div 
                                            className="p-4 bg-white border border-emerald-200 rounded-2xl flex items-center justify-between group cursor-pointer"
                                            onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); alert("Shard copied to local buffer."); }}
                                        >
                                            <code className="text-xs font-mono font-black text-zinc-900 truncate flex-1 text-left">{newlyCreatedKey}</code>
                                            <div className="p-2 bg-zinc-50 rounded-lg text-zinc-400 group-hover:text-primary transition-all">
                                                <Copy size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleCloseModal}
                                        className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
                                    >
                                        Confirm Node Capture
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {isPlatformStaff && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Target Tenant Shard</label>
                                            <select 
                                                className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                                value={selectedCompanyId}
                                                onChange={e => setSelectedCompanyId(e.target.value)}
                                            >
                                                <option value="">Select Entity Node...</option>
                                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Identity Label</label>
                                        <input 
                                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase"
                                            placeholder="e.g. ERP-SYSTEM-LINK-01"
                                            value={keyLabel}
                                            onChange={e => setKeyLabel(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Temporal Duration (Expiry)</label>
                                        <select 
                                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                            value={keyTtl}
                                            onChange={e => setKeyTtl(e.target.value)}
                                        >
                                            <option value="30">30 Days (Ephemeral)</option>
                                            <option value="90">90 Days (Standard)</option>
                                            <option value="365">1 Year (Long-Term Default)</option>
                                            <option value="0">Indefinite (Sovereign)</option>
                                        </select>
                                    </div>
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleGenerateKey}
                                            disabled={(isPlatformStaff && !selectedCompanyId) || !keyLabel}
                                            className="w-full py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4"
                                        >
                                            <Sparkles size={20} className="text-yellow-400" /> Commit Genesis Protocol
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityView;
