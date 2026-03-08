import React, { useMemo, useState, useRef } from 'react';
/* Added missing icon imports: LayoutGrid, List, Target, Activity from lucide-react to resolve undefined component errors */
import { 
  Upload, FileText, Download, Image as ImageIcon, Box, 
  Link as LinkIcon, X, Search, CheckCircle2, MoreVertical, Eye, 
  FileSpreadsheet, Trash2, Calendar, Paperclip, Loader2, Database,
  Sparkles, Info, Filter, ArrowRight, BookOpen, BrainCircuit,
  CheckSquare, GitMerge, User, LayoutGrid, List, Target, Activity
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Task, ProjectDocument } from '../types';
import { runRawPrompt } from '../services/geminiService';

interface DocumentsViewProps {
  projectId?: string;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { documents, tasks, updateDocument, addDocument } = useProjects();
  const [linkingDocId, setLinkingDocId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isUploading, setIsUploading] = useState(false);
  
  // AI Summary State
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    let docs = projectId ? documents.filter(d => d.projectId === projectId) : documents;
    if (filterType !== 'All') {
      if (filterType === 'Plans') docs = docs.filter(d => d.type === 'CAD' || d.type === 'PDF');
      else if (filterType === 'Images') docs = docs.filter(d => d.type === 'Image');
      else docs = docs.filter(d => d.type === filterType);
    }
    return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, projectId, filterType]);

  const projectTasks = useMemo(() => {
    return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
  }, [tasks, projectId]);

  const filteredTasks = projectTasks.filter(t => 
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const handleLinkTask = (taskId: string) => {
    if (!linkingDocId) return;
    const doc = documents.find(d => d.id === linkingDocId);
    if (!doc) return;

    const currentLinks = doc.linkedTaskIds || [];
    const newLinks = currentLinks.includes(taskId)
      ? currentLinks.filter(id => id !== taskId)
      : [...currentLinks, taskId];
    
    updateDocument(linkingDocId, { linkedTaskIds: newLinks });
  };

  const handleGenerateSummary = async (doc: ProjectDocument) => {
    setSummarizingId(doc.id);
    try {
      const prompt = `
        Act as a professional project coordinator. 
        Analyze the metadata for this construction document: 
        Name: "${doc.name}"
        Type: "${doc.type}"
        Linked Tasks: ${doc.linkedTaskIds?.length || 0}
        
        Provide a 2-sentence professional "Smart Summary" of what this document likely represents in a construction workflow and its importance.
      `;
      const result = await runRawPrompt(prompt, { model: 'gemini-3-pro-preview', temperature: 0.4 });
      setSummaries(prev => ({ ...prev, [doc.id]: result }));
    } catch (e) {
      setSummaries(prev => ({ ...prev, [doc.id]: "AI Synthesis failed. Please check network link." }));
    } finally {
      setSummarizingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newDoc: ProjectDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: file.type.includes('image') ? 'Image' : file.type.includes('pdf') ? 'PDF' : file.name.endsWith('.dwg') ? 'CAD' : 'Document',
          projectId: projectId || '',
          companyId: user?.companyId || 'c1',
          projectName: 'Current Project',
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          date: new Date().toLocaleDateString(),
          status: 'Approved',
          url: reader.result as string,
          linkedTaskIds: []
        };
        await addDocument(newDoc);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'Image') return <ImageIcon size={32} className="text-purple-500" />;
    if (type === 'CAD') return <Box size={32} className="text-blue-500" />;
    if (type === 'Spreadsheet') return <FileSpreadsheet size={32} className="text-green-500" />;
    return <FileText size={32} className="text-orange-500" />;
  };

  const getFileColor = (type: string) => {
    if (type === 'Image') return 'bg-purple-50/50 border-purple-100 text-purple-600';
    if (type === 'CAD') return 'bg-blue-50/50 border-blue-100 text-blue-600';
    if (type === 'Spreadsheet') return 'bg-green-50/50 border-green-100 text-green-600';
    return 'bg-orange-50/50 border-orange-100 text-orange-600';
  };

  return (
    <div className="max-w-full mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      
      {/* Control Strip */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm">
        <div className="flex-1 flex items-center gap-6 w-full">
            <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200 overflow-x-auto no-scrollbar shadow-inner">
                {['All', 'Plans', 'Permits', 'Reports', 'Images'].map((tag) => (
                    <button 
                        key={tag} 
                        onClick={() => setFilterType(tag)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            filterType === tag 
                            ? 'bg-white text-zinc-900 shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <div className="flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 shadow-inner">
                 <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white text-primary shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}><LayoutGrid size={16} /></button>
                 <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white text-primary shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}><List size={16} /></button>
            </div>
        </div>
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full lg:w-auto flex items-center justify-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
        >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isUploading ? 'Uploading to Bucket...' : 'Upload Project Document'}
        </button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Main Grid/List View */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-1">
          {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredDocs.map((doc) => (
                      <div key={doc.id} className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group flex flex-col relative h-[420px] shadow-sm">
                          {/* Preview Area */}
                          <div className={`h-48 w-full relative overflow-hidden ${doc.type === 'Image' ? 'bg-zinc-900' : getFileColor(doc.type)} flex items-center justify-center`}>
                              {doc.type === 'Image' && doc.url ? (
                                  <img src={doc.url} alt={doc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                              ) : (
                                  <div className="transform transition-transform duration-300 group-hover:scale-110 opacity-80 text-center flex flex-col items-center">
                                      {getFileIcon(doc.type)}
                                      <span className="text-[10px] font-black mt-2 opacity-60 uppercase tracking-widest">{doc.type}</span>
                                  </div>
                              )}
                              
                              <div className="absolute top-4 left-4 z-10">
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border shadow-sm ${
                                  doc.status === 'Approved' ? 'bg-emerald-50 text-white border-emerald-400' : 'bg-orange-50 text-white border-orange-400'
                                }`}>
                                  {doc.status}
                                </span>
                              </div>

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                  <button className="p-3 bg-white text-zinc-800 rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all shadow-xl" title="Open Document"><Eye size={20} /></button>
                                  <button className="p-3 bg-white text-zinc-800 rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all shadow-xl" title="Download Source"><Download size={20} /></button>
                              </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                      <h4 className="font-black text-zinc-900 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors pr-2 uppercase tracking-tight">{doc.name}</h4>
                                      <button className="text-zinc-300 hover:text-zinc-600 p-1"><MoreVertical size={16} /></button>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 flex items-center gap-2 font-black uppercase tracking-widest">
                                      <span className="flex items-center gap-1"><Database size={10} /> {doc.size}</span>
                                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                      <span className="flex items-center gap-1"><Calendar size={10} /> {doc.date}</span>
                                  </div>
                              </div>

                              <div className="mt-4 space-y-4">
                                  {/* AI Summary UI in Card */}
                                  {summaries[doc.id] ? (
                                      <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-[10px] text-zinc-600 italic leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                                          "{summaries[doc.id]}"
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={() => handleGenerateSummary(doc)}
                                        className="w-full py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all flex items-center justify-center gap-2"
                                      >
                                          {summarizingId === doc.id ? <Loader2 size={12} className="animate-spin text-primary" /> : <Sparkles size={12} className="text-blue-500" />}
                                          {summarizingId === doc.id ? 'Synthesizing...' : 'AI Technical Abstract'}
                                      </button>
                                  )}

                                  <button 
                                    onClick={() => setLinkingDocId(doc.id)}
                                    className="w-full py-3.5 bg-white border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-700 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                  >
                                      <LinkIcon size={14} className="text-primary" /> 
                                      {doc.linkedTaskIds?.length ? `${doc.linkedTaskIds.length} Linked Objectives` : 'Link Site Objective'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 border-b text-zinc-400 uppercase text-[10px] font-black tracking-[0.2em]">
                          <tr>
                              <th className="px-8 py-6">Registry Node</th>
                              <th className="px-8 py-6">Disciplinary Stack</th>
                              <th className="px-8 py-6">Telemetry</th>
                              <th className="px-8 py-6">Status</th>
                              <th className="px-8 py-6">Linked Objectives</th>
                              <th className="px-8 py-6 text-right"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                          {filteredDocs.map((doc) => (
                              <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                          <div className={`p-2.5 rounded-xl ${getFileColor(doc.type)} shadow-inner`}>
                                              {getFileIcon(doc.type)}
                                          </div>
                                          <div className="min-w-0">
                                              <div className="font-black text-zinc-900 text-sm truncate max-w-[300px] uppercase tracking-tight group-hover:text-primary transition-colors">{doc.name}</div>
                                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                <Calendar size={10} />Genesis: {doc.date}
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <span className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-200">{doc.type}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="text-[10px] font-mono text-zinc-500 uppercase font-black">{doc.size}</div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                      doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                    }`}>{doc.status}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex flex-wrap gap-2">
                                          {doc.linkedTaskIds?.slice(0, 2).map(tid => (
                                              <span key={tid} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase border border-blue-100 flex items-center gap-1">
                                                  <CheckSquare size={10} /> OBJ-{tid.slice(-4).toUpperCase()}
                                              </span>
                                          ))}
                                          {doc.linkedTaskIds && doc.linkedTaskIds.length > 2 && (
                                              <span className="px-2 py-1 bg-zinc-100 text-zinc-400 rounded-lg text-[9px] font-black">+{doc.linkedTaskIds.length - 2}</span>
                                          )}
                                          {(!doc.linkedTaskIds || doc.linkedTaskIds.length === 0) && (
                                            <span className="text-[9px] text-zinc-300 font-bold uppercase">Unlinked</span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => setLinkingDocId(doc.id)} className="p-2.5 bg-white text-zinc-400 hover:text-primary hover:border-primary border border-zinc-200 rounded-xl shadow-sm transition-all" title="Link Objectives"><GitMerge size={16} /></button>
                                          <button className="p-2.5 bg-white text-zinc-400 hover:text-primary hover:border-primary border border-zinc-200 rounded-xl shadow-sm transition-all" title="Download Source"><Download size={16} /></button>
                                          <button className="p-2.5 bg-white text-zinc-400 hover:text-red-600 hover:border-red-200 border border-zinc-200 rounded-xl shadow-sm transition-all" title="Purge Record"><Trash2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
          
          {filteredDocs.length === 0 && (
              <div className="text-center py-40 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200 flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-200 shadow-sm ring-8 ring-zinc-50">
                      <Database size={48} />
                  </div>
                  <div>
                      <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Vault Payload Empty</h3>
                      <p className="text-zinc-400 text-xs mt-2 font-medium">Initialize the site registry by uploading project documentation nodes.</p>
                  </div>
              </div>
          )}
      </div>

      {/* Optimized Objective Mapping Modal */}
      {linkingDocId && (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20 animate-in zoom-in-95 duration-300">
                  <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
                              <GitMerge size={32} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Objective Mapping</h3>
                              <p className="text-sm text-zinc-400 font-bold mt-1 uppercase tracking-widest">Link document nodes to project milestones.</p>
                          </div>
                      </div>
                      <button onClick={() => setLinkingDocId(null)} className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-all border border-zinc-100 shadow-sm"><X size={28} className="text-zinc-400" /></button>
                  </div>

                  <div className="p-8 bg-white border-b border-zinc-100">
                      <div className="relative group">
                          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text" 
                            placeholder="Filter objectives by title or assignee..." 
                            className="w-full pl-14 pr-6 py-5 bg-zinc-50 border border-zinc-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none shadow-inner transition-all"
                            value={taskSearch}
                            onChange={e => setTaskSearch(e.target.value)}
                            autoFocus
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-3 bg-zinc-50/30 custom-scrollbar">
                      {filteredTasks.length > 0 ? filteredTasks.map(task => {
                          const isLinked = documents.find(d => d.id === linkingDocId)?.linkedTaskIds?.includes(task.id);
                          return (
                              <div 
                                key={task.id} 
                                onClick={() => handleLinkTask(task.id)}
                                className={`p-6 rounded-[2rem] border-2 cursor-pointer flex items-center justify-between transition-all group ${
                                    isLinked 
                                    ? 'bg-white border-primary shadow-xl scale-[1.02] ring-8 ring-primary/5' 
                                    : 'bg-white border-zinc-100 hover:border-primary/40 hover:shadow-xl'
                                }`}
                              >
                                  <div className="flex items-center gap-5 overflow-hidden">
                                      <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${isLinked ? 'border-primary bg-primary text-white shadow-lg' : 'border-zinc-200 group-hover:border-primary/50 bg-white'}`}>
                                          {isLinked ? <CheckCircle2 size={18} /> : <Target size={18} className="text-zinc-300" />}
                                      </div>
                                      <div className="min-w-0">
                                          <div className={`font-black text-base truncate transition-colors uppercase tracking-tight ${isLinked ? 'text-primary' : 'text-zinc-800'}`}>{task.title}</div>
                                          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] flex items-center gap-3 mt-1.5">
                                              <span className={`px-2 py-0.5 rounded-lg border font-black ${
                                                  task.status === 'Done' ? 'bg-green-50 text-green-700 border-green-100' : 
                                                  task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                                  'bg-zinc-50 text-zinc-500 border-zinc-200'
                                              }`}>
                                                  {task.status}
                                              </span>
                                              <span className="flex items-center gap-1.5"><Calendar size={12} /> Target: {task.dueDate}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <ArrowRight size={20} className={`transition-all ${isLinked ? 'text-primary translate-x-2' : 'text-zinc-200 opacity-0 group-hover:opacity-100'}`} />
                              </div>
                          );
                      }) : (
                          <div className="p-20 text-center text-zinc-400 text-sm italic bg-white rounded-[2.5rem] border border-dashed border-zinc-200 shadow-inner flex flex-col items-center gap-4">
                            <Activity size={32} className="opacity-20" />
                            No matching site objectives found in current shard.
                          </div>
                      )}
                  </div>

                  <div className="p-10 border-t border-zinc-100 bg-white flex justify-end">
                      <button onClick={() => setLinkingDocId(null)} className="px-12 py-5 bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl hover:bg-black transition-all active:scale-95">
                          Commit Mappings
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DocumentsView;