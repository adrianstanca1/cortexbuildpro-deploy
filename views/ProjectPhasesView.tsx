import React, { useState, useMemo } from 'react';
import { 
    Layers, Calendar, Clock, CheckCircle2, AlertCircle, CircleDashed, 
    ChevronRight, Activity, Maximize, Sparkles, Plus, X, ShieldCheck, 
    Zap, Loader2, BrainCircuit, Info, Trash2, Edit3, Save, Target,
    ScanLine, ArrowRight, ListTodo, PlusSquare, ChevronDown, ChevronUp,
    Square, CheckSquare
} from 'lucide-react';
import { ProjectPhase, Project, SubTask } from '../types';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface ProjectPhasesViewProps {
  project: Project;
  phases: ProjectPhase[];
  onUpdate: (updates: Partial<Project>) => void;
}

const ProjectPhasesView: React.FC<ProjectPhasesViewProps> = ({ project, phases, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});
  
  const [newPhase, setNewPhase] = useState<Partial<ProjectPhase>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Upcoming',
    progress: 0,
    subtasks: []
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)]';
      case 'Delayed': return 'bg-red-50 text-red-700 border-red-100 animate-pulse';
      case 'Upcoming': return 'bg-zinc-50 text-zinc-500 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete': return <CheckCircle2 size={14} />;
      case 'In Progress': return <CircleDashed size={14} className="animate-spin" />;
      case 'Delayed': return <AlertCircle size={14} />;
      case 'Upcoming': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const calculatePhaseProgress = (subtasks?: SubTask[]) => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completedCount = subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  };

  const handleAddPhase = () => {
    if (!newPhase.name) return;
    const phase: ProjectPhase = {
        id: `ph-${Date.now()}`,
        name: newPhase.name!,
        startDate: newPhase.startDate!,
        endDate: newPhase.endDate!,
        status: newPhase.status as any || 'Upcoming',
        progress: newPhase.progress || 0,
        subtasks: []
    };
    onUpdate({ phases: [...(phases || []), phase] });
    setShowAddModal(false);
    setNewPhase({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'Upcoming',
        progress: 0,
        subtasks: []
    });
  };

  const handleRemovePhase = (id: string) => {
      if (window.confirm("Purge this phase node from the project roadmap?")) {
          onUpdate({ phases: phases.filter(p => p.id !== id) });
      }
  };

  const handleToggleSubtask = (phaseId: string, subtaskId: string) => {
    const updatedPhases = phases.map(p => {
        if (p.id === phaseId) {
            const updatedSubtasks = p.subtasks?.map(st => 
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            const progress = calculatePhaseProgress(updatedSubtasks);
            const status = progress === 100 ? 'Complete' : (progress > 0 ? 'In Progress' : p.status);
            return { ...p, subtasks: updatedSubtasks, progress, status: status as any };
        }
        return p;
    });
    onUpdate({ phases: updatedPhases });
  };

  const handleAddSubtask = (phaseId: string) => {
    const title = newSubtaskTitles[phaseId];
    if (!title?.trim()) return;

    const updatedPhases = phases.map(p => {
        if (p.id === phaseId) {
            const newSub: SubTask = { id: `st-${Date.now()}`, title: title.trim(), completed: false };
            const updatedSubtasks = [...(p.subtasks || []), newSub];
            const progress = calculatePhaseProgress(updatedSubtasks);
            return { ...p, subtasks: updatedSubtasks, progress };
        }
        return p;
    });

    onUpdate({ phases: updatedPhases });
    setNewSubtaskTitles(prev => ({ ...prev, [phaseId]: '' }));
  };

  const handleSynthesizeRoadmap = async () => {
      setIsSynthesizing(true);
      try {
          const prompt = `
            Act as an Expert Project Scheduler. 
            Project Technical Narrative: "${project.description}"
            Project Sector: "${project.type}"
            Project Start: "${project.startDate}"
            
            Synthesize a professional 5-phase construction roadmap.
            For each phase, also suggest 3 high-level sub-tasks.
            Return ONLY a valid JSON array:
            [
                { 
                  "name": "Phase Name", 
                  "startDate": "YYYY-MM-DD", 
                  "endDate": "YYYY-MM-DD", 
                  "status": "Upcoming", 
                  "progress": 0,
                  "subtasks": [
                    { "title": "Subtask 1" },
                    { "title": "Subtask 2" },
                    { "title": "Subtask 3" }
                  ]
                }
            ]
            Ensure dates are logical and sequential starting from project genesis.
          `;
          
          const result = await runRawPrompt(prompt, { 
              model: 'gemini-3-pro-preview', 
              responseMimeType: 'application/json',
              temperature: 0.4 
          });
          
          const newPhases = parseAIJSON(result);
          const mappedPhases: ProjectPhase[] = newPhases.map((p: any, i: number) => ({
              ...p,
              id: `ph-ai-${Date.now()}-${i}`,
              subtasks: p.subtasks?.map((st: any, j: number) => ({
                id: `st-ai-${Date.now()}-${i}-${j}`,
                title: st.title,
                completed: false
              })) || []
          }));
          
          onUpdate({ phases: [...(phases || []), ...mappedPhases] });
      } catch (e) {
          console.error("Roadmap synthesis failed", e);
      } finally {
          setIsSynthesizing(false);
      }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-full overflow-x-hidden pb-32">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div className="space-y-4">
            <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-5 leading-none">
                <Layers className="text-primary" size={40} /> Project Phases
            </h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                <Activity size={14} className="text-primary animate-pulse" /> Temporal Sequence Orchestration
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <button 
                onClick={handleSynthesizeRoadmap}
                disabled={isSynthesizing}
                className="bg-midnight text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
            >
                {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400 group-hover:rotate-12 transition-transform" />}
                Synthesize Roadmap
            </button>
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Initialize Phase Node
            </button>
        </div>
      </div>

      {phases && phases.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group/timeline animate-in slide-in-from-top-4 duration-700">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/timeline:opacity-5 transition-opacity"><Clock size={200} /></div>
              <div className="flex justify-between items-center mb-12 relative z-10 px-4">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <ScanLine size={14} className="text-primary" /> Temporal Pulse
                  </div>
                  <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Complete
                      </span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#0ea5e9] animate-pulse" /> Active Node
                      </span>
                  </div>
              </div>

              <div className="relative h-20 w-full flex items-center px-10">
                  <div className="absolute left-10 right-10 h-1 bg-zinc-100 rounded-full" />
                  <div className="relative w-full flex justify-between">
                      {phases.map((p, i) => (
                          <div key={p.id} className="relative flex flex-col items-center group/node">
                              <div className={`w-8 h-8 rounded-xl border-4 border-white shadow-xl z-10 transition-all duration-500 ${
                                  p.status === 'Complete' ? 'bg-emerald-500 scale-110' : 
                                  p.status === 'In Progress' ? 'bg-primary scale-125 shadow-primary/30 ring-8 ring-primary/5' : 
                                  'bg-zinc-200'
                              }`} />
                              <div className="absolute top-10 whitespace-nowrap text-center">
                                  <div className={`text-[10px] font-black uppercase tracking-tight transition-colors ${p.status === 'In Progress' ? 'text-primary' : 'text-zinc-500'}`}>{p.name}</div>
                                  <div className="text-[8px] font-bold text-zinc-300 uppercase mt-1">{p.startDate}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm relative z-10 animate-in slide-in-from-bottom-4 duration-1000">
        <div className="p-8 border-b bg-zinc-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Target size={14} className="text-primary" /> Roadmap Shard Registry
            </h3>
            <span className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full border border-zinc-200">{phases?.length || 0} DEFINED NODES</span>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6 w-16"></th>
              <th className="px-10 py-6">Phase Name</th>
              <th className="px-10 py-6">Start Date</th>
              <th className="px-10 py-6">End Date</th>
              <th className="px-10 py-6">Alignment</th>
              <th className="px-10 py-6">Status</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {phases && phases.length > 0 ? phases.map((phase) => {
              const subCount = phase.subtasks?.length || 0;
              const displayProgress = phase.subtasks && phase.subtasks.length > 0 
                ? calculatePhaseProgress(phase.subtasks)
                : (phase.progress !== undefined ? phase.progress : (phase.status === 'Complete' ? 100 : phase.status === 'Upcoming' ? 0 : 45));

              const isExpanded = expandedPhaseId === phase.id;

              return (
                <React.Fragment key={phase.id}>
                  <tr className={`hover:bg-zinc-50/50 transition-colors group cursor-default ${isExpanded ? 'bg-zinc-50/30' : ''}`}>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                        className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-primary text-white' : 'text-zinc-300 hover:text-primary hover:bg-primary/5'}`}
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner border ${
                            phase.status === 'In Progress' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                        }`}>
                          <Layers size={28} />
                        </div>
                        <div>
                          <div className="font-black text-zinc-900 text-lg uppercase tracking-tight group-hover:text-primary transition-colors">{phase.name}</div>
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span>ID: {phase.id.slice(-8).toUpperCase()}</span>
                            {subCount > 0 && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                    <span>{subCount} Sub-tasks</span>
                                </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-zinc-700 font-black text-xs uppercase tracking-tight">
                          <Calendar size={12} className="text-primary" />
                          {phase.startDate}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                          <ArrowRight size={10} />
                          {phase.endDate}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 w-48">
                          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                              <div 
                                  className={`h-full transition-all duration-1000 ease-out relative ${displayProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                  style={{ width: `${displayProgress}%` }}
                              >
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse-slow" />
                              </div>
                          </div>
                          <span className="text-[11px] font-black text-zinc-400 w-10 text-right">
                              {displayProgress}%
                          </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border flex items-center gap-2.5 w-fit ${getStatusStyle(phase.status)}`}>
                        {getStatusIcon(phase.status)}
                        {phase.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-2">
                          <button className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-90" title="Edit Logic">
                              <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleRemovePhase(phase.id)} className="p-3 bg-zinc-100 text-zinc-400 hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-90" title="Purge Node">
                              <Trash2 size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expandable Sub-task Registry */}
                  {isExpanded && (
                      <tr className="bg-zinc-50/20 animate-in slide-in-from-top-2 duration-300">
                          <td colSpan={7} className="px-10 py-10">
                              <div className="max-w-4xl mx-auto space-y-8">
                                  <div className="flex justify-between items-end border-b border-zinc-100 pb-4">
                                      <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                          <ListTodo size={18} className="text-primary" /> Sub-Task Registry Shard
                                      </h4>
                                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                          {phase.subtasks?.filter(s => s.completed).length || 0} / {phase.subtasks?.length || 0} Synced
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      {phase.subtasks && phase.subtasks.length > 0 ? (
                                          phase.subtasks.map((st) => (
                                              <div key={st.id} className="bg-white border border-zinc-200 rounded-[1.75rem] p-4 flex flex-col gap-3 group/st hover:border-primary/40 hover:shadow-xl transition-all h-full">
                                                  <div className="flex items-center justify-between gap-4">
                                                      <div className="flex items-center gap-4 flex-1">
                                                          <button 
                                                            onClick={() => handleToggleSubtask(phase.id, st.id)}
                                                            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-inner' : 'bg-zinc-50 border-zinc-100 text-zinc-300 group-hover/st:border-primary/30'}`}
                                                          >
                                                              {st.completed ? <CheckCircle2 size={20} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-zinc-200" />}
                                                          </button>
                                                          <span className={`text-sm font-black uppercase tracking-tight transition-all ${st.completed ? 'text-zinc-300 line-through' : 'text-zinc-800'}`}>
                                                              {st.title}
                                                          </span>
                                                      </div>
                                                      <div className="flex gap-2 opacity-0 group-hover/st:opacity-100 transition-opacity">
                                                          <button className="p-2 text-zinc-300 hover:text-primary transition-colors"><Edit3 size={16}/></button>
                                                          <button className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="px-14">
                                                      <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100/50 shadow-inner">
                                                          <div 
                                                            className={`h-full transition-all duration-1000 ease-out relative ${st.completed ? 'bg-emerald-50 shadow-[0_0_8px_#10b981]' : 'bg-zinc-100'}`} 
                                                            style={{ width: st.completed ? '100%' : '0%' }}
                                                          >
                                                              {st.completed && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />}
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))
                                      ) : (
                                          <div className="py-12 text-center border-2 border-dashed border-zinc-200 rounded-[2rem] bg-zinc-50/50 flex flex-col items-center gap-4">
                                              <CircleDashed size={32} className="text-zinc-200 opacity-20" />
                                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">Registry Empty. Append a logic node to begin tracking.</p>
                                          </div>
                                      )}
                                      
                                      <div className="pt-6 flex gap-4">
                                          <div className="relative flex-1 group">
                                              <PlusSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
                                              <input 
                                                className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase tracking-tight shadow-sm"
                                                placeholder="Define new sub-milestone node..."
                                                value={newSubtaskTitles[phase.id] || ''}
                                                onChange={e => setNewSubtaskTitles(prev => ({ ...prev, [phase.id]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && handleAddSubtask(phase.id)}
                                              />
                                          </div>
                                          <button 
                                            onClick={() => handleAddSubtask(phase.id)}
                                            disabled={!newSubtaskTitles[phase.id]?.trim()}
                                            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary transition-all disabled:opacity-30 active:scale-95 flex items-center gap-3"
                                          >
                                              <Plus size={16} /> Append Node
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </td>
                      </tr>
                  )}
                </React.Fragment>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-10 py-32 text-center">
                  <div className="flex flex-col items-center gap-6 text-zinc-300">
                    <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-zinc-200">
                        <Layers size={48} className="opacity-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500">Temporal Registry Empty</p>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Initialize a roadmap to synchronize project execution.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col">
                  <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 shrink-0 flex justify-between items-center">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-blue-900/20">
                              <Plus size={32} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Initialize Phase</h3>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Append a new roadmap shard.</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-3 bg-white border border-zinc-100 hover:bg-red-50 hover:text-red-500 text-zinc-400 rounded-full transition-all shadow-sm"><X size={24} /></button>
                  </div>

                  <div className="p-10 space-y-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Phase Identifier</label>
                          <input 
                            className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-base font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase tracking-tight" 
                            placeholder="e.g. Structural Assembly" 
                            value={newPhase.name} 
                            onChange={e => setNewPhase({...newPhase, name: e.target.value})} 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Genesis Date</label>
                              <input 
                                type="date"
                                className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" 
                                value={newPhase.startDate} 
                                onChange={e => setNewPhase({...newPhase, startDate: e.target.value})} 
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Settlement Target</label>
                              <input 
                                type="date"
                                className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" 
                                value={newPhase.endDate} 
                                onChange={e => setNewPhase({...newPhase, endDate: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Deployment State</label>
                            <select 
                                className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer" 
                                value={newPhase.status} 
                                onChange={e => setNewPhase({...newPhase, status: e.target.value as any})}
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Complete">Complete</option>
                                <option value="Delayed">Delayed</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Initial Alignment (%)</label>
                            <input 
                                type="number"
                                className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none" 
                                value={newPhase.progress} 
                                onChange={e => setNewPhase({...newPhase, progress: parseInt(e.target.value)})} 
                            />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-start gap-4">
                          <Info size={24} className="text-blue-500 shrink-0" />
                          <p className="text-[10px] text-blue-700 leading-relaxed font-bold uppercase tracking-widest">Shard changes propagate to global project telemetry and schedule lattices immediately.</p>
                      </div>

                      <button 
                        onClick={handleAddPhase}
                        disabled={!newPhase.name}
                        className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4"
                      >
                          <ShieldCheck size={20} className="text-emerald-500" /> Commit Phase Registry
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProjectPhasesView;
