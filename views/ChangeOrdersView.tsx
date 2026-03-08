
import React, { useState, useMemo } from 'react';
import { 
  Hammer, Plus, Search, Filter, Clock, 
  PoundSterling, ChevronRight, FileText, 
  CheckCircle2, AlertCircle, XCircle, MoreHorizontal,
  TrendingUp, Calendar, ArrowUpRight, BadgeHelp,
  Activity, Tag, ShieldCheck, AlertTriangle, PlusSquare,
  FileSpreadsheet, Download, RefreshCw, Layers,
  // Added missing icons
  Target, Maximize2
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { ChangeOrder } from '../types';

interface ChangeOrdersViewProps {
  projectId: string;
  onAdd: () => void;
}

const ChangeOrdersView: React.FC<ChangeOrdersViewProps> = ({ projectId, onAdd }) => {
  const { changeOrders } = useProjects();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const projectCOs = useMemo(() => 
    changeOrders.filter(co => co.projectId === projectId)
                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [changeOrders, projectId]);

  const filtered = useMemo(() => {
    return projectCOs.filter(co => {
        const matchesSearch = co.title.toLowerCase().includes(search.toLowerCase()) || 
                             co.number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || co.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [projectCOs, search, statusFilter]);

  const stats = useMemo(() => {
    const approved = projectCOs.filter(co => co.status === 'Approved');
    const totalApprovedValue = approved.reduce((sum, co) => sum + (co.amount || 0), 0);
    const pendingValue = projectCOs.filter(co => co.status === 'Pending').reduce((sum, co) => sum + (co.amount || 0), 0);
    const totalScheduleImpact = approved.reduce((sum, co) => sum + (co.scheduleImpactDays || 0), 0);
    return { totalApprovedValue, pendingValue, totalScheduleImpact };
  }, [projectCOs]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-500/20 shadow-sm';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-500/20';
      case 'Pending': return 'bg-blue-50 text-blue-700 border-blue-500/20 animate-pulse';
      case 'Draft': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full space-y-12 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-5 leading-none">
            <RefreshCw className="text-primary" size={40} /> Change Management
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <Activity size={14} className="text-primary animate-pulse" /> Formal Scope Variation Shards
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <div className="bg-zinc-950 rounded-[2rem] p-6 text-white flex items-center gap-8 shadow-2xl border border-white/5 group">
             <div className="flex flex-col">
                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Approved Aggregate</div>
                <div className="text-2xl font-black text-primary tracking-tighter leading-none">£{stats.totalApprovedValue.toLocaleString()}</div>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col">
                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Pending Valuation</div>
                <div className="text-2xl font-black text-white tracking-tighter leading-none">£{stats.pendingValue.toLocaleString()}</div>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col">
                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Schedule Drift</div>
                <div className="text-2xl font-black text-orange-500 tracking-tighter leading-none">+{stats.totalScheduleImpact} Days</div>
             </div>
          </div>
          
          <button 
            onClick={onAdd}
            className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/20 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-3 active:scale-95 group shrink-0"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Initialize CO Node
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search by title narrative or variation identifier..." 
              className="w-full pl-16 pr-6 py-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-primary/5 focus:bg-white outline-none transition-all shadow-inner" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-[1.75rem] border border-zinc-200 shadow-inner">
                {(['All', 'Pending', 'Approved', 'Draft'] as const).map(f => (
                    <button 
                        key={f} 
                        onClick={() => setStatusFilter(f)} 
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            statusFilter === f ? 'bg-white text-zinc-900 shadow-md border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm relative z-10 animate-in slide-in-from-bottom-4">
        <div className="p-8 border-b bg-zinc-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Target size={14} className="text-primary" /> Active Change Registry
            </h3>
            <span className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full border border-zinc-200">{filtered.length} LOGGED NODES</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Identity / Shard Node</th>
              <th className="px-10 py-6">Protocol State</th>
              <th className="px-10 py-6">Genesis Date</th>
              <th className="px-10 py-6">Financial Impact</th>
              <th className="px-10 py-6">Temporal Impact</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.length > 0 ? filtered.map((co) => (
              <tr key={co.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                <td className="px-10 py-10">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner border group-hover:scale-110 ${getStatusStyle(co.status)}`}>
                      <RefreshCw size={28} className={co.status === 'Pending' ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                      <div className="font-black text-zinc-900 text-lg uppercase tracking-tight group-hover:text-primary transition-colors">{co.title}</div>
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Ref: {co.number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-10">
                  <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border flex items-center gap-2.5 w-fit ${getStatusStyle(co.status)}`}>
                    {co.status === 'Approved' ? <ShieldCheck size={14} /> : co.status === 'Pending' ? <Clock size={14} /> : <AlertTriangle size={14} />}
                    {co.status} State
                  </span>
                </td>
                <td className="px-10 py-10 font-mono text-xs font-black text-zinc-500 uppercase tracking-tighter">
                  {new Date(co.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                </td>
                <td className="px-10 py-10">
                  <div className="font-black text-xl text-zinc-900 tracking-tighter">£{co.amount.toLocaleString()}</div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">Shard Valuation</p>
                </td>
                <td className="px-10 py-10">
                  <div className={`font-black text-xl tracking-tighter ${co.scheduleImpactDays > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {co.scheduleImpactDays > 0 ? `+${co.scheduleImpactDays}` : co.scheduleImpactDays} Days
                  </div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">Drift Analysis</p>
                </td>
                <td className="px-10 py-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-2">
                        <button className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-90" title="Inspect Node">
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-10 py-48 text-center">
                  <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-100 shadow-inner ring-8 ring-zinc-50">
                        <RefreshCw size={48} className="opacity-10" />
                    </div>
                    <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.4em] text-sm text-zinc-900">Change Ledger Empty</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest max-w-[250px] mx-auto leading-relaxed">No scope variations identified in current cluster registry.</p>
                    </div>
                    <button onClick={onAdd} className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">Initialize Genesis Change</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChangeOrdersView;
