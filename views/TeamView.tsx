import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Users, LayoutGrid, List as ListIcon, Search, Filter, 
  Phone, Mail, MapPin, Award, Star, Briefcase, X, 
  FileText, Loader2, Tag, Sparkles, Copy, UserCheck, Upload, Trash2, Eye, Globe,
  ShieldCheck, ShieldPlus, UserPlus, ArrowRight, ShieldAlert, Zap, AlertTriangle,
  Activity, ChevronRight, ChevronDown, Maximize2, CheckCircle, BrainCircuit,
  Lock, Shield, Terminal, Info
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember, Certification, UserRole, Permission, ROLE_PERMISSIONS } from '../types';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface TeamViewProps {
  projectId?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'On Site': 'bg-green-100 text-green-700',
        'Off Site': 'bg-zinc-100 text-zinc-600',
        'On Break': 'bg-blue-100 text-blue-700',
        'Leave': 'bg-orange-100 text-orange-700'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-zinc-100 text-zinc-600'}`}>
            {status || 'Unknown'}
        </span>
    );
};

const UserCard: React.FC<{ member: TeamMember; onClick: () => void; showCompany: boolean }> = ({ member, onClick, showCompany }) => {
    if (!member) return null;
    
    const status = member.status || 'Unknown';
    const name = member.name || 'Unknown Member';
    const roleLabel = member.role.replace('_', ' ');
    const color = member.color || 'bg-zinc-400';
    const initials = member.initials || '??';
    const projectName = member.projectName || 'Unassigned';
    const phone = member.phone || 'No phone';
    const certCount = member.certifications?.length || 0;

    return (
    <div onClick={onClick} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden hover:border-primary flex flex-col h-full ring-1 ring-transparent hover:ring-primary/10">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${status === 'On Site' ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
        
        <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center text-sm font-black shadow-lg ring-4 ring-white`}>
                {initials}
            </div>
            <div className="flex flex-col items-end gap-2">
                <StatusBadge status={status} />
                {member.role === UserRole.COMPANY_OWNER && <span className="bg-amber-50 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-100 shadow-sm">Sovereign Owner</span>}
                {member.role === UserRole.COMPANY_ADMIN && <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm">Tenant Admin</span>}
            </div>
        </div>
        
        <div className="flex-1">
            <h3 className="text-xl font-black text-zinc-900 mb-1 group-hover:text-primary transition-colors truncate uppercase tracking-tight">{name}</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">{roleLabel}</p>
            
            <div className="space-y-3 text-sm text-zinc-600">
                {showCompany && (
                    <div className="flex items-center gap-3">
                        <Globe size={14} className="text-purple-500" />
                        <span className="truncate font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg text-[10px] uppercase">{member.companyId}</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Briefcase size={14} className="text-zinc-400" />
                    <span className="truncate text-xs font-medium">{projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Phone size={14} className="text-zinc-400" />
                    <span className="text-xs font-mono">{phone}</span>
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-50 flex justify-between items-center">
            <div className="flex gap-2">
                {certCount > 0 ? (
                    <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1 font-black uppercase border border-blue-100">
                        <Award size={10} /> {certCount} Docs
                    </span>
                ) : (
                    <span className="text-[9px] bg-zinc-50 text-zinc-400 px-2 py-1 rounded-lg flex items-center gap-1 font-black uppercase border border-zinc-100">
                        No Docs
                    </span>
                )}
                {member.performanceRating !== undefined && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg flex items-center gap-1 font-black uppercase border border-emerald-100">
                        <Activity size={10} /> {member.performanceRating}%
                    </span>
                )}
            </div>
            <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
    </div>
    );
};

const TeamView: React.FC<TeamViewProps> = ({ projectId }) => {
  const { teamMembers, isLoading, addTeamMember, updateTeamMember, deleteTeamMember } = useProjects();
  const { user, can } = useAuth();
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showRbacAudit, setShowRbacAudit] = useState(false);
  const [isAuditingRbac, setIsAuditingRbac] = useState(false);
  const [rbacAuditResult, setRbacAuditResult] = useState<any>(null);
  
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const canManageTeam = can(Permission.TENANT_IDENTITY_ADMIN);
  const canSovereignManage = can(Permission.TENANT_SOVEREIGN_OPS);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    role: UserRole.OPERATIVE,
    email: '',
    phone: '',
    skills: '',
    location: ''
  });
  const [newCerts, setNewCerts] = useState<Certification[]>([]);
  const [pendingCert, setPendingCert] = useState<Partial<Certification>>({ name: '', issuer: '', expiryDate: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useMemo(() => {
      if (!teamMembers || !Array.isArray(teamMembers)) return [];
      let members = teamMembers;
      if (projectId) members = members.filter(m => m.projectId === projectId);
      if (isSuperAdmin && companyFilter !== 'All') members = members.filter(m => m.companyId === companyFilter);
      return members.filter(m => {
          if (!m) return false;
          const nameMatch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase());
          const roleMatch = (m.role || '').toLowerCase().includes(searchQuery.toLowerCase());
          return nameMatch || roleMatch;
      });
  }, [teamMembers, searchQuery, projectId, companyFilter, isSuperAdmin]);

  const handleCreateMember = () => {
    if (!newMemberData.name) return;
    const initials = newMemberData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        companyId: user?.companyId || 'c1',
        name: newMemberData.name,
        initials: initials,
        role: newMemberData.role,
        status: 'Off Site',
        projectId: projectId, 
        phone: newMemberData.phone || '',
        email: newMemberData.email || '',
        color: randomColor,
        location: newMemberData.location || '',
        skills: newMemberData.skills ? newMemberData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
        joinDate: new Date().toISOString().split('T')[0],
        performanceRating: 100,
        completedProjects: 0,
        certifications: newCerts
    };

    addTeamMember(newMember);
    setShowAddModal(false);
    setNewMemberData({ name: '', role: UserRole.OPERATIVE, email: '', phone: '', skills: '', location: '' });
    setNewCerts([]);
  };

  const handleUpdateRole = async (targetRole: UserRole) => {
    if (!selectedMember || !canManageTeam) return;

    // RBAC Hierarchy Enforcement
    const isPlatformStaff = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.SUPPORT_ADMIN;
    
    // Only platform staff can modify owners
    if (selectedMember.role === UserRole.COMPANY_OWNER && !isPlatformStaff) {
        alert("Sovereign Protection: Owner identities are restricted.");
        return;
    }

    // Admins cannot promote to Owner or modify Peer Admins
    if (!isPlatformStaff && !canSovereignManage) {
        if (targetRole === UserRole.COMPANY_OWNER) {
            alert("Protocol Violation: Role escalation to Sovereign Owner requires root clearance.");
            return;
        }
        if (selectedMember.role === UserRole.COMPANY_ADMIN && targetRole !== selectedMember.role) {
            alert("Hierarchical Block: Peer identity transitions require Owner authorization.");
            return;
        }
    }

    if (window.confirm(`Protocol Transition: Confirm identity node shift to ${targetRole.replace('_', ' ').toUpperCase()}?`)) {
        await updateTeamMember(selectedMember.id, { role: targetRole });
        setSelectedMember({ ...selectedMember, role: targetRole });
    }
  };

  const handleRbacAudit = async () => {
    setIsAuditingRbac(true);
    setShowRbacAudit(true);
    try {
        const teamData = teamMembers.map(m => ({ name: m.name, role: m.role, status: m.status }));
        const prompt = `
            Analyze the current RBAC cluster: ${JSON.stringify(teamData)}
            Identify logic bottlenecks (too many admins, missing supervisors). propose 3 optimizations.
            Return valid JSON: { "integrityScore": number, "observations": [], "roleMatrix": {} }
        `;
        const res = await runRawPrompt(prompt, { 
          model: 'gemini-3-pro-preview', 
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 32768 } // Deep audit reasoning
        });
        setRbacAuditResult(parseAIJSON(res));
    } catch (e) {
        console.error(e);
    } finally {
        setIsAuditingRbac(false);
    }
  };

  if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
  }

  const companyOptions = Array.from(new Set(teamMembers.map(m => m.companyId)));

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative h-full flex flex-col space-y-10 animate-in fade-in duration-500 pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 mb-1 flex items-center gap-4 tracking-tighter uppercase leading-none">
               <Users className="text-primary" size={36} /> {projectId ? 'Project Personnel' : isSuperAdmin ? 'Identity Registry' : 'Identity Mesh'}
            </h1>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-2">Manage workforce assignments, RBAC escalation, and qualification telemetry.</p>
          </div>
          
          <div className="flex items-center gap-4">
              <button 
                onClick={handleRbacAudit}
                className="flex items-center gap-3 bg-zinc-100 text-zinc-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200"
              >
                <ShieldCheck size={18} /> RBAC Audit
              </button>
              <div className="bg-zinc-100 p-1.5 rounded-2xl flex border border-zinc-200 shadow-inner">
                  <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-white shadow-md text-primary' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                      <LayoutGrid size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-white shadow-md text-primary' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                      <ListIcon size={20} />
                  </button>
              </div>
              {canManageTeam && (
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 group"
                >
                    <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Add Identity Node
                </button>
              )}
          </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Search mesh by name, role, or technical keywords..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
              />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
              {isSuperAdmin && (
                  <div className="relative">
                      <select 
                          value={companyFilter}
                          onChange={(e) => setCompanyFilter(e.target.value)}
                          className="appearance-none pl-10 pr-12 py-4 bg-zinc-100 border border-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-600 focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                      >
                          <option value="All">All Entities</option>
                          {companyOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                  </div>
              )}
              <button className="flex items-center gap-3 px-8 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 border border-zinc-200 transition-all">
                  <Filter size={18} /> Filters
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredMembers.map(member => (
                  <UserCard key={member.id} member={member} onClick={() => setSelectedMember(member)} showCompany={isSuperAdmin} />
              ))}
          </div>
      </div>

      {showRbacAudit && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowRbacAudit(false)}>
              <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-midnight text-primary rounded-2xl shadow-xl">
                              <Shield size={32} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">RBAC Intelligence Audit</h3>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                  <BrainCircuit size={12} className="text-primary animate-pulse" /> Gemini Pro Forensic Analysis
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setShowRbacAudit(false)} className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-zinc-50/30">
                      {isAuditingRbac ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-6 animate-pulse">
                              <div className="relative">
                                  <div className="w-24 h-24 border-4 border-zinc-200 border-t-primary rounded-full animate-spin" />
                                  <Zap size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400" />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Auditing logic shards...</p>
                          </div>
                      ) : rbacAuditResult ? (
                          <div className="space-y-10 animate-in slide-in-from-bottom-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-white p-8 rounded-3xl border border-zinc-200 text-center shadow-sm">
                                      <div className="text-5xl font-black text-primary tracking-tighter mb-1">{rbacAuditResult.integrityScore}%</div>
                                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mesh Integrity</div>
                                  </div>
                                  <div className="bg-white p-8 rounded-3xl border border-zinc-200 text-center shadow-sm col-span-2">
                                      <div className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 justify-center"><Info size={14} /> Shard Recommendation</div>
                                      <p className="text-sm font-medium italic text-zinc-600">"Current identity distribution indicates an over-concentration of Admin nodes. Suggest sharding roles to more Supervisors."</p>
                                  </div>
                              </div>

                              <div className="space-y-6">
                                  <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-zinc-100 pb-3"><Terminal size={14} /> Logic Observations</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {rbacAuditResult.observations?.map((obs: string, i: number) => (
                                          <div key={i} className="p-4 bg-white border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-700 uppercase tracking-tight flex items-start gap-3">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                              {obs}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ) : null}
                  </div>
                  
                  <div className="p-10 border-t bg-zinc-50 flex justify-end">
                      <button onClick={() => setShowRbacAudit(false)} className="px-12 py-5 bg-zinc-950 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-primary active:scale-95 transition-all">Close Audit Shard</button>
                  </div>
              </div>
          </div>
      )}

      {selectedMember && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[250] flex justify-end transition-opacity" onClick={() => setSelectedMember(null)}>
              <div 
                className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                  <div className="relative shrink-0">
                      <button onClick={() => setSelectedMember(null)} className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all z-20 backdrop-blur-md">
                          <X size={24} />
                      </button>
                      <div className="h-40 bg-gradient-to-r from-midnight via-[#0f5c82] to-primary overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                      </div>
                      <div className="px-10 -mt-16 mb-8 relative z-10 flex justify-between items-end">
                          <div className={`w-32 h-32 rounded-[2.5rem] ${selectedMember.color || 'bg-zinc-400'} text-white flex items-center justify-center text-4xl font-black border-8 border-white shadow-2xl ring-1 ring-zinc-200`}>
                              {selectedMember.initials}
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-10 space-y-12 pb-20 custom-scrollbar bg-white">
                      {canManageTeam && (
                          <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group/rbac">
                              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/rbac:scale-110 transition-transform duration-1000"><ShieldPlus size={80} /></div>
                              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                  <ShieldCheck size={14} className="text-emerald-400" /> Identity Transition Protocol
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE].map(role => {
                                      const isCurrent = selectedMember.role === role;
                                      const isPeerAdmin = user?.role === UserRole.COMPANY_ADMIN && selectedMember.role === UserRole.COMPANY_ADMIN;
                                      const disabled = isCurrent || (user?.role === UserRole.COMPANY_ADMIN && role === UserRole.COMPANY_ADMIN && !isCurrent) || isPeerAdmin;
                                      return (
                                          <button 
                                            key={role}
                                            onClick={() => handleUpdateRole(role)}
                                            disabled={disabled}
                                            className={`py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${
                                                isCurrent 
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 cursor-default' 
                                                : disabled ? 'bg-white/5 border-white/5 text-zinc-600 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary active:scale-95'
                                            }`}
                                          >
                                              {isCurrent && <CheckCircle size={16} />}
                                              {role.replace('_', ' ')}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeamView;
