
import React, { useMemo, useState } from 'react';
import { Upload, FileText, Download, Image as ImageIcon, Box, Link, X, Search, CheckCircle2, MoreVertical, Eye, FileSpreadsheet, Trash2, Calendar, Paperclip } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Task, ProjectDocument } from '../types';

interface DocumentsViewProps {
  projectId?: string;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ projectId }) => {
  const { documents, tasks, updateDocument, addDocument } = useProjects();
  const [linkingDocId, setLinkingDocId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // File Upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
      let docs = documents;
      if (projectId) {
          docs = docs.filter(d => d.projectId === projectId);
      }
      if (filterType !== 'All') {
          if (filterType === 'Plans') docs = docs.filter(d => d.type === 'CAD' || d.type === 'PDF');
          else if (filterType === 'Images') docs = docs.filter(d => d.type === 'Image');
          else docs = docs.filter(d => d.type === filterType); // Generic match
      }
      return docs;
  }, [documents, projectId, filterType]);

  const projectTasks = useMemo(() => {
      if (!projectId) return [];
      return tasks.filter(t => t.projectId === projectId);
  }, [tasks, projectId]);

  const filteredTasks = projectTasks.filter(t => 
      t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const handleLinkTask = (taskId: string) => {
      if (!linkingDocId) return;
      const doc = documents.find(d => d.id === linkingDocId);
      if (!doc) return;

      const currentLinks = doc.linkedTaskIds || [];
      const newLinks = currentLinks.includes(taskId)
          ? currentLinks.filter(id => id !== taskId)
          : [...currentLinks, taskId];
      
      updateDocument(linkingDocId, { linkedTaskIds: newLinks });
  };

  const getLinkedTaskTitle = (taskId: string) => {
      return tasks.find(t => t.id === taskId)?.title || 'Unknown Task';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && projectId) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const newDoc: ProjectDocument = {
                  id: `doc-${Date.now()}`,
                  name: file.name,
                  type: file.type.includes('image') ? 'Image' : file.type.includes('pdf') ? 'PDF' : 'Document',
                  projectId: projectId,
                  projectName: 'Current Project',
                  size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                  date: new Date().toLocaleDateString(),
                  status: 'Approved',
                  url: reader.result as string
              };
              addDocument(newDoc);
          };
          reader.readAsDataURL(file);
      }
  };

  const getFileIcon = (type: string) => {
      if (type === 'Image') return <ImageIcon size={32} className="text-purple-500" />;
      if (type === 'CAD') return <Box size={32} className="text-blue-500" />;
      if (type === 'Spreadsheet') return <FileSpreadsheet size={32} className="text-green-500" />;
      return <FileText size={32} className="text-orange-500" />;
  };

  const getFileColor = (type: string) => {
      if (type === 'Image') return 'bg-purple-50/50 border-purple-100 text-purple-600';
      if (type === 'CAD') return 'bg-blue-50/50 border-blue-100 text-blue-600';
      if (type === 'Spreadsheet') return 'bg-green-50/50 border-green-100 text-green-600';
      return 'bg-orange-50/50 border-orange-100 text-orange-600';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-1">{projectId ? 'Project Documents' : 'Documents Library'}</h1>
                <p className="text-zinc-500">Manage drawings, permits, specs, and photos.</p>
            </div>
            {projectId && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#0f5c82] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0c4a6e] shadow-lg shadow-blue-900/10 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Upload size={18} /> Upload New
                </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto no-scrollbar">
                {['All', 'Plans', 'Permits', 'Reports', 'Images'].map((tag) => (
                    <button 
                        key={tag} 
                        onClick={() => setFilterType(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                            filterType === tag 
                            ? 'bg-zinc-800 text-white border-zinc-800 shadow-md' 
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <div className="flex bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
                 <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-400 hover:text-zinc-600'}`}><Box size={16} /></button>
                 <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-400 hover:text-zinc-600'}`}><FileText size={16} /></button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
          {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDocs.map((doc) => (
                      <div key={doc.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all group flex flex-col relative h-64">
                          {/* Preview Area */}
                          <div className={`h-36 w-full relative overflow-hidden ${doc.type === 'Image' ? 'bg-zinc-900' : getFileColor(doc.type)} flex items-center justify-center`}>
                              {doc.type === 'Image' && doc.url ? (
                                  <img src={doc.url} alt={doc.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                              ) : (
                                  <div className="transform transition-transform duration-300 group-hover:scale-110 opacity-80">
                                      {getFileIcon(doc.type)}
                                  </div>
                              )}
                              
                              {/* Hover Actions Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                  <button className="p-2 bg-white text-zinc-800 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-lg" title="Preview">
                                      <Eye size={18} />
                                  </button>
                                  <button className="p-2 bg-white text-zinc-800 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors shadow-lg" title="Download">
                                      <Download size={18} />
                                  </button>
                                  {projectId && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setLinkingDocId(doc.id); }}
                                        className="p-2 bg-white text-zinc-800 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors shadow-lg" 
                                        title="Link to Task"
                                      >
                                          <Link size={18} />
                                      </button>
                                  )}
                              </div>
                          </div>

                          {/* Content Area */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-zinc-900 text-sm leading-tight line-clamp-2 group-hover:text-[#0f5c82] transition-colors">{doc.name}</h4>
                                      <button className="text-zinc-300 hover:text-zinc-600 -mr-2 -mt-1 p-1"><MoreVertical size={16} /></button>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 flex items-center gap-2 font-medium">
                                      <span>{doc.size}</span>
                                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                      <span>{doc.date}</span>
                                  </div>
                              </div>

                              {/* Linked Tasks Chips */}
                              <div className="mt-3 pt-2 border-t border-zinc-50">
                                  {doc.linkedTaskIds && doc.linkedTaskIds.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                          {doc.linkedTaskIds.slice(0, 2).map(taskId => (
                                              <span key={taskId} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold border border-blue-100 flex items-center gap-1 truncate max-w-[120px]">
                                                  <Link size={8} /> {getLinkedTaskTitle(taskId)}
                                              </span>
                                          ))}
                                          {doc.linkedTaskIds.length > 2 && (
                                              <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-1 rounded-md font-bold">
                                                  +{doc.linkedTaskIds.length - 2}
                                              </span>
                                          )}
                                      </div>
                                  ) : (
                                      <span className="text-[10px] text-zinc-300 italic flex items-center gap-1">
                                          <Link size={10} /> No links
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  {filteredDocs.map((doc, i) => (
                      <div key={i} className="flex items-center p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 border ${getFileColor(doc.type).replace('/50', '')} bg-opacity-20`}>
                              {doc.type === 'Image' && doc.url ? (
                                  <img src={doc.url} className="w-full h-full object-cover rounded-lg" alt="icon" />
                              ) : getFileIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0 mr-4">
                              <h4 className="text-sm font-bold text-zinc-900 truncate group-hover:text-[#0f5c82] transition-colors">{doc.name}</h4>
                              <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                                  <span>{doc.type}</span>
                                  <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                  <span>{doc.date}</span>
                                  <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                  <span>{doc.size}</span>
                              </div>
                          </div>
                          
                          <div className="flex-1 hidden md:flex items-center gap-2">
                              {doc.linkedTaskIds?.map(tid => (
                                  <span key={tid} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-100 truncate max-w-[150px]">
                                      <Link size={10} className="inline mr-1"/> {getLinkedTaskTitle(tid)}
                                  </span>
                              ))}
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {projectId && (
                                  <button onClick={() => setLinkingDocId(doc.id)} className="p-2 hover:bg-purple-50 text-zinc-400 hover:text-purple-600 rounded transition-colors" title="Link"><Link size={16} /></button>
                              )}
                              <button className="p-2 hover:bg-blue-50 text-zinc-400 hover:text-blue-600 rounded transition-colors" title="Download"><Download size={16} /></button>
                              <button className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
          
          {filteredDocs.length === 0 && (
              <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300 shadow-sm">
                      <FileText size={32} />
                  </div>
                  <h3 className="text-zinc-900 font-bold mb-1">No Documents Found</h3>
                  <p className="text-zinc-500 text-sm mb-6">Try adjusting filters or upload a new document.</p>
                  {projectId && (
                      <button onClick={() => fileInputRef.current?.click()} className="text-[#0f5c82] text-sm font-bold hover:underline">Upload Document</button>
                  )}
              </div>
          )}
      </div>

      {/* Link Task Modal */}
      {linkingDocId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-zinc-200 animate-in zoom-in-95">
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50/80 backdrop-blur-md">
                      <div className="flex justify-between items-center mb-4">
                          <div>
                              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><Link size={18} className="text-[#0f5c82]" /> Link Document to Tasks</h3>
                              <p className="text-xs text-zinc-500 mt-1">Select tasks relevant to <span className="font-medium text-zinc-800">{documents.find(d => d.id === linkingDocId)?.name}</span></p>
                          </div>
                          <button onClick={() => setLinkingDocId(null)} className="p-2 hover:bg-white rounded-full text-zinc-500 transition-colors shadow-sm"><X size={20} /></button>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Search tasks by name..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none shadow-sm transition-all"
                            value={taskSearch}
                            onChange={e => setTaskSearch(e.target.value)}
                            autoFocus
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50/30 custom-scrollbar">
                      {filteredTasks.length > 0 ? filteredTasks.map(task => {
                          const isLinked = documents.find(d => d.id === linkingDocId)?.linkedTaskIds?.includes(task.id);
                          return (
                              <div 
                                key={task.id} 
                                onClick={() => handleLinkTask(task.id)}
                                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all group ${
                                    isLinked 
                                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' 
                                    : 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-sm'
                                }`}
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${isLinked ? 'border-blue-500 bg-blue-500 scale-110' : 'border-zinc-300 group-hover:border-blue-400'}`}>
                                          {isLinked && <CheckCircle2 size={14} className="text-white" />}
                                      </div>
                                      <div className="min-w-0">
                                          <div className={`font-bold text-sm truncate transition-colors ${isLinked ? 'text-blue-900' : 'text-zinc-700'}`}>{task.title}</div>
                                          <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                                              <span className={`px-1.5 rounded text-[10px] font-bold uppercase ${
                                                  task.status === 'Done' ? 'bg-green-100 text-green-700' : 
                                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                                                  'bg-zinc-100 text-zinc-600'
                                              }`}>
                                                  {task.status}
                                              </span>
                                              <span className="flex items-center gap-1"><Calendar size={10} /> {task.dueDate}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      }) : (
                          <div className="p-8 text-center text-zinc-400 text-sm italic bg-zinc-50 rounded-xl border border-dashed border-zinc-200">No matching tasks found.</div>
                      )}
                  </div>

                  <div className="p-4 border-t border-zinc-100 bg-white flex justify-end">
                      <button onClick={() => setLinkingDocId(null)} className="px-6 py-2.5 bg-[#0f5c82] text-white font-bold rounded-xl hover:bg-[#0c4a6e] shadow-lg shadow-blue-900/10 transition-all text-sm">
                          Done
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DocumentsView;
