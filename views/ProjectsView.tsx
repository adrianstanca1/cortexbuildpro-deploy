
import React, { useState, useMemo } from 'react';
import { 
  Plus, ArrowUpDown, Calendar, PoundSterling, Users, AlertTriangle, 
  MapPin, ArrowRight, Rocket, Building2, Activity, PieChart, 
  TrendingUp, Clock, ShieldAlert, CheckCircle2, AlertOctagon,
  FileText, Layers, Briefcase, CheckSquare, MoreHorizontal, Globe, ChevronDown, Camera, Hash, Search, X
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Page, UserRole, Permission } from '../types';
import ProjectLaunchpadView from './ProjectLaunchpadView';

interface ProjectsViewProps {
  onProjectSelect?: (id: string) => void;
  setPage: (page: Page) => void;
  autoLaunch?: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onProjectSelect, setPage, autoLaunch = false }) => {
  const { projects, tasks, documents } = useProjects();
  const { user, can } = useAuth();
  const [showLaunchpad, setShowLaunchpad] = useState(autoLaunch);
  const [companyFilter, setCompanyFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const canManageProjects = can(Permission.TENANT_PROJECT_ADMIN);

  // --- Fuzzy Match Utility ---
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase();
    
    if (cleanText.includes(cleanQuery)) return true;
    
    const terms = cleanQuery.split(' ').filter(t => t.length > 0);
    if (terms.length > 1) {
        return terms.every(term => cleanText.includes(term));
    }
    
    let qIdx = 0;
    for (let i = 0; i < cleanText.length && qIdx < cleanQuery.length; i++) {
        if (cleanText[i] === cleanQuery[qIdx]) qIdx++;
    }
    return qIdx === cleanQuery.length;
  };

  // --- Dashboard Metrics Calculation ---
  const dashboardMetrics = useMemo(() => {
      let filteredProjects = projects;
      
      if (isSuperAdmin && companyFilter !== 'All') {
          filteredProjects = projects.filter(p => p.companyId === companyFilter);
      }
      if (typeFilter !== 'All') {
          filteredProjects = filteredProjects.filter(p => p.type === typeFilter);
      }

      const total = filteredProjects.length;
      const active = filteredProjects.filter(p => p.status === 'Active').length;
      const delayed = filteredProjects.filter(p => p.status === 'Delayed' || p.health === 'At Risk').length;
      const critical = filteredProjects.filter(p => p.health === 'Critical').length;
      
      const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budget, 0);
      const totalSpent = filteredProjects.reduce((acc, p) => acc + p.spent, 0);
      const budgetHealth = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      
      const avgProgress = total > 0 
          ? Math.round(filteredProjects.reduce((acc, p) => acc + p.progress, 0) / total) 
          : 0;

      const visibleProjectIds = filteredProjects.map(p => p.id);
      const visibleTasks = tasks.filter(t => visibleProjectIds.includes(t.projectId));

      const safetyIncidents = visibleTasks.filter(t => t.title.toLowerCase().includes('safety') && t.priority === 'Critical').length;
      const blockedTasks = visibleTasks.filter(t => t.status === 'Blocked').length;
      
      const urgentMatters = [
          ...filteredProjects.filter(p => p.health === 'Critical').map(p => ({ type: 'Project', title: `Critical Health: ${p.name}`, id: p.id, severity: 'high' })),
          ...visibleTasks.filter(t => t.status === 'Blocked').map(t => ({ type: 'Task', title: `Blocked: ${t.title}`, id: t.projectId, severity: 'medium' })),
          ...visibleTasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').map(t => ({ type: 'Task', title: `Critical Task: ${t.title}`, id: t.projectId, severity: 'high' }))
      ].slice(0, 5);

      return {
          total, active, delayed, critical,
          totalBudget, totalSpent, budgetHealth,
          avgProgress,
          safetyIncidents, blockedTasks,
          urgentMatters
      };
  }, [projects, tasks, isSuperAdmin, companyFilter, typeFilter]);

  const formatCompactCurrency = (val: number) => {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: "compact", maximumFractionDigits: 1 }).format(val);
  };

  const handleProjectCreated = (projectId: string) => {
      setShowLaunchpad(false);
      if (onProjectSelect) onProjectSelect(projectId);
  };

  const handleUrgentClick = (type: string, id: string) => {
      if (type === 'Project' && onProjectSelect) {
          onProjectSelect(id);
      } else if (type === 'Task') {
          setPage(Page.TASKS);
      }
  };

  const displayProjects = useMemo(() => {
      let filtered = projects;
      
      if (isSuperAdmin && companyFilter !== 'All') {
          filtered = filtered.filter(p => p.companyId === companyFilter);
      }
      if (typeFilter !== 'All') {
          filtered = filtered.filter(p => p.type === typeFilter);
      }

      if (searchQuery.trim()) {
        filtered = filtered.filter(p => 
          fuzzyMatch(p.name, searchQuery) || 
          fuzzyMatch(p.code, searchQuery) || 
          fuzzyMatch(p.location, searchQuery)
        );
      }

      return filtered;
  }, [projects, isSuperAdmin, companyFilter, typeFilter, searchQuery]);

  const companyOptions = Array.from(new Set(projects.map(p => p.companyId)));
  const typeOptions = ['Commercial', 'Residential', 'Infrastructure', 'Industrial', 'Healthcare'];

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative space-y-8">
      {showLaunchpad && (
          <ProjectLaunchpadView onClose={() => setShowLaunchpad(false)} onViewProject={handleProjectCreated} />
      )}

      {/* --- PROJECTS DASHBOARD --- */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
              <div>
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                      <Activity className="text-primary" /> Portfolio Command Center
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">Real-time aggregated insights across {dashboardMetrics.total} projects.</p>
              </div>
              <div className="flex items-center gap-4">
                  {isSuperAdmin && (
                      <div className="relative">
                          <select 
                              value={companyFilter}
                              onChange={(e) => setCompanyFilter(e.target.value)}
                              className="appearance-none pl-4 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer outline-none focus:ring-2 focus:ring-primary uppercase"
                          >
                              <option value="All">All Companies</option>
                              {companyOptions.map(c => (
                                  <option key={c} value={c}>{c}</option>
                              ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                      </div>
                  )}
                  <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-medium text-zinc-400">System Online</span>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-blue-100 text-primary rounded-lg"><Building2 size={20} /></div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${dashboardMetrics.delayed > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {dashboardMetrics.delayed > 0 ? `${dashboardMetrics.delayed} Attention` : 'Optimal'}
                      </span>
                  </div>
                  <div>
                      <div className="text-2xl font-bold text-zinc-900">{dashboardMetrics.active} <span className="text-sm text-zinc-500 font-normal">/ {dashboardMetrics.total} Active</span></div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${dashboardMetrics.total > 0 ? (dashboardMetrics.active / dashboardMetrics.total) * 100 : 0}%` }}></div>
                      </div>
                  </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-green-100 text-green-700 rounded-lg"><PoundSterling size={20} /></div>
                      <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                          <TrendingUp size={12} /> Burn Rate
                      </span>
                  </div>
                  <div>
                      <div className="text-2xl font-bold text-zinc-900">{formatCompactCurrency(dashboardMetrics.totalSpent)}</div>
                      <div className="text-xs text-zinc-500 flex justify-between mt-1">
                          <span>of {formatCompactCurrency(dashboardMetrics.totalBudget)}</span>
                          <span className={dashboardMetrics.budgetHealth > 90 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{dashboardMetrics.budgetHealth}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${dashboardMetrics.budgetHealth > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${dashboardMetrics.budgetHealth}%` }}></div>
                      </div>
                  </div>
              </div>

              <div className={`border rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all ${dashboardMetrics.critical > 0 || dashboardMetrics.safetyIncidents > 0 ? 'bg-red-50 border-red-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg ${dashboardMetrics.critical > 0 ? 'bg-red-200 text-red-700' : 'bg-zinc-200 text-zinc-600'}`}>
                          <ShieldAlert size={20} />
                      </div>
                      {dashboardMetrics.safetyIncidents > 0 && (
                          <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full animate-pulse">
                              {dashboardMetrics.safetyIncidents} Incidents
                          </span>
                      )}
                  </div>
                  <div>
                      <div className="text-2xl font-bold text-zinc-900">{dashboardMetrics.critical} <span className="text-sm font-normal text-zinc-600">Critical</span></div>
                      <p className="text-xs text-zinc-500 mt-1">Projects requiring immediate intervention.</p>
                  </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Clock size={20} /></div>
                      <span className="text-xs font-bold text-zinc-500">Overall Progress</span>
                  </div>
                  <div>
                      <div className="text-2xl font-bold text-zinc-900">{dashboardMetrics.avgProgress}%</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <AlertOctagon size={12} className={dashboardMetrics.blockedTasks > 0 ? "text-orange-500" : "text-zinc-400"} /> 
                          {dashboardMetrics.blockedTasks} Blocked Tasks
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500" /> Urgent Matters
                  </h3>
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                      {dashboardMetrics.urgentMatters.length > 0 ? (
                          <div className="divide-y divide-zinc-100">
                              {dashboardMetrics.urgentMatters.map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={() => handleUrgentClick(item.type, item.id)}
                                    className="p-3 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-50'}`}></div>
                                          <div>
                                              <div className="text-sm font-medium text-zinc-900 group-hover:text-primary transition-colors">{item.title}</div>
                                              <div className="text-[10px] text-zinc-500 uppercase">{item.type} • ID: {item.id}</div>
                                          </div>
                                      </div>
                                      <button className="text-xs font-medium text-zinc-400 group-hover:text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-all">
                                          Resolve <ArrowRight size={12} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="p-6 text-center text-zinc-400 text-sm flex flex-col items-center">
                              <CheckCircle2 size={24} className="mb-2 text-green-500" />
                              No urgent matters detected. Good job!
                          </div>
                      )}
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Rocket size={16} className="text-blue-500" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                      {canManageProjects && (
                        <button 
                            onClick={() => setShowLaunchpad(true)}
                            className="p-3 bg-primary text-white rounded-xl flex items-center gap-3 shadow-md hover:bg-[#125a87] transition-all group"
                        >
                            <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20"><Plus size={18} /></div>
                            <div className="text-left">
                                <div className="text-sm font-bold">New Project</div>
                                <div className="text-[10px] opacity-80">Launchpad & AI Setup</div>
                            </div>
                        </button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setPage(Page.TASKS)}
                            className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
                          >
                              <CheckSquare size={20} className="text-zinc-400" />
                              <span className="text-xs font-medium">Add Task</span>
                          </button>
                          <button 
                            onClick={() => setPage(Page.SCHEDULE)}
                            className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
                          >
                              <Calendar size={20} className="text-zinc-400" />
                              <span className="text-xs font-medium">Schedule</span>
                          </button>
                          <button 
                            onClick={() => setPage(Page.REPORTS)}
                            className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
                          >
                              <FileText size={20} className="text-zinc-400" />
                              <span className="text-xs font-medium">Reports</span>
                          </button>
                          <button 
                            onClick={() => setPage(Page.TEAM)}
                            className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
                          >
                              <Users size={20} className="text-zinc-400" />
                              <span className="text-xs font-medium">Team</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- PROJECT LIST --- */}
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">All Projects</h1>
              <p className="text-zinc-500 text-sm">Detailed view of {displayProjects.length} matching developments.</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                 <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search name, code, loc..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                 </div>

                 <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer outline-none focus:ring-2 focus:ring-primary uppercase shadow-sm w-full"
                        >
                            <option value="All">All Types</option>
                            {typeOptions.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                    </div>
                    <button className="px-4 py-2 text-sm font-bold text-primary hover:underline flex items-center gap-1.5 transition-colors bg-white border border-zinc-200 rounded-xl shadow-sm">
                        <ArrowUpDown size={14} /> Sort
                    </button>
                 </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {displayProjects.map((project) => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const totalTasks = projectTasks.length;
                const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
                const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                
                const projectPhotos = documents
                    .filter(d => d.projectId === project.id && d.type === 'Image')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const photoCount = projectPhotos.length;

                return (
                <div 
                    key={project.id} 
                    onClick={() => onProjectSelect && onProjectSelect(project.id)}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full ring-1 ring-transparent hover:ring-primary/20 animate-in fade-in zoom-in-95"
                >
                    <div className="h-48 w-full relative overflow-hidden bg-zinc-100">
                        <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase backdrop-blur-md shadow-sm border border-white/10 ${
                                project.status === 'Active' ? 'bg-green-500/90 text-white' : 'bg-zinc-500/90 text-white'
                            }`}>
                                {project.status}
                            </span>
                            {isSuperAdmin && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase backdrop-blur-md shadow-sm border border-white/10 bg-purple-50/90 text-white flex items-center gap-1">
                                    <Globe size={10} /> {project.companyId}
                                </span>
                            )}
                        </div>

                        <div className="absolute top-4 right-4">
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md border border-white/10 ${
                                project.health === 'Good' ? 'bg-green-500/90 text-white' :
                                project.health === 'At Risk' ? 'bg-orange-500/90 text-white' :
                                'bg-red-500/90 text-white'
                            }`}>
                                {project.health} Health
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 uppercase tracking-tighter flex items-center gap-1">
                                    <Hash size={10} /> {project.code}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{project.type}</span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors mb-1">{project.name}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <MapPin size={12} className="text-zinc-400" /> {project.location}
                                </div>
                                {photoCount > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-medium text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        <Camera size={10} /> {photoCount}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-t border-zinc-50 text-sm">
                            <div>
                                <div className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Deadline</div>
                                <div className="font-semibold text-zinc-700 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-primary" /> 
                                    {new Date(project.endDate).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Budget</div>
                                <div className="font-semibold text-zinc-700 flex items-center gap-1.5">
                                    <PoundSterling size={14} className="text-green-600" />
                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: "compact", maximumFractionDigits: 1 }).format(project.budget)}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                             <div className="flex justify-between items-end mb-1.5">
                                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1"><CheckSquare size={12} /> Tasks Completed</span>
                                <span className="text-xs font-bold text-zinc-700">{taskProgress}%</span>
                             </div>
                             <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden shadow-inner">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                        project.health === 'Critical' ? 'bg-red-500' : 
                                        project.health === 'At Risk' ? 'bg-orange-500' : 
                                        'bg-primary'
                                    }`} 
                                    style={{width: `${taskProgress}%`}}
                                 ></div>
                             </div>
                        </div>

                        <div className="mt-4 pt-4 flex gap-2 border-t border-zinc-50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onProjectSelect && onProjectSelect(project.id); 
                                }}
                                className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-lg transition-colors border border-zinc-200 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <CheckSquare size={14} className="text-zinc-400" /> Tasks
                            </button>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setPage(Page.TASKS);
                                }}
                                className="flex-1 py-2 bg-white border border-zinc-200 hover:border-primary hover:text-primary text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Plus size={14} /> Add
                            </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); }}
                                className="flex-1 py-2 bg-white border border-zinc-200 hover:border-orange-500 hover:text-orange-600 text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Activity size={14} /> Status
                            </button>
                        </div>
                    </div>
                </div>
            )})}
            
            {canManageProjects && (
                <button 
                    onClick={() => setShowLaunchpad(true)}
                    className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:border-primary hover:text-primary hover:bg-blue-50/30 transition-all group min-h-[400px] shadow-inner"
                >
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-lg font-bold">Create New Project</h3>
                    <p className="text-sm text-center mt-2 max-w-xs opacity-70">Initialize a new site, set budgets, and assign teams.</p>
                </button>
            )}
          </div>
          
          {displayProjects.length === 0 && searchQuery && (
             <div className="py-32 text-center bg-white border-2 border-dashed border-zinc-100 rounded-[3rem] animate-in fade-in slide-in-from-bottom-4">
                 <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Search size={40} className="text-zinc-200" />
                 </div>
                 <h3 className="text-xl font-bold text-zinc-900 mb-2">No Projects Match Your Search</h3>
                 <p className="text-zinc-500 text-sm max-w-xs mx-auto">Try refining your parameters or clearing the search query to see all developments.</p>
                 <button 
                   onClick={() => setSearchQuery('')}
                   className="mt-8 px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                 >
                     Clear Fuzzy Search
                 </button>
             </div>
          )}
      </div>
    </div>
  );
};

export default ProjectsView;
