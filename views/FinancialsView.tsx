
import React, { useState, useMemo } from 'react';
import { 
  PoundSterling, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, 
  Download, Filter, FileText, BarChart3, Shield, Wallet,
  Activity, Zap, Brain, Target, ArrowRight, ChevronRight,
  TrendingDown, ShieldCheck, Scale, History, Loader2,
  Clock, Database, Receipt
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import InvoicesView from './InvoicesView';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';
import { ProjectActionModals } from '../components/ProjectActionModals';

type ModalType = 'RFI' | 'PUNCH' | 'LOG' | 'DAYWORK' | 'PHOTO' | 'DRAWING' | 'INVOICE';

const FinancialsView: React.FC = () => {
  const { user } = useAuth();
  const { projects, invoices, setAiProcessing } = useProjects();
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'CASHFLOW' | 'LEDGER'>('PORTFOLIO');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = projects.reduce((acc, p) => acc + p.spent, 0);
    const margin = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;
    const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0);
    
    return { totalBudget, totalSpent, margin, pendingAmount };
  }, [projects, invoices]);

  const handleSimulateCashflow = async () => {
    setIsSimulating(true);
    setAiProcessing(true);
    try {
        const context = projects.map(p => ({
            name: p.name,
            budget: p.budget,
            spent: p.spent,
            progress: p.progress,
            health: p.health
        }));

        const prompt = `
            Act as an AI Chief Financial Officer for a construction portfolio.
            PORTFOLIO DATA: ${JSON.stringify(context)}
            
            TASK: 
            1. Run a 12-month predictive cashflow simulation.
            2. Identify potential liquidity gaps based on current burn rates and project health.
            3. Suggest 3 high-impact financial optimizations.
            
            RETURN JSON ONLY:
            {
                "forecast": [number, number, number, number, number, number, number, number, number, number, number, number],
                "liquidityScore": number (0-100),
                "riskNodes": ["string"],
                "optimizations": [{"title": "string", "impact": "string"}]
            }
        `;

        const res = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 8192 }
        });
        setSimulationResult(parseAIJSON(res));
    } finally {
        setIsSimulating(false);
        setAiProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-6">
                <PoundSterling className="text-primary" size={48} /> Sovereign Ledger
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Multi-Tenant Financial Orchestration Shard</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200 shadow-inner">
            <button 
                onClick={() => setActiveTab('PORTFOLIO')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PORTFOLIO' ? 'bg-white text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
                <Activity size={16} /> Portfolio Cockpit
            </button>
            <button 
                onClick={() => setActiveTab('CASHFLOW')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'CASHFLOW' ? 'bg-white text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
                <TrendingUp size={16} /> Cashflow Shard
            </button>
            <button 
                onClick={() => setActiveTab('LEDGER')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'LEDGER' ? 'bg-white text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
                <Database size={16} /> Global Ledger
            </button>
        </div>
      </div>

      {activeTab === 'LEDGER' ? (
          <InvoicesView onAdd={() => setActiveModal('INVOICE')} />
      ) : (
          <div className="space-y-12">
              {/* Aggregated KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-zinc-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Wallet size={120} /></div>
                      <div className="relative z-10">
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Portfolio Valuation</div>
                          <div className="text-4xl font-black tracking-tighter">£{(stats.totalBudget / 1000000).toFixed(2)}M</div>
                          <div className="mt-6 flex items-center gap-2">
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Authorized Nodes</span>
                          </div>
                      </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Zap size={120} /></div>
                      <div className="relative z-10">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Active Burn</div>
                          <div className="text-4xl font-black text-zinc-900 tracking-tighter">£{(stats.totalSpent / 1000000).toFixed(2)}M</div>
                          <div className="mt-6 w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${(stats.totalSpent / stats.totalBudget) * 100}%` }} />
                          </div>
                      </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
                      <div className="relative z-10">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Net Efficiency</div>
                          <div className="text-4xl font-black text-emerald-600 tracking-tighter">+{stats.margin.toFixed(1)}%</div>
                          <div className="mt-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Above Nominal Baseline</div>
                      </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Clock size={120} /></div>
                      <div className="relative z-10">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Exposure Lock</div>
                          <div className="text-4xl font-black text-orange-600 tracking-tighter">£{(stats.pendingAmount / 1000).toFixed(0)}k</div>
                          <div className="mt-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Awaiting Forensic Audit</div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Predictive Cashflow Matrix */}
                  <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-[3rem] p-12 shadow-sm flex flex-col relative overflow-hidden group/chart">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/chart:opacity-10 transition-all duration-1000 group-hover/chart:rotate-12"><Activity size={200} /></div>
                      
                      <div className="flex justify-between items-start mb-12 relative z-10">
                          <div>
                              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Cashflow Simulation</h3>
                              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Predictive AI Variance Node</p>
                          </div>
                          <button 
                            onClick={handleSimulateCashflow}
                            disabled={isSimulating}
                            className="bg-midnight text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                          >
                              {isSimulating ? <Loader2 size={18} className="animate-spin text-primary" /> : <Brain size={18} className="text-yellow-400 fill-current" />}
                              Commit Neural Simulation
                          </button>
                      </div>

                      <div className="flex-1 relative min-h-[350px] w-full flex items-end gap-3 px-10 pb-10 border-b border-l border-zinc-100">
                          {(simulationResult?.forecast || [65, 74, 68, 82, 78, 95, 88, 72, 85, 90, 82, 88]).map((h: number, i: number) => (
                              <div key={i} className="flex-1 flex flex-col justify-end h-full gap-2 group cursor-pointer">
                                  <div 
                                    className="w-full bg-primary rounded-xl opacity-80 group-hover:opacity-100 transition-all relative shadow-lg group-hover:shadow-primary/20 group-hover:-translate-y-2" 
                                    style={{ height: `${h}%` }}
                                  >
                                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap shadow-2xl border border-white/10 z-10">
                                          PULSE: £{h}00k
                                      </div>
                                  </div>
                                  <div className="text-[8px] font-black text-zinc-400 uppercase text-center mt-2 group-hover:text-primary transition-colors">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Portfolio Risk Panel */}
                  <div className="lg:col-span-4 space-y-10">
                      <div className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group/risk h-full flex flex-col">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/risk:scale-110 transition-transform duration-1000"><Target size={120} /></div>
                          <div className="relative z-10 space-y-10 flex-1">
                              <div>
                                  <h3 className="text-2xl font-black uppercase tracking-tighter">Optimization Logic</h3>
                                  <p className="text-primary text-[9px] font-black uppercase tracking-[0.3em] mt-2">AI Reasoning Inferred</p>
                              </div>

                              <div className="space-y-6">
                                  {(simulationResult?.optimizations || [
                                      { title: 'Material Bulk Hedging', impact: 'High' },
                                      { title: 'Labor Logic Alignment', impact: 'Medium' },
                                      { title: 'Liquidity Sharding', impact: 'Low' }
                                  ]).map((opt: any, i: number) => (
                                      <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all cursor-default group/opt">
                                          <div className="flex justify-between items-center mb-2">
                                              <span className="font-black text-xs uppercase tracking-tight group-hover/opt:text-primary transition-colors">{opt.title}</span>
                                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${opt.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{opt.impact}</span>
                                          </div>
                                          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium italic">"Implementing this strategy addresses active budget variance in Sector 4."</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <button className="mt-10 w-full py-5 bg-white text-zinc-900 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary hover:text-white transition-all active:scale-95">
                              Inject Logic Changes
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <ProjectActionModals 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  );
};

export default FinancialsView;
