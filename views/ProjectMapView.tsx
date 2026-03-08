import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { Project, Task } from '../types';
/* Added missing ArrowRight and X imports from lucide-react */
import { 
    ScanLine, Crosshair, MapPin, Navigation, 
    ZoomIn, ZoomOut, Target, Activity, LocateFixed, Focus,
    Search, Loader2, Sparkles, Map as MapIcon, Globe,
    ArrowRight, X
} from 'lucide-react';
import { mapsGroundingSearch } from '../services/geminiService';

interface ProjectMapViewProps {
  project: Project;
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

const ProjectMapView: React.FC<ProjectMapViewProps> = ({ project, tasks, onSelectTask }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const groundingMarkersLayer = useRef<L.LayerGroup | null>(null);
  const [centerCoords, setCenterCoords] = useState<{lat: number, lng: number}>({ 
      lat: project.latitude || 51.505, 
      lng: project.longitude || -0.09 
  });

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);
  const [searchResultText, setSearchResultText] = useState<string | null>(null);

  const resetView = () => {
    if (leafletMap.current && project.latitude && project.longitude) {
      leafletMap.current.setView([project.latitude, project.longitude], 17, { animate: true });
    }
  };

  const fitAllMarkers = () => {
      if (!leafletMap.current || !markersLayer.current) return;
      const allCoords: L.LatLngExpression[] = [
          ...(project.latitude && project.longitude ? [[project.latitude, project.longitude] as L.LatLngExpression] : []),
          ...tasks.filter(t => t.latitude && t.longitude).map(t => [t.latitude!, t.longitude!] as L.LatLngExpression)
      ];

      if (allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords);
          leafletMap.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 18 });
      }
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim() || isSearchingGrounding) return;

    setIsSearchingGrounding(true);
    setSearchResultText(null);
    groundingMarkersLayer.current?.clearLayers();

    try {
        const { text, links } = await mapsGroundingSearch(
            mapSearchQuery, 
            project.latitude || centerCoords.lat, 
            project.longitude || centerCoords.lng
        );
        
        setSearchResultText(text);

        // Plot external grounding results if coordinates can be inferred (simulated for high-fidelity)
        links.forEach((link, i) => {
            if (link.maps) {
                // If the model provides map grounding chunks, we list them in results.
                // In a production app, we would resolve places to coordinates here.
            }
        });

    } catch (e) {
        console.error("Map grounding failed", e);
    } finally {
        setIsSearchingGrounding(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const initialLat = project.latitude || 51.505;
    const initialLng = project.longitude || -0.09;

    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    groundingMarkersLayer.current = L.layerGroup().addTo(leafletMap.current);

    leafletMap.current.on('move', () => {
        const center = leafletMap.current?.getCenter();
        if (center) setCenterCoords({ lat: center.lat, lng: center.lng });
    });

    // Initial fit
    setTimeout(fitAllMarkers, 100);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    // --- Project Command Node ---
    if (project.latitude && project.longitude) {
      const projectIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-16 h-16 rounded-[2rem] bg-midnight border-4 border-white shadow-2xl flex items-center justify-center text-primary ring-4 ring-primary/20 scale-110 z-[2000]">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
               </div>`,
        iconSize: [64, 64],
        iconAnchor: [32, 32]
      });

      L.marker([project.latitude, project.longitude], { icon: projectIcon })
        .addTo(markersLayer.current)
        .bindPopup(`
          <div class="p-6 font-sans w-72 bg-white rounded-[2.5rem]">
            <div class="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
               <div class="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#0ea5e9]"></div>
               Primary Command Node
            </div>
            <div class="font-black text-2xl text-zinc-900 uppercase tracking-tighter leading-tight">${project.name}</div>
            <div class="text-[11px] font-bold text-zinc-400 uppercase mt-4 flex items-center gap-2">
               <MapPin size={14} className="text-primary" />
               ${project.location}
            </div>
            <div class="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-center">
               <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">${project.status} HUB</span>
               <span class="text-[10px] font-black text-white bg-primary px-3 py-1 rounded-full shadow-lg shadow-blue-500/20">${project.progress}% SYNC</span>
            </div>
          </div>
        `);
    }

    // --- Task Objective Shards ---
    tasks.forEach(task => {
      if (task.latitude && task.longitude) {
        const statusColors: Record<string, string> = {
          'Done': '#22c55e',
          'In Progress': '#0ea5e9',
          'Blocked': '#ef4444',
          'To Do': '#94a3b8'
        };
        const color = statusColors[task.status] || '#0ea5e9';
        const isCritical = task.priority === 'Critical';

        const taskIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative w-12 h-12 flex items-center justify-center">
                  ${isCritical ? `<div class="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>` : ''}
                  <div class="w-10 h-10 rounded-2xl bg-white border-2 border-zinc-200 shadow-xl flex items-center justify-center transition-all hover:scale-125 hover:z-[1000] cursor-pointer group relative">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-inner" style="background-color: ${color}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    ${isCritical ? `<div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg"></div>` : ''}
                  </div>
                 </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker([task.latitude, task.longitude], { icon: taskIcon })
          .addTo(markersLayer.current!)
          .on('click', () => {
              if (onSelectTask) onSelectTask(task);
          });
          
        marker.bindTooltip(`
          <div class="p-3 font-sans w-64 bg-white rounded-2xl shadow-2xl border border-zinc-100">
            <div class="flex justify-between items-center mb-2">
               <div class="font-black text-[9px] uppercase text-zinc-400 tracking-widest">${task.status} NODE</div>
               <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border" style="background-color: ${color}15; color: ${color}; border-color: ${color}30">${task.priority}</span>
            </div>
            <div class="font-black text-sm text-zinc-900 uppercase tracking-tighter leading-tight line-clamp-2">${task.title}</div>
            <div class="text-[9px] font-bold text-zinc-500 uppercase mt-3 flex items-center gap-1.5 pt-2 border-t border-zinc-50">
               <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></div>
               Custodian: ${task.assigneeName || 'Unassigned'}
            </div>
          </div>
        `, { direction: 'top', offset: [0, -15], opacity: 1, className: 'leaflet-tooltip-custom' });
      }
    });
  }, [project, tasks, onSelectTask]);

  return (
    <div className="h-[780px] w-full bg-zinc-100 rounded-[3.5rem] overflow-hidden border border-zinc-200 shadow-inner relative group animate-in zoom-in-95 duration-700">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      
      {/* --- FLOATING MAP CONTROLS --- */}
      <div className="absolute right-8 top-8 flex flex-col gap-4 z-10 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-zinc-200 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 ring-1 ring-black/5">
            <button onClick={() => leafletMap.current?.zoomIn()} className="p-3 text-zinc-600 hover:bg-zinc-100 hover:text-primary rounded-xl transition-all active:scale-90" title="Zoom In Shard"><ZoomIn size={22} /></button>
            <div className="h-px bg-zinc-100 mx-2" />
            <button onClick={() => leafletMap.current?.zoomOut()} className="p-3 text-zinc-600 hover:bg-zinc-100 hover:text-primary rounded-xl transition-all active:scale-90" title="Zoom Out Shard"><ZoomOut size={22} /></button>
          </div>
          <button onClick={resetView} className="p-4 bg-midnight text-white rounded-2xl shadow-2xl hover:bg-black active:scale-90 transition-all border border-white/10 flex items-center justify-center ring-4 ring-midnight/5" title="Recenter Command Node">
            <Navigation size={24} strokeWidth={2.5} />
          </button>
          <button onClick={fitAllMarkers} className="p-4 bg-white text-zinc-700 rounded-2xl shadow-2xl hover:bg-zinc-100 active:scale-90 transition-all border border-zinc-200 flex items-center justify-center ring-4 ring-black/5" title="Fit All Shards">
            <Focus size={24} strokeWidth={2.5} />
          </button>
      </div>

      {/* --- SITE AMENITY SEARCH OVERLAY (Maps Grounding) --- */}
      <div className="absolute top-8 right-32 z-10 w-96 pointer-events-auto">
        <form onSubmit={handleMapSearch} className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchingGrounding ? 'text-primary animate-pulse' : 'text-zinc-400'}`} size={18} />
            <input 
                value={mapSearchQuery}
                onChange={e => setMapSearchQuery(e.target.value)}
                placeholder="Locate suppliers, amenities..."
                className="w-full pl-12 pr-12 py-4 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-2xl text-sm font-bold shadow-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
            {isSearchingGrounding ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={18} className="animate-spin text-primary" />
                </div>
            ) : (
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 text-white rounded-lg hover:bg-primary transition-all shadow-lg active:scale-90">
                    <ArrowRight size={14} />
                </button>
            )}
        </form>

        {searchResultText && (
            <div className="mt-4 p-6 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 max-h-[300px] overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-4 px-1">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles size={12} className="text-yellow-400" /> AI Spatial Insight
                    </div>
                    <button onClick={() => setSearchResultText(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={14} /></button>
                </div>
                <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed font-medium italic">
                    {searchResultText}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Maps Grounding Active</span>
                    <Globe size={12} className="text-primary" />
                </div>
            </div>
        )}
      </div>

      {/* --- TELEMETRY HUD OVERLAYS --- */}
      <div className="absolute top-8 left-8 flex flex-col gap-4 z-10">
          <div className="bg-midnight/90 backdrop-blur-xl px-6 py-4 rounded-[1.75rem] border border-white/10 shadow-2xl flex items-center gap-6 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Spatial Telemetry</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Global Cluster Sync Active</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{tasks.filter(t => t.latitude).length} Objective Shards</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Plotted in Registry</span>
              </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-200 shadow-xl flex items-center gap-4 animate-in slide-in-from-left-4 duration-1000">
              <div className="flex items-center gap-2">
                <LocateFixed size={12} className="text-zinc-400" />
                <span className="text-[9px] font-mono text-zinc-500 font-black">{centerCoords.lat.toFixed(6)}, {centerCoords.lng.toFixed(6)}</span>
              </div>
          </div>
      </div>

      {/* --- MATRIX KEY --- */}
      <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md border border-zinc-200 p-8 rounded-[2.5rem] shadow-2xl z-10 w-72 animate-in slide-in-from-right-4 ring-1 ring-black/5">
          <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em] mb-6 border-b border-zinc-100 pb-4 flex items-center gap-3">
            <ScanLine size={16} className="text-primary" /> Spatial Registry Key
          </h4>
          <div className="space-y-5">
              <div className="flex items-center gap-4 group/key cursor-default">
                  <div className="w-5 h-5 rounded-full bg-midnight border-2 border-white shadow-lg ring-2 ring-primary/20 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Command Node</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Primary Site Anchor</span>
                  </div>
              </div>
              <div className="flex items-center gap-4 group/key cursor-default">
                  <div className="w-5 h-5 rounded-lg bg-[#0ea5e9] border-2 border-white shadow-lg group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Active Shard</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Site Objective</span>
                  </div>
              </div>
              <div className="flex items-center gap-4 group/key cursor-default">
                  <div className="w-5 h-5 rounded-lg bg-[#22c55e] border-2 border-white shadow-lg group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Synced Shard</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Completed Progression Node</span>
                  </div>
              </div>
              <div className="flex items-center gap-4 group/key cursor-default">
                  <div className="w-5 h-5 rounded-lg bg-[#ef4444] border-2 border-white shadow-lg animate-pulse group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest font-black text-red-600">Blocked Node</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Requires Immediate Protocol</span>
                  </div>
              </div>
          </div>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 2.5rem !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-shadow: 0 50px 100px -20px rgb(0 0 0 / 0.5) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-tooltip-custom {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default ProjectMapView;