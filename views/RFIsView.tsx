import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, Plus, Search, Filter, Clock, 
  ChevronRight, FileText, CheckCircle2, AlertCircle, 
  MoreHorizontal, Calendar, Hash, User, ArrowRight, X, Sparkles, Loader2, Send,
  ShieldCheck, BrainCircuit, Activity, Maximize2, ScanLine, MessageSquare,
  FileCheck, GitMerge, Paperclip
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { RFI, Task } from '../types';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface RFIsViewProps {
  projectId: string;
  onAdd: () => void;
}

const RFIsView: React.FC<RFIsViewProps> = ({ projectId, onAdd }) => {
  const { rfis, updateRFI, teamMembers, projects, tasks } = useProjects();
  const [search, setSearch] = useState('');
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [clientBrief, setClientBrief] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<RFI>>({});

  const projectRFIs = useMemo(() => 
    rfis.filter(r => r.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [rfis, projectId]);

  const filtered = projectRFIs.filter(r => 
    r.subject.toLowerCase().includes(search.toLowerCase()) || 
    r.number.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    const open = projectRFIs.filter(r => r.status === 'Open').length;
    const closed = projectRFIs.filter(r => r.status === 'Closed').length;
    return { open, closed };
  }, [projectRFIs]);

  const openEditModal = (rfi: RFI) => {
      setSelectedRFI(rfi);
      setClientBrief(null);
      setEditState({
          assignedTo: rfi.assignedTo,
          status: rfi.status,
          answer: rfi.answer || ''
      });
  };

  const handleUpdate = async () => {
      if (!selectedRFI) return;
      await updateRFI(selectedRFI.id, editState);
      setSelectedRFI(null);
  };

  const handleSmartAnswer = async () => {
      if (!selectedRFI) return;
      setIsAnswering(true);
      try {
          const project = projects.find(p => p.id === projectId);
          const prompt = `
            Act as a Senior Project Architect for BuildPro.
            Task: Provide a professional, technically accurate, and concise answer to the following construction RFI.
            
            Context:
            Project: "${project?.name || 'Unknown'}"
            Subject: "${selectedRFI.subject}"
            Question: "${selectedRFI.question}"
            
            Requirement: Draft a response that clarifies technical ambiguity and suggests a standard compliance path. Limit to 3 sentences.
          `;
          
          const response = await runRawPrompt(prompt, { 
              model: 'gemini-3-pro-preview', 
              temperature: 0.4,
              thinkingConfig: { thinkingBudget: 32768 }
          });
          
          setEditState(prev => ({ ...prev, answer: response }));
      } catch (e) {
          console.error("AI Answer failure", e);
      } finally {
          setIsAnswering(false);
      }
  };

  const generateClientSummary = async () => {
      if (!selectedRFI) return;
      setIsGeneratingBrief(true);
      try {
          const prompt = `Convert this technical construction RFI into a polished client-facing status update summary. 
                         Subject: "${selectedRFI.subject}". 
                         Question: "${selectedRFI.question}". 
                         Resolution: "${editState.answer || 'Pending assessment'}". 
                         Tone: Informative, reassuring, and non-technical. Max 100 words.`;
          const res = await runRawPrompt(prompt, { model: 'gemini-3-pro-preview' });
          setClientBrief(res);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingBrief(false);
      }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-3 leading-none">
            <HelpCircle className="text-primary" /> Technical Inquiries (RFI)
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-2 uppercase tracking-widest">Formal Requests for Information and Technical Clarifications Registry.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-primary transition-all">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-primary group-hover:text-white transition-all"><Clock size={20} /></div>
             <div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Open Logic Nodes</div>
                <div className="text-2xl font-black text-zinc-900 leading-none">{stats.open}</div>
             </div>
          </div>
          <button 
            onClick={onAdd}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:bg-[#125a87] transition-all flex items-center gap-2 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Raise Technical RFI
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
              <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search registry by subject node or RFI identifier..." 
                className="w-full pl-14 pr-6 py-4.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none shadow-inner transition-all" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
              <button className="flex-1 lg:flex-none px-6 py-4.5 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all border border-zinc-200"><Filter size={16} /> Filter States</button>
          </div>
      </div>

      {/* List */}
      <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                      <th className="px-10 py-6">RFI Number</th>
                      <th className="px-10 py-6">Subject</th>
                      <th className="px-10 py-6">Linked Objectives</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6">Due Date</th>
                      <th className="px-10 py-6 text-right">Created Date</th>
                      <th className="px-10 py-6"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                  {filtered.map((rfi) => (
                      <tr key={rfi.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer" onClick={() => openEditModal(rfi)}>
                          <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                      <Hash size={18} strokeWidth={2.5} />
                                  </div>
                                  <span className="font-mono text-xs font-black text-zinc-900 tracking-wider uppercase">{rfi.number}</span>
                              </div>
                          </td>
                          <td className="px-10 py-8">
                              <div className="font-black text-zinc-800 text-base uppercase tracking-tight truncate max-w-[300px] group-hover:text-primary transition-colors">{rfi.subject}</div>
                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                  <User size={10} /> Assigned: {rfi.assignedTo}
                                  {rfi.attachments && rfi.attachments.length > 0 && (
                                    <>
                                      <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                                      <span className="flex items-center gap-1 text-primary"><Paperclip size={10} /> {rfi.attachments.length} Artifacts</span>
                                    </>
                                  )}
                              </div>
                          </td>
                          <td className="px-10 py-8">
                              <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                  {rfi.linkedTaskIds?.slice(0, 2).map(tid => (
                                      <span key={tid} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase border border-blue-100 flex items-center gap-1">
                                          <GitMerge size={10} /> OBJ-{tid.slice(-4).toUpperCase()}
                                      </span>
                                  ))}
                                  {rfi.linkedTaskIds && rfi.linkedTaskIds.length > 2 && (
                                      <span className="text-[9px] font-black text-zinc-400 px-1">+{rfi.linkedTaskIds.length - 2}</span>
                                  )}
                                  {(!rfi.linkedTaskIds || rfi.linkedTaskIds.length === 0) && (
                                      <span className="text-[9px] font-bold text-zinc-300 uppercase italic">Unlinked</span>
                                  )}
                              </div>
                          </td>
                          <td className="px-10 py-8">
                              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border flex items-center gap-2 w-fit ${
                                  rfi.status === 'Open' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                              }`}>
                                  {rfi.status === 'Open' ? <Clock size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
                                  {rfi.status}
                              </span>
                          </td>
                          <td className="px-10 py-8 font-mono text-xs font-black text-zinc-500 uppercase tracking-tighter">
                              {new Date(rfi.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-10 py-8 text-right font-mono text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                              {new Date(rfi.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-90"><Maximize2 size={18} /></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* RFI Detail/Edit Modal */}
      {selectedRFI && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedRFI(null)}>
              <div 
                className="bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh] animate-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                  <div className="p-10 border-b bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-5 bg-primary text-white rounded-1.75rem shadow-2xl shadow-blue-900/30">
                              <HelpCircle size={32} />
                          </div>
                          <div>
                              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{selectedRFI.number}</h3>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                 <Activity size={10} className="text-primary" /> Technical Node Resolution Chain
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedRFI(null)} className="p-4 bg-zinc-100 hover:bg-red-50 hover:text-red-500 text-zinc-400 rounded-full transition-all shadow-sm border border-zinc-100"><X size={28} /></button>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-white">
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><ScanLine size={14} className="text-primary" /> Inquiry Narrative</label>
                              <div className="p-10 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-lg font-black text-zinc-800 leading-relaxed shadow-inner italic relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><BrainCircuit size={120} /></div>
                                  <span className="relative z-10 font-medium">"{selectedRFI.question}"</span>
                              </div>
                          </div>

                          {selectedRFI.attachments && selectedRFI.attachments.length > 0 && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><Paperclip size={14} /> Attached Forensic Shards</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedRFI.attachments.map((file, i) => (
                                  <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:bg-white hover:border-primary transition-all group shadow-sm">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100 group-hover:text-primary transition-all">
                                      <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] font-black text-zinc-900 truncate uppercase tracking-tight">{file.name}</div>
                                      <div className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5">{file.type.split('/')[1] || 'DOC'} Artifact</div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2">Deployment State</label>
                                  <select 
                                    className="w-full p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black outline-none"
                                    value={editState.status}
                                    onChange={e => setEditState({...editState, status: e.target.value as any})}
                                  >
                                      <option value="Open">Open (Pending)</option>
                                      <option value="Closed">Closed (Resolved)</option>
                                  </select>
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2">Authority Node</label>
                                  <select 
                                    className="w-full p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black outline-none"
                                    value={editState.assignedTo}
                                    onChange={e => setEditState({...editState, assignedTo: e.target.value})}
                                  >
                                      {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name} - {m.role}</option>)}
                                  </select>
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between items-center px-2">
                                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Resolution Synthesis</label>
                                 <button onClick={handleSmartAnswer} disabled={isAnswering} className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200">
                                     {isAnswering ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Smart Response
                                 </button>
                              </div>
                              <textarea 
                                className="w-full p-8 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium outline-none resize-none h-48 italic shadow-inner"
                                placeholder="Draft the technical resolution briefing..."
                                value={editState.answer}
                                onChange={e => setEditState({...editState, answer: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Right Panel: Logic Links & Client Brief */}
                      <div className="w-[350px] border-l border-zinc-100 bg-zinc-50/50 p-8 flex flex-col space-y-10">
                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <GitMerge size={14} className="text-primary" /> Traceable Lattice Links
                            </h4>
                            <div className="space-y-3">
                              {selectedRFI.linkedTaskIds?.map(tid => {
                                const task = tasks.find(t => t.id === tid);
                                return (
                                  <div key={tid} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm flex items-center justify-between group">
                                    <div className="min-w-0">
                                      <div className="text-[10px] font-black text-zinc-900 uppercase truncate pr-4">{task?.title || `OBJ-${tid.slice(-4).toUpperCase()}`}</div>
                                      <div className="text-[8px] font-bold text-zinc-400 uppercase mt-1">Status: {task?.status || 'Unknown'}</div>
                                    </div>
                                    <ArrowRight size={12} className="text-zinc-200 group-hover:text-primary transition-all" />
                                  </div>
                                );
                              })}
                              {(!selectedRFI.linkedTaskIds || selectedRFI.linkedTaskIds.length === 0) && (
                                <div className="p-10 border-2 border-dashed border-zinc-200 rounded-2xl text-center text-[9px] font-black text-zinc-300 uppercase">No Logic Links</div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                  <MessageSquare size={14} className="text-primary" /> Client Updates Agent
                              </h4>
                              <p className="text-[9px] text-zinc-400 font-bold uppercase leading-relaxed">Synthesize this technical RFI into a simplified summary for project owners.</p>
                              <button 
                                onClick={generateClientSummary}
                                disabled={isGeneratingBrief}
                                className="w-full py-4 bg-white border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#0f5c82] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                              >
                                  {isGeneratingBrief ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                                  Generate Client Brief
                              </button>
                          </div>

                          {clientBrief && (
                              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xl animate-in slide-in-from-bottom-2 duration-500 relative group">
                                  <div className="absolute top-3 right-3 text-emerald-500 opacity-20"><FileCheck size={32} /></div>
                                  <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><ShieldCheck size={12} /> Optimized Summary</h5>
                                  <p className="text-[11px] text-zinc-600 leading-relaxed font-medium italic">"{clientBrief}"</p>
                                  <button onClick={() => navigator.clipboard.writeText(clientBrief)} className="mt-4 w-full py-2 bg-zinc-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all">Copy to Weekly Update</button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="p-10 border-t bg-zinc-50/50 flex gap-4 shrink-0">
                      <button onClick={() => setSelectedRFI(null)} className="px-10 py-5 text-zinc-400 font-black text-xs uppercase tracking-[0.2em] hover:text-zinc-600 transition-colors">Discard</button>
                      <button onClick={handleUpdate} className="flex-1 py-5 bg-zinc-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95">
                          <ShieldCheck size={20} className="text-green-400" /> Commit Technical Resolution
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RFIsView;