
import React, { useState, useMemo } from 'react';
import { 
  Clipboard, Plus, Search, Filter, Clock, 
  Users, Thermometer, Cloud, CheckCircle2,
  Calendar, User, ChevronRight, MoreHorizontal,
  CloudRain, Sun, Activity, MapPin
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { DailyLog } from '../types';

interface DailyLogsViewProps {
  projectId: string;
  onAdd: () => void;
}

const DailyLogsView: React.FC<DailyLogsViewProps> = ({ projectId, onAdd }) => {
  const { dailyLogs } = useProjects();
  const [search, setSearch] = useState('');

  const projectLogs = useMemo(() => 
    dailyLogs.filter(l => l.projectId === projectId)
             .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [dailyLogs, projectId]);

  const filtered = projectLogs.filter(l => 
    l.workPerformed?.toLowerCase().includes(search.toLowerCase()) || 
    l.author.toLowerCase().includes(search.toLowerCase()) ||
    l.date.includes(search)
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-3">
            <Clipboard className="text-primary" /> Field Intelligence Logs
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Daily site reports, manpower tracking, and climate telemetry.</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#125a87] transition-all flex items-center gap-2 active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Log Site Activity
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 flex items-center gap-4 bg-zinc-50 rounded-2xl px-5 py-3.5 border border-zinc-100 focus-within:ring-4 focus-within:ring-primary/10 focus-within:bg-white transition-all w-full">
          <Search size={20} className="text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search work performed, authors, or dates..." 
            className="flex-1 bg-transparent outline-none text-sm font-medium" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 border border-zinc-200 transition-all">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="space-y-4">
        {filtered.length > 0 ? filtered.map((log) => (
          <div key={log.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-primary hover:shadow-xl transition-all shadow-sm relative overflow-hidden">
            <div className="flex gap-8 items-center flex-1 min-w-0">
               <div className="w-20 h-20 bg-zinc-50 rounded-[1.75rem] flex flex-col items-center justify-center border border-zinc-100 text-zinc-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors shrink-0">
                  <span className="text-xs font-black uppercase leading-none">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-3xl font-black leading-none mt-1">{new Date(log.date).getDate()}</span>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <User size={12} /> {log.author}
                    </span>
                    <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={12} /> {log.crewCount} Personnel
                    </span>
                    <div className="h-1 w-1 bg-zinc-300 rounded-full" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sun size={12} className="text-amber-500" /> {log.weather || '72°F Sunny'}
                    </span>
                  </div>
                  <h4 className="font-black text-zinc-900 group-hover:text-primary transition-colors truncate pr-8 text-xl uppercase tracking-tight">{log.workPerformed}</h4>
                  <p className="mt-3 text-sm text-zinc-500 line-clamp-2 leading-relaxed font-medium italic">"{log.notes}"</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6 md:mt-0 ml-auto shrink-0">
               <button className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95 group/btn">
                  View Full Report <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-32 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-[3rem] flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center border border-zinc-100 shadow-inner">
               <Clipboard size={48} className="opacity-10" />
            </div>
            <div>
               <p className="font-black uppercase tracking-[0.3em] text-sm text-zinc-600">Daily Shard Registry Clear</p>
               <p className="text-xs text-zinc-400 mt-1 uppercase font-bold tracking-widest">No logs identified in current temporal search.</p>
            </div>
            <button onClick={onAdd} className="mt-4 text-primary font-black uppercase text-[10px] tracking-[0.3em] hover:underline flex items-center gap-2">
                <Plus size={14} strokeWidth={3} /> Inject Site Activity Node
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyLogsView;
