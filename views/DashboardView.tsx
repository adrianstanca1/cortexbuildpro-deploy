import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowRight, Activity, Zap, Brain, Loader2, Rocket, Building2, 
  MessageSquare, Navigation, Store, Cpu, Binary, Wifi, Target, 
  Layers, Signal, Gauge, Globe, ShieldCheck, TrendingUp, BrainCircuit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { UserRole, Page, Project } from '../types';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

const PortfolioMesh: React.FC<{ projects: Project[] }> = ({ projects }) => {
    return (
        <div className="bg-zinc-950 rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group min-h-[400px]">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            <div className="relative z-10 flex justify-between items-start mb-10">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Sovereign Mesh HUD</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Active Multi-Node Telemetry</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-primary uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        Synchronized
                    </div>
                </div>
            </div>

            <div className="relative h-64 w-full flex items-center justify-center">
                <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary shadow-[0_0_50px_rgba(14,165,233,0.3)] animate-pulse-glow z-20">
                    <Cpu size={32} strokeWidth={2.5} />
                </div>

                {projects.slice(0, 6).map((p, i) => {
                    const angle = (i * (360 / Math.min(6, projects.length))) * (Math.PI / 180);
                    const radius = 120;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                        <React.Fragment key={p.id}>
                            <div 
                                className="absolute h-[2px] bg-gradient-to-r from-primary/40 to-transparent origin-left opacity-30 group-hover:opacity-100 transition-opacity duration-1000"
                                style={{ 
                                    width: radius,
                                    transform: `rotate(${angle}rad)`,
                                    left: '50%',
                                    top: '50%'
                                }}
                            />
                            <div 
                                className="absolute w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center hover:scale-125 hover:border-primary transition-all cursor-pointer shadow-xl z-20 group/node"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <Building2 size={18} className="text-zinc-500 group-hover/node:text-primary" />
                                <div className="absolute top-full mt-3 opacity-0 group-hover/node:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-1 rounded text-[8px] font-black uppercase text-white whitespace-nowrap">
                                    {p.name} • {p.progress}%
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-12 border-t border-white/5 pt-10">
                <div className="text-center">
                    <div className="text-2xl font-black text-white tracking-tighter">{projects.length}</div>
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Managed Nodes</div>
                </div>
                <div className="text-center border-x border-white/5">
                    <div className="text-2xl font-black text-primary tracking-tighter">1.2ms</div>
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Global Latency</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-emerald-500 tracking-tighter">99%</div>
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Asset Integrity</div>
                </div>
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { user } = useAuth();
    const { projects } = useProjects();
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const context = projects.map(p => `${p.name}: ${p.progress}%`).join(', ');
            const res = await runRawPrompt(`Portfolio Simulation for: ${context}. Predict 30-day bottleneck and structural optimization. Concise.`, { 
              model: 'gemini-3-pro-preview',
              thinkingConfig: { thinkingBudget: 4096 }
            });
            setBriefing(res);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-10 max-w-[1700px] mx-auto space-y-12 pb-28 animate-in fade-in duration-700">
            <div className="flex justify-between items-end gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-midnight tracking-tighter uppercase leading-none">
                        Mesh <span className="text-primary">Command</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-500 font-black uppercase text-[12px] tracking-[0.4em] flex items-center gap-3">
                            <Cpu size={16} className="text-primary" /> Shard v4.5.0-STABLE
                        </span>
                        <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Signal size={14} /> Neural Connection Verified
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <PortfolioMesh projects={projects} />
                </div>
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-xl flex flex-col h-full relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Brain size={18} /></div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Strategic Reasoning</span>
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-4 leading-tight">Trajectory Pulse</h3>
                                {briefing ? (
                                    <p className="text-zinc-600 text-sm leading-relaxed italic animate-in fade-in">"{briefing}"</p>
                                ) : (
                                    <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">Initialize logic scan to generate predictive portfolio intelligence.</p>
                                )}
                            </div>
                            <button 
                                onClick={runSimulation}
                                disabled={loading}
                                className="mt-10 w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin text-primary" /> : <BrainCircuit size={18} className="text-primary" />}
                                Commit Neural Simulation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                <button onClick={() => setPage(Page.CHAT)} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm hover:border-primary transition-all group flex flex-col items-center">
                    <div className="p-5 bg-zinc-50 rounded-2xl mb-4 group-hover:bg-midnight group-hover:text-white transition-all"><MessageSquare size={32} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AI Advisor</span>
                </button>
                <button onClick={() => setPage(Page.LIVE)} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm hover:border-primary transition-all group flex flex-col items-center">
                    <div className="p-5 bg-zinc-50 rounded-2xl mb-4 group-hover:bg-midnight group-hover:text-white transition-all"><Zap size={32} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vision Agent</span>
                </button>
                <button onClick={() => setPage(Page.LIVE_PROJECT_MAP)} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm hover:border-primary transition-all group flex flex-col items-center">
                    <div className="p-5 bg-zinc-50 rounded-2xl mb-4 group-hover:bg-midnight group-hover:text-white transition-all"><Navigation size={32} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Spatial HUD</span>
                </button>
                <button onClick={() => setPage(Page.MARKETPLACE)} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm hover:border-primary transition-all group flex flex-col items-center">
                    <div className="p-5 bg-zinc-50 rounded-2xl mb-4 group-hover:bg-midnight group-hover:text-white transition-all"><Store size={32} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">App Forge</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardView;
