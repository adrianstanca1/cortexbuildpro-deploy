
import React, { useMemo, useState } from 'react';
import { 
  ScanLine, ShieldAlert, Activity, Eye, 
  MapPin, Clock, ArrowRight, ShieldCheck,
  AlertTriangle, CheckCircle2, Search, Filter,
  Globe, Zap, BrainCircuit, Maximize2, RefreshCw
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { SafetyIncident } from '../types';

const VisionView: React.FC = () => {
    const { safetyIncidents, projects, isLoading } = useProjects();
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('All');

    const filteredIncidents = useMemo(() => {
        return safetyIncidents.filter(inc => {
            const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) || 
                                 inc.project.toLowerCase().includes(search.toLowerCase());
            const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter;
            return matchesSearch && matchesSeverity;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [safetyIncidents, search, severityFilter]);

    const stats = useMemo(() => {
        const total = safetyIncidents.length;
        const high = safetyIncidents.filter(i => i.severity === 'High').length;
        const resolved = safetyIncidents.filter(i => i.status === 'Resolved').length;
        return { total, high, resolved };
    }, [safetyIncidents]);

    return (
        <div className="p-8 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                        <ScanLine className="text-primary" size={48} /> Vision Shard
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                        <Activity size={14} className="text-primary animate-pulse" /> Aggregate Forensic Site Telemetry
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-white border border-zinc-200 px-8 py-4 rounded-[2rem] shadow-sm flex items-center gap-6">
                        <div>
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Detections</div>
                            <div className="text-3xl font-black text-zinc-900 leading-none tracking-tighter">{stats.total}</div>
                        </div>
                        <div className="h-10 w-px bg-zinc-100" />
                        <div>
                            <div className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Critical</div>
                            <div className="text-3xl font-black text-red-600 leading-none tracking-tighter">{stats.high}</div>
                        </div>
                    </div>
                    <button className="bg-zinc-900 text-white px-8 py-4 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center gap-3 active:scale-95 group">
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" /> Sync Vision Nodes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by incident title or project node..." 
                                className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl border border-zinc-200">
                            {['All', 'High', 'Medium', 'Low'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setSeverityFilter(s)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${severityFilter === s ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {filteredIncidents.map((inc, i) => (
                            <div key={inc.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary hover:shadow-2xl transition-all shadow-sm relative overflow-hidden animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`absolute top-0 left-0 w-2 h-full ${inc.severity === 'High' ? 'bg-red-500' : inc.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                
                                <div className="flex gap-8 items-center flex-1 min-w-0">
                                    <div className="w-20 h-20 bg-zinc-50 rounded-[1.75rem] flex items-center justify-center border border-zinc-100 text-zinc-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                        <Eye size={36} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                                                inc.severity === 'High' ? 'bg-red-50 text-red-700 border-red-500/20' : 
                                                inc.severity === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-500/20' : 
                                                'bg-blue-50 text-blue-700 border-blue-500/20'
                                            }`}>{inc.severity} Severity</span>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {inc.date}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-zinc-900 truncate uppercase tracking-tighter group-hover:text-primary transition-colors">{inc.title}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {inc.project}</span>
                                            <div className="h-1 w-1 bg-zinc-200 rounded-full" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{inc.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 md:mt-0">
                                    <button className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-primary rounded-2xl transition-all shadow-sm active:scale-90"><Maximize2 size={20} /></button>
                                    <button className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3 group/btn">
                                        Inspect Source <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredIncidents.length === 0 && (
                            <div className="py-40 text-center border-2 border-dashed border-zinc-200 rounded-[3rem] bg-white/50">
                                <ShieldCheck size={48} className="mx-auto mb-4 text-zinc-200" />
                                <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Visual Clearance</h3>
                                <p className="text-zinc-400 text-xs mt-2 font-medium uppercase tracking-widest">No active hazards detected in current vision registry.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group/risk">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/risk:scale-110 transition-transform duration-1000"><Zap size={120} className="text-primary" /></div>
                        <div className="relative z-10 space-y-8">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Neural Insights</h3>
                            <div className="space-y-6">
                                <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all cursor-default">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Model Confidence</div>
                                    <div className="text-4xl font-black tracking-tighter">98.4%</div>
                                    <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '98%' }} />
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all cursor-default">
                                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3">Resolution Rate</div>
                                    <div className="text-4xl font-black tracking-tighter">84.2%</div>
                                    <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: '84%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Globe size={14} className="text-primary" /> Cluster Density</h3>
                        <div className="space-y-6">
                            {projects.slice(0, 4).map(p => (
                                <div key={p.id} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                        <span>{p.name}</span>
                                        <span>{safetyIncidents.filter(i => i.projectId === p.id).length} Nodes</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(safetyIncidents.filter(i => i.projectId === p.id).length / (stats.total || 1)) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisionView;
