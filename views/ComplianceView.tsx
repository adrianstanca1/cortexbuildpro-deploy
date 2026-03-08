
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, AlertTriangle, Check, X, FileText, PieChart, 
  Sparkles, Loader2, RefreshCw, Scale, BookOpen, 
  ShieldAlert, Info, Download, ArrowRight, Gavel,
  History, Search, CheckCircle2, ChevronRight, Activity,
  // Added missing icon imports
  Building, ChevronDown, CheckCircle, Shield, Tag, Save, BrainCircuit
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface ChecklistItem {
    id: string;
    text: string;
    status: 'PASS' | 'FAIL' | 'PENDING';
    category: string;
}

interface AuditReport {
    summary: string;
    score: number;
    conflicts: {
        regulation: string;
        description: string;
        severity: 'High' | 'Medium' | 'Low';
        remediation: string;
    }[];
    safetyGaps: string[];
    timestamp: string;
}

const ComplianceView: React.FC = () => {
  const { projects, tasks, safetyIncidents, setAiProcessing } = useProjects();
  const { user } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');

  const [items, setItems] = useState<ChecklistItem[]>([
      { id: '1', text: 'Site perimeter fencing secure and signed', status: 'PASS', category: 'Site Safety' },
      { id: '2', text: 'PPE requirements posted at all entrances', status: 'PASS', category: 'Site Safety' },
      { id: '3', text: 'Fire extinguishers inspected (monthly tag)', status: 'PENDING', category: 'Fire Safety' },
      { id: '4', text: 'Electrical panels locked and labeled', status: 'FAIL', category: 'Electrical' },
      { id: '5', text: 'Scaffolding tagged by competent person', status: 'PENDING', category: 'Working at Height' },
      { id: '6', text: 'First aid kit stocked and accessible', status: 'PASS', category: 'Health' },
  ]);

  const currentProject = projects.find(p => p.id === activeProjectId);

  const runAIAudit = async () => {
    if (!currentProject) return;
    
    setIsAuditing(true);
    setAiProcessing(true);
    try {
        const projectTasks = tasks.filter(t => t.projectId === currentProject.id);
        const incidents = safetyIncidents.filter(i => i.projectId === currentProject.id);
        
        const context = {
            project: {
                name: currentProject.name,
                type: currentProject.type,
                location: currentProject.location,
                description: currentProject.description
            },
            checklist: items.map(i => ({ task: i.text, status: i.status })),
            activeTasks: projectTasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })),
            incidents: incidents.map(i => ({ title: i.title, severity: i.severity, status: i.status }))
        };

        const prompt = `
            Act as a Senior Health & Safety (HSE) Compliance Auditor for a large-scale construction firm.
            
            PROJECT CONTEXT:
            ${JSON.stringify(context)}
            
            TASK: 
            1. Analyze the project data against local construction regulations (e.g. UK HSE, OSHA, or relevant local building codes based on location).
            2. Identify any potential conflicts, missing safety protocols, or regulatory breaches.
            3. Evaluate the risk level of the current operations.
            
            OUTPUT FORMAT (JSON):
            {
                "summary": "High-level executive overview of the compliance posture.",
                "score": number (0-100),
                "conflicts": [
                    { 
                        "regulation": "Specific code or standard name", 
                        "description": "How the current project conflicts with this", 
                        "severity": "High"|"Medium"|"Low", 
                        "remediation": "Corrective action required" 
                    }
                ],
                "safetyGaps": ["List of missing safety documentation or field protocols"],
                "timestamp": "ISO timestamp"
            }
        `;

        const response = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 4096 }
        });

        const report = parseAIJSON(response);
        setAuditReport(report);
    } catch (error) {
        console.error("Compliance audit failed:", error);
    } finally {
        setIsAuditing(false);
        setAiProcessing(false);
    }
  };

  const toggleStatus = (id: string, status: 'PASS' | 'FAIL' | 'PENDING') => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const passCount = items.filter(i => i.status === 'PASS').length;
  const failCount = items.filter(i => i.status === 'FAIL').length;
  const total = items.length;
  const manualScore = Math.round((passCount / total) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-1 flex items-center gap-3 tracking-tighter uppercase leading-none">
                <ShieldCheck className="text-primary" size={32} /> Compliance Dashboard
            </h1>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-2">Digital safety inspections and automated regulatory oversight.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="relative">
                <select 
                    value={activeProjectId} 
                    onChange={e => setActiveProjectId(e.target.value)}
                    className="appearance-none pl-10 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
                >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"><Building size={16} /></div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"><ChevronDown size={14} /></div>
            </div>
            
            <button 
                onClick={runAIAudit}
                disabled={isAuditing || !currentProject}
                className="px-8 py-3.5 bg-midnight text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 group"
            >
                {isAuditing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-yellow-400 group-hover:scale-110 transition-transform" />}
                {isAuditing ? 'Auditing Logic...' : 'Run AI Regulatory Scan'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Manual Checks */}
          <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><CheckCircle size={150} /></div>
                  <div className="relative w-44 h-44 mb-6">
                      <svg className="w-full h-full -rotate-90">
                          <circle cx="88" cy="88" r="75" fill="none" stroke="#f4f4f5" strokeWidth="16" />
                          <circle 
                            cx="88" cy="88" r="75" 
                            fill="none" 
                            stroke={manualScore > 80 ? '#22c55e' : manualScore > 50 ? '#f59e0b' : '#ef4444'} 
                            strokeWidth="16" 
                            strokeDasharray="471" 
                            strokeDashoffset={471 - (471 * manualScore) / 100} 
                            strokeLinecap="round"
                            className="transition-all duration-[2000ms] ease-out"
                          />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-zinc-900 tracking-tighter">{manualScore}%</span>
                          <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Manual Node</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 w-full border-t border-zinc-100 pt-6">
                      <div className="space-y-1">
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Pass Nodes</div>
                          <div className="text-xl font-black text-green-600">{passCount}</div>
                      </div>
                      <div className="space-y-1">
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Fail Nodes</div>
                          <div className="text-xl font-black text-red-600">{failCount}</div>
                      </div>
                  </div>
              </div>

              <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Shield size={80} /></div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Activity size={12} className="text-green-400" /> Sentinel Feed
                  </h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Next Scheduled Audit</span>
                          <span className="font-bold">Mon, 18 Nov</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Total Inspections YTD</span>
                          <span className="font-bold">428</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Open Hazard Nodes</span>
                          <span className="font-bold text-orange-400">{safetyIncidents.filter(i => i.status === 'Open').length}</span>
                      </div>
                  </div>
                  <button className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">View All Activity Logs</button>
              </div>
          </div>

          {/* Center Column: Interactive Checklist */}
          <div className="lg:col-span-8 space-y-8">
              {auditReport ? (
                <div className="bg-white border border-zinc-200 rounded-[3rem] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                    <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-blue-900/20">
                                <Scale size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">AI Regulatory Audit Result</h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Sparkles size={12} className="text-primary" /> Multi-Layered Compliance Scan • {new Date(auditReport.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className={`text-4xl font-black tracking-tighter ${auditReport.score > 80 ? 'text-green-600' : auditReport.score > 50 ? 'text-orange-600' : 'text-red-600'}`}>
                                {auditReport.score}%
                            </div>
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Inference Score</span>
                        </div>
                    </div>

                    <div className="p-10 space-y-12">
                        <div className="p-8 bg-zinc-950 rounded-[2.5rem] text-white relative overflow-hidden group/abstract">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/abstract:scale-110 transition-transform"><BookOpen size={100} /></div>
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Info size={14} /> Executive Abstract
                                </h3>
                                <p className="text-lg text-zinc-200 leading-relaxed font-medium italic">"{auditReport.summary}"</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <Gavel size={14} className="text-primary" /> Regulatory Conflicts & Compliance Gaps
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {auditReport.conflicts.map((conflict, i) => (
                                    <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-8 space-y-4 hover:border-primary hover:bg-white transition-all group relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${conflict.severity === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : conflict.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-black bg-white border border-zinc-200 px-3 py-1 rounded-lg text-zinc-600 uppercase tracking-widest shadow-sm">{conflict.regulation}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                conflict.severity === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-zinc-100 text-zinc-500'
                                            }`}>{conflict.severity} Impact</span>
                                        </div>
                                        <h4 className="font-black text-zinc-900 uppercase tracking-tight text-lg group-hover:text-primary transition-colors leading-tight">{conflict.description}</h4>
                                        <div className="pt-4 border-t border-zinc-200">
                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <CheckCircle2 size={12} className="text-green-500" /> Resolution Protocol
                                            </div>
                                            <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">"{conflict.remediation}"</p>
                                        </div>
                                    </div>
                                ))}
                                {auditReport.safetyGaps.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8 col-span-1 md:col-span-2 shadow-inner">
                                        <h4 className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <ShieldAlert size={16} /> Site Safety Logic Gaps
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                                            {auditReport.safetyGaps.map((gap, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-orange-900 group cursor-default">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 group-hover:scale-150 transition-transform" />
                                                    {gap}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-10 border-t bg-zinc-50 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setAuditReport(null)}
                                className="px-8 py-4 bg-zinc-200 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-300 transition-all active:scale-95"
                            >
                                Clear Audit Hub
                            </button>
                        </div>
                        <button className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95">
                            <Download size={18} /> Export Technical Ledger
                        </button>
                    </div>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm flex flex-col">
                    <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Active Compliance Checklist</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Manual field verification node</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-3 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"><History size={18} /></button>
                            <button className="p-3 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"><Search size={18} /></button>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-zinc-50">
                        {items.map(item => (
                            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-all group">
                                <div className="flex items-start gap-5">
                                    <div className={`mt-1 p-3 rounded-2xl border-2 transition-all ${
                                        item.status === 'FAIL' ? 'bg-red-50 text-red-600 border-red-100 shadow-lg shadow-red-900/10' : 
                                        item.status === 'PASS' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        'bg-zinc-50 text-zinc-300 border-zinc-100'
                                    }`}>
                                        {item.status === 'FAIL' ? <AlertTriangle size={24} /> : item.status === 'PASS' ? <Check size={24} strokeWidth={3} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-zinc-900 uppercase tracking-tight group-hover:text-primary transition-colors">{item.text}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                            <Tag size={10} /> Sector: {item.category}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleStatus(item.id, 'PASS')}
                                        className={`w-14 h-14 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center border-2 ${item.status === 'PASS' ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-900/20' : 'bg-white border-zinc-200 text-zinc-400 hover:border-green-500 hover:text-green-500'}`}
                                    >
                                        PASS
                                    </button>
                                    <button 
                                        onClick={() => toggleStatus(item.id, 'FAIL')}
                                        className={`w-14 h-14 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center border-2 ${item.status === 'FAIL' ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-900/20 animate-pulse' : 'bg-white border-zinc-200 text-zinc-400 hover:border-red-500 hover:text-red-500'}`}
                                    >
                                        FAIL
                                    </button>
                                    <button 
                                        onClick={() => toggleStatus(item.id, 'PENDING')}
                                        className={`w-14 h-14 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center border-2 ${item.status === 'PENDING' ? 'bg-zinc-400 border-zinc-400 text-white shadow-xl' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-500 hover:text-zinc-500'}`}
                                    >
                                        N/A
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-10 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-4">
                        <button className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95">
                            <Save size={18} /> Commit Verification Hub
                        </button>
                    </div>
                </div>
              )}
          </div>
      </div>

      {isAuditing && (
          <div className="fixed inset-0 z-[1000] bg-midnight/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
              <div className="relative mb-16">
                  <div className="w-48 h-48 border-[8px] border-white/5 border-t-primary rounded-full animate-spin" />
                  <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse shadow-[0_0_50px_rgba(14,165,233,0.5)]" size={72} />
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse-slow" />
              </div>
              <h3 className="text-6xl font-black text-white tracking-tighter uppercase mb-4">Gemini Regulatory Probe</h3>
              <p className="text-zinc-500 font-bold uppercase text-lg tracking-[0.5em] mb-12 animate-pulse">Reconciling field telemetry with global compliance nodes</p>
              
              <div className="w-full max-w-xl bg-black border border-white/10 p-10 rounded-[3rem] shadow-inner text-left font-mono text-[11px] text-zinc-400 uppercase h-64 overflow-y-auto custom-scrollbar ring-1 ring-white/5">
                <div className="flex gap-4 mb-3 animate-in slide-in-from-left duration-500"><span className="text-primary font-black shrink-0">»</span> Scanning sector regulatory lattice...</div>
                <div className="flex gap-4 mb-3 animate-in slide-in-from-left duration-700 delay-200"><span className="text-primary font-black shrink-0">»</span> Auditing active mission task chain...</div>
                <div className="flex gap-4 mb-3 animate-in slide-in-from-left duration-1000 delay-500"><span className="text-primary font-black shrink-0">»</span> Mapping site incidents to HSE 2025 directives...</div>
                <div className="flex gap-4 mb-3 animate-in slide-in-from-left duration-1000 delay-800 animate-pulse"><span className="text-primary font-black shrink-0">»</span> Synthesizing forensic report node...</div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ComplianceView;
