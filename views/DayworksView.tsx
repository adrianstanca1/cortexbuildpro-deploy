
import React, { useState, useMemo } from 'react';
import { 
  Hammer, Plus, Search, Filter, Clock, 
  PoundSterling, ChevronRight, FileText, 
  CheckCircle2, AlertCircle, XCircle, MoreHorizontal,
  TrendingUp, Calendar, ArrowUpRight, BadgeHelp,
  // Added missing icon imports
  Activity, Tag, ShieldCheck, AlertTriangle, PlusSquare
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Daywork } from '../types';

interface DayworksViewProps {
  projectId: string;
  onAdd: () => void;
}

const DayworksView: React.FC<DayworksViewProps> = ({ projectId, onAdd }) => {
  const { dayworks } = useProjects();
  const [search, setSearch] = useState('');

  const projectDayworks = useMemo(() => 
    dayworks.filter(d => d.projectId === projectId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [dayworks, projectId]);

  const filtered = projectDayworks.filter(d => 
    d.description.toLowerCase().includes(search.toLowerCase()) || 
    d.date.includes(search)
  );

  const stats = useMemo(() => {
    const approved = projectDayworks.filter(d => d.status === 'Approved');
    const totalValue = approved.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
    const pendingCount = projectDayworks.filter(d => d.status === 'Pending').length;
    return { totalValue, pendingCount };
  }, [projectDayworks]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-500/20 shadow-sm';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-500/20';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-500/20 animate-pulse';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-12 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-4 leading-none">
            <Hammer className="text-primary" size={40} /> Variation Ledger
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Formal Shard Registry for Temporal Discrepancies</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white border border-zinc-200 px-8 py-4 rounded-[2rem] shadow-sm flex items-center gap-6 hover:shadow-xl transition-all group">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><TrendingUp size={24} /></div>
             <div>
                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1.5">Recoverable Valuation</div>
                <div className="text-3xl font-black text-zinc-900 leading-none tracking-tighter">£{stats.totalValue.toLocaleString()}</div>
             </div>
          </div>
          <button 
            onClick={onAdd}
            className="bg-zinc-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/20 hover:bg-primary transition-all flex items-center gap-3 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Inject Variation Node
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex items-center gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Trace variation description, codes, or date nodes..." 
              className="w-full pl-16 pr-6 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-primary/5 focus:bg-white outline-none transition-all shadow-inner" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="px-8 py-5 bg-zinc-100 text-zinc-600 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 border border-zinc-200 transition-all flex items-center gap-3">
              <Filter size={20} /> Field Parameters
          </button>
      </div>

      <div className="space-y-6">
        {filtered.length > 0 ? filtered.map((dw) => (
          <div key={dw.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary hover:shadow-2xl transition-all shadow-sm relative overflow-hidden h-full ring-1 ring-transparent hover:ring-primary/10">
            <div className={`absolute top-0 left-0 w-2 h-full ${dw.status === 'Approved' ? 'bg-emerald-500' : dw.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-200'}`} />
            
            <div className="flex gap-10 items-center flex-1 min-w-0">
               <div className="w-20 h-20 bg-zinc-50 rounded-[1.75rem] flex flex-col items-center justify-center border border-zinc-100 text-zinc-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors shrink-0">
                  <span className="text-xs font-black uppercase leading-none">{new Date(dw.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-3xl font-black leading-none mt-1.5">{new Date(dw.date).getDate()}</span>
               </div>
               
               <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl border flex items-center gap-2 ${getStatusStyle(dw.status)}`}>
                        {dw.status === 'Approved' ? <ShieldCheck size={14} /> : dw.status === 'Pending' ? <Clock size={14} /> : <AlertTriangle size={14} />} 
                        {dw.status} State
                    </span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"><Tag size={12} className="text-primary" /> SHARD-{dw.id.slice(-6).toUpperCase()}</span>
                  </div>
                  
                  <h4 className="font-black text-zinc-900 group-hover:text-primary transition-colors truncate text-2xl uppercase tracking-tight leading-tight">{dw.description}</h4>
                  
                  <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest pt-2">
                     <span className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm text-zinc-700">
                        <PoundSterling size={14} className="text-emerald-500" /> Valuation: £{dw.grandTotal?.toLocaleString() || 'TBC'}
                     </span>
                     <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary" /> Genesis: {new Date(dw.createdAt).toLocaleDateString()}
                     </span>
                     <span className="flex items-center gap-2">
                        <Activity size={14} className="text-primary" /> Variation Protocol 4.2
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4 mt-8 md:mt-0 ml-auto shrink-0">
               <button className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-400 hover:bg-primary hover:text-white hover:border-primary rounded-2xl transition-all shadow-sm active:scale-90">
                  <FileText size={22} />
               </button>
               <button className="px-10 py-5 bg-zinc-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 group/btn active:scale-95">
                  Inspect Shard <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-40 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-[3.5rem] flex flex-col items-center gap-8 bg-zinc-50/50 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-100 shadow-inner ring-8 ring-zinc-50">
               <Hammer size={48} className="opacity-10" />
            </div>
            <div className="space-y-2">
               <h3 className="font-black uppercase tracking-[0.4em] text-sm text-zinc-500">Variation Matrix Clear</h3>
               <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">No site discrepancies registered in current project registry.</p>
            </div>
            <button onClick={onAdd} className="mt-4 px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:bg-[#0c4a6e] transition-all active:scale-95 flex items-center gap-3">
                <PlusSquare size={18} /> Initialize First Variation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayworksView;
