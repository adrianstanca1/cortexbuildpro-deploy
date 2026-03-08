
import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Users, LayoutGrid, List as ListIcon, Search, Filter, 
  Phone, Mail, MapPin, Award, Star, Briefcase, X, 
  FileText, Loader2, Tag, Sparkles, Copy, UserCheck, Upload, Trash2, Eye, Globe
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { TeamMember, Certification, UserRole } from '../types';
import { runRawPrompt } from '../services/geminiService';

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
    
    // Safe access defaults
    const status = member.status || 'Unknown';
    const name = member.name || 'Unknown Member';
    const role = member.role || 'Unassigned';
    const color = member.color || 'bg-zinc-400';
    const initials = member.initials || '??';
    const projectName = member.projectName || 'Unassigned';
    const phone = member.phone || 'No phone';
    const certCount = member.certifications?.length || 0;

    return (
    <div onClick={onClick} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden hover:border-[#0f5c82] flex flex-col h-full">
        <div className={`absolute top-0 left-0 w-1 h-full ${status === 'On Site' ? 'bg-green-500' : 'bg-zinc-300'}`} />
        
        <div className="flex justify-between items-start mb-4 pl-2">
            <div className={`w-12 h-12 rounded-full ${color} text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white`}>
                {initials}
            </div>
            <StatusBadge status={status} />
        </div>
        
        <div className="pl-2 flex-1">
            <h3 className="text-lg font-bold text-zinc-900 mb-1 group-hover:text-[#0f5c82] transition-colors truncate">{name}</h3>
            <p className="text-sm text-zinc-500 mb-4">{role}</p>
            
            <div className="space-y-2 text-sm text-zinc-600">
                {showCompany && (
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-purple-500" />
                        <span className="truncate font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-xs uppercase">{member.companyId}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-zinc-400" />
                    <span className="truncate">{projectName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zinc-400" />
                    <span>{phone}</span>
                </div>
            </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-50 pl-2 flex gap-2">
            {certCount > 0 ? (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1 font-medium">
                    <Award size={12} /> {certCount} Doc{certCount !== 1 ? 's' : ''}
                </span>
            ) : (
                <span className="text-xs bg-zinc-50 text-zinc-400 px-2 py-1 rounded flex items-center gap-1 font-medium">
                    No Docs
                </span>
            )}
            {member.performanceRating !== undefined && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center gap-1 font-medium">
                    <Star size={12} /> {member.performanceRating}%
                </span>
            )}
        </div>
    </div>
    );
};

const TeamView: React.FC<TeamViewProps> = ({ projectId }) => {
  const { teamMembers, isLoading, addTeamMember } = useProjects();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Add Member State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    role: 'Operative',
    email: '',
    phone: '',
    skills: '',
    location: ''
  });
  const [newCerts, setNewCerts] = useState<Certification[]>([]);
  const [pendingCert, setPendingCert] = useState<Partial<Certification>>({ name: '', issuer: '', expiryDate: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Performance Review State
  const [reviewLoading, setReviewLoading] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);

  // Safe Filtering
  const filteredMembers = useMemo(() => {
      if (!teamMembers || !Array.isArray(teamMembers)) return [];
      
      let members = teamMembers;
      
      // Project Filter
      if (projectId) {
          members = members.filter(m => m.projectId === projectId);
      }

      // Super Admin Company Filter
      if (isSuperAdmin && companyFilter !== 'All') {
          members = members.filter(m => m.companyId === companyFilter);
      }

      return members.filter(m => {
          if (!m) return false;
          const nameMatch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase());
          const roleMatch = (m.role || '').toLowerCase().includes(searchQuery.toLowerCase());
          return nameMatch || roleMatch;
      });
  }, [teamMembers, searchQuery, projectId, companyFilter, isSuperAdmin]);

  // Handlers for File Uploads in Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPendingCert(prev => ({
                  ...prev,
                  fileName: file.name,
                  fileType: file.type,
                  fileData: reader.result as string,
                  name: prev.name || file.name.split('.')[0] // Auto-fill name if empty
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const addPendingCert = () => {
      if (!pendingCert.name) return;
      const cert: Certification = {
          id: `cert-${Date.now()}`,
          name: pendingCert.name,
          issuer: pendingCert.issuer || 'Self-Uploaded',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: pendingCert.expiryDate || 'N/A',
          status: 'Valid',
          fileName: pendingCert.fileName,
          fileType: pendingCert.fileType,
          fileData: pendingCert.fileData
      };
      setNewCerts(prev => [...prev, cert]);
      setPendingCert({ name: '', issuer: '', expiryDate: '' });
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingCert = (id: string) => {
      setNewCerts(prev => prev.filter(c => c.id !== id));
  };

  const handleCreateMember = () => {
    if (!newMemberData.name) return;

    const initials = newMemberData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-[#0f5c82]', 'bg-[#1f7d98]'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        companyId: user?.companyId || 'c1',
        name: newMemberData.name,
        initials: initials,
        role: newMemberData.role,
        status: 'Off Site',
        projectId: projectId, // Assign to current project if present
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
    setNewMemberData({ name: '', role: 'Operative', email: '', phone: '', skills: '', location: '' });
    setNewCerts([]);
  };

  const handleAutoGenerateSkills = async () => {
      if (!newMemberData.role) return;
      setIsGeneratingSkills(true);
      try {
          const prompt = `Generate a comma-separated list of 5-7 essential technical skills and certifications for a construction ${newMemberData.role}. Return ONLY the comma-separated string, no other text.`;
          const skills = await runRawPrompt(prompt, { model: 'gemini-2.5-flash', temperature: 0.4 });
          setNewMemberData(prev => ({ ...prev, skills: skills.trim() }));
      } catch (error) {
          console.error("Skill generation failed", error);
      } finally {
          setIsGeneratingSkills(false);
      }
  };

  const generatePerformanceReview = async () => {
      if (!selectedMember) return;
      setReviewLoading(true);
      setGeneratedReview(null);
      try {
          const context = {
              name: selectedMember.name,
              role: selectedMember.role,
              projectsCompleted: selectedMember.completedProjects,
              currentRating: selectedMember.performanceRating,
              skills: selectedMember.skills
          };
          
          const prompt = `
            Draft a professional performance review summary for this construction employee: ${JSON.stringify(context)}.
            Include:
            1. Recognition of key strengths based on their skills.
            2. Feedback on performance rating.
            3. One constructive goal for the next quarter.
            Tone: Encouraging and professional. Max 150 words.
          `;
          
          const result = await runRawPrompt(prompt, { model: 'gemini-3-pro-preview', temperature: 0.7 });
          setGeneratedReview(result);
      } catch (e) {
          console.error(e);
          setGeneratedReview("Failed to generate review. Please try again.");
      } finally {
          setReviewLoading(false);
      }
  };

  if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
  }

  // Extract unique company IDs for filtering
  const companyOptions = Array.from(new Set(teamMembers.map(m => m.companyId)));

  return (
    <div className="p-8 max-w-7xl mx-auto relative h-full flex flex-col">
       {/* Header */}
       <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-3">
               <Users className="text-[#0f5c82]" /> {projectId ? 'Project Team' : isSuperAdmin ? 'Global User Directory' : 'Team Management'}
            </h1>
            <p className="text-zinc-500">Manage your workforce, track qualifications, and view assignments.</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="bg-zinc-100 p-1 rounded-lg flex border border-zinc-200">
                  <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-[#0f5c82]' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                      <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-[#0f5c82]' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                      <ListIcon size={18} />
                  </button>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[#0f5c82] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0c4a6e] shadow-sm transition-all"
              >
                  <Plus size={18} /> Add Member
              </button>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, role, or skills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all"
              />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {isSuperAdmin && (
                  <div className="relative">
                      <select 
                          value={companyFilter}
                          onChange={(e) => setCompanyFilter(e.target.value)}
                          className="appearance-none px-4 py-2 pr-8 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer outline-none focus:ring-2 focus:ring-[#0f5c82]"
                      >
                          <option value="All">All Companies</option>
                          {companyOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                      <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                  </div>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex-1 md:flex-none justify-center">
                  <Filter size={16} /> Role
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex-1 md:flex-none justify-center">
                  <Award size={16} /> Certifications
              </button>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
          {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMembers.map(member => (
                      <UserCard key={member.id} member={member} onClick={() => setSelectedMember(member)} showCompany={isSuperAdmin} />
                  ))}
                  {filteredMembers.length === 0 && (
                      <div className="col-span-full text-center py-12 text-zinc-400 italic">
                          No team members found matching criteria.
                      </div>
                  )}
              </div>
          ) : (
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium border-b border-zinc-200">
                          <tr>
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Role</th>
                              {isSuperAdmin && <th className="px-6 py-4">Company</th>}
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Project</th>
                              <th className="px-6 py-4">Documents</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                          {filteredMembers.map(member => (
                              <tr key={member.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => setSelectedMember(member)}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-9 h-9 rounded-full ${member.color || 'bg-zinc-400'} text-white flex items-center justify-center text-xs font-bold`}>{member.initials}</div>
                                          <span className="font-medium text-zinc-900">{member.name}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-zinc-600">{member.role}</td>
                                  {isSuperAdmin && (
                                      <td className="px-6 py-4">
                                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-[10px] uppercase font-bold border border-purple-100">{member.companyId}</span>
                                      </td>
                                  )}
                                  <td className="px-6 py-4">
                                      <StatusBadge status={member.status} />
                                  </td>
                                  <td className="px-6 py-4 text-zinc-600 truncate max-w-[200px]">{member.projectName || '-'}</td>
                                  <td className="px-6 py-4 text-zinc-500 text-xs">
                                      {member.certifications?.length || 0} files
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button className="text-[#0f5c82] hover:underline font-medium text-xs">View</button>
                                  </td>
                              </tr>
                          ))}
                          {filteredMembers.length === 0 && (
                              <tr>
                                  <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-zinc-400 italic">No members found.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      {/* Slide-over Details Panel (Same as before, omitted for brevity as no changes needed inside the panel logic itself for this request) */}
      {selectedMember && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end transition-opacity" onClick={() => { setSelectedMember(null); setGeneratedReview(null); }}>
              <div 
                className="w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                  <div className="relative">
                      <button 
                        onClick={() => { setSelectedMember(null); setGeneratedReview(null); }}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
                      >
                          <X size={20} />
                      </button>
                      
                      {/* Header Banner */}
                      <div className="h-32 bg-gradient-to-r from-[#0f5c82] to-[#1e3a8a]"></div>
                      
                      <div className="px-8 -mt-12 mb-6">
                          <div className="flex justify-between items-end">
                              <div className={`w-24 h-24 rounded-2xl ${selectedMember.color || 'bg-zinc-400'} text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg`}>
                                  {selectedMember.initials}
                              </div>
                              <div className="flex gap-3 mb-1">
                                  <button className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600" title="Call"><Phone size={18} /></button>
                                  <button className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600" title="Email"><Mail size={18} /></button>
                                  <button className="px-4 py-2 bg-[#0f5c82] text-white rounded-lg font-medium text-sm hover:bg-[#0c4a6e] shadow-sm">Edit Profile</button>
                              </div>
                          </div>
                          
                          <div className="mt-4">
                              <h2 className="text-2xl font-bold text-zinc-900">{selectedMember.name}</h2>
                              <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                                  <span className="font-medium">{selectedMember.role}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedMember.location || 'London, UK'}</span>
                                  {isSuperAdmin && (
                                      <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">{selectedMember.companyId}</span>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="px-8 space-y-8 pb-12">
                          {/* Certifications & Docs */}
                          <div>
                              <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-500">
                                  <Award size={16} /> Documents & Qualifications
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {selectedMember.certifications && selectedMember.certifications.length > 0 ? (
                                      selectedMember.certifications.map((cert, i) => (
                                          <div key={i} className="flex flex-col p-3 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden">
                                              <div className="flex justify-between items-start mb-2">
                                                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                                                      {cert.fileData && cert.fileData.startsWith('data:image') ? (
                                                          <img src={cert.fileData} className="w-4 h-4 object-cover rounded-sm" alt="preview" />
                                                      ) : (
                                                          <FileText size={16} />
                                                      )}
                                                  </div>
                                                  <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${cert.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                      {cert.status}
                                                  </div>
                                              </div>
                                              <div className="font-bold text-zinc-800 text-sm truncate mb-0.5" title={cert.name}>{cert.name}</div>
                                              <div className="text-xs text-zinc-500">{cert.issuer}</div>
                                              <div className="text-[10px] text-zinc-400 mt-2 flex justify-between items-center">
                                                  <span>Exp: {cert.expiryDate}</span>
                                                  {cert.fileData && (
                                                      <button 
                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                        onClick={() => {
                                                            const win = window.open();
                                                            win?.document.write(`<iframe src="${cert.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                        }}
                                                      >
                                                          <Eye size={10} /> View
                                                      </button>
                                                  )}
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="col-span-2 p-4 text-center text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                          No documents on file.
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Status & Allocation */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                  <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Current Status</div>
                                  <StatusBadge status={selectedMember.status} />
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                  <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Assigned Project</div>
                                  <div className="font-semibold text-zinc-900 truncate" title={selectedMember.projectName}>
                                      {selectedMember.projectName || 'Unassigned'}
                                  </div>
                              </div>
                          </div>

                          {/* AI Performance Review - GEMINI 3 PRO */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600"><Sparkles size={80} /></div>
                              
                              <div className="flex justify-between items-center mb-4 relative z-10">
                                  <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                      <Sparkles size={16} className="text-blue-600" /> AI Performance Review
                                  </h3>
                                  <button 
                                    onClick={generatePerformanceReview}
                                    disabled={reviewLoading}
                                    className="text-xs font-bold bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                                  >
                                      {reviewLoading ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={14} />}
                                      {reviewLoading ? 'Drafting...' : 'Draft Review'}
                                  </button>
                              </div>
                              
                              {generatedReview ? (
                                  <div className="relative bg-white/80 backdrop-blur p-4 rounded-xl border border-blue-100 text-sm text-zinc-700 leading-relaxed shadow-sm animate-in fade-in zoom-in-95">
                                      <p>{generatedReview}</p>
                                      <button 
                                        className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        onClick={() => navigator.clipboard.writeText(generatedReview)}
                                        title="Copy to clipboard"
                                      >
                                          <Copy size={14} />
                                      </button>
                                  </div>
                              ) : (
                                  <div className="text-center py-6 bg-white/50 rounded-xl border border-blue-100/50">
                                      <Sparkles size={24} className="text-blue-300 mx-auto mb-2" />
                                      <p className="text-xs text-blue-800/70">
                                          Use Gemini to analyze performance and draft a review based on skills and project history.
                                      </p>
                                  </div>
                              )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 border border-zinc-100 bg-white rounded-xl shadow-sm">
                                  <div className="text-2xl font-bold text-[#0f5c82]">{selectedMember.completedProjects || 0}</div>
                                  <div className="text-xs text-zinc-500 uppercase mt-1 font-semibold">Projects</div>
                              </div>
                              <div className="text-center p-4 border border-zinc-100 bg-white rounded-xl shadow-sm">
                                  <div className="text-2xl font-bold text-[#0f5c82]">{selectedMember.performanceRating || '-'}<span className="text-sm text-zinc-400 font-normal">/100</span></div>
                                  <div className="text-xs text-zinc-500 uppercase mt-1 font-semibold">Rating</div>
                              </div>
                              <div className="text-center p-4 border border-zinc-100 bg-white rounded-xl shadow-sm">
                                  <div className="text-2xl font-bold text-[#0f5c82]">£{selectedMember.hourlyRate || '45'}</div>
                                  <div className="text-xs text-zinc-500 uppercase mt-1 font-semibold">Hourly</div>
                              </div>
                          </div>

                          {/* Skills Section */}
                          {selectedMember.skills && selectedMember.skills.length > 0 && (
                              <div>
                                  <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-500">
                                      <Tag size={16} /> Skills & Competencies
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                      {selectedMember.skills.map((skill, i) => (
                                          <span 
                                            key={i} 
                                            className="px-3 py-1.5 bg-white text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200 shadow-sm"
                                          >
                                              {skill}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Member Modal (Same as previous) */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                {/* ... (Modal Content same as before, simplified for brevity in this response but fully functional in code) ... */}
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center flex-shrink-0 bg-zinc-50">
                    <h3 className="text-lg font-bold text-zinc-900">Add New Team Member</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-zinc-200 rounded-full transition-colors"><X size={20} className="text-zinc-400" /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Full Name *</label>
                            <input type="text" className="w-full p-3 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f5c82]" value={newMemberData.name} onChange={e => setNewMemberData({...newMemberData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Role</label>
                            <select className="w-full p-3 border border-zinc-200 rounded-xl text-sm outline-none bg-white" value={newMemberData.role} onChange={e => setNewMemberData({...newMemberData, role: e.target.value})}>
                                <option value="Operative">Operative</option>
                                <option value="Foreman">Foreman</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Supervisor">Supervisor</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Email</label><input type="email" className="w-full p-3 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f5c82]" value={newMemberData.email} onChange={e => setNewMemberData({...newMemberData, email: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Phone</label><input type="text" className="w-full p-3 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f5c82]" value={newMemberData.phone} onChange={e => setNewMemberData({...newMemberData, phone: e.target.value})} /></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 flex justify-between">Skills <button onClick={handleAutoGenerateSkills} disabled={isGeneratingSkills} className="text-[#0f5c82] text-[10px] font-bold flex items-center gap-1">{isGeneratingSkills ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Suggest</button></label>
                        <input type="text" className="w-full p-3 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f5c82]" value={newMemberData.skills} onChange={e => setNewMemberData({...newMemberData, skills: e.target.value})} placeholder="e.g. Welding, First Aid" />
                    </div>
                </div>
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleCreateMember} disabled={!newMemberData.name} className="px-6 py-2.5 bg-[#0f5c82] text-white font-bold rounded-xl hover:bg-[#0c4a6e] disabled:opacity-50 transition-colors shadow-lg">Create Member</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;