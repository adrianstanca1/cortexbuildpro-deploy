import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, Clock, 
  PoundSterling, ChevronRight, CheckCircle2, 
  AlertCircle, XCircle, MoreHorizontal, 
  ArrowUpRight, Download, Sparkles, Loader2,
  Calendar, Building2, Eye, ShieldCheck, Trash2,
  ListPlus, MinusCircle, Wallet, ArrowRight, BrainCircuit,
  Upload, Camera, ScanLine, Info, Activity, Link as LinkIcon,
  CheckSquare, Tag, Hammer, Receipt, Zap, ChevronDown, X,
  Maximize2, FileSearch, Scale, Save, PlusCircle,
  AlertTriangle, GitMerge, Check, Box, Target, Layout
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Invoice, Project, Task } from '../types';

interface InvoicesViewProps {
  projectId?: string;
  onAdd?: () => void;
  onEdit?: (invoice: Invoice) => void;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ projectId, onAdd, onEdit }) => {
  const { invoices, updateInvoice, deleteInvoice, projects } = useProjects();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (projectId) list = list.filter(i => i.projectId === projectId);
    if (statusFilter !== 'All') list = list.filter(i => i.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => 
        i.vendorName.toLowerCase().includes(q) || 
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, projectId, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);
    const pending = filteredInvoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
    const overdueCount = filteredInvoices.filter(i => i.status === 'Overdue').length;
    return { total, pending, overdueCount };
  }, [filteredInvoices]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Purge this financial record from the cluster? This action is immutable.")) {
        await deleteInvoice(id);
    }
  };

  const handleUpdateStatus = async (id: string, status: Invoice['status'], e: React.MouseEvent) => {
    e.stopPropagation();
    await updateInvoice(id, { status });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-100 animate-pulse';
      case 'Pending': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Approved': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Rejected': return 'bg-zinc-50 text-zinc-500 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Financial Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-zinc-950 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 group relative overflow-hidden">
             <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-10 transition-opacity" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><PoundSterling size={120} /></div>
             <div className="relative z-10">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-primary animate-pulse" /> Portfolio Capital Shard
                </div>
                <div className="text-5xl font-black tracking-tighter">£{stats.total.toLocaleString()}</div>
                <div className="mt-6 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">Aggregated Master Ledger</span>
                </div>
             </div>
         </div>
         <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm group relative overflow-hidden ring-1 ring-transparent hover:ring-orange-500/10 transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Clock size={120} className="text-orange-500" /></div>
             <div className="relative z-10">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Pending Authorization</div>
                <div className="text-5xl font-black text-orange-600 tracking-tighter">£{stats.pending.toLocaleString()}</div>
                <div className="mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_orange]"></div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Forensic Verification Required</span>
                </div>
             </div>
         </div>
         <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-sm group relative overflow-hidden ring-1 ring-transparent hover:ring-red-500/10 transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5"><AlertCircle size={120} className="text-red-500" /></div>
             <div className="relative z-10">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Breach Delta</div>
                <div className="text-5xl font-black text-red-600 tracking-tighter">{stats.overdueCount}</div>
                <div className="mt-6 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocol Variance Alert</span>
                </div>
             </div>
         </div>
      </div>

      {/* Ledger Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm">
        <div className="flex-1 flex items-center gap-6 w-full">
            <div className="relative flex-1 group">
                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="Trace ledger node by vendor identity or reference..." className="w-full pl-16 pr-8 py-5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-primary/5 transition-all outline-none shadow-inner" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-[1.5rem] border border-zinc-200 overflow-x-auto no-scrollbar shadow-inner">
                {(['All', 'Pending', 'Approved', 'Paid', 'Overdue'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === f ? 'bg-white text-zinc-900 shadow-md border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'}`}>{f}</button>
                ))}
            </div>
        </div>
        <div className="flex gap-4 shrink-0">
            <button 
                onClick={onAdd}
                className="px-10 py-5 bg-[#0f5c82] text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-[#0c4a6e] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
                <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" /> Initialize Invoice Node
            </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-8 border-b bg-zinc-50/50 flex justify-between items-center">
              <div className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <ScanLine size={16} className="text-primary" /> Active Ledger Shards
              </div>
              <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full border border-zinc-200">{filteredInvoices.length} LOGGED NODES</span>
          </div>
          <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Vendor / Shard Node</th>
                    <th className="px-10 py-6">Protocol State</th>
                    <th className="px-10 py-6">Target Settlement</th>
                    <th className="px-10 py-6">Linked Objectives</th>
                    <th className="px-10 py-6 text-right">Agg. Valuation</th>
                    <th className="px-10 py-6"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                  {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 transition-all group cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                          <td className="px-10 py-10">
                              <div className="flex items-center gap-6">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-inner group-hover:scale-110 ${getStatusStyle(inv.status)}`}>
                                      <Receipt size={28} />
                                  </div>
                                  <div className="min-w-0">
                                      <div className="font-black text-zinc-900 text-lg uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{inv.vendorName}</div>
                                      <div className="flex items-center gap-2 mt-2">
                                          <code className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200 font-mono tracking-widest uppercase font-black">{inv.invoiceNumber}</code>
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-10 py-10">
                              <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border flex items-center gap-3 w-fit shadow-inner ${getStatusStyle(inv.status)}`}>
                                {inv.status === 'Paid' ? <CheckCircle2 size={14} className="text-emerald-500" /> : inv.status === 'Overdue' ? <AlertTriangle size={14} className="text-red-500" /> : <Clock size={14} className="text-blue-500" />}
                                {inv.status} Node
                              </span>
                          </td>
                          <td className="px-10 py-10">
                              <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 text-sm font-black text-zinc-800 tracking-tight uppercase">
                                      <Calendar size={16} className="text-primary" />
                                      {new Date(inv.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-6">Financial Window</span>
                              </div>
                          </td>
                          <td className="px-10 py-10">
                              <div className="flex flex-wrap gap-2 max-w-[200px]">
                                  {inv.linkedTaskIds?.slice(0, 3).map(tid => (
                                      <span key={tid} className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-500 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm hover:border-primary hover:text-primary transition-colors">
                                          OBJ-{tid.slice(-4).toUpperCase()}
                                      </span>
                                  ))}
                                  {inv.linkedTaskIds && inv.linkedTaskIds.length > 3 && (
                                      <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-[9px] font-black">+{inv.linkedTaskIds.length - 3}</span>
                                  )}
                                  {(!inv.linkedTaskIds || inv.linkedTaskIds.length === 0) && (
                                      <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest italic">No Objective Mappings</span>
                                  )}
                              </div>
                          </td>
                          <td className="px-10 py-10 text-right">
                              <div className="font-black text-2xl text-zinc-900 tracking-tighter group-hover:text-primary transition-colors">£{inv.amount.toLocaleString()}</div>
                              <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">Agg. Shard Value</p>
                          </td>
                          <td className="px-10 py-10 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                  {inv.status === 'Pending' && (
                                      <button 
                                        onClick={(e) => handleUpdateStatus(inv.id, 'Approved', e)}
                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-xl shadow-emerald-900/10 active:scale-90"
                                        title="Approve Settlement"
                                      >
                                          <Check size={20} strokeWidth={3} />
                                      </button>
                                  )}
                                  <button 
                                    onClick={(e) => handleDelete(inv.id, e)}
                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-xl shadow-emerald-900/10 active:scale-90"
                                    title="Purge Shard"
                                  >
                                      <Trash2 size={20} />
                                  </button>
                                  <button className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-primary transition-all shadow-2xl active:scale-90 border border-white/10">
                                      <Maximize2 size={20} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-10 py-48 text-center text-zinc-400">
                              <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
                                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-100 shadow-inner ring-8 ring-zinc-50">
                                      <Receipt size={48} className="opacity-10" />
                                  </div>
                                  <div className="space-y-2">
                                      <p className="font-black uppercase tracking-[0.4em] text-sm text-zinc-900">Ledger Shard Empty</p>
                                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest max-w-[250px] mx-auto leading-relaxed">No matching financial artifacts identified in the current cluster registry.</p>
                                  </div>
                                  <button onClick={onAdd} className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">Initialize Genesis Ledger</button>
                              </div>
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* Deep Forensic Detail View Overlay */}
      {selectedInvoice && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[200] flex justify-end animate-in fade-in duration-300" onClick={() => setSelectedInvoice(null)}>
              <div 
                className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden border-l border-zinc-200"
                onClick={e => e.stopPropagation()}
              >
                  <div className="p-10 border-b bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-midnight rounded-3xl flex items-center justify-center text-primary shadow-2xl cortex-glow shrink-0">
                             <Receipt size={32} />
                          </div>
                          <div>
                              <h3 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{selectedInvoice.invoiceNumber}</h3>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                  <Activity size={12} className="text-primary animate-pulse" /> Financial Node Shard Summary
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedInvoice(null)} className="p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-full transition-all shadow-sm"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                      <div className="space-y-12">
                          <div className="space-y-4">
                              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><Target size={14} className="text-primary" /> Vendor Shard</div>
                              <h2 className="text-5xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{selectedInvoice.vendorName}</h2>
                              <p className="text-sm text-zinc-500 font-medium italic pr-12 leading-relaxed">"{selectedInvoice.description || 'No technical narrative provided for this financial node.'}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                              <div className="p-8 bg-zinc-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000"><PoundSterling size={80} /></div>
                                  <div className="relative z-10">
                                      <div className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-4">Node Valuation</div>
                                      <div className="text-4xl font-black tracking-tighter text-primary">£{selectedInvoice.amount.toLocaleString()}</div>
                                      <div className="mt-6 flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${selectedInvoice.status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-500'} shadow-lg shadow-current`} />
                                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{selectedInvoice.status} Node</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-inner relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Clock size={80} /></div>
                                  <div className="relative z-10">
                                      <div className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Settlement Lock</div>
                                      <div className="text-2xl font-black text-zinc-900 uppercase tracking-tight">{new Date(selectedInvoice.dueDate).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}</div>
                                      <div className="mt-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Temporal Window Closing</div>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><Layout size={14} className="text-primary" /> Shard Line Items</h4>
                              <div className="space-y-3">
                                  {selectedInvoice.items?.map((item, i) => (
                                      <div key={i} className="flex justify-between items-center p-6 bg-zinc-50 border border-zinc-100 rounded-3xl hover:bg-white hover:shadow-xl hover:border-primary transition-all group/item">
                                          <div className="min-w-0">
                                              <div className="font-black text-sm text-zinc-800 uppercase tracking-tight truncate group-hover/item:text-primary transition-colors">{item.description}</div>
                                              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                                  <span>{item.quantity} Nodes</span>
                                                  <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                                                  <span>£{item.unitPrice.toLocaleString()} / Node</span>
                                              </div>
                                          </div>
                                          <div className="font-black text-lg text-zinc-900 tracking-tighter ml-6">£{item.total.toLocaleString()}</div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {selectedInvoice.aiAuditNotes && (
                              <div className="p-8 bg-midnight text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group/audit border border-white/5 ring-1 ring-white/10">
                                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/audit:scale-150 transition-transform duration-[3000ms]"><BrainCircuit size={100} /></div>
                                  <div className="relative z-10">
                                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                          <ShieldCheck size={16} className="text-emerald-400" /> Forensic Intelligence Synthesis
                                      </h3>
                                      <p className="text-sm text-zinc-300 leading-relaxed font-medium italic pr-6">"{selectedInvoice.aiAuditNotes}"</p>
                                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10"><Zap size={20} className="fill-current" /></div>
                                          <div>
                                              <div className="text-[9px] font-black text-primary uppercase tracking-widest">Auditor Logic Rank</div>
                                              <div className="text-xs font-black uppercase text-white">Sovereign Shard v4.5 Active</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {selectedInvoice.linkedTaskIds && selectedInvoice.linkedTaskIds.length > 0 && (
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><GitMerge size={14} className="text-primary" /> Traceable Objective Lattice</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedInvoice.linkedTaskIds.map(tid => (
                                        <div key={tid} className="flex items-center justify-between p-5 bg-zinc-50 border border-zinc-100 rounded-3xl hover:bg-white hover:shadow-lg transition-all group/link">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-primary rounded-2xl shadow-inner border border-blue-100 group-hover/link:bg-primary group-hover/link:text-white transition-all"><CheckSquare size={18} /></div>
                                                <div>
                                                    <div className="text-xs font-black text-zinc-800 uppercase tracking-tight leading-none mb-1">Node Reference: {tid.slice(-8).toUpperCase()}</div>
                                                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Site Progression Shard</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-zinc-300 group-hover/link:text-primary group-hover/link:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                          )}
                      </div>
                  </div>

                  <div className="p-10 border-t bg-zinc-50/50 flex gap-4 shrink-0">
                      <button className="flex-1 py-5 bg-white border border-zinc-200 text-zinc-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                          <Download size={18} /> Shard Export PDF
                      </button>
                      {selectedInvoice.status !== 'Paid' && (
                          <button 
                            onClick={(e) => handleUpdateStatus(selectedInvoice.id, 'Paid', e)}
                            className="flex-1 py-5 bg-zinc-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
                          >
                            <ShieldCheck size={18} className="text-emerald-400 group-hover/btn:scale-110 transition-transform" /> Confirm Node Settlement
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InvoicesView;
