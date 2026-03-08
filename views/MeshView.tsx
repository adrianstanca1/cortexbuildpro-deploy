
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Network, Globe, Signal, Zap, Activity, 
  DatabaseZap, Cpu, ShieldCheck, Server,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Terminal, Sliders, ChevronRight, Layout,
  Target, Binary, ShieldAlert, Radio, Maximize2
} from 'lucide-react';
import { useControlPlane } from '../contexts/SuperAdminContext';
import { useProjects } from '../contexts/ProjectContext';

const MeshView: React.FC = () => {
    const { companies, auditLogs, systemConfig } = useControlPlane();
    const { teamMembers, projects } = useProjects();
    const [pulseOpacity, setPulseOpacity] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setPulseOpacity(prev => prev === 1 ? 0.4 : 1);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const meshStats = useMemo(() => {
        const activeTenants = companies.filter(c => c.status === 'ACTIVE').length;
        const totalNodes = teamMembers.length;
        const totalThroughput = companies.length * 1242; // Simulated
        return { activeTenants, totalNodes, totalThroughput };
    }, [companies, teamMembers]);

    return (
        <div className="p-8 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                        <Network className="text-primary" size={48} /> Global Mesh
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                        <Activity size={14} className="text-primary animate-pulse" /> Cluster Topology & Logic State Synchronization
                    </p>
                </div>
                
                <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-4 px-8 items-center shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Stable</span>
                    </div>
                    <div className="h-6 w-px bg-zinc-200" />
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">v{systemConfig?.version || '4.5.2-PRIME'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Visual Topology Representation */}
                <div className="lg:col-span-8 bg-zinc-950 rounded-[3rem] p-12 text-white border border-white/5 shadow-2xl relative overflow-hidden group min-h-[600px]">
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Globe size={300} /></div>
                    
                    <div className="relative z-10 flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Cluster Topology</h3>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                                <Radio size={14} /> Global Node Distribution
                            </p>
                        </div>
                    </div>

                    <div className="relative h-[400px] flex items-center justify-center">
                        {/* Central Hub */}
                        <div className="w-28 h-28 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary shadow-[0_0_80px_rgba(14,165,233,0.3)] z-20 relative">
                            <Cpu size={48} strokeWidth={2.5} className="animate-pulse" />
                            <div className="absolute -inset-8 bg-primary/5 rounded-full border border-primary/10 animate-spin-slow" />
                        </div>

                        {/* Tenant Nodes Orbit */}
                        {companies.map((c, i) => {
                            const angle = (i * (360 / companies.length)) * (Math.PI / 180);
                            const radius = 180;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            return (
                                <div 
                                    key={c.id}
                                    className="absolute transition-all duration-1000 flex items-center justify-center group/node"
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                >
                                    <div className="absolute h-px bg-gradient-to-r from-primary/40 to-transparent origin-left w-[180px] -rotate-180 opacity-20 group-hover/node:opacity-100 group-hover/node:scale-x-110 transition-all duration-700" />
                                    <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover/node:border-primary group-hover/node:shadow-2xl group-hover/node:shadow-primary/20 transition-all cursor-pointer relative z-30 ${c.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        <Server size={24} />
                                        <div className="absolute top-full mt-4 bg-black border border-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase text-white whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-all translate-y-2 group-hover/node:translate-y-0">
                                            {c.name} Shard
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-10 mt-12 border-t border-white/5 pt-10">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-emerald-500" /> Mesh Sync
                            </div>
                            <div className="text-3xl font-black tracking-tighter">99.99%</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" /> Shard IOPS
                            </div>
                            <div className="text-3xl font-black tracking-tighter">128.4k</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <DatabaseZap size={14} className="text-primary" /> Data Shards
                            </div>
                            <div className="text-3xl font-black tracking-tighter">{companies.length * 8} Clusters</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white border border-zinc-200 rounded-[3.5rem] p-10 shadow-sm space-y-10 h-full flex flex-col">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-primary/10 text-primary rounded-3xl shadow-inner border border-primary/20">
                                <ShieldCheck size={32} />
                            </div>
                            <div className="px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sovereign State</div>
                        </div>
                        
                        <div className="flex-1 space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter leading-none">Node Pulse</h3>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Live Identity Mesh Telemetry</p>
                            </div>
                            
                            <div className="space-y-6">
                                {auditLogs.slice(0, 5).map((log, i) => (
                                    <div key={log.id} className="flex gap-5 group animate-in slide-in-from-right-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                                        <div>
                                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()} • {log.targetType}</div>
                                            <div className="text-xs font-black text-zinc-800 uppercase tracking-tight line-clamp-1">{log.action.replace(/_/g, ' ')}</div>
                                            <div className="text-[9px] text-zinc-500 font-medium truncate italic mt-0.5">{log.reason}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="mt-8 w-full py-5 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95 group/btn">
                             Initialize Cluster Diagnostic <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Target size={120} /></div>
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Active Tenants</div>
                    <div className="text-5xl font-black text-zinc-900 tracking-tighter">{meshStats.activeTenants}</div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">+2 New Today</span>
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Activity size={120} /></div>
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Total Users</div>
                    <div className="text-5xl font-black text-zinc-900 tracking-tighter">{meshStats.totalNodes}</div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Global Identity Pool</span>
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Zap size={120} /></div>
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">API Throughput</div>
                    <div className="text-5xl font-black text-zinc-900 tracking-tighter">{(meshStats.totalThroughput / 1000).toFixed(1)}k</div>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase">
                        <ArrowUpRight size={12} /> Nominal Load
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><DatabaseZap size={120} /></div>
                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Storage Usage</div>
                    <div className="text-5xl font-black text-zinc-900 tracking-tighter">842 TB</div>
                    <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[38%]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeshView;
