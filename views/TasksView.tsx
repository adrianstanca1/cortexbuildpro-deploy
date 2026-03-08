import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, User, Briefcase, X, Link, AlertCircle, Search, Filter, 
  ArrowUpDown, LayoutGrid, List as ListIcon, CheckCircle2, AlertTriangle, 
  Lock, Sparkles, Loader2, MapPin, Navigation,
  ChevronsUp, ChevronUp, Minus, ChevronDown, Paperclip, FileText, Eye, Trash2, Download, Image as ImageIcon, Box, Upload, Wand2, UserPlus,
  CheckSquare, Info, ListTodo, GitMerge, Map as MapIcon, ChevronRight, Check, ListChecks, Activity, BrainCircuit, Send, Edit2, Share2,
  ShieldCheck, Building, Target, ZoomIn, ZoomOut, Anchor,
  ScanLine, Map as MapIconLucide, Globe, LocateFixed, Focus,
  Save,
  MoreHorizontal, Maximize2, MinusCircle, Layers, Shield,
  Link2,
  PencilLine,
  Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';
import { UserRole, Task, ProjectDocument, SubTask } from '../types';
import * as L from 'leaflet';

interface TasksViewProps {
  projectId?: string;
}

const TaskMapView: React.FC<{ 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void; 
  projectId?: string;
  focusedTaskId?: string | null;
}> = ({ tasks, onTaskClick, projectId, focusedTaskId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const { projects } = useProjects();
  const [hoveredCoords, setHoveredCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const project = projectId ? projects.find(p => p.id === projectId) : null;
    const initialLat = project?.latitude || 51.505;
    const initialLng = project?.longitude || -0.09;

    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    markersLayer.current = L.layerGroup().addTo(leafletMap.current);

    leafletMap.current.on('mousemove', (e: L.LeafletMouseEvent) => {
        setHoveredCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [projectId, projects]);

  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    tasks.forEach(task => {
      if (task.latitude && task.longitude) {
        const coords: L.LatLngExpression = [task.latitude, task.longitude];
        bounds.push(coords);

        const statusColors: Record<string, string> = {
            'Done': '#22c55e',
            'In Progress': '#3b82f6',
            'Blocked': '#ef4444',
            'To Do': '#94a3b8'
        };
        const color = statusColors[task.status] || '#166ba1';
        const isFocused = focusedTaskId === task.id;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative w-12 h-12 flex items-center justify-center">
                  ${isFocused ? '<div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>' : ''}
                  <div class="w-10 h-10 rounded-2xl bg-white border-2 ${isFocused ? 'border-primary shadow-primary/20' : 'border-zinc-200'} shadow-xl flex items-center justify-center transition-all hover:scale-125 hover:z-[1000] cursor-pointer group relative">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-inner" style="background-color: ${color}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border border-zinc-100 rounded-full flex items-center justify-center shadow-sm">
                      <div class="w-2 h-2 rounded-full ${task.priority === 'Critical' ? 'bg-red-50 animate-pulse' : 'bg-zinc-300'}"></div>
                    </div>
                  </div>
                 </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker(coords, { icon })
          .addTo(markersLayer.current!)
          .on('click', () => onTaskClick(task));
          
        marker.bindTooltip(`
          <div class="p-3 font-sans w-64 bg-white rounded-2xl shadow-2xl border border-zinc-100">
            <div class="flex justify-between items-center mb-2">
               <div class="font-black text-[9px] uppercase text-zinc-400 tracking-widest">${task.status} NODE</div>
               <span class="text-[8px] font-mono font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">GPS SYNC</span>
            </div>
            <div class="font-black text-sm text-zinc-900 uppercase tracking-tighter leading-tight">${task.title}</div>
            <div class="mt-3 pt-2 border-t border-zinc-50 flex flex-col gap-1">
               <div class="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-400">
                  <LocateFixed size={10} /> ${task.latitude.toFixed(6)}, ${task.longitude.toFixed(6)}
               </div>
               <div class="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></div>
                  Custodian: ${task.assigneeName || 'Unassigned'}
               </div>
            </div>
          </div>
        `, { direction: 'top', offset: [0, -15], opacity: 1, className: 'leaflet-tooltip-custom' });
      }
    });

    if (focusedTaskId) {
        const focusedTask = tasks.find(t => t.id === focusedTaskId);
        if (focusedTask && focusedTask.latitude && focusedTask.longitude) {
            leafletMap.current.setView([focusedTask.latitude, focusedTask.longitude], 17, { animate: true });
        }
    } else if (bounds.length > 0) {
      leafletMap.current.fitBounds(L.latLngBounds(bounds), { padding: [80, 80], maxZoom: 16 });
    }
  }, [tasks, onTaskClick, focusedTaskId]);

  return (
    <div className="relative h-full w-full bg-zinc-100 rounded-[3.5rem] overflow-hidden border border-zinc-200 shadow-inner group animate-in zoom-in-95 duration-700">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      
      {/* Floating Map Controls */}
      <div className="absolute right-8 top-8 flex flex-col gap-4 z-10 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-zinc-200 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 ring-1 ring-black/5">
            <button onClick={() => leafletMap.current?.zoomIn()} className="p-3 text-zinc-600 hover:bg-zinc-100 hover:text-primary rounded-xl transition-all active:scale-90" title="Zoom In Shard"><ZoomIn size={22} /></button>
            <div className="h-px bg-zinc-100 mx-2" />
            <button onClick={() => leafletMap.current?.zoomOut()} className="p-3 text-zinc-600 hover:bg-zinc-100 hover:text-primary rounded-xl transition-all active:scale-90" title="Zoom Out Shard"><ZoomOut size={22} /></button>
          </div>
          <button className="p-4 bg-midnight text-white rounded-2xl shadow-2xl hover:bg-black active:scale-90 transition-all border border-white/10 flex items-center justify-center ring-4 ring-midnight/5" title="Recenter Shard Cluster">
            <Navigation size={24} strokeWidth={2.5} />
          </button>
      </div>

      <div className="absolute top-8 left-8 flex flex-col gap-3 z-10">
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-[1.5rem] border border-zinc-200 shadow-2xl flex items-center gap-3 ring-1 ring-black/5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                Spatial Telemetry Active
              </span>
          </div>
          
          <div className="bg-midnight/80 backdrop-blur-sm px-4 py-2 rounded-xl text-[9px] font-mono text-zinc-400 border border-white/5 shadow-xl flex items-center gap-3">
              <LocateFixed size={12} className="text-primary" />
              <span>{hoveredCoords ? `${hoveredCoords.lat.toFixed(6)}, ${hoveredCoords.lng.toFixed(6)}` : 'SCANNING MATRIX...'}</span>
          </div>
      </div>

      <style>{`
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

const ModalLocationPicker: React.FC<{ 
  lat?: number; 
  lng?: number; 
  onSelect: (lat: number, lng: number) => void;
  defaultLat?: number;
  defaultLng?: number;
}> = ({ lat, lng, onSelect, defaultLat = 51.505, defaultLng = -0.09 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = lat || defaultLat;
    const initialLng = lng || defaultLng;

    mapInstance.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], lat ? 16 : 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-10 h-10 rounded-full bg-primary border-4 border-white shadow-2xl flex items-center justify-center text-white scale-125 ring-4 ring-primary/20"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg></div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
          })
      }).addTo(mapInstance.current);
    }

    mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-10 h-10 rounded-full bg-primary border-4 border-white shadow-2xl flex items-center justify-center text-white scale-125 ring-4 ring-primary/20"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(mapInstance.current!);
      }
      onSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    setTimeout(() => {
      mapInstance.current?.invalidateSize();
    }, 100);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (lat && lng && mapInstance.current) {
      const newPos = L.latLng(lat, lng);
      if (markerRef.current) {
        markerRef.current.setLatLng(newPos);
      } else {
        markerRef.current = L.marker(newPos, {
             icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-10 h-10 rounded-full bg-primary border-4 border-white shadow-2xl flex items-center justify-center text-white scale-125 ring-4 ring-primary/20"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(mapInstance.current);
      }
      mapInstance.current.setView(newPos, 16);
    }
  }, [lat, lng]);

  return (
    <div className="relative h-64 w-full bg-zinc-100 rounded-[2.5rem] overflow-hidden border border-zinc-200 mt-2 shadow-inner group">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-200 shadow-xl group-hover:text-primary transition-colors flex items-center gap-2">
        <Target size={12} className="text-primary" /> Drop Spatial Node Pin
      </div>
      <div className="absolute bottom-4 right-4 z-10">
          <div className="p-3 bg-white/90 backdrop-blur-md rounded-[1.25rem] shadow-xl border border-zinc-200">
              <ScanLine size={18} className="text-zinc-400 group-hover:text-primary transition-colors" />
          </div>
      </div>
    </div>
  );
};

const TasksView: React.FC<TasksViewProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { tasks, projects, teamMembers, documents, addTask, updateTask } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [depSearch, setDepSearch] = useState('');
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [activeFieldAnalyzing, setActiveFieldAnalyzing] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState('');
  
  // View State
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST' | 'MAP'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Done' | 'Blocked',
    priority: 'Medium' as 'High' | 'Medium' | 'Low' | 'Critical',
    assigneeType: 'user' as 'user' | 'role',
    assigneeName: '',
    dueDate: '',
    dependencies: [] as string[],
    subtasks: [] as SubTask[],
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('');
  
  const currentProject = useMemo(() => 
    projects.find(p => p.id === (formState.projectId || projectId))
  , [projects, formState.projectId, projectId]);

  const processedTasks = useMemo(() => {
      let result = [...tasks];
      if (projectId) result = result.filter(t => t.projectId === projectId);
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(t => t.title.toLowerCase().includes(q) || (t.assigneeName && t.assigneeName.toLowerCase().includes(q)));
      }
      return result;
  }, [tasks, searchQuery, projectId]);

  const dependencyCandidates = useMemo(() => {
    return tasks.filter(t => 
        t.projectId === (formState.projectId || projectId) && 
        t.id !== editingTask?.id &&
        !formState.dependencies.includes(t.id) &&
        (t.title.toLowerCase().includes(depSearch.toLowerCase()))
    );
  }, [tasks, formState.projectId, projectId, editingTask, formState.dependencies, depSearch]);

  const columns = useMemo(() => [
      { title: 'To Do', items: processedTasks.filter(t => t.status === 'To Do') },
      { title: 'In Progress', items: processedTasks.filter(t => t.status === 'In Progress') },
      { title: 'Blocked', items: processedTasks.filter(t => t.status === 'Blocked') },
      { title: 'Done', items: processedTasks.filter(t => t.status === 'Done') }
  ], [processedTasks]);

  const handleAIAnalyze = async (fieldToSuggest?: 'title' | 'description' | 'assignee' | 'priority') => {
    const availableStaff = teamMembers.map(m => `${m.name} (Skills: ${m.skills?.join(', ') || 'General Construction'})`);
    
    setIsAnalyzing(true);
    if (fieldToSuggest) setActiveFieldAnalyzing(fieldToSuggest);

    try {
        const prompt = `
        Act as a Senior Construction Project Manager.
        Project: "${currentProject?.name || 'Unknown'}" 
        Draft: Title="${formState.title}", Description="${formState.description}"
        Available Personnel: ${availableStaff.join(', ')}
        Focus on: ${fieldToSuggest || 'ALL FIELDS'}.
        Suggest professional values. Return ONLY valid JSON:
        { 
          "title": "Professional title", 
          "description": "Technical description", 
          "priority": "High|Medium|Low|Critical", 
          "suggestedAssignee": "Name from list",
          "reasoning": "Explanation"
        }
        `;
        
        const res = await runRawPrompt(prompt, { 
            model: 'gemini-3-pro-preview', 
            responseMimeType: 'application/json', 
            temperature: 0.4 
        });
        
        const data = parseAIJSON(res);
        
        setFormState(prev => ({
            ...prev,
            title: (!fieldToSuggest || fieldToSuggest === 'title') ? data.title : prev.title,
            description: (!fieldToSuggest || fieldToSuggest === 'description') ? data.description : prev.description,
            priority: (!fieldToSuggest || fieldToSuggest === 'priority') ? data.priority : prev.priority,
            assigneeName: (!fieldToSuggest || fieldToSuggest === 'assignee') ? data.suggestedAssignee : prev.assigneeName
        }));
        
        setAiReasoning(data.reasoning);
    } catch (e) {
        console.error("AI Error", e);
    } finally {
        setIsAnalyzing(false);
        setActiveFieldAnalyzing(null);
    }
  };

  const handleAIGenerateSubtasks = async () => {
    if (!formState.title) return;
    setIsGeneratingSubtasks(true);
    try {
        const prompt = `
            Act as a Project Scheduler.
            Task Title: "${formState.title}"
            Task Description: "${formState.description}"
            Project Context: "${currentProject?.name || ''}"
            
            Break down this high-level task into 4-6 granular, actionable sub-milestones (subtasks) for construction field workers.
            Return ONLY a valid JSON array of strings: ["Subtask 1", "Subtask 2", ...]
        `;
        const res = await runRawPrompt(prompt, { 
            model: 'gemini-3-flash-preview', 
            responseMimeType: 'application/json',
            temperature: 0.4
        });
        const subTitles = parseAIJSON(res);
        if (Array.isArray(subTitles)) {
            const newSubtasks: SubTask[] = subTitles.map(title => ({
                id: `st-ai-${Date.now()}-${Math.random()}`,
                title,
                completed: false
            }));
            setFormState(prev => ({
                ...prev,
                subtasks: [...prev.subtasks, ...newSubtasks],
                status: evaluateTargetStatus([...prev.subtasks, ...newSubtasks], prev.status)
            }));
        }
    } catch (e) {
        console.error("Subtask generation failed", e);
    } finally {
        setIsGeneratingSubtasks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const subCount = formState.subtasks.length;
        const doneCount = formState.subtasks.filter(s => s.completed).length;
        const progress = subCount > 0 ? Math.round((doneCount / subCount) * 100) : (formState.status === 'Done' ? 100 : 0);

        const taskData: Task = {
            id: editingTask?.id || `t-${Date.now()}`,
            ...formState,
            progress,
            companyId: user?.companyId || 'c1',
            projectId: formState.projectId || projectId || projects[0].id
        };

        if (editingTask) {
            await updateTask(editingTask.id, taskData);
        } else {
            await addTask(taskData);
        }
        setShowModal(false);
        resetForm();
    } catch (err) {
        console.error("Submission failed", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState({
        title: '',
        description: '',
        projectId: projectId || '',
        status: 'To Do',
        priority: 'Medium',
        assigneeType: 'user',
        assigneeName: '',
        dueDate: '',
        dependencies: [],
        subtasks: [],
        latitude: undefined,
        longitude: undefined
    });
    setEditingTask(null);
    setAiReasoning('');
  };

  const openEdit = (task: Task) => {
      if (selectedTaskIds.length > 0) return; 
      setEditingTask(task);
      setFormState({
          title: task.title,
          description: task.description || '',
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
          assigneeType: task.assigneeType,
          assigneeName: task.assigneeName || '',
          dueDate: task.dueDate,
          dependencies: task.dependencies || [],
          subtasks: task.subtasks || [],
          latitude: task.latitude,
          longitude: task.longitude
      });
      setShowModal(true);
  };

  const handleAddSubtask = () => {
      if (!newSubtaskTitle.trim()) return;
      const newSt: SubTask = { id: `st-${Date.now()}`, title: newSubtaskTitle, completed: false };
      setFormState(prev => {
        const updatedSubtasks = [...prev.subtasks, newSt];
        return {
            ...prev,
            subtasks: updatedSubtasks,
            status: evaluateTargetStatus(updatedSubtasks, prev.status)
        };
      });
      setNewSubtaskTitle('');
  };

  const removeSubtask = (id: string) => {
      setFormState(prev => {
        const updatedSubtasks = prev.subtasks.filter(st => st.id !== id);
        return {
            ...prev,
            subtasks: updatedSubtasks,
            status: evaluateTargetStatus(updatedSubtasks, prev.status)
        };
      });
  };

  const startEditSubtask = (st: SubTask) => {
    setEditingSubtaskId(st.id);
    setEditingSubtaskValue(st.title);
  };

  const saveEditSubtask = () => {
    if (!editingSubtaskId) return;
    setFormState(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(st => st.id === editingSubtaskId ? { ...st, title: editingSubtaskValue } : st)
    }));
    setEditingSubtaskId(null);
  };

  const toggleSubtask = (id: string) => {
    setFormState(prev => {
        const updatedSubtasks = prev.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
        return {
            ...prev,
            subtasks: updatedSubtasks,
            status: evaluateTargetStatus(updatedSubtasks, prev.status)
        };
    });
  };

  const addDependency = (id: string) => {
      setFormState(prev => ({ ...prev, dependencies: [...prev.dependencies, id] }));
      setShowDepDropdown(false);
      setDepSearch('');
  };

  const removeDependency = (id: string) => {
      setFormState(prev => ({ ...prev, dependencies: prev.dependencies.filter(d => d !== id) }));
  };

  const evaluateTargetStatus = (subtasks: SubTask[], currentStatus: Task['status']): Task['status'] => {
      if (subtasks.length === 0) return currentStatus;
      const allDone = subtasks.every(s => s.completed);
      if (allDone) return 'Done';
      if (subtasks.some(s => s.completed)) return 'In Progress';
      if (currentStatus === 'Done') return 'To Do';
      return currentStatus;
  };

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'Critical': return 'bg-red-50 text-red-600 border-red-100';
          case 'High': return 'bg-orange-50 text-orange-600 border-orange-100';
          case 'Medium': return 'bg-blue-50 text-blue-600 border-blue-100';
          default: return 'bg-zinc-50 text-zinc-500 border-zinc-200';
      }
  };

  const toggleTaskSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLocateTask = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setFocusedTaskId(id);
      setViewMode('MAP');
  };

  const handleBatchUpdate = async (field: 'status' | 'priority' | 'assignee', value: any) => {
    setIsSubmitting(true);
    try {
      const updates: any = {};
      if (field === 'status') updates.status = value;
      if (field === 'priority') updates.priority = value;
      if (field === 'assignee') {
        updates.assigneeName = value.name;
        updates.assigneeId = value.id;
      }

      await Promise.all(selectedTaskIds.map(id => updateTask(id, updates)));
      setSelectedTaskIds([]);
    } catch (e) {
      console.error("Batch update failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtaskStats = useMemo(() => {
    const subCount = formState.subtasks.length;
    const doneCount = formState.subtasks.filter(s => s.completed).length;
    const percentage = subCount > 0 ? Math.round((doneCount / subCount) * 100) : 0;
    return { subCount, doneCount, percentage };
  }, [formState.subtasks]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase flex items-center gap-3">
                <ListChecks className="text-primary" /> Site Objectives
            </h1>
            <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">
                Mission control for field tasks and technical milestones.
            </p>
        </div>
        <div className="flex gap-3">
            <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-inner">
                <button onClick={() => { setViewMode('KANBAN'); setFocusedTaskId(null); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'KANBAN' ? 'bg-white text-primary shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}><LayoutGrid size={14} /> Kanban</button>
                <button onClick={() => { setViewMode('LIST'); setFocusedTaskId(null); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-white text-primary shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}><ListIcon size={14} /> List</button>
                <button onClick={() => { setViewMode('MAP'); setFocusedTaskId(null); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'MAP' ? 'bg-white text-primary shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}><MapIconLucide size={14} /> Spatial</button>
            </div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:bg-[#125a87] transition-all flex items-center gap-2 active:scale-95 group">
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Initialize Objective
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
              <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search registry by objective title or assignee..." 
                className="w-full pl-14 pr-6 py-4.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all outline-none shadow-inner" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
              {selectedTaskIds.length > 0 && (
                <button 
                  onClick={() => setSelectedTaskIds([])}
                  className="px-6 py-4.5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-200 animate-in zoom-in"
                >
                  <X size={16} /> Deselect ({selectedTaskIds.length})
                </button>
              )}
              <button className="flex-1 lg:flex-none px-6 py-4.5 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all border border-zinc-200"><Filter size={16} /> Filters</button>
              <button className="flex-1 lg:flex-none px-6 py-4.5 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all border border-zinc-200"><ArrowUpDown size={16} /> Sort</button>
          </div>
      </div>

      <div className="flex-1 min-h-0">
          {viewMode === 'KANBAN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 h-full">
                  {columns.map(col => (
                      <div key={col.title} className="flex flex-col h-full bg-zinc-50/50 rounded-[2.5rem] border border-zinc-200 p-6">
                          <div className="flex items-center justify-between mb-6 px-2">
                              <h3 className="font-black text-zinc-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${col.title === 'To Do' ? 'bg-zinc-300' : col.title === 'In Progress' ? 'bg-blue-500' : col.title === 'Blocked' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                  {col.title}
                              </h3>
                              <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg">{col.items.length}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                              {col.items.map(task => {
                                  const subCount = task.subtasks?.length || 0;
                                  const doneCount = task.subtasks?.filter(s => s.completed).length || 0;
                                  const percentage = subCount > 0 ? Math.round((doneCount / subCount) * 100) : (task.progress || 0);
                                  const isSelected = selectedTaskIds.includes(task.id);
                                  const hasGPS = task.latitude && task.longitude;
                                  
                                  return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => openEdit(task)}
                                        className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-primary/10' : 'border-zinc-200 hover:border-primary'}`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'Critical' ? 'bg-red-500' : 'bg-primary'}`} />
                                        
                                        <div 
                                          className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'bg-white border-zinc-100 opacity-0 group-hover:opacity-100 hover:border-primary'}`}
                                          onClick={(e) => toggleTaskSelection(task.id, e)}
                                        >
                                          {isSelected && <Check size={14} strokeWidth={4} />}
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                            {hasGPS && (
                                                <button 
                                                    onClick={(e) => handleLocateTask(task.id, e)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm group-hover:scale-110"
                                                    title="Locate Shard"
                                                >
                                                    <Compass size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-zinc-900 text-sm leading-tight mb-4 group-hover:text-primary transition-colors">{task.title}</h4>
                                        
                                        {(subCount > 0 || percentage > 0) && (
                                            <div className="mb-4 space-y-1.5">
                                                <div className="flex justify-between text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                                    <span>Verified progression</span>
                                                    <span>{percentage}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-700 ${percentage === 100 ? 'bg-green-500' : 'bg-primary/60'}`} style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[8px] font-black text-zinc-500 uppercase">{task.assigneeName?.split(' ').map(n => n[0]).join('')}</div>
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[80px]">{task.assigneeName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400">
                                                <Calendar size={10} /> {task.dueDate}
                                            </div>
                                        </div>
                                    </div>
                                  );
                              })}
                              {col.items.length === 0 && <div className="py-12 text-center text-zinc-300 italic text-xs uppercase tracking-widest border-2 border-dashed border-zinc-200 rounded-2xl">Empty Node</div>}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {viewMode === 'LIST' && (
              <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 border-b text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                          <tr>
                              <th className="px-6 py-6 w-12">
                                <button 
                                  onClick={() => setSelectedTaskIds(selectedTaskIds.length === processedTasks.length ? [] : processedTasks.map(t => t.id))}
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTaskIds.length === processedTasks.length ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-zinc-200 hover:border-primary'}`}
                                >
                                  {selectedTaskIds.length === processedTasks.length && <Check size={14} strokeWidth={4} />}
                                </button>
                              </th>
                              <th className="px-6 py-6">Objective Narrative</th>
                              <th className="px-6 py-6">Spatial Telemetry (GPS)</th>
                              <th className="px-6 py-6 text-center">Status</th>
                              <th className="px-6 py-6 text-center">Inference Status</th>
                              <th className="px-6 py-6 text-center">Progression</th>
                              <th className="px-6 py-6">Assignee</th>
                              <th className="px-6 py-6">Deadline</th>
                              <th className="px-6 py-6">Priority</th>
                              <th className="px-6 py-6"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                          {processedTasks.map(task => {
                              const subCount = task.subtasks?.length || 0;
                              const doneCount = task.subtasks?.filter(s => s.completed).length || 0;
                              const percentage = subCount > 0 ? Math.round((doneCount / subCount) * 100) : (task.progress || 0);
                              const isSelected = selectedTaskIds.includes(task.id);
                              const hasGPS = task.latitude && task.longitude;

                              return (
                                <tr 
                                  key={task.id} 
                                  onClick={() => openEdit(task)} 
                                  className={`hover:bg-zinc-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                                >
                                    <td className="px-6 py-8" onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}>
                                        <button 
                                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white shadow-lg scale-110' : 'bg-white border-zinc-200 group-hover:border-primary'}`}
                                        >
                                          {isSelected && <Check size={14} strokeWidth={4} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="font-black text-zinc-900 text-base uppercase tracking-tight truncate max-w-[300px] group-hover:text-primary transition-colors">{task.title}</div>
                                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1">Ref: {task.id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-8">
                                        {hasGPS ? (
                                            <button 
                                                onClick={(e) => handleLocateTask(task.id, e)}
                                                className="flex flex-col gap-1 items-start group/gps"
                                            >
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-zinc-600 group-hover/gps:text-primary transition-colors">
                                                    <Compass size={12} /> {task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}
                                                </div>
                                                <span className="text-[8px] font-black uppercase text-zinc-300 tracking-widest group-hover/gps:text-primary/60">Trace in spatial hud</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">No Spatial Node</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border flex items-center gap-2 w-fit ${
                                                task.status === 'Done' ? 'bg-green-50 text-green-700 border-green-100' : 
                                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                task.status === 'Blocked' ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' :
                                                'bg-zinc-50 text-zinc-500 border-zinc-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : task.status === 'Blocked' ? 'bg-red-500' : 'bg-zinc-400'}`} />
                                                {task.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex items-center gap-3 w-32 mx-auto">
                                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-700 ${percentage === 100 ? 'bg-green-500' : 'bg-primary/60'}`} style={{ width: `${percentage}%` }} />
                                            </div>
                                            <span className="text-[9px] font-black text-zinc-400">{percentage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">{task.assigneeName?.split(' ').map(n => n[0]).join('')}</div>
                                            <span className="font-bold text-zinc-700 uppercase text-xs tracking-tight">{task.assigneeName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8 font-mono text-xs font-bold text-zinc-500">{task.dueDate}</td>
                                    <td className="px-6 py-8">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                    </td>
                                    <td className="px-6 py-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-3 bg-zinc-100 text-zinc-400 hover:text-primary rounded-xl transition-all shadow-sm"><Maximize2 size={18} /></button>
                                    </td>
                                </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}

          {viewMode === 'MAP' && (
              <div className="h-[750px]">
                  <TaskMapView 
                    tasks={processedTasks} 
                    onTaskClick={openEdit} 
                    projectId={projectId} 
                    focusedTaskId={focusedTaskId}
                  />
              </div>
          )}
      </div>

      {/* Initialize / Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-7xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20 animate-in zoom-in-95">
                  <div className="p-8 border-b bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-primary text-white rounded-2xl shadow-xl">
                              <Target size={32} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{editingTask ? 'Edit Objective Node' : 'Initialize Technical Objective'}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol Sync Active</span>
                                <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-primary uppercase">{subtaskStats.percentage}% Logic Alignment</span>
                                </div>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-3 hover:bg-red-50 text-zinc-400 rounded-full transition-all"><X size={28} /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                      <div className="flex-1 p-10 space-y-12 bg-white custom-scrollbar overflow-y-auto">
                          <div className="space-y-10">
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Objective Label</label>
                                    <button type="button" onClick={() => handleAIAnalyze('title')} className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200">
                                        <Sparkles size={10} /> AI Suggest
                                    </button>
                                  </div>
                                  <input 
                                    required
                                    className="w-full p-4.5 bg-zinc-50 border border-zinc-200 rounded-2xl text base font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none uppercase tracking-tight"
                                    placeholder="Define the primary task goal..."
                                    value={formState.title}
                                    onChange={e => setFormState({...formState, title: e.target.value})}
                                  />
                              </div>

                              <div className="space-y-3">
                                  <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Technical Description</label>
                                    <button type="button" onClick={() => handleAIAnalyze('description')} className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200">
                                        <Sparkles size={10} /> Enhance Scope
                                    </button>
                                  </div>
                                  <textarea 
                                    className="w-full p-6 h-32 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all placeholder:text-zinc-300 italic"
                                    placeholder="Elaborate on the technical requirements..."
                                    value={formState.description}
                                    onChange={e => setFormState({...formState, description: e.target.value})}
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Protocol Status</label>
                                      <select 
                                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        value={formState.status}
                                        onChange={e => setFormState({...formState, status: e.target.value as any})}
                                      >
                                          <option value="To Do">To Do</option>
                                          <option value="In Progress">In Progress</option>
                                          <option value="Blocked">Blocked</option>
                                          <option value="Done">Done</option>
                                      </select>
                                  </div>
                                  <div className="space-y-3">
                                      <div className="flex justify-between items-center px-1">
                                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assignee Personnel</label>
                                      </div>
                                      <select 
                                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        value={formState.assigneeName}
                                        onChange={e => setFormState({...formState, assigneeName: e.target.value})}
                                      >
                                          <option value="">Select Personnel Node...</option>
                                          {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name} - {m.role}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          {/* SUBTASK HUB */}
                          <div className="space-y-8 bg-zinc-50/50 p-8 rounded-[3rem] border border-zinc-100 shadow-inner">
                                <div className="flex justify-between items-end border-b border-zinc-200 pb-3 px-1">
                                    <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ListTodo size={16} className="text-primary" /> Roadmap Milestones
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            type="button" 
                                            onClick={handleAIGenerateSubtasks} 
                                            disabled={isGeneratingSubtasks || !formState.title}
                                            className="text-[10px] font-black text-purple-600 hover:underline uppercase flex items-center gap-1.5 transition-all disabled:opacity-50"
                                        >
                                            {isGeneratingSubtasks ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={14} />} AI Auto-Breakdown
                                        </button>
                                        <button type="button" onClick={handleAddSubtask} className="text-[10px] font-black text-primary hover:underline uppercase flex items-center gap-1.5 transition-all active:scale-95 group">
                                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Append Node
                                        </button>
                                    </div>
                                </div>
                                
                                {subtaskStats.subCount > 0 && (
                                    <div className="px-1 space-y-3 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                            <span>Neural Progression Sync</span>
                                            <span className={subtaskStats.percentage === 100 ? 'text-emerald-500' : 'text-primary'}>
                                                {subtaskStats.percentage}% Alignment
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-zinc-200/50 rounded-full overflow-hidden shadow-inner ring-1 ring-zinc-300/20">
                                            <div 
                                                className={`h-full transition-all duration-1000 ease-out relative ${subtaskStats.percentage === 100 ? 'bg-emerald-50 shadow-[0_0_12px_#10b981]' : 'bg-primary shadow-[0_0_10px_#0ea5e9]'}`} 
                                                style={{ width: `${subtaskStats.percentage}%` }} 
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {formState.subtasks.map((st) => (
                                        <div key={st.id} className="flex flex-col group bg-white p-4 rounded-2xl border border-zinc-100 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-sm">
                                            <div className="flex gap-4 items-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => toggleSubtask(st.id)} 
                                                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-inner' : 'bg-zinc-50 border-zinc-100 text-zinc-300 group-hover:border-primary/50'}`}
                                                >
                                                    {st.completed ? <Check size={20} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-zinc-200" />}
                                                </button>
                                                
                                                {editingSubtaskId === st.id ? (
                                                    <input 
                                                        className="flex-1 bg-zinc-50 p-2 rounded-lg border-2 border-primary outline-none text-sm font-black uppercase tracking-tight"
                                                        value={editingSubtaskValue}
                                                        onChange={e => setEditingSubtaskValue(e.target.value)}
                                                        onBlur={saveEditSubtask}
                                                        onKeyDown={e => e.key === 'Enter' && saveEditSubtask()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span 
                                                        onClick={() => startEditSubtask(st)}
                                                        className={`flex-1 text-sm font-black uppercase tracking-tight cursor-text ${st.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 hover:text-primary transition-colors'}`}
                                                    >
                                                        {st.title}
                                                    </span>
                                                )}

                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button type="button" onClick={() => startEditSubtask(st)} className="p-2.5 text-zinc-300 hover:text-primary transition-all active:scale-90">
                                                        <PencilLine size={18} />
                                                    </button>
                                                    <button type="button" onClick={() => removeSubtask(st.id)} className="p-2.5 text-zinc-300 hover:text-red-500 transition-all active:scale-90">
                                                        <MinusCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Subtask Individual Progression Shard */}
                                            <div className="mt-4 px-14">
                                                <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100/50 shadow-inner">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out relative ${st.completed ? 'bg-emerald-50 shadow-[0_0_8px_#10b981]' : 'bg-zinc-200'}`} 
                                                        style={{ width: st.completed ? '100%' : '0%' }}
                                                    >
                                                        {st.completed && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-4 px-2 pt-2">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400"><Plus size={18} /></div>
                                        <input 
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-zinc-300 py-3 uppercase tracking-tighter" 
                                            placeholder="Enter incremental task step node..." 
                                            value={newSubtaskTitle}
                                            onChange={e => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                        />
                                    </div>
                                </div>
                          </div>
                      </div>

                      {/* RIGHT PANEL: LOGIC LATTICE & SPATIAL */}
                      <div className="w-full lg:w-[480px] border-l border-zinc-100 flex flex-col p-10 bg-zinc-50/30 overflow-y-auto custom-scrollbar shrink-0 space-y-12">
                          
                          {/* DEPENDENCY HUB */}
                          <div className="space-y-6">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><GitMerge size={16} className="text-primary" /> Logic Lattice (Dependencies)</label>
                                
                                <div className="relative group px-1">
                                    <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
                                        <Search size={18} className="text-zinc-400 group-focus-within:text-primary" />
                                        <input 
                                            type="text" 
                                            placeholder="Trace dependency node..." 
                                            className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-tight"
                                            value={depSearch}
                                            onFocus={() => setShowDepDropdown(true)}
                                            onChange={e => setDepSearch(e.target.value)}
                                        />
                                        {showDepDropdown && (
                                            <button type="button" onClick={() => setShowDepDropdown(false)} className="text-zinc-400 hover:text-zinc-900"><X size={16} /></button>
                                        )}
                                    </div>

                                    {showDepDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-zinc-200 rounded-3xl shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar p-2 animate-in slide-in-from-top-2">
                                            {dependencyCandidates.length > 0 ? dependencyCandidates.map(cand => (
                                                <button 
                                                    key={cand.id}
                                                    type="button"
                                                    onClick={() => addDependency(cand.id)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl transition-all text-left group/item border border-transparent hover:border-blue-100"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-black text-zinc-800 text-xs uppercase tracking-tight truncate">{cand.title}</div>
                                                        <div className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Ref: {cand.id.slice(-6).toUpperCase()} • {cand.status}</div>
                                                    </div>
                                                    <Plus size={16} className="text-zinc-300 group-hover/item:text-primary transition-colors" />
                                                </button>
                                            )) : (
                                                <div className="p-8 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">No available nodes</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 px-1">
                                    {formState.dependencies.map(depId => {
                                        const depTask = tasks.find(t => t.id === depId);
                                        if (!depTask) return null;
                                        return (
                                            <div key={depId} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-primary/40 transition-all group animate-in slide-in-from-right-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                        <Link2 size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-black text-zinc-800 truncate block uppercase tracking-tight leading-none mb-1">{depTask.title}</span>
                                                        <span className={`text-[8px] font-black uppercase ${depTask.status === 'Done' ? 'text-emerald-500' : 'text-zinc-400'}`}>{depTask.status} Sync</span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeDependency(depId)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={16} /></button>
                                            </div>
                                        );
                                    })}
                                    {formState.dependencies.length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-center flex flex-col items-center gap-3 bg-white/50">
                                            <GitMerge size={32} className="text-zinc-200" />
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Logic Lattice Empty</p>
                                        </div>
                                    )}
                                </div>
                          </div>

                          <div className="space-y-6">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 flex items-center gap-2"><MapIcon size={14} className="text-primary" /> Spatial Registry</label>
                              <div className="bg-white border border-zinc-200 rounded-[3rem] p-6 shadow-sm space-y-6 group/map">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Latitude</label>
                                          <div className="relative">
                                              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                                              <input 
                                                type="number" 
                                                step="any"
                                                placeholder="e.g. 51.505"
                                                className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-mono font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                value={formState.latitude ?? ''}
                                                onChange={e => setFormState({...formState, latitude: parseFloat(e.target.value) || undefined})}
                                              />
                                          </div>
                                      </div>
                                      <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">Longitude</label>
                                          <div className="relative">
                                              <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                                              <input 
                                                type="number" 
                                                step="any"
                                                placeholder="e.g. -0.09"
                                                className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-mono font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                value={formState.longitude ?? ''}
                                                onChange={e => setFormState({...formState, longitude: parseFloat(e.target.value) || undefined})}
                                              />
                                          </div>
                                      </div>
                                  </div>
                                  <ModalLocationPicker 
                                    lat={formState.latitude} 
                                    lng={formState.longitude} 
                                    onSelect={(lat, lng) => setFormState({...formState, latitude: lat, longitude: lng})} 
                                    defaultLat={currentProject?.latitude}
                                    defaultLng={currentProject?.longitude}
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 px-1">
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Node Priority</label>
                                  <select 
                                    className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer uppercase tracking-widest shadow-sm"
                                    value={formState.priority}
                                    onChange={e => setFormState({...formState, priority: e.target.value as any})}
                                  >
                                      <option value="Critical">Critical</option>
                                      <option value="High">High</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Low">Low</option>
                                  </select>
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Settlement Target</label>
                                  <input 
                                    type="date" 
                                    className="w-full p-4 bg-white border border-zinc-200 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 outline-none shadow-sm"
                                    value={formState.dueDate}
                                    onChange={e => setFormState({...formState, dueDate: e.target.value})}
                                  />
                              </div>
                          </div>

                          {aiReasoning && (
                              <div className="bg-blue-900/5 border border-blue-500/10 p-8 rounded-[2.5rem] space-y-4 shadow-inner relative overflow-hidden group/ai mx-1">
                                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/ai:scale-110 transition-transform"><BrainCircuit size={80} /></div>
                                  <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles size={16} className="text-primary animate-pulse" /> AI Logic Trace</h4>
                                  <p className="text-xs text-zinc-600 leading-relaxed font-medium italic">"{aiReasoning}"</p>
                              </div>
                          )}

                          <div className="pt-8 border-t border-zinc-100 mt-auto px-1">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/40 hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                                >
                                    {isSubmitting ? <Loader2 size={24} className="animate-spin text-primary" /> : <ShieldCheck size={24} className="text-emerald-500 group-hover/submit:scale-110 transition-transform" />}
                                    {editingTask ? 'Update Registry Node' : 'Initialize Objective'}
                                </button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default TasksView;