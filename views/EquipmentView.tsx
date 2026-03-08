
import React, { useMemo, useState, useRef } from 'react';
import { Plus, Wrench, Filter, Search, Camera, Image as ImageIcon, X, Upload, Calendar, MapPin, Truck, AlertTriangle, Maximize2, Edit2, MoreHorizontal, Trash2, CheckCircle2 } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Equipment } from '../types';

interface EquipmentViewProps {
  projectId?: string;
}

const EquipmentView: React.FC<EquipmentViewProps> = ({ projectId }) => {
  const { equipment, addEquipment, updateEquipment } = useProjects();
  
  // View State
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Modal / Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Equipment>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Logic
  const filteredEquipment = useMemo(() => {
      let items = equipment;
      
      if (projectId) {
          items = items.filter(e => e.projectId === projectId);
      }
      
      if (filterType !== 'All') {
          items = items.filter(e => e.type === filterType);
      }

      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          items = items.filter(e => 
              e.name.toLowerCase().includes(q) || 
              e.type.toLowerCase().includes(q) ||
              (e.projectName || '').toLowerCase().includes(q)
          );
      }
      
      return items;
  }, [equipment, projectId, filterType, searchQuery]);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const openAddModal = () => {
      setIsEditing(false);
      setCurrentItem({ 
          status: 'Available', 
          type: 'Tools',
          nextService: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          lastService: new Date().toISOString().split('T')[0]
      });
      setImagePreview(null);
      setShowModal(true);
  };

  const openEditModal = (item: Equipment) => {
      setIsEditing(true);
      setCurrentItem({ ...item });
      setImagePreview(item.image || null);
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!currentItem.name || !currentItem.type) return;

      if (isEditing && currentItem.id) {
          // Update Existing
          await updateEquipment(currentItem.id, {
              ...currentItem,
              image: imagePreview || undefined
          });
      } else {
          // Create New
          const eq: Equipment = {
              id: `eq-${Date.now()}`,
              name: currentItem.name,
              type: currentItem.type,
              status: currentItem.status || 'Available',
              projectId: projectId || '',
              projectName: projectId ? 'Current Project' : '-', 
              lastService: currentItem.lastService || new Date().toISOString().split('T')[0],
              nextService: currentItem.nextService || '',
              companyId: 'c1',
              image: imagePreview || undefined
          };
          await addEquipment(eq);
      }
      setShowModal(false);
  };

  // Helpers
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'In Use': return 'bg-amber-500 text-white border-amber-600';
          case 'Available': return 'bg-emerald-500 text-white border-emerald-600';
          case 'Maintenance': return 'bg-red-500 text-white border-red-600';
          default: return 'bg-zinc-500 text-white border-zinc-600';
      }
  };

  const getTypeIcon = (type: string) => {
      switch (type) {
          case 'Heavy Machinery': return <Truck size={48} className="text-zinc-300" />;
          case 'Tools': return <Wrench size={48} className="text-zinc-300" />;
          case 'Access': return <Truck size={48} className="text-zinc-300" />; // Placeholder
          default: return <Wrench size={48} className="text-zinc-300" />;
      }
  };

  const isServiceOverdue = (date: string) => {
      if (!date) return false;
      return new Date(date) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
                    {projectId ? 'Project Equipment' : 'Equipment Fleet'}
                </h1>
                <p className="text-zinc-500">Track machinery allocation, maintenance status, and asset conditions.</p>
            </div>
            <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-[#0f5c82] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0c4a6e] shadow-lg transition-all transform hover:scale-105"
            >
                <Plus size={18} /> Add Equipment
            </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar px-2">
                {['All', 'Heavy Machinery', 'Utility Equipment', 'Access', 'Tools'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                            filterType === type 
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
            
            <div className="relative w-full md:w-64 mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search assets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all"
                />
            </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredEquipment.map((item) => (
              <div key={item.id} className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-200 flex flex-col h-full relative">
                  
                  {/* Image Area */}
                  <div className="aspect-video w-full relative overflow-hidden bg-zinc-100 flex items-center justify-center">
                      {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                          <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                              {getTypeIcon(item.type)}
                              <span className="text-xs text-zinc-400 font-medium">No Image Available</span>
                          </div>
                      )}
                      
                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px] z-20">
                          {item.image && (
                              <button 
                                onClick={() => setViewingImage(item.image || null)}
                                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-lg border border-white/30" 
                                title="View Full Image"
                              >
                                  <Maximize2 size={20} />
                              </button>
                          )}
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors shadow-lg border border-white/30" 
                            title="Edit Details"
                          >
                              <Edit2 size={20} />
                          </button>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md border ${getStatusColor(item.status)}`}>
                              {item.status}
                          </span>
                      </div>

                      {/* Service Alert */}
                      {isServiceOverdue(item.nextService) && (
                          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-lg shadow-md flex items-center gap-1 text-[10px] font-bold uppercase border border-red-400 animate-pulse">
                              <AlertTriangle size={12} fill="white" /> Service Due
                          </div>
                      )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                          <div className="flex justify-between items-start">
                              <h3 className="font-bold text-zinc-900 text-base mb-1 truncate pr-2">{item.name}</h3>
                              <button onClick={() => openEditModal(item)} className="text-zinc-300 hover:text-[#0f5c82] transition-colors">
                                  <MoreHorizontal size={16} />
                              </button>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded w-fit">{item.type}</p>
                      </div>

                      <div className="space-y-3 mb-4 flex-1">
                          {!projectId && (
                              <div className="flex items-start gap-2 text-xs text-zinc-600">
                                  <MapPin size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                                  <span className="truncate font-medium">{item.projectName || 'Unassigned'}</span>
                              </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2">
                                  <div className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Last Service</div>
                                  <div className="text-xs font-mono text-zinc-700">{item.lastService || '-'}</div>
                              </div>
                              <div className={`border rounded-lg p-2 ${isServiceOverdue(item.nextService) ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
                                  <div className={`text-[10px] uppercase font-bold mb-0.5 ${isServiceOverdue(item.nextService) ? 'text-red-500' : 'text-zinc-400'}`}>Next Service</div>
                                  <div className={`text-xs font-mono ${isServiceOverdue(item.nextService) ? 'text-red-700 font-bold' : 'text-zinc-700'}`}>{item.nextService}</div>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-50 flex gap-2">
                          <button 
                            onClick={() => updateEquipment(item.id, { status: item.status === 'Available' ? 'In Use' : 'Available' })}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${
                                item.status === 'Available' 
                                ? 'bg-[#0f5c82] text-white border-[#0f5c82] hover:bg-[#0c4a6e]' 
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                              {item.status === 'Available' ? 'Assign to Site' : 'Return to Yard'}
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          
          {filteredEquipment.length === 0 && (
              <div className="col-span-full p-16 text-center text-zinc-400 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Wrench size={32} className="opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-600 mb-2">No Equipment Found</h3>
                  <p className="text-sm text-zinc-400 mb-6">Try adjusting your filters or add new equipment to the fleet.</p>
                  <button onClick={openAddModal} className="text-[#0f5c82] font-bold hover:underline">Add New Equipment</button>
              </div>
          )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                      <div>
                          <h3 className="text-lg font-bold text-zinc-900">{isEditing ? 'Edit Equipment' : 'Register New Asset'}</h3>
                          <p className="text-xs text-zinc-500">{isEditing ? `ID: ${currentItem.id}` : 'Add machinery to the fleet inventory'}</p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                      {/* Image Upload */}
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Asset Photo</label>
                          <div className="flex justify-center">
                              <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`relative w-full aspect-video rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${imagePreview ? 'border-0' : 'bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-blue-400 hover:bg-blue-50'}`}
                              >
                                  {imagePreview ? (
                                      <>
                                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Camera size={32} className="text-white mb-2" />
                                              <span className="text-white font-bold text-sm">Change Photo</span>
                                          </div>
                                      </>
                                  ) : (
                                      <>
                                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-zinc-400">
                                              <ImageIcon size={24} />
                                          </div>
                                          <p className="text-sm font-bold text-zinc-600">Click to Upload</p>
                                          <p className="text-xs text-zinc-400">JPG, PNG supported</p>
                                      </>
                                  )}
                                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </div>
                          </div>
                          {imagePreview && (
                              <button 
                                onClick={() => { setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1 font-medium"
                              >
                                  <Trash2 size={12} /> Remove Photo
                              </button>
                          )}
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Equipment Name</label>
                              <input 
                                type="text" 
                                className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all" 
                                value={currentItem.name || ''} 
                                onChange={e => setCurrentItem({...currentItem, name: e.target.value})} 
                                placeholder="e.g. CAT 320 Excavator" 
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Type</label>
                                  <select 
                                    className="w-full p-3 border border-zinc-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0f5c82]" 
                                    value={currentItem.type || ''} 
                                    onChange={e => setCurrentItem({...currentItem, type: e.target.value})}
                                  >
                                      <option value="Heavy Machinery">Heavy Machinery</option>
                                      <option value="Utility Equipment">Utility Equipment</option>
                                      <option value="Access">Access</option>
                                      <option value="Tools">Tools</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Status</label>
                                  <select 
                                    className="w-full p-3 border border-zinc-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0f5c82]" 
                                    value={currentItem.status} 
                                    onChange={e => setCurrentItem({...currentItem, status: e.target.value as any})}
                                  >
                                      <option value="Available">Available</option>
                                      <option value="In Use">In Use</option>
                                      <option value="Maintenance">Maintenance</option>
                                  </select>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Last Service</label>
                                  <input 
                                    type="date" 
                                    className="w-full p-3 border border-zinc-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0f5c82]" 
                                    value={currentItem.lastService || ''} 
                                    onChange={e => setCurrentItem({...currentItem, lastService: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Next Service Due</label>
                                  <input 
                                    type="date" 
                                    className="w-full p-3 border border-zinc-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0f5c82]" 
                                    value={currentItem.nextService || ''} 
                                    onChange={e => setCurrentItem({...currentItem, nextService: e.target.value})} 
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                      <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
                      <button onClick={handleSave} disabled={!currentItem.name || !currentItem.type} className="px-8 py-2.5 bg-[#0f5c82] text-white font-bold rounded-xl hover:bg-[#0c4a6e] disabled:opacity-50 shadow-lg shadow-blue-900/10 transition-all">
                          {isEditing ? 'Save Changes' : 'Register Asset'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Lightbox Viewer */}
      {viewingImage && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
              <button 
                  onClick={() => setViewingImage(null)}
                  className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-50"
              >
                  <X size={24} />
              </button>
              <img 
                  src={viewingImage} 
                  alt="Full Size" 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
              />
          </div>
      )}
    </div>
  );
};

export default EquipmentView;
