
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Map as MapIcon, Layers, Upload, Crosshair, Users, Navigation, 
  FileText, Loader2, ZoomIn, ZoomOut, Eye, CheckCircle2,
  Cpu, Scan, FileCode, XCircle, Maximize, Grid,
  FolderOpen, Clock, X, Image as ImageIcon, Search, Briefcase, RefreshCw,
  PlusSquare, PenTool, Sparkles, ChevronDown, CheckSquare, MapPin, User
} from 'lucide-react';
import * as L from 'leaflet';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { runRawPrompt } from '../services/geminiService';
import { Zone, Task, ProjectDrawing } from '../types';

type MapMode = 'REAL_WORLD' | 'VIRTUAL_SITE';
type ProcessingStatus = 'IDLE' | 'PROCESSING' | 'ERROR' | 'SUCCESS';

interface MapUser {
  id: string;
  name: string;
  role: 'Manager' | 'Foreman' | 'Labor';
  lat: number; 
  lng: number; 
  lastActive: string;
  status: 'Active' | 'Idle';
}

interface LiveProjectMapViewProps {
  projectId?: string;
}

const LiveProjectMapView: React.FC<LiveProjectMapViewProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { projects, drawings, addZone, addDrawing, tasks } = useProjects();
  const [mode, setMode] = useState<MapMode>('VIRTUAL_SITE');
  
  const activeProject = projectId 
      ? projects.find(p => p.id === projectId) 
      : (projects.length > 0 ? projects[0] : null);
  
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('IDLE');
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZoneRect, setPendingZoneRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  const [newZoneData, setNewZoneData] = useState({ label: '', type: 'warning' as const, protocol: '', trigger: 'Entry' });
  const [isGeneratingProtocol, setIsGeneratingProtocol] = useState(false);

  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [users, setUsers] = useState<MapUser[]>([
    { id: '1', name: 'John Anderson', role: 'Manager', lat: 45, lng: 30, lastActive: 'Just now', status: 'Active' },
    { id: '2', name: 'Mike Thompson', role: 'Foreman', lat: 60, lng: 65, lastActive: '2m ago', status: 'Active' },
    { id: '3', name: 'David Chen', role: 'Foreman', lat: 25, lng: 80, lastActive: '5m ago', status: 'Active' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load latest drawing for project
  useEffect(() => {
    if (activeProject) {
        const projectDrawings = drawings.filter(d => d.projectId === activeProject.id);
        if (projectDrawings.length > 0) {
            setMapImage(projectDrawings[0].url);
        }
    }
  }, [activeProject, drawings]);

  const startProcessingSimulation = async (file: File) => {
      if (!activeProject) return;
      setProcessingStatus('PROCESSING');
      setError(null);
      
      try {
        setProcessingSteps(['Initializing Gemini Vision AI...', 'Analyzing blueprint layers...']);
        
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
        
        await new Promise(r => setTimeout(r, 2000));
        setProcessingSteps(prev => [...prev, 'Gemini: Generating vector map...', 'AI Analysis: Calibrating site coordinates...']);
        await new Promise(r => setTimeout(r, 1500));

        /* Fixed: Added companyId to the new drawing object. */
        const newDrawing: ProjectDrawing = {
            id: `dr-${Date.now()}`,
            name: file.name,
            type: file.name.endsWith('.dwg') ? 'DWG' : 'PDF',
            category: 'Structural',
            projectId: activeProject.id,
            companyId: user?.companyId || 'c1',
            uploader: 'Current User',
            date: new Date().toLocaleDateString(),
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            url: base64
        };

        await addDrawing(newDrawing);
        setMapImage(base64);
        setProcessingStatus('SUCCESS');
        setTimeout(() => setProcessingStatus('IDLE'), 1000);
      } catch (err) {
          setError("Analysis failed. Please try again.");
          setProcessingStatus('ERROR');
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startProcessingSimulation(file);
  };

  const handleZoneDrawn = (rect: any) => { setPendingZoneRect(rect); setShowZoneModal(true); };
  const handleSaveZone = () => {
      if (pendingZoneRect && newZoneData.label && activeProject) {
          addZone(activeProject.id, { id: `z-${Date.now()}`, ...pendingZoneRect, ...newZoneData });
          setShowZoneModal(false);
          setPendingZoneRect(null);
      }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-50 relative">
      <div className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2"><Crosshair className="text-[#0f5c82]" /> Live Project Map</h1>
           {mapImage && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Drawing Bucket Active</span>}
        </div>
        <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#0f5c82] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                <Upload size={16} /> Upload Blueprint
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r border-zinc-200 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-widest">Drawings in Bucket</h3>
            <div className="space-y-3">
                {drawings.filter(d => d.projectId === activeProject?.id).map(d => (
                    <div key={d.id} onClick={() => setMapImage(d.url)} className="p-3 border border-zinc-100 rounded-xl hover:border-blue-300 cursor-pointer transition-all bg-white shadow-sm group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">{d.type}</span>
                            <span className="text-[10px] text-zinc-400">{d.date}</span>
                        </div>
                        <div className="font-bold text-zinc-900 text-sm truncate">{d.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1"><User size={10} /> {d.uploader}</div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 relative bg-zinc-100">
           {processingStatus !== 'IDLE' && (
               <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in">
                   <div className="p-10 bg-white rounded-3xl shadow-2xl border border-zinc-100 text-center max-w-sm">
                        {processingStatus === 'PROCESSING' ? (
                            <>
                                <Loader2 size={40} className="text-[#0f5c82] animate-spin mx-auto mb-6" />
                                <h3 className="text-xl font-bold mb-4">Processing Blueprint...</h3>
                                <div className="space-y-2 text-left">
                                    {processingSteps.map((s, i) => <div key={i} className="text-xs text-zinc-500 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> {s}</div>)}
                                </div>
                            </>
                        ) : (
                            <div className="animate-in zoom-in-95"><CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" /><h3 className="text-xl font-bold">Successfully Bucketized</h3></div>
                        )}
                   </div>
               </div>
           )}
           {mode === 'VIRTUAL_SITE' && mapImage && (
             <VirtualSiteMap users={users} getRoleColor={(r) => 'bg-blue-500'} mapImage={mapImage} zones={activeProject?.zones || []} onZoneDraw={handleZoneDrawn} />
           )}
           {!mapImage && <div className="h-full flex items-center justify-center flex-col text-zinc-400"><FileCode size={64} className="opacity-10 mb-4" /><p>No drawing in bucket. Upload a PDF or DWG.</p></div>}
        </div>
      </div>

      {showZoneModal && (
          <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center">
              <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-6">Zone Configuration</h3>
                  <div className="space-y-4">
                      <div><label className="text-[10px] font-bold text-zinc-400 uppercase">Label</label><input type="text" value={newZoneData.label} onChange={e => setNewZoneData({...newZoneData, label: e.target.value})} className="w-full p-3 border border-zinc-200 rounded-xl" /></div>
                      <div><label className="text-[10px] font-bold text-zinc-400 uppercase">Type</label><select className="w-full p-3 border border-zinc-200 rounded-xl" value={newZoneData.type} onChange={e => setNewZoneData({...newZoneData, type: e.target.value as any})}><option value="danger">Danger</option><option value="warning">Warning</option><option value="info">Info</option></select></div>
                  </div>
                  <div className="flex gap-3 mt-8"><button onClick={() => setShowZoneModal(false)} className="flex-1 py-3 bg-zinc-100 rounded-xl font-bold text-zinc-600">Cancel</button><button onClick={handleSaveZone} className="flex-1 py-3 bg-[#0f5c82] text-white rounded-xl font-bold shadow-lg">Save Zone</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper components (VirtualSiteMap needs to be defined or imported - assuming simplified version here for context)
const VirtualSiteMap = ({ mapImage, users, zones, onZoneDraw }: any) => {
    const [scale, setScale] = useState(1);
    const [dragging, setDragging] = useState(false);
    const [pos, setPos] = useState({x: 0, y: 0});

    return (
        <div className="w-full h-full bg-white overflow-hidden relative cursor-grab active:cursor-grabbing" onMouseDown={() => setDragging(true)} onMouseUp={() => setDragging(false)} onMouseMove={(e) => dragging && setPos({x: pos.x + e.movementX, y: pos.y + e.movementY})}>
            <div style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }} className="relative origin-center w-full h-full flex items-center justify-center">
                <img src={mapImage} alt="Map" className="max-w-none max-h-none h-full object-contain pointer-events-none" />
                {zones.map((z: any) => (
                    <div key={z.id} className={`absolute border-2 border-dashed ${z.type === 'danger' ? 'bg-red-500/20 border-red-500' : 'bg-orange-500/20 border-orange-500'}`} style={{ top: `${z.top}%`, left: `${z.left}%`, width: `${z.width}%`, height: `${z.height}%` }}>
                        <span className="absolute top-0 left-0 bg-white text-[8px] font-bold px-1 rounded shadow-sm">{z.label}</span>
                    </div>
                ))}
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => setScale(s => s + 0.1)} className="p-2 bg-white rounded shadow border border-zinc-200"><ZoomIn size={16} /></button>
                <button onClick={() => setScale(s => s - 0.1)} className="p-2 bg-white rounded shadow border border-zinc-200"><ZoomOut size={16} /></button>
            </div>
        </div>
    );
};

export default LiveProjectMapView;
