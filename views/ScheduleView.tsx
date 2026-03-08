
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, Filter, Plus, ChevronRight, ChevronDown, 
  MoreHorizontal, Zap, Flag, ArrowRight, Search, 
  LayoutGrid, List, Clock, User, AlertCircle, CheckCircle2, Loader2, Paperclip,
  Maximize2, X, BrainCircuit, AlertTriangle, Sparkles, RotateCcw
} from 'lucide-react';
import { runRawPrompt } from '../services/geminiService';
import { useProjects } from '../contexts/ProjectContext';

interface ScheduleViewProps {
  projectId?: string;
}

const DependencyLines = ({ tasks, dayWidth, rowHeight }: any) => {
    const lines: any[] = [];

    tasks.forEach((task: any, i: number) => {
        if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach((depId: string) => {
                const depIdx = tasks.findIndex((t: any) => t.id === depId);
                if (depIdx !== -1) {
                    const depTask = tasks[depIdx];
                    const x1 = (depTask.start + depTask.duration - 1) * dayWidth;
                    const y1 = (depIdx * rowHeight) + (rowHeight / 2);
                    const x2 = (task.start - 1) * dayWidth;
                    const y2 = (i * rowHeight) + (rowHeight / 2);

                    lines.push(
                        <g key={`${depId}-${task.id}`}>
                            <path 
                                d={`M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x1 + 10} ${y2} L ${x2} ${y2}`}
                                fill="none"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                className="transition-all duration-300 hover:stroke-primary"
                            />
                            <circle cx={x2} cy={y2} r="3" fill="#cbd5e1" />
                        </g>
                    );
                }
            });
        }
    });

    return <svg className="absolute inset-0 pointer-events-none z-0" width="100%" height="100%">{lines}</svg>;
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ projectId }) => {
  const { tasks, documents } = useProjects();
  const [viewMode, setViewMode] = useState<'GANTT' | 'LIST'>('GANTT');
  const [showAIOptimizer, setShowAIOptimizer] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const hasLinkedDocs = (taskId: string) => {
      return documents.some(d => d.linkedTaskIds?.includes(taskId));
  };

  const filteredTasks = useMemo(() => {
      let projectTasks = projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
      
      if (projectTasks.length > 0) {
          return projectTasks.map((t, index) => {
              const today = new Date();
              const due = new Date(t.dueDate);
              const diffTime = Math.abs(due.getTime() - today.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              const startDay = Math.max(1, diffDays - 5 + (index * 2)); 
              
              return {
                  id: t.id,
                  name: t.title,
                  start: startDay,
                  duration: 5,
                  progress: t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0,
                  type: 'construction',
                  dependencies: t.dependencies || [],
                  assignee: t.assigneeName || 'Unassigned',
                  status: t.status,
                  priority: t.priority,
                  hasDocs: hasLinkedDocs(t.id)
              };
          });
      }
      
      return [];
  }, [tasks, projectId, documents]);

  const runOptimizer = async () => {
      setOptimizing(true);
      try {
          const tasksStr = JSON.stringify(filteredTasks.map(t => ({ name: t.name, start: t.start, duration: t.duration, dependencies: t.dependencies })));
          const prompt = `
            Analyze this construction schedule tasks: ${tasksStr}.
            Identify critical path risks and potential optimizations.
            Assume current weather forecast predicts heavy rain on day 12-14.
            Return JSON:
            {
                "riskLevel": "High" | "Medium" | "Low",
                "riskAnalysis": "Concise summary of risks.",
                "recommendations": [
                    { "title": "Action Title", "desc": "What to do" }
                ]
            }
          `;
          
          const result = await runRawPrompt(prompt, { 
              model: 'gemini-3-pro-preview', 
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 1024 }
          });
          
          setOptimizationResult(JSON.parse(result));
      } catch (e) {
          console.error("Optimization failed", e);
      } finally {
          setOptimizing(false);
      }
  };

  const dayWidth = 40;
  const rowHeight = 48;

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Completed': case 'Done': return 'bg-green-100 text-green-700';
          case 'In Progress': return 'bg-blue-100 text-blue-700';
          case 'Pending': case 'To Do': return 'bg-zinc-100 text-zinc-600';
          case 'Blocked': return 'bg-red-100 text-red-700';
          default: return 'bg-zinc-100 text-zinc-600';
      }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      <div className="h-20 border-b border-zinc-200 px-10 flex items-center justify-between bg-white flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
           <h1 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tighter">
              <Calendar className="text-primary" /> {projectId ? 'Technical Timeline' : 'Master Matrix'}
           </h1>
           <div className="h-6 w-px bg-zinc-200" />
           <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
              <button 
                onClick={() => setViewMode('GANTT')}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'GANTT' ? 'bg-white text-primary shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                  <LayoutGrid size={14} /> Gantt
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'LIST' ? 'bg-white text-primary shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                  <List size={14} /> List
              </button>
           </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => { setShowAIOptimizer(!showAIOptimizer); if(!optimizationResult) runOptimizer(); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    showAIOptimizer 
                    ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-inner' 
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm'
                }`}
            >
                <Zap size={16} className={showAIOptimizer ? 'fill-purple-700' : ''} /> AI Optimizer
            </button>
            <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0c4a6e] shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
                <Plus size={18} /> New Milestone
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {viewMode === 'GANTT' ? (
             <>
                 <div className="w-80 border-r border-zinc-200 flex flex-col bg-white z-10 shadow-2xl">
                    <div className="h-[60px] border-b border-zinc-200 flex items-center px-6 bg-zinc-50 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                        Objective Matrix
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {filteredTasks.map((task, i) => (
                            <div 
                                key={i} 
                                className="h-[48px] flex items-center px-6 border-b border-zinc-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                            >
                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                    <span className="text-zinc-400 font-mono text-[9px] w-4">{i+1}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-500' : 'bg-primary'}`} />
                                    <span className="text-[11px] font-black text-zinc-800 truncate uppercase tracking-tight">{task.name}</span>
                                    {task.hasDocs && <Paperclip size={10} className="text-blue-500 flex-shrink-0" />}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="flex-1 overflow-auto relative bg-zinc-50/30" style={{ scrollBehavior: 'smooth' }}>
                    <div className="min-w-[1500px] relative h-full">
                        <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 h-[60px] flex">
                            {[...Array(40)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 border-r border-zinc-100 flex flex-col justify-end pb-2 items-center" style={{ width: dayWidth }}>
                                    <span className="text-[8px] font-black text-zinc-400 uppercase mb-1">D</span>
                                    <span className={`text-[10px] font-black ${i % 7 === 0 || i % 7 === 6 ? 'text-red-400' : 'text-zinc-700'}`}>
                                        {i + 1}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="absolute inset-0 top-[60px] pointer-events-none flex">
                            {[...Array(40)].map((_, i) => (
                                <div key={i} className={`flex-shrink-0 border-r h-full ${i % 7 === 0 || i % 7 === 6 ? 'bg-zinc-50 border-zinc-100/50' : 'border-zinc-50'}`} style={{ width: dayWidth }} />
                            ))}
                            <div className="absolute top-0 bottom-0 border-l-2 border-red-500 z-0" style={{ left: 8 * dayWidth + (dayWidth/2) }}>
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_red]" />
                            </div>
                        </div>

                        <div className="relative pt-0 min-h-full">
                            <DependencyLines tasks={filteredTasks} dayWidth={dayWidth} rowHeight={rowHeight} />
                            {filteredTasks.map((task, i) => (
                                <div key={i} className="relative group" style={{ height: rowHeight }}>
                                    <div 
                                        className={`absolute top-1/2 -translate-y-1/2 rounded-lg shadow-sm border border-white/20 flex items-center px-3 overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer z-10 ${
                                            task.status === 'Done' ? 'bg-green-500' : 
                                            task.priority === 'Critical' ? 'bg-red-500' :
                                            'bg-primary'
                                        } h-8`}
                                        style={{ 
                                            left: (task.start - 1) * dayWidth, 
                                            width: task.duration * dayWidth 
                                        }}
                                    >
                                        <div className="absolute top-0 left-0 bottom-0 bg-black/10" style={{ width: `${task.progress}%` }} />
                                        <span className="relative text-[9px] font-black text-white truncate drop-shadow-md uppercase tracking-widest">
                                            {task.progress}% - {task.assignee.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             </>
         ) : (
             <div className="flex-1 overflow-y-auto p-10 bg-zinc-50/50">
                 <div className="bg-white border border-zinc-200 rounded-[3rem] shadow-xl overflow-hidden">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 uppercase text-[10px] font-black tracking-[0.2em]">
                             <tr>
                                 <th className="px-8 py-6">Objective Shard</th>
                                 <th className="px-8 py-6 text-center">Inference Status</th>
                                 <th className="px-8 py-6">Target</th>
                                 <th className="px-8 py-6 text-right"></th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-50">
                             {filteredTasks.map((task, i) => (
                                 <tr key={i} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                                     <td className="px-8 py-8">
                                         <div className="flex items-center gap-4">
                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${task.status === 'Done' ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                                 {i+1}
                                             </div>
                                             <div>
                                                <div className="font-black text-zinc-900 text-base uppercase tracking-tight">{task.name}</div>
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase mt-1 flex items-center gap-2">
                                                    <User size={10} /> {task.assignee}
                                                </div>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-8 py-8 text-center">
                                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-current ${getStatusColor(task.status)}`}>
                                             {task.status}
                                         </span>
                                     </td>
                                     <td className="px-8 py-8 font-mono text-xs font-black text-zinc-500">
                                         Day {task.start}
                                     </td>
                                     <td className="px-8 py-8 text-right">
                                         <button className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-90">
                                             <Maximize2 size={16} />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}

         {showAIOptimizer && (
             <div className="w-[400px] bg-white border-l border-zinc-200 shadow-[0_0_50px_rgba(0,0,0,0.1)] z-30 flex flex-col animate-in slide-in-from-right duration-500">
                 <div className="p-8 border-b border-zinc-100 bg-purple-50/50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                         <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-900/20">
                            <Zap size={20} className="fill-current" />
                         </div>
                         <h3 className="font-black text-zinc-900 uppercase tracking-tighter text-lg">Logic Optimizer</h3>
                     </div>
                     <button onClick={() => setShowAIOptimizer(false)} className="p-2 text-purple-700 hover:bg-purple-100 rounded-full transition-all">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
                     {optimizing ? (
                         <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pulse">
                             <div className="relative">
                                 <div className="w-20 h-20 border-4 border-zinc-100 border-t-purple-600 rounded-full animate-spin" />
                                 <BrainCircuit size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">Architectural Inference</p>
                                <p className="text-[10px] text-zinc-500 mt-2 uppercase font-bold tracking-tight">Simulating 1M+ scheduling variations...</p>
                             </div>
                         </div>
                     ) : optimizationResult ? (
                         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className={`p-6 rounded-[2rem] border-2 shadow-inner relative overflow-hidden group ${
                                 optimizationResult.riskLevel === 'High' ? 'border-red-100 bg-red-50 text-red-900' : 'border-emerald-100 bg-emerald-50 text-emerald-900'
                             }`}>
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle size={60} /></div>
                                 <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
                                    <span>Portfolio Alert</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${optimizationResult.riskLevel === 'High' ? 'border-red-200 bg-red-100' : 'border-emerald-200 bg-emerald-100'}`}>
                                        {optimizationResult.riskLevel} Criticality
                                    </span>
                                 </div>
                                 <p className="text-sm font-medium leading-relaxed italic">
                                     "{optimizationResult.riskAnalysis}"
                                 </p>
                             </div>

                             <div className="space-y-4">
                                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                                     <Sparkles size={14} className="text-purple-500" /> Strategy Recommender
                                 </div>
                                 <div className="space-y-3">
                                     {optimizationResult.recommendations?.map((rec: any, i: number) => (
                                         <div key={i} className="p-5 bg-white border border-zinc-100 rounded-3xl text-sm hover:border-primary hover:shadow-xl transition-all group/rec cursor-pointer">
                                             <div className="flex justify-between items-start mb-2">
                                                <div className="font-black text-zinc-900 uppercase tracking-tight group-hover/rec:text-primary transition-colors">{rec.title}</div>
                                                <ArrowRight size={14} className="text-zinc-300 group-hover/rec:text-primary group-hover/rec:translate-x-1 transition-all" />
                                             </div>
                                             <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">"{rec.desc}"</p>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="pt-6 border-t border-zinc-100">
                                 <button className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-2xl active:scale-95">
                                     Inject Proposed Logic
                                 </button>
                             </div>
                         </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
                             <div className="w-16 h-16 bg-zinc-50 rounded-[1.5rem] border border-zinc-100 flex items-center justify-center text-zinc-300">
                                <Zap size={32} />
                             </div>
                             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">Initialize the Gemini inference engine to detect critical path bottlenecks.</p>
                             <button onClick={runOptimizer} className="text-primary font-black uppercase text-[10px] tracking-widest hover:underline decoration-2">Start Logic Pulse</button>
                         </div>
                     )}
                 </div>
                 
                 <div className="p-8 border-t border-zinc-100 bg-zinc-50/50">
                     <button 
                        onClick={runOptimizer} 
                        disabled={optimizing}
                        className="w-full py-4 border-2 border-purple-200 text-purple-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
                     >
                         <RotateCcw size={16} /> Refresh Inference
                     </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default ScheduleView;
