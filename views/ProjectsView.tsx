
import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Filter, Calendar, Users, MapPin,
  CheckSquare, Activity, Image as ImageIcon, ArrowRight, MoreVertical,
  LayoutGrid, List as ListIcon, Briefcase
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Project, Page } from '../types';

interface ProjectsViewProps {
  onProjectSelect?: (projectId: string) => void;
  setPage?: (page: Page) => void;
  autoLaunch?: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onProjectSelect, setPage, autoLaunch }) => {
  const { projects, documents } = useProjects();
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Auto-launch logic if needed (e.g. for Project Launchpad redirection)
  React.useEffect(() => {
      if (autoLaunch && setPage) {
          // In a real app, this might trigger a modal or specific route
      }
  }, [autoLaunch, setPage]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, filterStatus]);

  const getLatestPhotos = (projectId: string) => {
      return documents
          .filter(d => d.projectId === projectId && d.type === 'Image')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
  };

  const getPhotoCount = (projectId: string) => {
      return documents.filter(d => d.projectId === projectId && d.type === 'Image').length;
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'bg-green-100 text-green-700';
          case 'Planning': return 'bg-blue-100 text-blue-700';
          case 'Delayed': return 'bg-red-100 text-red-700';
          case 'Completed': return 'bg-gray-100 text-gray-700';
          default: return 'bg-zinc-100 text-zinc-600';
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Projects Portfolio</h1>
          <p className="text-zinc-500">Manage and monitor all active construction sites.</p>
        </div>
        <div className="flex gap-3">
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
                onClick={() => setPage && setPage(Page.PROJECT_LAUNCHPAD)}
                className="flex items-center gap-2 bg-[#0f5c82] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0c4a6e] shadow-sm transition-all"
            >
                <Plus size={18} /> New Project
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all"
              />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-w-[160px]">
                  <Filter size={14} className="text-zinc-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent border-none text-sm text-zinc-700 font-medium focus:ring-0 cursor-pointer w-full outline-none"
                  >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                  </select>
              </div>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map(project => {
                    const latestPhotos = getLatestPhotos(project.id);
                    const photoCount = getPhotoCount(project.id);

                    return (
                    <div
                        key={project.id}
                        onClick={() => onProjectSelect && onProjectSelect(project.id)}
                        className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
                                    {project.image ? (
                                        <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Briefcase size={20} className="text-zinc-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 leading-tight line-clamp-1 group-hover:text-[#0f5c82] transition-colors">{project.name}</h3>
                                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                                        <MapPin size={10} /> {project.location}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>

                        <p className="text-sm text-zinc-600 line-clamp-2 mb-4 flex-1">{project.description}</p>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                <span>Progress</span>
                                <span className="font-bold text-zinc-700">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${project.health === 'At Risk' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${project.progress}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-zinc-50">
                            <div>
                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Manager</div>
                                <div className="text-sm font-medium text-zinc-800 flex items-center gap-1.5 mt-0.5">
                                    <div className="w-5 h-5 bg-[#0f5c82] rounded-full text-white text-[8px] flex items-center justify-center">
                                        {project.manager.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    {project.manager}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Timeline</div>
                                <div className="text-sm font-medium text-zinc-800 flex items-center gap-1.5 mt-0.5">
                                    <Calendar size={12} className="text-zinc-400" /> {new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                </div>
                            </div>
                        </div>

                        {latestPhotos.length > 0 && (
                            <div className="mt-auto pt-3 border-t border-zinc-50 mb-10">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2 flex justify-between items-center">
                                    <span>Site Gallery</span>
                                    <span className="text-zinc-300">{photoCount} Photos</span>
                                </div>
                                <div className="flex gap-2">
                                    {latestPhotos.map(photo => (
                                        <div
                                            key={photo.id}
                                            className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 relative cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onProjectSelect && onProjectSelect(project.id);
                                            }}
                                        >
                                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {photoCount > 3 && (
                                        <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                                            +{photoCount - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Action Buttons (Visible on Hover) */}
                        <div className="absolute bottom-6 left-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProjectSelect && onProjectSelect(project.id);
                                    // Ideally navigate to tasks tab inside project details
                                }}
                                className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold rounded-lg transition-colors border border-zinc-200 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <CheckSquare size={14} className="text-zinc-400" /> Tasks
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Trigger new task modal? For now just open project
                                    onProjectSelect && onProjectSelect(project.id);
                                }}
                                className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-[#0f5c82] hover:text-[#0f5c82] text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Plus size={14} /> Add
                            </button>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Placeholder for status update logic
                                    alert("Status update dialog would open here.");
                                }}
                                className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-orange-500 hover:text-orange-600 text-zinc-600 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Activity size={14} /> Status
                            </button>
                        </div>
                    </div>
                )})}

                {/* Add New Project Card - Always visible at end of grid */}
                <button
                    onClick={() => setPage && setPage(Page.PROJECT_LAUNCHPAD)}
                    className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center text-zinc-400 hover:border-[#0f5c82] hover:text-[#0f5c82] hover:bg-blue-50/30 transition-all group min-h-[300px]"
                >
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                        <Plus size={32} />
                    </div>
                    <h3 className="font-bold text-lg">Create New Project</h3>
                    <p className="text-sm opacity-70 mt-2 text-center max-w-xs">Launch a new project with AI assistance using Gemini 3 Pro.</p>
                </button>
            </div>
        ) : (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold">Project Name</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold">Manager</th>
                            <th className="px-6 py-4 font-bold">Location</th>
                            <th className="px-6 py-4 font-bold">Progress</th>
                            <th className="px-6 py-4 font-bold">Budget</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredProjects.map(project => (
                            <tr
                                key={project.id}
                                onClick={() => onProjectSelect && onProjectSelect(project.id)}
                                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 font-medium text-zinc-900 group-hover:text-[#0f5c82]">{project.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-600">{project.manager}</td>
                                <td className="px-6 py-4 text-zinc-600">{project.location}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${project.health === 'At Risk' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${project.progress}%` }} />
                                        </div>
                                        <span className="text-xs font-bold">{project.progress}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 font-mono">£{project.budget.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-[#0f5c82]">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
