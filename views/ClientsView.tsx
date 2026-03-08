
import React, { useState, useMemo } from 'react';
import { 
  Building, Phone, Mail, MoreHorizontal, Star, Plus, X, Search, 
  Activity, Calendar, PoundSterling, MessageSquare, CheckCircle2, 
  Clock, ArrowRight, ShieldCheck, FileText, ExternalLink,
  ChevronRight, Briefcase, User, Globe, Layout, Target, Zap,
  // Added missing imports
  Users, ScanLine, RefreshCw
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Client, Project, Invoice } from '../types';

const ClientsView: React.FC = () => {
  const { clients, addClient, projects, invoices } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Form State
  const [newClient, setNewClient] = useState<Partial<Client>>({ status: 'Active', tier: 'Silver' });

  const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId)
  , [clients, selectedClientId]);

  // Dynamic Activity Feed Logic
  const clientActivity = useMemo(() => {
    if (!selectedClient) return [];

    // Since we don't have a direct clientId on Projects/Invoices in the core types yet,
    // we'll intelligently synthesize a feed based on company context and simulated links.
    // In a real prod env, these would be indexed database lookups.
    
    const clientProjects = projects.slice(0, selectedClient.activeProjects);
    const projectIds = clientProjects.map(p => p.id);
    const clientInvoices = invoices.filter(inv => projectIds.includes(inv.projectId));

    const events = [
        ...clientProjects.map(p => ({
            id: `p-${p.id}`,
            type: 'PROJECT',
            title: p.name,
            desc: `Project status updated to ${p.status}. Progression at ${p.progress}%`,
            date: p.startDate,
            status: p.health,
            icon: Target,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        })),
        ...clientInvoices.map(inv => ({
            id: `inv-${inv.id}`,
            type: 'FINANCIAL',
            title: `Invoice ${inv.invoiceNumber}`,
            desc: `Payment of £${inv.amount.toLocaleString()} marked as ${inv.status}.`,
            date: inv.createdAt,
            status: inv.status,
            icon: PoundSterling,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        })),
        // Mocking communication logs as they are ephemeral/chat-based in current types
        {
            id: 'comm-1',
            type: 'COMMUNICATION',
            title: 'Q4 Review Meeting',
            desc: 'Discussed project trajectories and safety integrity scores.',
            date: new Date(Date.now() - 172800000).toISOString(),
            status: 'Logged',
            icon: MessageSquare,
            color: 'text-purple-500',
            bg: 'bg-purple-50'
        },
        {
            id: 'comm-2',
            type: 'COMMUNICATION',
            title: 'Site Access Protocol',
            desc: 'Subcontractor clearance levels verified for North sector.',
            date: new Date(Date.now() - 432000000).toISOString(),
            status: 'Verified',
            icon: ShieldCheck,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        }
    ];

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedClient, projects, invoices]);

  const handleCreate = () => {
      if (newClient.name && newClient.email) {
          const client: Client = {
              id: `c-${Date.now()}`,
              companyId: 'c1',
              name: newClient.name!,
              contactPerson: newClient.contactPerson || 'Unknown',
              role: newClient.role || 'Contact',
              email: newClient.email!,
              phone: newClient.phone || '',
              status: newClient.status as any || 'Active',
              tier: newClient.tier as any || 'Silver',
              activeProjects: 0,
              totalValue: '£0'
          };
          addClient(client);
          setShowModal(false);
          setNewClient({ status: 'Active', tier: 'Silver' });
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-1 flex items-center gap-3 tracking-tighter uppercase">
                <Building className="text-primary" /> Clients Registry
            </h1>
            <p className="text-zinc-500 font-medium text-sm uppercase tracking-widest">Sovereign CRM & Stakeholder Asset Management</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-95 group"
        >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> Register Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-10 relative max-w-xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Trace client name, custodian, or email node..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-zinc-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pb-20 custom-scrollbar pr-1">
          {filteredClients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClientId(client.id)}
                className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full ring-1 ring-transparent hover:ring-primary/10"
              >
                  <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-200 border border-zinc-100 group-hover:bg-primary group-hover:text-white transition-all shadow-inner relative ring-4 ring-white shrink-0 overflow-hidden">
                          <Building size={32} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                           client.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>{client.status}</span>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-black uppercase tracking-tighter">
                           <Star size={12} fill="currentColor" /> {client.tier} Node
                        </div>
                      </div>
                  </div>

                  <h3 className="text-2xl font-black text-zinc-900 mb-2 truncate uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{client.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Globe size={12} className="text-primary" /> Sector Integrity Verified
                  </p>

                  <div className="space-y-4 border-t border-zinc-50 pt-6">
                      <div className="flex items-center gap-4 group/owner transition-all hover:bg-zinc-50 p-2 rounded-xl">
                          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-primary shadow-sm font-black text-xs">
                              {client.contactPerson.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="overflow-hidden">
                              <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Custodian</div>
                              <div className="text-sm font-black text-zinc-800 truncate uppercase tracking-tight">{client.contactPerson}</div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-auto pt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span className="flex items-center gap-2"><Briefcase size={12} className="text-primary" /> {client.activeProjects} Projects</span>
                      <button className="text-primary hover:underline flex items-center gap-1">Open Pulse <ChevronRight size={14} /></button>
                  </div>
              </div>
          ))}
          
          {filteredClients.length === 0 && (
              <div className="col-span-full py-40 text-center bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200 flex flex-col items-center gap-6 animate-in fade-in">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-zinc-200 shadow-sm ring-8 ring-zinc-50">
                      {/* Fixed: Users icon find error */}
                      <Users size={48} />
                  </div>
                  <div>
                      <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Registry Node Empty</h3>
                      <p className="text-zinc-400 text-xs mt-2 font-medium">No clients found matching the current synthesis parameters.</p>
                  </div>
              </div>
          )}
      </div>

      {/* --- CLIENT DETAIL SIDE PANEL --- */}
      {selectedClient && (
        <div className="fixed inset-0 z-[200] bg-midnight/80 backdrop-blur-xl flex justify-end animate-in fade-in duration-300" onClick={() => setSelectedClientId(null)}>
            <div 
                className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Panel Header */}
                <div className="p-10 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-midnight rounded-3xl flex items-center justify-center text-primary shadow-2xl cortex-glow shrink-0">
                            <Building size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{selectedClient.name}</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                <Activity size={12} className="text-primary animate-pulse" /> Stakeholder Node Shard 
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedClientId(null)} className="p-3 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 rounded-full transition-all shadow-sm"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    {/* Metrics HUD */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 text-center space-y-1 shadow-inner">
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Agg. Exposure</div>
                            <div className="text-xl font-black text-zinc-900 tracking-tighter">{selectedClient.totalValue}</div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 text-center space-y-1 shadow-inner">
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Active Links</div>
                            <div className="text-xl font-black text-zinc-900 tracking-tighter">{selectedClient.activeProjects} Projects</div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 text-center space-y-1 shadow-inner">
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Tier Rank</div>
                            <div className="text-xl font-black text-amber-600 tracking-tighter uppercase">{selectedClient.tier}</div>
                        </div>
                    </div>

                    {/* DYNAMIC ACTIVITY FEED SECTION */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                {/* Fixed: ScanLine find error */}
                                <ScanLine size={18} className="text-primary" /> Forensic Activity Timeline
                            </h3>
                            <button className="text-[9px] font-black text-primary uppercase hover:underline flex items-center gap-1.5 transition-all">
                                {/* Fixed: RefreshCw find error */}
                                <RefreshCw size={12} /> Sync Ledger
                            </button>
                        </div>

                        <div className="relative space-y-10">
                            {/* Vertical Progress Line */}
                            <div className="absolute left-6 top-2 bottom-2 w-px bg-zinc-100" />

                            {clientActivity.length > 0 ? clientActivity.map((event, i) => (
                                <div key={event.id} className="relative pl-16 group animate-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    {/* Timeline Node Icon */}
                                    <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-primary/20 ${event.bg} ${event.color} z-10`}>
                                        <event.icon size={20} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-start">
                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                                {event.type} • {new Date(event.date).toLocaleDateString()}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                event.status === 'Good' || event.status === 'Paid' || event.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' :
                                                event.status === 'At Risk' || event.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                'bg-zinc-50 text-zinc-500 border-zinc-200'
                                            }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-zinc-900 uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                                        <p className="text-sm text-zinc-500 font-medium leading-relaxed italic pr-8">"{event.desc}"</p>
                                        
                                        <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-[9px] font-black text-[#0f5c82] uppercase tracking-widest flex items-center gap-1 hover:underline">
                                                View Source <ExternalLink size={10} />
                                            </button>
                                            <div className="h-3 w-px bg-zinc-200" />
                                            <button className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1 hover:text-zinc-600">
                                                Log Inquiry <MessageSquare size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4 bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200 mx-2">
                                    <Activity size={32} className="text-zinc-300 animate-pulse" />
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No site activity nodes detected.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custodian Details */}
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group/custodian">
                        {/* Fixed: UserIcon find error changed to User */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/custodian:scale-110 transition-transform duration-1000"><User size={120} /></div>
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 relative z-10"><User size={14} /> Primary Custodian</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary font-black border border-white/10">{selectedClient.contactPerson.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                    <div className="text-lg font-black tracking-tight uppercase leading-none">{selectedClient.contactPerson}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase mt-1.5 font-bold tracking-widest">{selectedClient.role}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                    <Mail size={16} className="text-primary" />
                                    <span className="font-medium">{selectedClient.email}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                    <Phone size={16} className="text-primary" />
                                    <span className="font-medium">{selectedClient.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t bg-zinc-50/50 flex gap-4 shrink-0">
                    <button className="flex-1 py-5 bg-white border border-zinc-200 text-zinc-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <Layout size={18} /> CRM Profile
                    </button>
                    <button className="flex-1 py-5 bg-zinc-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 group">
                        <Zap size={18} className="text-yellow-400 fill-current group-hover:scale-110 transition-transform" /> Neural Briefing
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-midnight/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                  <div className="p-10 border-b bg-zinc-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-blue-900/20">
                              <Building size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight leading-none">Stakeholder Genesis</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Initialize new registry node</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-3 hover:bg-red-50 text-zinc-400 rounded-full transition-all border border-transparent hover:border-red-100"><X size={24} /></button>
                  </div>
                  <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Entity Identity</label>
                          <input type="text" className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase" placeholder="Entity Legal Name" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Custodian</label>
                              <input type="text" className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Sarah Mitchell" value={newClient.contactPerson || ''} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Designation</label>
                              <input type="text" className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Project Director" value={newClient.role || ''} onChange={e => setNewClient({...newClient, role: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Endpoint Email</label>
                              <input type="email" className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="sarah@entity.io" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Rank</label>
                              <select className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer uppercase" value={newClient.tier} onChange={e => setNewClient({...newClient, tier: e.target.value as any})}>
                                  <option value="Platinum">Platinum (High Capacity)</option>
                                  <option value="Gold">Gold (Standard)</option>
                                  <option value="Silver">Silver (Entry)</option>
                                  <option value="Government">Government (Regulated)</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Lifecycle State</label>
                              <select className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer uppercase" value={newClient.status} onChange={e => setNewClient({...newClient, status: e.target.value as any})}>
                                  <option value="Active">Active Subscription</option>
                                  <option value="Lead">Lead Optimization</option>
                                  <option value="Inactive">Decommissioned</option>
                              </select>
                          </div>
                      </div>
                  </div>
                  <div className="p-10 border-t bg-zinc-50/50 flex justify-end gap-4 shrink-0">
                      <button onClick={handleCreate} disabled={!newClient.name || !newClient.email} className="w-full py-5 bg-zinc-900 text-white rounded-[1.75rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30">Commit Shard Registry</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClientsView;
