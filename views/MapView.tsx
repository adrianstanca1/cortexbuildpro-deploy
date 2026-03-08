
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Filter, Info, ChevronRight, CheckSquare, Building2, Map as MapIcon, Loader2, X } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Project, Task } from '../types';
import * as L from 'leaflet';

const MapView: React.FC = () => {
  const { projects, tasks } = useProjects();
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'project' | 'task', id: string } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Standard Leaflet Initialization
    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([40.7128, -74.0060], 4); // Initial view over US

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    setIsMapReady(true);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update Markers when projects/tasks change
  useEffect(() => {
    if (!isMapReady || !leafletMap.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    // Add Project Markers
    projects.forEach(p => {
      if (p.latitude && p.longitude) {
        const marker = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-10 h-10 rounded-full bg-[#0f5c82] border-4 border-white shadow-xl flex items-center justify-center text-white ring-2 ring-[#0f5c82]/20 scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const m = L.marker([p.latitude, p.longitude], { icon: marker })
          .addTo(markersLayer.current!)
          .on('click', () => setSelectedEntity({ type: 'project', id: p.id }));
      }
    });

    // Add Task Markers
    tasks.forEach(t => {
      if (t.latitude && t.longitude) {
        const marker = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center text-white animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([t.latitude, t.longitude], { icon: marker })
          .addTo(markersLayer.current!)
          .on('click', () => setSelectedEntity({ type: 'task', id: t.id }));
      }
    });

    // Auto-fit bounds if we have entities
    const allCoords: L.LatLngExpression[] = [
        ...projects.filter(p => p.latitude).map(p => [p.latitude!, p.longitude!] as L.LatLngExpression),
        ...tasks.filter(t => t.latitude).map(t => [t.latitude!, t.longitude!] as L.LatLngExpression)
    ];

    if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [isMapReady, projects, tasks]);

  const selectedData = selectedEntity ? (
      selectedEntity.type === 'project' 
      ? projects.find(p => p.id === selectedEntity.id) 
      : tasks.find(t => t.id === selectedEntity.id)
  ) : null;

  return (
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden">
      {/* Map Header */}
      <div className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <MapIcon size={20} className="text-[#0f5c82]" /> Global Site Map
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-lg border border-blue-100">Live Telemetry</span>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="bg-zinc-100 p-1 rounded-lg border border-zinc-200 flex gap-1">
                 <button className="px-3 py-1.5 bg-white text-[#0f5c82] rounded shadow-sm text-xs font-bold uppercase tracking-tight">Standard</button>
                 <button className="px-3 py-1.5 text-zinc-500 text-xs font-bold uppercase tracking-tight hover:text-zinc-700">Satellite</button>
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all">
                <Filter size={16} /> Layers
            </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 relative">
         <div ref={mapRef} className="absolute inset-0 z-0 bg-zinc-200" />
         
         {!isMapReady && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-50/80 backdrop-blur-sm">
                 <Loader2 size={40} className="animate-spin text-[#0f5c82] mb-4" />
                 <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Initializing Spatial Engine...</p>
             </div>
         )}

         {/* Floating Zoom Controls */}
         <div className="absolute right-6 top-6 flex flex-col gap-2 z-10">
             <button onClick={() => leafletMap.current?.zoomIn()} className="p-3 bg-white text-zinc-700 rounded-xl shadow-xl hover:bg-zinc-50 border border-zinc-100 active:scale-90 transition-all"><ZoomIn size={20} /></button>
             <button onClick={() => leafletMap.current?.zoomOut()} className="p-3 bg-white text-zinc-700 rounded-xl shadow-xl hover:bg-zinc-50 border border-zinc-100 active:scale-90 transition-all"><ZoomOut size={20} /></button>
         </div>

         {/* Legend / Key Overlay */}
         <div className="absolute left-6 bottom-6 bg-white/90 backdrop-blur-md border border-zinc-200 p-4 rounded-2xl shadow-2xl z-10 w-48 animate-in slide-in-from-left-4 duration-500">
             <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 border-b pb-2">Spatial Legend</h4>
             <div className="space-y-3">
                 <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full bg-[#0f5c82] border-2 border-white shadow-sm" />
                     <span className="text-xs font-bold text-zinc-700">Project Hub</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm" />
                     <span className="text-xs font-bold text-zinc-700">Field Objective</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                     <span className="text-xs font-bold text-zinc-700">Safe Zone</span>
                 </div>
             </div>
         </div>

         {/* Selection Sidebar (Slide-over style) */}
         {selectedData && (
             <div className="absolute right-6 bottom-20 top-6 w-96 bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-zinc-200 rounded-[2.5rem] z-20 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500">
                 <div className="p-6 border-b border-zinc-100 flex justify-between items-start">
                     <div>
                         <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{selectedEntity?.type} Overview</span>
                         <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase mt-1 leading-tight">
                             {(selectedData as any).name || (selectedData as any).title}
                         </h3>
                     </div>
                     {/* Fix: Added missing X icon import */}
                     <button onClick={() => setSelectedEntity(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={24} className="text-zinc-400" /></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     {selectedEntity?.type === 'project' ? (
                         <div className="space-y-6">
                             <div className="rounded-3xl overflow-hidden h-40 shadow-inner bg-zinc-100">
                                 <img src={(selectedData as Project).image} className="w-full h-full object-cover" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                     <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</div>
                                     <div className="font-bold text-[#0f5c82]">{(selectedData as Project).status}</div>
                                 </div>
                                 <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                     <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Health</div>
                                     <div className="font-bold text-green-600">{(selectedData as Project).health}</div>
                                 </div>
                             </div>
                             <p className="text-sm text-zinc-600 leading-relaxed">{(selectedData as Project).description}</p>
                         </div>
                     ) : (
                         <div className="space-y-6">
                             <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 text-center">
                                 <CheckSquare size={32} className="text-orange-500 mx-auto mb-3" />
                                 <h4 className="font-black text-zinc-900 uppercase">Field Objective</h4>
                                 <p className="text-xs text-zinc-500 mt-1 italic">Spatial coordinates verified at this site node.</p>
                             </div>
                             <div className="space-y-4">
                                 <div className="flex justify-between items-center text-sm border-b pb-4 border-zinc-50">
                                     <span className="text-zinc-500 font-medium">Assignee</span>
                                     <span className="font-bold text-zinc-900">{(selectedData as Task).assigneeName}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm border-b pb-4 border-zinc-50">
                                     <span className="text-zinc-500 font-medium">Due Date</span>
                                     <span className="font-bold text-zinc-900">{(selectedData as Task).dueDate}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-zinc-500 font-medium">Priority</span>
                                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${(selectedData as Task).priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                         {(selectedData as Task).priority}
                                     </span>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>

                 <div className="p-8 border-t border-zinc-100 bg-zinc-50/50">
                     <button className="w-full py-4 bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                         Access Context Hub <ChevronRight size={16} />
                     </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default MapView;
