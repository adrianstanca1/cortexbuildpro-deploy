
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Plus, Box, Search, Filter, History, Eye, 
  Download, Link as LinkIcon, Trash2, ChevronRight, 
  ChevronLeft, X, CheckSquare, GitMerge, FileText,
  Calendar, User, Activity, Sparkles, Loader2, Info,
  ZoomIn, ZoomOut, Maximize, BrainCircuit, Check,
  Maximize2, FileDigit, MessageSquareQuote,
  ScanLine, ShieldCheck, Target, Edit3, Save,
  RotateCcw, Layers, Database, PlusSquare,
  Ruler, Construction, TriangleAlert, Zap, Clock,
  Pin, MessageCircle, AlertCircle, HelpCircle,
  LayoutGrid, GalleryHorizontalEnd, ImageIcon,
  FileUp, ArrowRight, RefreshCw
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { ProjectDrawing, Task, DrawingMarkup } from '../types';
import { analyzeDrawing, runRawPrompt } from '../services/geminiService';

export interface DrawingsViewProps {
  projectId: string;
  onAddRevision: (drawing: ProjectDrawing) => void;
  onUploadNew: () => void;
  initialDrawing?: ProjectDrawing;
}

interface DeepAnalysisResult {
  dimensions: { element: string; value: string }[];
  materials: { type: string; quantity: string; unit: string }[];
  risks: { title: string; impact: string; mitigation: string; x?: number; y?: number }[];
  summary: string;
}

const DrawingSetCard: React.FC<{ 
  name: string; 
  versions: ProjectDrawing[]; 
  onAddRevision: (d: ProjectDrawing) => void;
  onInspect: (d: ProjectDrawing) => void;
  onLink: (id: string) => void;
}> = ({ name, versions, onAddRevision, onInspect, onLink }) => {
  const [activeVersionId, setActiveVersionId] = useState(versions[0].id);
  const activeVersion = useMemo(() => versions.find(v => v.id === activeVersionId) || versions[0], [versions, activeVersionId]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Structural': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Architectural': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'MEP': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Site': return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group flex flex-col shadow-sm relative h-full ring-1 ring-transparent hover:ring-primary/10 animate-in fade-in zoom-in-95 duration-500 h-full">
      <div className="h-64 w-full relative bg-zinc-900 overflow-hidden flex items-center justify-center">
        {activeVersion.url ? (
          <img src={activeVersion.url} alt={name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
        ) : (
          <Box size={48} className="text-zinc-700" />
        )}
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border backdrop-blur-md shadow-sm w-fit ${getCategoryColor(activeVersion.category)}`}>
            {activeVersion.category}
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/80 backdrop-blur-md text-white rounded-lg text-[9px] font-black uppercase border border-white/10 shadow-sm flex items-center gap-1 w-fit">
            Version {activeVersion.version || 1}
          </span>
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px] z-20">
          <button onClick={() => onInspect(activeVersion)} className="p-3 bg-white text-zinc-800 rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all shadow-xl" title="Open Full Blueprint"><Eye size={20} /></button>
          <button className="p-3 bg-white text-zinc-800 rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all shadow-xl" title="Download Source"><Download size={20} /></button>
        </div>

        {/* HOVER REVISION NOTES */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-midnight/95 backdrop-blur-xl border-t border-white/10 translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-in-out z-30">
          <div className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="animate-pulse" /> Technical Revision Context
          </div>
          <p className="text-[12px] text-zinc-100 leading-relaxed line-clamp-4 font-medium italic">
            "{activeVersion.revisionNotes || "Genesis parameters for this structural node have been established in the primary registry."}"
          </p>
        </div>
      </div>

      {/* VERSION SCRUBBER BAR */}
      <div className="bg-zinc-50 border-b border-zinc-100 p-3.5 flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0 shadow-inner">
        {versions.map((v) => (
          <div key={v.id} className="relative group/thumbItem">
            <button 
                onClick={() => setActiveVersionId(v.id)}
                className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 transition-all relative overflow-hidden ${activeVersionId === v.id ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-zinc-200 hover:border-zinc-400'}`}
            >
                <img src={v.url} className={`w-full h-full object-cover ${activeVersionId === v.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`} alt={`v${v.version}`} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-black text-[10px]">V{v.version}</div>
            </button>
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-4 bg-zinc-900 text-white text-[10px] rounded-[1.25rem] shadow-2xl opacity-0 group-hover/thumbItem:opacity-100 transition-all pointer-events-none z-[100] border border-white/10 italic translate-y-2 group-hover/thumbItem:translate-y-0">
               <div className="font-black text-primary uppercase text-[8px] tracking-widest mb-1">Version {v.version} Notes</div>
               "{v.revisionNotes || 'Registry entry complete.'}"
            </div>
          </div>
        ))}
        <button 
          onClick={() => onAddRevision(activeVersion)}
          className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary hover:bg-white transition-all active:scale-90 group/add"
          title="Add New Version Revision"
        >
          <FileUp size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="p-8 flex-1 flex flex-col justify-between">
        <div onClick={() => onInspect(activeVersion)} className="cursor-pointer space-y-4">
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-tighter">Stack ID: {name.substring(0,6).toUpperCase()}</span>
          </div>
          <h3 className="font-black text-zinc-900 text-xl tracking-tight leading-tight line-clamp-1 group-hover:text-primary transition-colors uppercase">{name}</h3>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest border-t border-zinc-50 pt-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              <span>{activeVersion.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              <span>{versions.length} versions</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button 
            onClick={() => onLink(activeVersion.id)}
            className="flex-1 py-4 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <GitMerge size={16} /> 
            {activeVersion.linkedTaskIds?.length ? `${activeVersion.linkedTaskIds.length} Nodes` : 'Link Map'}
          </button>
          <button 
            onClick={() => onInspect(activeVersion)}
            className="flex-1 py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 group/inspect"
          >
            <Maximize2 size={16} className="group-hover/inspect:scale-110 transition-transform" /> Inspect
          </button>
        </div>
      </div>
    </div>
  );
};

