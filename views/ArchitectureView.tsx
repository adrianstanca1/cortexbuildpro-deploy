
import React, { useMemo, useState } from 'react';
import { 
  BrainCircuit, Layers, GitMerge, Target, 
  Activity, Clock, ChevronRight, Zap,
  AlertTriangle, ShieldCheck, Sparkles,
  Database, Cpu, Network, Terminal,
  Maximize2, ArrowRight, Loader2, Info,
  RefreshCw, Gavel, BarChart3, LineChart
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

const ArchitectureView: React.FC = () => {
    const { projects, tasks, setAiProcessing } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);

    const handleDeepLogicAnalysis = async () => {
        if (!project) return;
        setIsAnalyzing(true);
        setAiProcessing(true);
        try {
            const context = {
                project: project.name,
                description: project.description,
                phases: project.phases,
                tasks: projectTasks.map(t => ({ title: t.title, dependencies: t.dependencies }))
            };

            const prompt = `
                Act as a Lead System Architect for a large construction firm.
                Analyze the logic lattice and project phases for this project: ${JSON.stringify(context)}.
                Identify circular dependencies, fragile timing nodes, and resource bottlenecks.
                Return JSON:
                {
                    "structuralHealth": number (0-100),
                    "bottlenecks": ["string"],
                    "fragileNodes": ["string"],
                    "recommedations": [{"title": "string", "impact": "string"}]
                }
            `;

            const res = await runRawPrompt(prompt, { 
                model: 'gemini-3-pro-preview', 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 32768 } // Deep reasoning for architecture audits
            });
            setAnalysisResult(parseAIJSON(res));
        } finally {
            setIsAnalyzing(false);
            setAiProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                        <BrainCircuit className="text-primary" size={48} /> Logic Architecture
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                        <Activity size={14} className="text-primary animate-pulse" /> Project Dependency Lattice & Temporal Flow
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className="bg-white border border-zinc-200 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button 
                        onClick={handleDeepLogicAnalysis}
                        disabled={isAnalyzing}
                        className="bg-midnight text-white px-8 py-4 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center gap-3 active:scale-95 group disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} className="text-yellow-400 fill-current" />}
                        Execute Logic Audit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-12 shadow-sm relative overflow-hidden group/viz min-h-[500px] flex flex-col justify-center items-center">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-midnight rounded-[2rem] flex items-center justify-center text-primary shadow-2xl cortex-glow mb-16 relative z-20">
                                <Target size={40} strokeWidth={2.5} />
                                <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping" />
                            </div>

                            <div className="flex gap-12 relative">
                                {project?.phases?.slice(0, 3).map((p, i) => (
                                    <div key={p.id} className="relative flex flex-col items-center group/node">
                                        <div className="w-[1px] h-16 bg-gradient-to-b from-primary/40 to-transparent absolute -top-16" />
                                        <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl group-hover/node:border-primary group-hover/node:bg-white transition-all shadow-sm group-hover/node:shadow-2xl text-center w-48 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/node:scale-110 transition-transform"><Layers size={60} /></div>
                                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1 block">Phase Shard</span>
                                            <h4 className="font-black text-zinc-900 uppercase tracking-tight text-xs">{p.name}</h4>
                                            <div className="mt-4 flex items-center justify-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{p.status}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 mt-8">
                                            {[1, 2, 3].map(j => (
                                                <div key={j} className="w-2 h-2 rounded-full bg-zinc-200 group-hover/node:bg-primary transition-colors" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"><GitMerge size={14} className="text-primary" /> Logic Gaps Identified</h3>
                            <div className="space-y-4">
                                {analysisResult?.bottlenecks?.map((b: string, i: number) => (
                                    <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-4 hover:border-red-200 transition-all group">
                                        <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all"><AlertTriangle size={16} /></div>
                                        <p className="text-xs font-bold text-zinc-700 uppercase tracking-tight leading-relaxed">{b}</p>
                                    </div>
                                )) || (
                                    <div className="p-10 text-center text-zinc-300 italic text-xs uppercase tracking-widest">Execute logic audit to scan registry.</div>
                                )}
                            </div>
                        </div>
                        <div className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Database size={100} /></div>
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><Terminal size={14} /> System Directives</h3>
                            <div className="space-y-4">
                                {analysisResult?.recommedations?.map((r: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-1 border-l-2 border-white/10 pl-4 hover:border-primary transition-colors cursor-default">
                                        <div className="text-[8px] font-black text-primary uppercase tracking-widest">Protocol: {r.impact} IMPACT</div>
                                        <div className="text-sm font-black uppercase tracking-tight">{r.title}</div>
                                    </div>
                                )) || (
                                    <p className="text-zinc-500 text-xs italic">Logic engine standing by for payload...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><BarChart3 size={120} /></div>
                        <div className="relative w-40 h-40 mb-6">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="#f4f4f5" strokeWidth="12" />
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    fill="none" 
                                    stroke="#0ea5e9" 
                                    strokeWidth="12" 
                                    strokeDasharray="440" 
                                    strokeDashoffset={440 - (440 * (analysisResult?.structuralHealth || 0)) / 100} 
                                    strokeLinecap="round"
                                    className="transition-all duration-[2000ms] ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-zinc-900 tracking-tighter">{analysisResult?.structuralHealth || '--'}%</span>
                                <span className="text-[8px] text-zinc-400 uppercase font-black tracking-widest">Health Score</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Structural Soundness</h3>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.2em] mt-2">Aggregate Dependency Integrity</p>
                    </div>

                    <div className="bg-midnight rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform duration-1000"><LineChart size={120} /></div>
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">Temporal Drift Forecast</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end gap-2 h-20">
                                {[30, 45, 25, 60, 40, 80, 55, 90, 70, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-primary/20 rounded-sm relative group/bar">
                                        <div className="absolute bottom-0 w-full bg-primary rounded-sm transition-all duration-1000 group-hover/bar:bg-white" style={{ height: `${h}%` }} />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[11px] text-zinc-400 italic leading-relaxed">"Site metrics indicate a potential 12% drift in structural assembly during Q3 based on current resource sharding."</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-[3rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-100 rounded-3xl">
                            <div className="p-3 bg-primary text-white rounded-2xl shadow-lg"><Network size={20} /></div>
                            <div>
                                <div className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Active Shards</div>
                                <div className="text-xl font-black text-zinc-900 tracking-tighter">{projectTasks.length} Nodes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchitectureView;
