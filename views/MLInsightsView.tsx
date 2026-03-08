
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, AlertTriangle, Zap, RefreshCw, Activity, 
  Brain, CheckCircle2, XCircle, ArrowRight, Rocket,
  BrainCircuit, Gauge, Cpu, Network, Signal, 
  LayoutGrid, Layers, Globe, ShieldCheck, TrendingDown,
  // Added missing Terminal and Sparkles to imports
  ChevronRight, Info, AlertOctagon, Maximize2, Loader2,
  ScanLine, Terminal, Sparkles
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

const MLInsightsView: React.FC = () => {
  const { user } = useAuth();
  const { projects, tasks, setAiProcessing } = useProjects();
  const [isSimulating, setIsSimulating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [inferenceLog, setInferenceLog] = useState<string[]>(['Sovereign Inference Hub v4.5.2 Initialized.', 'Awaiting multi-tenant telemetry input...', 'Logic core standby.']);

  const runSimulation = async () => {
    setIsSimulating(true);
    setAiProcessing(true);
    setInferenceLog(["Initializing Reasoning Link...", "Fetching Project Shards...", "Consulting Gemini 3 Pro Reasoning Engine..."]);
    
    try {
        const summary = projects.map(p => ({
            id: p.id,
            name: p.name,
            progress: p.progress,
            health: p.health,
            budget: p.budget,
            spent: p.spent
        }));
        
        const overdueTasks = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;

        const prompt = `
            Act as a Lead AI Project Strategist (Sovereign Level).
            PORTFOLIO TELEMETRY: ${JSON.stringify(summary)}
            GLOBAL BOTTLE_NECKS: ${overdueTasks} overdue tasks.

            TASK: Perform a technical deep-dive predictive simulation.
            Identify hidden risk vectors in the dependency lattice and calculate portfolio-wide optimization scores.
            
            OUTPUT FORMAT (JSON ONLY):
            {
                "optimizationScore": number (0-100),
                "riskProbability": number (0-100),
                "failureNode": "Project Name or Task ID that is most likely to fail",
                "projectedSavings": number (value in GBP),
                "timelineDeviation": [number x 12],
                "reasoningTrace": "One sentence summary of the AI reasoning.",
                "actionNodes": [
                    { "title": "Protocol Name", "impact": "High"|"Medium"|"Low", "rationale": "One sentence" }
                ]
            }
        `;

        const result = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 16384 }
        });

        const data = parseAIJSON(result);
        setAnalysisResult(data);
        setInferenceLog(prev => [...prev, "Neural handshake successful.", "Portfolio variance calculated.", "Simulation Node Complete."]);
    } catch (e) {
        console.error(e);
        setInferenceLog(prev => [...prev, "ERROR: Logic shard disconnection detected.", "Retrying gateway link..."]);
    } finally {
        setIsSimulating(false);
        setAiProcessing(false);
    }
  };

  const score = analysisResult?.optimizationScore ?? 0;
  const risk = analysisResult?.riskProbability ?? 0;

  return (
    <div className="p-8 max-w-[1700px] mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                <BrainCircuit className="text-primary" size={48} /> Inference Hub
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                <Signal size={14} className="text-primary animate-pulse" /> Gemini 3 Pro Reasoning Core Active
            </p>
        </div>
        
        <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="bg-midnight text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/20 hover:bg-primary transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50 group"
        >
            {isSimulating ? <Loader2 size={24} className="animate-spin text-primary" /> : <Zap size={24} className="text-yellow-400 fill-current group-hover:scale-110 transition-transform" />}
            Execute Neural Pulse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><CheckCircle2 size={120} /></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                          <div>
                              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                  <ShieldCheck size={14} className="text-emerald-500" /> Portfolio Health Score
                              </div>
                              <div className={`text-7xl font-black tracking-tighter leading-none ${score > 80 ? 'text-emerald-600' : 'text-zinc-900'}`}>{score}%</div>
                              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4">Optimization Efficiency Gradient</p>
                          </div>
                          <div className="mt-8 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full transition-all duration-[2000ms] ${score > 80 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${score}%` }} />
                          </div>
                      </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group hover:border-red-500 transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><AlertOctagon size={120} /></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                          <div>
                              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                  <AlertTriangle size={14} className="text-red-500" /> Risk Probability Node
                              </div>
                              <div className={`text-7xl font-black tracking-tighter leading-none ${risk > 50 ? 'text-red-600' : 'text-zinc-900'}`}>{risk}%</div>
                              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4">Calculated Failure Potential</p>
                          </div>
                          <div className="mt-8 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full transition-all duration-[2000ms] ${risk > 50 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${risk}%` }} />
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-[3rem] p-12 shadow-sm relative overflow-hidden group/chart">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/chart:rotate-12 transition-transform duration-1000"><TrendingUp size={200} /></div>
                  <div className="flex justify-between items-center mb-12 relative z-10">
                      <div>
                          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Trajectory Simulation</h3>
                          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">12-Month Rolling Logic Deviation</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                             <div className="w-2.5 h-2.5 bg-primary rounded-sm shadow-sm" /> Baseline
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">
                             <div className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/30 rounded-sm shadow-sm" /> Simulation
                          </div>
                      </div>
                  </div>
                  
                  <div className="h-64 w-full relative flex items-end gap-3 px-10 pb-8 border-b border-l border-zinc-100">
                      {(analysisResult?.timelineDeviation || [60, 72, 65, 84, 92, 88, 74, 96, 82, 78, 85, 90]).map((h: number, i: number) => (
                          <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group/bar relative">
                              <div 
                                className="w-full bg-primary/10 border border-primary/20 rounded-t-lg transition-all duration-1000 group-hover/bar:bg-primary/20" 
                                style={{ height: `100%` }}
                              />
                              <div 
                                className="absolute bottom-0 w-full bg-primary rounded-t-lg shadow-xl opacity-90 group-hover/bar:opacity-100 transition-all group-hover/bar:-translate-y-1" 
                                style={{ height: `${h}%` }}
                              >
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 whitespace-nowrap z-20">
                                      SYNC: {h}%
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[9px] font-black text-zinc-300 uppercase tracking-widest px-10">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-4 space-y-10 flex flex-col">
              <div className="bg-zinc-950 rounded-[3rem] p-1 text-white shadow-2xl flex flex-col h-[400px] border border-white/5 overflow-hidden">
                  <div className="h-12 border-b border-white/5 flex items-center justify-between px-8 bg-white/5 shrink-0">
                      <div className="flex items-center gap-3">
                          <Terminal size={14} className="text-primary" />
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inference Ledger</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-2 custom-scrollbar bg-black/40">
                      {inferenceLog.map((log, i) => (
                          <div key={i} className="flex gap-3">
                              <span className="text-primary font-black shrink-0">»</span>
                              <span className="text-zinc-400 break-all">{log}</span>
                          </div>
                      ))}
                      {isSimulating && <div className="text-primary animate-pulse">REASONING ENGINE PROCESSING...</div>}
                  </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm flex flex-col flex-1 overflow-hidden relative group/action">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/action:scale-110 transition-transform duration-1000"><Zap size={100} /></div>
                  <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-8 px-1">
                          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Active Recommendations</h3>
                          <div className="p-2 bg-primary/10 text-primary rounded-xl shadow-inner"><Sparkles size={18} /></div>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                          {(analysisResult?.actionNodes || [
                              { title: 'Material Logic Shard', impact: 'High', rationale: 'Address supply chain variance in Sector 4.' },
                              { title: 'Temporal Buffer Sync', impact: 'Medium', rationale: 'Align pour schedule with weather telemetry.' },
                              { title: 'Audit Depth Escalate', impact: 'Low', rationale: 'Verify compliance nodes on residential Complex.' }
                          ]).map((node: any, i: number) => (
                              <div key={i} className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 hover:bg-white hover:border-primary hover:shadow-xl transition-all cursor-pointer group/node">
                                  <div className="flex justify-between items-center mb-3">
                                      <span className="font-black text-zinc-900 text-xs uppercase tracking-tight group-hover/node:text-primary transition-colors">{node.title}</span>
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${node.impact === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{node.impact}</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 font-medium italic leading-relaxed">"{node.rationale}"</p>
                              </div>
                          ))}
                      </div>
                      <div className="mt-8 pt-8 border-t border-zinc-50">
                        <button className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                             Inject Global Logic Protocols <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MLInsightsView;
