
import React, { useMemo, useState } from 'react';
import { Plus, Wrench, Filter, Search } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Equipment } from '../types';

interface EquipmentViewProps {
  projectId?: string;
}

const EquipmentView: React.FC<EquipmentViewProps> = ({ projectId }) => {
  const { equipment, addEquipment, updateEquipment } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Equipment>>({ status: 'Available' });
  const [filterType, setFilterType] = useState('All');

  const filteredEquipment = useMemo(() => {
      let items = equipment;
      if (projectId) {
          items = items.filter(e => e.projectId === projectId);
      }
      if (filterType !== 'All') {
          items = items.filter(e => e.type === filterType);
      }
      return items;
  }, [equipment, projectId, filterType]);

  const handleAddEquipment = async () => {
      if (newItem.name && newItem.type) {
          const eq: Equipment = {
              id: `eq-${Date.now()}`,
              name: newItem.name,
              type: newItem.type,
              status: newItem.status || 'Available',
              projectId: projectId || '',
              projectName: projectId ? 'Current Project' : '-', // Ideally lookup project name
              lastService: new Date().toISOString().split('T')[0],
              nextService: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], // +90 days
              companyId: 'c1' // Should come from auth
          };
          await addEquipment(eq);
          setShowAddModal(false);
          setNewItem({ status: 'Available' });
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'In Use': return 'bg-orange-100 text-orange-700';
          case 'Available': return 'bg-green-100 text-green-700';
          case 'Maintenance': return 'bg-red-100 text-red-700';
          default: return 'bg-zinc-100 text-zinc-600';
      }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-1">{projectId ? 'Project Equipment' : 'Equipment Management'}</h1>
                <p className="text-zinc-500">Track and manage machinery allocation and maintenance</p>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[#1f7d98] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#166ba1] shadow-sm"
            >
                <Plus size={16} /> Add Equipment
            </button>
        </div>

        <div className="flex gap-3">
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded text-sm bg-white hover:bg-zinc-50 outline-none focus:ring-2 focus:ring-[#0f5c82]"
            >
                <option value="All">All Types</option>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="Utility Equipment">Utility Equipment</option>
                <option value="Access">Access</option>
                <option value="Tools">Tools</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {filteredEquipment.map((item) => (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                          <div className="text-sm text-zinc-500">{item.type}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                      </span>
                  </div>

                  <div className="space-y-3 text-sm mb-6 flex-1">
                      {!projectId && (
                          <div>
                              <div className="text-zinc-900 font-medium">Project: {item.projectName || 'Unassigned'}</div>
                          </div>
                      )}
                      <div className="flex justify-between border-t border-zinc-50 pt-2">
                          <span className="text-zinc-500">Last Service</span>
                          <span className="font-medium text-zinc-700">{item.lastService}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-zinc-500">Next Service</span>
                          <span className="font-medium text-zinc-700">{item.nextService}</span>
                      </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-zinc-100">
                      <button className="flex-1 py-2 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded text-xs font-medium hover:bg-zinc-100 flex items-center justify-center gap-1">
                          <Wrench size={12} /> Maintenance
                      </button>
                      <button 
                        onClick={() => updateEquipment(item.id, { status: item.status === 'Available' ? 'In Use' : 'Available' })}
                        className="flex-1 py-2 bg-white border border-zinc-200 text-[#0f5c82] rounded text-xs font-medium hover:bg-blue-50"
                      >
                          {item.status === 'Available' ? 'Assign' : 'Return'}
                      </button>
                  </div>
              </div>
          ))}
          
          {filteredEquipment.length === 0 && (
              <div className="col-span-full p-12 text-center text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
                  No equipment records found.
              </div>
          )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">Register New Equipment</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Equipment Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#0f5c82] outline-none transition-colors" 
                            value={newItem.name || ''} 
                            onChange={e => setNewItem({...newItem, name: e.target.value})} 
                            placeholder="e.g. Generator X500" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                          <select className="w-full p-2 border border-zinc-200 rounded-lg bg-white" value={newItem.type || ''} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                              <option value="">Select Type...</option>
                              <option value="Heavy Machinery">Heavy Machinery</option>
                              <option value="Utility Equipment">Utility Equipment</option>
                              <option value="Access">Access</option>
                              <option value="Tools">Tools</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                          <select className="w-full p-2 border border-zinc-200 rounded-lg bg-white" value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value as any})}>
                              <option value="Available">Available</option>
                              <option value="In Use">In Use</option>
                              <option value="Maintenance">Maintenance</option>
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
                      <button onClick={handleAddEquipment} disabled={!newItem.name || !newItem.type} className="px-6 py-2 bg-[#0f5c82] text-white font-bold rounded-lg hover:bg-[#0c4a6e] disabled:opacity-50">Register</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default EquipmentView;
