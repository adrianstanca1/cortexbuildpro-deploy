
import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, Plus, Search, Filter, Clock, 
  ChevronRight, FileText, CheckCircle2, AlertCircle, 
  MoreHorizontal, Calendar, MapPin, User, ArrowRight, XCircle
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { PunchItem } from '../types';

interface PunchItemsViewProps {
  projectId: string;
  onAdd: () => void;
}

const PunchItemsView: React.FC<PunchItemsViewProps> = ({ projectId, onAdd }) => {
  const { punchItems, updatePunchItem } = useProjects();
  const [search, setSearch] = useState('');

  const projectPunchItems = useMemo(() => 
    punchItems.filter(p => p.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [punchItems, projectId]);

  const filtered = projectPunchItems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    const open = projectPunchItems.filter(p => p.status === 'Open').length;
    const resolved = projectPunchItems.filter(p => p.status === 'Resolved' || p.status === 'Closed').length;
    return { open, resolved };
  }, [projectPunchItems]);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700 border-red-100';
      case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Low': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Resolved': return 'bg-green-50 text-green-700 border-green-100';
      case 'Closed': return 'bg-zinc-50 text-zinc-700 border-zinc-100';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  const handleResolve = async (id: string) => {
      await updatePunchItem(id, { status: 'Resolved' });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-3">
            <ClipboardCheck className="text-primary" /> Project Punch List
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Deficiency tracking and closeout management.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-4">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertCircle size={20} /></div>
             <div>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Open Items</div>
                <div className="text-xl font-black text-zinc-900 leading-none">{stats.open}</div>
             </div>
          </div>
          <button 
            onClick={onAdd}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#125a87] transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> New Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl px-5 py-3.5 border border-zinc-100 focus-within:ring-4 focus-within:ring-primary/10 focus-within:bg-white transition-all">
          <Search size={20} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by title or location..." 
            className="flex-1 bg-transparent outline-none text-sm font-medium" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
            <Filter size={16} className="text-zinc-400" />
            <span className="text-xs font-bold text-zinc-500">Filters</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 pb-20">
        {filtered.length > 0 ? filtered.map((item) => (
          <div key={item.id} className="bg-white border border-zinc-200 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary hover:shadow-xl transition-all shadow-sm relative overflow-hidden">
            <div className="flex gap-6 items-center flex-1 min-w-0">
               <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center border border-zinc-100 text-zinc-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors shrink-0">
                  <CheckCircle2 size={24} strokeWidth={2.5} />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getStatusStyle(item.status)}`}>
                        {item.status === 'Open' ? <Clock size={12} /> : <CheckCircle2 size={12} />} {item.status}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getPriorityStyle(item.priority)}`}>
                        {item.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-900 group-hover:text-primary transition-colors truncate pr-4 text-lg">{item.title}</h4>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3">
                     <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <MapPin size={14} className="text-zinc-400" />
                        <span>Location: {item.location}</span>
                     </div>
                     <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <Calendar size={14} className="text-zinc-400" />
                        <span>Raised: {new Date(item.createdAt).toLocaleDateString()}</span>
                     </div>
                     {item.assignedTo && (
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                            <User size={14} className="text-zinc-400" />
                            <span>Assigned: {item.assignedTo}</span>
                        </div>
                     )}
                  </div>
                  {item.description && (
                      <p className="mt-3 text-sm text-zinc-600 line-clamp-1 italic font-medium">"{item.description}"</p>
                  )}
               </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6 md:mt-0 ml-auto shrink-0">
               <button className="p-3 bg-zinc-50 text-zinc-400 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm">
                  <FileText size={18} />
               </button>
               {item.status === 'Open' && (
                   <button 
                    onClick={() => handleResolve(item.id)}
                    className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center gap-3 group/btn active:scale-95"
                   >
                      Resolve Item <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
               )}
            </div>
          </div>
        )) : (
          <div className="text-center py-20 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-[3rem] flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100">
               <ClipboardCheck size={32} className="opacity-20" />
            </div>
            <div>
               <p className="font-black uppercase tracking-[0.2em] text-xs text-zinc-500">Punch List Clear</p>
               <p className="text-xs text-zinc-400 mt-1">No pending deficiency items for this project scope.</p>
            </div>
            <button onClick={onAdd} className="mt-2 text-primary font-black uppercase text-[10px] tracking-widest hover:underline">Log first item</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PunchItemsView;
