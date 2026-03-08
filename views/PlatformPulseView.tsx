import React, { useMemo } from 'react';
import { 
  Radio, Globe, Activity, Users, Zap, Building2, 
  PoundSterling, ShieldCheck, MapPin, ArrowUpRight,
  Database, Server, Cpu, Network, Signal, Layers,
  ChevronRight, ArrowRight, BarChart3, TrendingUp,
  Target, Globe2, ScanLine, DatabaseZap
} from 'lucide-react';
import { useControlPlane } from '../contexts/SuperAdminContext';
import { useProjects } from '../contexts/ProjectContext';

const PlatformPulseView: React.FC = () => {
    const { companies, auditLogs } = useControlPlane();
    const { projects, teamMembers } = useProjects();

    const stats = useMemo(() => {
        const totalCompanies = companies.length;
        const totalUsers = teamMembers.length;
        const totalProjects = projects.length;
        const totalRevenue = companies.reduce((acc, c) => acc + (c.plan === 'Enterprise' ? 50000 : c.plan === 'Business' ? 20000 : 5000), 0);
        
        return { totalCompanies, totalUsers, totalProjects, totalRevenue };
    }, [companies, projects, teamMembers]);

    return (
        <div className="p-10 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                        <Radio size={48} className="text-emerald-500 animate-pulse" /> Platform Pulse
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-zinc-500 font-black uppercase text-[12px] tracking-[0.4em] flex items-center gap-3">
                            <Globe size={16} className="text-primary" /> Multi-Shard Core
                        </span>
                        <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Signal size={14} /> Global Gateway Verified
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tenants</div>
                        <div className="text-2xl font-black text-zinc-900 tracking-tighter">{stats.totalCompanies}</div>
                    </div>
                    <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Nodes</div>
                        <div className="text-2xl font-black text-zinc-900 tracking-tighter">{stats.totalUsers}</div>
                    </div>
                    <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Clusters</div>
                        <div className="text-2xl font-black text-zinc-900 tracking-tighter">{stats.totalProjects}</div>
                    </div>
                    <div className="bg-zinc-950 p-6 rounded-3xl shadow-2xl">
                        <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Aggregate ARR</div>
                        <div className="text-2xl font-black text-white tracking-tighter">£{(stats.totalRevenue / 1000).toFixed(0)}k</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-zinc-950 rounded-[3rem] p-12 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
                    <div className="relative z-10 flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Global Shard Distribution</h3>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                                <Globe2 size={14} /> Real-time Node Density
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Active Gateway</span>
                                <span className="text-xs font-mono font-black text-emerald-400">AWS-EMEA-LONDON-01</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <Activity size={24} className="text-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="h-[400px] w-full relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/simple-dashed.png')] opacity-10" />
                        <div className="relative w-full h-full">
                            <div className="absolute top-[30%] left-[45%] group/pin cursor-pointer">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute" />
                                <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xl relative z-10" />
                                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase shadow-2xl border border-zinc-100 opacity-0 group-hover/pin:opacity-100 transition-all scale-90 group-hover/pin:scale-100 whitespace-nowrap">
                                    EMEA Cluster: 14 Shards
                                </div>
                            </div>
                            <div className="absolute top-[40%] left-[20%] group/pin2 cursor-pointer">
                                <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute" />
                                <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-xl relative z-10" />
                                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase shadow-2xl border border-zinc-100 opacity-0 group-hover/pin2:opacity-100 transition-all scale-90 group-hover/pin2:scale-100 whitespace-nowrap">
                                    NA Cluster: 8 Shards
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-10 border-t border-white/5 pt-10 mt-10">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" /> P99 Latency
                            </div>
                            <div className="text-3xl font-black tracking-tighter">1.2ms</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-emerald-500" /> Global IOPS
                            </div>
                            <div className="text-3xl font-black tracking-tighter">842k / s</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Database size={14} className="text-primary" /> Mesh Storage
                            </div>
                            <div className="text-3xl font-black tracking-tighter">8.4 PB</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-xl relative overflow-hidden group h-full flex flex-col">
                        <div className="relative z-10 space-y-10 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shadow-inner border border-emerald-100">
                                    <Activity size={32} />
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">System Health</div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Cluster Integrity</h3>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Immutable Forensic Log Analysis</p>
                            </div>
                            <div className="space-y-6">
                                {auditLogs.slice(0, 4).map((log, i) => (
                                    <div key={log.id} className="flex gap-5 group/log cursor-default animate-in slide-in-from-right-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 group-hover/log:scale-150 transition-transform" />
                                        <div>
                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()} • NODE {log.actorId.slice(-4).toUpperCase()}</div>
                                            <div className="text-sm font-bold text-zinc-800 uppercase tracking-tight line-clamp-1">{log.action.replace(/_/g, ' ')}</div>
                                            <div className="text-[10px] text-zinc-500 italic mt-0.5 line-clamp-1 font-medium">{log.reason}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button className="mt-12 w-full py-5 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 group/btn">
                             Open Security Shard <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Cpu size={100} /></div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ScanLine size={16} className="text-primary" /> Logic Engine Load
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">14.2%</div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Optimal</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-emerald-500 w-[14%]" />
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Network size={100} /></div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target size={16} className="text-primary" /> Active Thread Mesh
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">1,842</div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Synced</span>
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><DatabaseZap size={100} /></div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" /> Forensic Integrity
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                        <div className="text-5xl font-black text-zinc-900 tracking-tighter">99.9%</div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Verified</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformPulseView;