const DrawingsView: React.FC<DrawingsViewProps> = ({ projectId, onAddRevision, onUploadNew, initialDrawing }) => {
  const { drawings } = useProjects();
  const [search, setSearch] = useState('');

  const projectDrawings = useMemo(() => 
    drawings.filter(d => d.projectId === projectId)
  , [drawings, projectId]);

  const drawingGroups = useMemo(() => {
    const groups: Record<string, ProjectDrawing[]> = {};
    projectDrawings.forEach(d => {
      if (!groups[d.name]) groups[d.name] = [];
      groups[d.name].push(d);
    });
    // Sort versions within groups
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => (b.version || 0) - (a.version || 0));
    });
    return groups;
  }, [projectDrawings]);

  const filteredGroupNames = useMemo(() => 
    Object.keys(drawingGroups).filter(name => name.toLowerCase().includes(search.toLowerCase()))
  , [drawingGroups, search]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-5 leading-none">
            <Box className="text-primary" size={40} /> Technical Blueprints
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
            <Activity size={14} className="text-primary animate-pulse" /> Multi-Version Shard Registry
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => {
              const latest = projectDrawings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              if (latest) onAddRevision(latest);
              else onUploadNew();
            }}
            className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 group"
          >
            {/* Added missing RefreshCw import fix */}
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform" /> New Version
          </button>
          <button 
            onClick={onUploadNew}
            className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-3 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Upload New Set
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search blueprint registry..." 
            className="w-full pl-16 pr-8 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-primary/5 outline-none transition-all shadow-inner" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredGroupNames.map(name => (
          <DrawingSetCard 
            key={name}
            name={name}
            versions={drawingGroups[name]}
            onAddRevision={onAddRevision}
            onInspect={(d) => console.log('Inspect', d)}
            onLink={(id) => console.log('Link', id)}
          />
        ))}
      </div>

      {filteredGroupNames.length === 0 && (
        <div className="py-40 text-center border-2 border-dashed border-zinc-200 rounded-[3rem] bg-zinc-50/50">
          <GalleryHorizontalEnd size={48} className="mx-auto mb-4 text-zinc-200" />
          <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Blueprint Registry Empty</h3>
          <p className="text-zinc-400 text-xs mt-2 font-medium uppercase tracking-widest">No technical drawings found in current shard.</p>
        </div>
      )}
    </div>
  );
};

export default DrawingsView;
