
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar, PoundSterling, Users, MapPin, 
  LayoutDashboard, CheckSquare, FileText, Layers, 
  CloudRain, AlertTriangle, Plus, Filter, Download, Box, Image as ImageIcon,
  Camera, Hammer, Clipboard, ChevronRight, Building, HelpCircle, List, Link, Wrench, Navigation, Shield,
  Sparkles, BrainCircuit, Send, Loader2, Bot, User, CheckCircle2, MoreHorizontal, Search, Paperclip,
  Clock, Zap, X, Building2, Info, RefreshCw, ScanLine, MessageSquare, Maximize2, Eye, ChevronUp, ChevronDown,
  GitCommit
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { Project, Task, ProjectDocument, RFI, PunchItem, DailyLog, ProjectPhase } from '../types';
import ScheduleView from './ScheduleView';
import SafetyView from './SafetyView';
import EquipmentView from './EquipmentView';
import LiveProjectMapView from './LiveProjectMapView';
import TeamView from './TeamView';
import DocumentsView from './DocumentsView';
import TasksView from './TasksView';
import ProjectPhasesView from './ProjectPhasesView';
import { ProjectActionModals } from '../components/ProjectActionModals';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface ProjectDetailsViewProps {
  projectId: string | null;
  onBack: () => void;
}

type Tab = 'OVERVIEW' | 'TIMELINE' | 'SCHEDULE' | 'TASKS' | 'TEAM' | 'SAFETY' | 'EQUIPMENT' | 'LIVE_MAP' | 'DOCUMENTS' | 'FINANCIALS' | 'BIM_MODEL' | 'RFI' | 'QUALITY' | 'SITE_LOGS' | 'VARIATIONS' | 'PHOTOS';

// --- Interfaces for AI Chat ---
interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    isThinking?: boolean;
}

const ProjectGallery = ({ projectId, onUpload }: { projectId: string, onUpload: () => void }) => {
    const { documents, addSafetyIncident, projects } = useProjects();
    const photos = documents.filter(d => d.projectId === projectId && d.type === 'Image');
    const [selectedPhoto, setSelectedPhoto] = useState<ProjectDocument | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const project = projects.find(p => p.id === projectId);

    const analyzePhoto = async (promptType: string) => {
        if (!selectedPhoto || !selectedPhoto.url) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            let base64 = '';
            if (selectedPhoto.url.startsWith('data:')) {
                base64 = selectedPhoto.url.split(',')[1];
            } else {
                try {
                    const response = await fetch(selectedPhoto.url);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    base64 = await new Promise((resolve) => {
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn("Could not fetch image for analysis", e);
                    setAnalysisResult("Image source unavailable for AI analysis. Please use uploaded photos.");
                    setIsAnalyzing(false);
                    return;
                }
            }

            const prompts: Record<string, string> = {
                'GENERAL': 'Analyze this construction site photo. Describe the current stage of work, visible materials, and any notable observations.',
                'HAZARD': 'Act as a Safety Officer. Inspect this photo for safety hazards, PPE compliance, and site organization. List risks found.',
                'PROGRESS': 'Act as a Project Manager. Estimate the completion status of visible tasks in this photo. Compare against typical construction sequences.',
                'QUALITY': 'Act as a QA Engineer. Inspect this photo for workmanship defects, material damage, or installation errors.'
            };

            const result = await runRawPrompt(prompts[promptType], { model: 'gemini-3-pro-preview', temperature: 0.4 }, base64);
            setAnalysisResult(result);
        } catch (e) {
            setAnalysisResult("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLogIncident = async () => {
        if (!project) return;
        await addSafetyIncident({
            id: `si-${Date.now()}`,
            projectId: projectId,
            project: project.name, 
            title: 'AI Detected Issue (Visual Analysis)',
            type: 'AI Hazard',
            severity: 'Medium', 
            status: 'Open',
            date: new Date().toLocaleDateString()
        });
        alert("Incident logged from visual analysis.");
        setAnalysisResult(null); // Clear after action
    };

    const handleDownload = (e: React.MouseEvent, photo: ProjectDocument) => {
        e.stopPropagation();
        if (photo.url) {
            const link = document.createElement('a');
            link.href = photo.url;
            link.download = photo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2"><ImageIcon className="text-[#0f5c82]" /> Photo Gallery</h2>
                    <p className="text-zinc-500 text-sm">{photos.length} site photos available for intelligence analysis</p>
                </div>
                <button onClick={onUpload} className="bg-[#0f5c82] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-[#0c4a6e] transition-colors flex items-center gap-2">
                    <Camera size={16} /> Add Photo
                </button>
            </div>

            {photos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-zinc-900 font-bold">No Photos Yet</h3>
                    <p className="text-zinc-500 text-sm mb-6">Upload site photos to enable AI analysis and progress tracking.</p>
                    <button onClick={onUpload} className="text-[#0f5c82] font-bold hover:underline">Upload First Photo</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-10">
                    {photos.map(photo => (
                        <div 
                            key={photo.id} 
                            onClick={() => { setSelectedPhoto(photo); setAnalysisResult(null); }}
                            className="aspect-square rounded-xl overflow-hidden border border-zinc-200 cursor-pointer group relative shadow-sm hover:shadow-md transition-all bg-zinc-100"
                        >
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100" size={24} />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                                <div>
                                    <p className="text-white text-xs font-medium truncate max-w-[120px]">{photo.name}</p>
                                    <p className="text-white/70 text-[10px]">{photo.date}</p>
                                </div>
                                <button 
                                    onClick={(e) => handleDownload(e, photo)} 
                                    className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Analysis Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in">
                    <div className="w-full max-w-6xl h-[85vh] bg-zinc-900 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-zinc-800">
                        
                        {/* Image View */}
                        <div className="flex-1 relative bg-black flex items-center justify-center">
                            <img src={selectedPhoto.url} alt="Selected" className="max-w-full max-h-full object-contain" />
                            <button 
                                onClick={() => setSelectedPhoto(null)} 
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Analysis Sidebar */}
                        <div className="w-full md:w-96 bg-white border-l border-zinc-200 flex flex-col">
                            <div className="p-6 border-b border-zinc-100">
                                <h3 className="font-bold text-zinc-900 text-lg mb-1">Photo Intelligence</h3>
                                <p className="text-xs text-zinc-500">{selectedPhoto.name} • {selectedPhoto.date}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50">
                                {analysisResult ? (
                                    <div className="animate-in slide-in-from-right-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles size={16} className="text-purple-600" />
                                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Gemini Analysis</span>
                                        </div>
                                        <div className="prose prose-sm text-zinc-600 text-sm leading-relaxed markdown-body">
                                            {analysisResult}
                                        </div>
                                        
                                        <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-200">
                                            <button 
                                                onClick={() => setAnalysisResult(null)}
                                                className="flex-1 py-2 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 font-medium"
                                            >
                                                Dismiss
                                            </button>
                                            <button 
                                                onClick={handleLogIncident}
                                                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-sm"
                                            >
                                                Log Incident
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-zinc-400">
                                        <ScanLine size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm">Select an AI tool to analyze this photo.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-zinc-200 bg-white">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-3">Run Analysis</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => analyzePhoto('GENERAL')}
                                        disabled={isAnalyzing}
                                        className="p-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-left transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Search size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold text-zinc-700">Summary</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 leading-tight">General description</p>
                                    </button>
                                    <button 
                                        onClick={() => analyzePhoto('HAZARD')}
                                        disabled={isAnalyzing}
                                        className="p-3 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-100 text-left transition-colors disabled:opacity-50 group"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle size={14} className="text-red-500" />
                                            <span className="text-xs font-bold text-zinc-700 group-hover:text-red-700">Hazards</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 group-hover:text-red-600/70 leading-tight">Identify safety risks</p>
                                    </button>
                                    <button 
                                        onClick={() => analyzePhoto('PROGRESS')}
                                        disabled={isAnalyzing}
                                        className="p-3 rounded-xl border border-zinc-200 bg-white hover:bg-green-50 hover:border-green-100 text-left transition-colors disabled:opacity-50 group"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={14} className="text-green-500" />
                                            <span className="text-xs font-bold text-zinc-700 group-hover:text-green-700">Progress</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 group-hover:text-green-600/70 leading-tight">Track work status</p>
                                    </button>
                                    <button 
                                        onClick={() => analyzePhoto('QUALITY')}
                                        disabled={isAnalyzing}
                                        className="p-3 rounded-xl border border-zinc-200 bg-white hover:bg-orange-50 hover:border-orange-100 text-left transition-colors disabled:opacity-50 group"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 size={14} className="text-orange-500" />
                                            <span className="text-xs font-bold text-zinc-700 group-hover:text-orange-700">Quality</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 group-hover:text-orange-600/70 leading-tight">Detect defects</p>
                                    </button>
                                </div>
                                {isAnalyzing && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-600 font-medium animate-pulse">
                                        <Loader2 size={14} className="animate-spin" /> Analyzing with Gemini 3 Pro...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Embedded AI Console Component ---
const AIArchitectConsole = ({ project, tasks, onUpdate }: { project: Project, tasks: Task[], onUpdate: (updates: Partial<Project>) => void }) => {
    const { documents, safetyIncidents } = useProjects();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'ai', text: `I'm connected to **${project.name}**. I can analyze risks, optimize your schedule, or update project details based on tasks, photos, and safety data.` }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
             // Extract Base64 from cover image for visual context
             let mediaData = undefined;
             if (project.image && project.image.startsWith('data:')) {
                 mediaData = project.image.split(',')[1];
             }

             // Rich Task Context
             const taskSummary = {
                 metrics: {
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'Done').length,
                    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done').length,
                 },
                 criticalPath: tasks.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 10).map(t => `${t.title} (${t.status})`),
                 upcoming: tasks.filter(t => t.status !== 'Done').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(t => `${t.title} (Due: ${t.dueDate})`)
             };

             // Documents Context
             const recentPhotos = documents.filter(d => d.projectId === project.id && d.type === 'Image').slice(0, 5).map(d => d.name);
             const recentDocs = documents.filter(d => d.projectId === project.id && d.type !== 'Image').slice(0, 5).map(d => d.name);

             // Safety Context
             const recentIncidents = safetyIncidents.filter(i => i.projectId === project.id).slice(0, 3).map(i => `${i.title} (${i.severity})`);

             const context = {
                name: project.name,
                description: project.description,
                dates: { start: project.startDate, end: project.endDate },
                status: project.status,
                health: project.health,
                budget: { total: project.budget, spent: project.spent },
                risks: project.aiAnalysis,
                tasks: taskSummary,
                documents: { photos: recentPhotos, files: recentDocs },
                safety: recentIncidents,
                hasCoverImage: !!mediaData,
                currentDate: new Date().toISOString().split('T')[0]
            };

            const prompt = `
                You are the dedicated AI Architect for "${project.name}".
                Current Status & Data: ${JSON.stringify(context)}
                
                ${mediaData ? "VISUAL CONTEXT: The user has provided the project's cover image. You can 'see' the site state." : ""}
                
                User Input: "${userMsg.text}"
                
                Capabilities:
                1. Analyze project health, tasks, and risks.
                2. Update project metadata (health, description, risk analysis) if requested.
                3. Provide strategic advice.
                4. Answer questions about the site visuals if asked (assuming cover image represents current state).
                
                Output JSON: { 
                    "reply": "string (markdown supported)", 
                    "updates": { 
                        "health": "Good"|"At Risk"|"Critical" (optional),
                        "aiAnalysis": "string (optional risk update)",
                        "aiExecutiveSummary": "string (optional summary update)"
                    } (optional)
                }
            `;

            const res = await runRawPrompt(prompt, { 
                model: 'gemini-3-pro-preview', 
                responseMimeType: 'application/json', 
                temperature: 0.4,
                thinkingConfig: { thinkingBudget: 4096 }
            }, mediaData);
            
            const data = parseAIJSON(res);

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: data.reply }]);
            if (data.updates) {
                onUpdate(data.updates);
            }
        } catch (e) {
            console.error("AI Chat Error", e);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "I encountered an error analyzing the project data. Please try again." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestions = ['Analyze Project Health', 'Identify Schedule Risks', 'Summarize Safety Status', 'Budget Check'];

    return (
        <div className="flex flex-col h-[500px] bg-zinc-50/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m) => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'ai' ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                            {m.role === 'ai' ? <Sparkles size={14} /> : <User size={14} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${m.role === 'ai' ? 'bg-white border border-zinc-200 text-zinc-700' : 'bg-[#0f5c82] text-white'}`}>
                            <div className="markdown-body">{m.text}</div>
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-center gap-2 text-zinc-400 text-xs ml-12">
                        <Loader2 size={12} className="animate-spin" /> Architect is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-zinc-100 bg-white">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    {suggestions.map(s => (
                        <button 
                            key={s} 
                            onClick={() => { setInput(s); handleSend(); }}
                            disabled={isThinking}
                            className="text-xs font-medium bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors whitespace-nowrap"
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder="Ask about risks, budget, tasks or safety..." 
                        className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                    <button type="submit" disabled={!input.trim() || isThinking} className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const ProjectOverview = ({ project, tasks, onUpdate, openModal }: { project: Project, tasks: Task[], onUpdate: (updates: Partial<Project>) => void, openModal: (m: any) => void }) => {
    const [isArchitectOpen, setIsArchitectOpen] = useState(false);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [visualAnalysis, setVisualAnalysis] = useState<string | null>(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

    const metrics = [
        { label: 'Open RFIs', value: 2, icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Overdue Tasks', value: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done').length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Pending T&M', value: 1, icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Budget Utilized', value: `${Math.round((project.spent / project.budget) * 100)}%`, icon: PoundSterling, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    const generateInsights = async () => {
        setIsGeneratingInsights(true);
        try {
            const taskSummary = tasks.map(t => `- ${t.title} (${t.status}, Priority: ${t.priority})`).join('\n');
            const prompt = `
                Analyze this construction project based on the data below.
                Description: ${project.description}
                Budget: ${project.budget}
                Tasks:
                ${taskSummary.slice(0, 1000)}... (truncated)

                Provide:
                1. Executive Summary: A concise high-level overview of project status and trajectory.
                2. Key Risks (Safety, Financial, Schedule): A detailed paragraph.
                3. Strategic Optimizations: List of actionable improvements.

                Output JSON: { "executiveSummary": "string", "riskAnalysis": "string", "optimizations": ["string", "string"] }
            `;
            const res = await runRawPrompt(prompt, { model: 'gemini-3-pro-preview', responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 2048 } });
            const data = parseAIJSON(res);
            onUpdate({
                aiExecutiveSummary: data.executiveSummary,
                aiAnalysis: data.riskAnalysis,
                timelineOptimizations: data.optimizations
            });
        } catch(e) { console.error(e); }
        finally { setIsGeneratingInsights(false); }
    };

    const analyzeImage = async () => {
        if (!project.image) return;
        setIsAnalyzingImage(true);
        try {
            let base64Data = '';
            if (project.image.startsWith('data:')) {
                base64Data = project.image.split(',')[1];
            } else {
                try {
                    const response = await fetch(project.image);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    base64Data = await new Promise((resolve) => {
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn("Image fetch failed", err);
                    setVisualAnalysis("Unable to access image URL for analysis. Please ensure it is a valid image file.");
                    setIsAnalyzingImage(false);
                    return;
                }
            }

            const prompt = "Analyze this project image. Provide a descriptive summary of the scene, construction stage, and identify any visible safety or quality issues.";
            const result = await runRawPrompt(prompt, { model: 'gemini-2.5-flash' }, base64Data);
            setVisualAnalysis(result);
        } catch (e) {
            setVisualAnalysis("Analysis failed.");
        } finally {
            setIsAnalyzingImage(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <DashboardMetric key={i} {...m} />
                ))}
            </div>

            {/* Integrated AI Architect Console */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                <div 
                    onClick={() => setIsArchitectOpen(!isArchitectOpen)}
                    className="bg-gradient-to-r from-[#0f5c82] to-[#1e3a8a] p-6 cursor-pointer flex justify-between items-center group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                            <BrainCircuit size={24} className="text-purple-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                AI Architect Console 
                                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Gemini 3.0 Pro</span>
                            </h3>
                            <p className="text-blue-100 text-sm">Interactive project analysis, risk assessment, and strategy.</p>
                        </div>
                    </div>
                    <button className="text-white/70 hover:text-white transition-colors">
                        {isArchitectOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                </div>
                
                {isArchitectOpen && (
                    <div className="border-t border-zinc-200 animate-in slide-in-from-top-2">
                        <AIArchitectConsole project={project} tasks={tasks} onUpdate={onUpdate} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Description Card */}
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2"><Building size={18} /> Project Description</h3>
                            <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded border border-zinc-200 font-mono">
                                Code: {project.code}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed">{project.description}</p>
                    </div>
                    
                    {/* AI Strategic Analysis Card */}
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                <Zap size={18} className="text-purple-600" /> AI Strategic Analysis
                            </h3>
                            <button 
                                onClick={generateInsights}
                                disabled={isGeneratingInsights}
                                className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGeneratingInsights ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                {isGeneratingInsights ? 'Analyzing...' : 'Refresh Analysis'}
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {(project.aiAnalysis || project.aiExecutiveSummary || (project.timelineOptimizations && project.timelineOptimizations.length > 0)) ? (
                                <>
                                    {project.aiExecutiveSummary && (
                                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl animate-in fade-in">
                                            <h4 className="text-xs font-bold text-purple-800 uppercase mb-1.5 flex items-center gap-2">
                                                <Sparkles size={14} /> Executive Summary
                                            </h4>
                                            <p className="text-sm text-zinc-700 leading-relaxed">{project.aiExecutiveSummary}</p>
                                        </div>
                                    )}

                                    {project.aiAnalysis && (
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-4 animate-in fade-in">
                                            <div className="bg-white p-2 rounded-lg border border-orange-100 h-fit shadow-sm">
                                                <AlertTriangle size={20} className="text-orange-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-orange-800 uppercase mb-1.5">Risk Assessment</h4>
                                                <p className="text-sm text-zinc-700 leading-relaxed">{project.aiAnalysis}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {project.timelineOptimizations && project.timelineOptimizations.length > 0 && (
                                        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex gap-4 animate-in fade-in">
                                            <div className="bg-white p-2 rounded-lg border border-green-100 h-fit shadow-sm">
                                                <Zap size={20} className="text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-green-800 uppercase mb-1.5">Optimization Opportunities</h4>
                                                <ul className="space-y-2">
                                                    {project.timelineOptimizations.map((opt, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                                                            <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                                                            {opt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                    <Sparkles size={32} className="text-zinc-300 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500 mb-4">No analysis generated yet based on current project data.</p>
                                    <button 
                                        onClick={generateInsights}
                                        disabled={isGeneratingInsights}
                                        className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
                                    >
                                        Generate Initial Analysis
                                    </button>
                                </div>
                            )}

                            {/* New Visual Analysis Block */}
                            {project.image && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl animate-in fade-in">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2">
                                            <ImageIcon size={14} /> Visual Site Analysis
                                        </h4>
                                        {!visualAnalysis && !isAnalyzingImage && (
                                            <button 
                                                onClick={analyzeImage}
                                                className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                                            >
                                                <Sparkles size={10} /> Analyze Image
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isAnalyzingImage ? (
                                        <div className="flex items-center gap-2 text-xs text-blue-600 py-2">
                                            <Loader2 size={12} className="animate-spin" /> Analyzing visual data...
                                        </div>
                                    ) : visualAnalysis ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-zinc-700 leading-relaxed">{visualAnalysis}</p>
                                            <button onClick={() => setVisualAnalysis(null)} className="text-[10px] text-blue-500 hover:underline">Clear</button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-blue-600/60">AI can scan the project image for hazards and progress.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Key Details Card */}
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2"><Info size={18} /> Key Details</h3>
                        
                        <div className="space-y-5">
                            <div>
                                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Project Manager</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-bold text-xs border border-zinc-200">
                                        {project.manager ? project.manager.split(' ').map(n => n[0]).join('') : 'NA'}
                                    </div>
                                    <div className="text-sm font-medium text-zinc-900">{project.manager || 'Unassigned'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Team Size</div>
                                    <div className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                        <Users size={14} className="text-zinc-400" /> {project.teamSize} Members
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Type</div>
                                    <div className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                        <Building2 size={14} className="text-zinc-400" /> {project.type}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Start Date</div>
                                    <div className="text-sm font-mono text-zinc-700">{project.startDate}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase mb-1">End Date</div>
                                    <div className="text-sm font-mono text-zinc-700">{project.endDate}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickActionButton icon={Plus} label="New Task" onClick={() => openModal(null)} /> 
                            <QuickActionButton icon={FileText} label="New RFI" onClick={() => openModal('RFI')} />
                            <QuickActionButton icon={CheckSquare} label="Punch Item" onClick={() => openModal('PUNCH')} />
                            <QuickActionButton icon={Clipboard} label="Daily Log" onClick={() => openModal('LOG')} />
                            <QuickActionButton icon={Hammer} label="Daywork" onClick={() => openModal('DAYWORK')} />
                            <QuickActionButton icon={Camera} label="Add Photo" onClick={() => openModal('PHOTO')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({ projectId, onBack }) => {
  const { getProject, updateProject, tasks, rfis, punchItems, dailyLogs, dayworks } = useProjects();
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [rfiSearch, setRfiSearch] = useState('');
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'RFI' | 'PUNCH' | 'LOG' | 'DAYWORK' | 'PHOTO' | null>(null);

  useEffect(() => {
    setActiveTab('OVERVIEW');
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      const p = getProject(projectId);
      setProject(p);
    }
  }, [projectId, getProject]);

  if (!project) {
    return <div className="p-8 text-center">Project not found.</div>;
  }

  // Safe Filtering & Sorting
  const projectRFIs = (rfis || [])
    .filter(r => r.projectId === project.id)
    .filter(r => r.subject.toLowerCase().includes(rfiSearch.toLowerCase()) || r.number.toLowerCase().includes(rfiSearch.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  const projectPunchList = (punchItems || []).filter(p => p.projectId === project.id);
  const projectLogs = (dailyLogs || []).filter(l => l.projectId === project.id);
  const projectDayworks = (dayworks || []).filter(d => d.projectId === project.id);

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        activeTab === id 
          ? 'border-[#0f5c82] text-[#0f5c82]' 
          : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50 relative">
      {/* Modals */}
      <ProjectActionModals 
          type={activeModal} 
          projectId={project.id} 
          onClose={() => setActiveModal(null)} 
      />

      {/* Project Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-6 flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
             <button onClick={onBack} className="hover:text-zinc-800 transition-colors">Projects</button>
             <ChevronRight size={14} />
             <span className="text-zinc-900 font-medium">{project.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 font-bold text-2xl shadow-inner border border-zinc-200 overflow-hidden">
                 {project.image ? (
                     <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                 ) : (
                     <Building size={32} />
                 )}
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{project.name}</h1>
                    <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${
                        project.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        project.status === 'Planning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}>
                       {project.status}
                    </span>
                 </div>
                 <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1.5">
                       <MapPin size={14} className="text-zinc-400" /> {project.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Calendar size={14} className="text-zinc-400" /> {project.startDate}
                    </div>
                 </div>
              </div>
           </div>

           {/* Weather Widget */}
           {project.weatherLocation && (
             <div className="flex items-center gap-4 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-sm">
                 <div className="flex items-center gap-3 border-r border-zinc-100 pr-4">
                     <div className="text-amber-500 bg-amber-50 p-2 rounded-full"><CloudRain size={18} /></div>
                     <div>
                         <div className="text-base font-bold text-zinc-800">{project.weatherLocation.temp}</div>
                         <div className="text-[10px] text-zinc-500 uppercase font-bold">{project.weatherLocation.condition}</div>
                     </div>
                 </div>
                 <div className="flex flex-col justify-center">
                     <span className="text-zinc-900 font-medium text-xs">{project.weatherLocation.city}</span>
                     <span className="text-zinc-400 text-[10px]">Local Site Weather</span>
                 </div>
             </div>
           )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-8 border-b border-zinc-100 overflow-x-auto -mb-6 pb-0 hide-scrollbar">
           <TabButton id="OVERVIEW" label="Overview" icon={LayoutDashboard} />
           <TabButton id="TIMELINE" label="Phases" icon={GitCommit} />
           <TabButton id="PHOTOS" label="Photos" icon={ImageIcon} />
           <TabButton id="LIVE_MAP" label="Live Map" icon={Navigation} />
           <TabButton id="SCHEDULE" label="Schedule" icon={Calendar} />
           <TabButton id="TASKS" label="Tasks" icon={CheckSquare} />
           <TabButton id="RFI" label="RFIs" icon={HelpCircle} />
           <TabButton id="VARIATIONS" label="Dayworks" icon={Hammer} />
           <TabButton id="QUALITY" label="Quality" icon={CheckCircle2} />
           <TabButton id="SITE_LOGS" label="Logs" icon={Clipboard} />
           <TabButton id="TEAM" label="Team" icon={Users} />
           <TabButton id="SAFETY" label="Safety" icon={Shield} />
           <TabButton id="EQUIPMENT" label="Equipment" icon={Wrench} />
           <TabButton id="DOCUMENTS" label="Documents" icon={FileText} />
           <TabButton id="FINANCIALS" label="Financials" icon={PoundSterling} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-[#f4f4f5] p-6 md:p-8 relative">
         {activeTab === 'OVERVIEW' && (
             <ProjectOverview 
                project={project} 
                tasks={tasks.filter(t => t.projectId === project.id)} 
                onUpdate={(updates) => updateProject(project.id, updates)} 
                openModal={setActiveModal}
             />
         )}
         {activeTab === 'TIMELINE' && (
             <div className="max-w-7xl mx-auto h-full">
                 <ProjectPhasesView project={project} onUpdate={(phases: ProjectPhase[]) => updateProject(project.id, { phases })} />
             </div>
         )}
         {activeTab === 'PHOTOS' && <ProjectGallery projectId={project.id} onUpload={() => setActiveModal('PHOTO')} />}
         {activeTab === 'LIVE_MAP' && <div className="h-[700px] bg-white border border-zinc-200 rounded-xl overflow-hidden"><LiveProjectMapView projectId={project.id} /></div>}
         
         {activeTab === 'SCHEDULE' && <ScheduleView projectId={project.id} />}
         {activeTab === 'TASKS' && <TasksView projectId={project.id} />}
         
         {activeTab === 'TEAM' && <TeamView projectId={project.id} />}
         {activeTab === 'SAFETY' && <SafetyView projectId={project.id} />}
         {activeTab === 'EQUIPMENT' && <EquipmentView projectId={project.id} />}
         {activeTab === 'DOCUMENTS' && <DocumentsView projectId={project.id} />}
         {activeTab === 'FINANCIALS' && <ProjectBudget project={project} openModal={setActiveModal} />}
         
         {/* --- New Tab Views --- */}
         {activeTab === 'RFI' && (
             <div className="max-w-5xl mx-auto h-full flex flex-col">
                 <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
                     <div>
                         <h2 className="text-2xl font-bold text-zinc-900">Requests for Information (RFIs)</h2>
                         <p className="text-zinc-500 text-sm">{projectRFIs.length} records found</p>
                     </div>
                     <div className="flex gap-3">
                         <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                             <input 
                                type="text" 
                                placeholder="Search RFI..." 
                                value={rfiSearch}
                                onChange={(e) => setRfiSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none"
                             />
                         </div>
                         <button onClick={() => setActiveModal('RFI')} className="bg-[#0f5c82] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-[#0c4a6e] transition-colors flex items-center gap-2">
                             <Plus size={16} /> Create New
                         </button>
                     </div>
                 </div>
                 
                 <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex-1">
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-zinc-50 border-b border-zinc-200">
                                 <tr>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Number</th>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Subject</th>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Assigned To</th>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Status</th>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Due Date</th>
                                     <th className="px-6 py-3 font-semibold text-zinc-500 uppercase text-xs">Created</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-100">
                                 {projectRFIs.length > 0 ? projectRFIs.map((rfi) => (
                                     <tr key={rfi.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                                         <td className="px-6 py-4 font-mono text-xs text-zinc-600 font-bold">{rfi.number}</td>
                                         <td className="px-6 py-4 font-medium text-zinc-900 group-hover:text-[#0f5c82] transition-colors">{rfi.subject}</td>
                                         <td className="px-6 py-4 text-zinc-600 flex items-center gap-2">
                                             <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                 {rfi.assignedTo.substring(0,2).toUpperCase()}
                                             </div>
                                             {rfi.assignedTo}
                                         </td>
                                         <td className="px-6 py-4">
                                             <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1 w-fit ${
                                                 rfi.status === 'Open' 
                                                 ? 'bg-orange-50 text-orange-700 border-orange-100' 
                                                 : 'bg-green-50 text-green-700 border-green-100'
                                             }`}>
                                                 {rfi.status === 'Open' ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                                                 {rfi.status}
                                             </span>
                                         </td>
                                         <td className="px-6 py-4 text-zinc-600 text-xs font-mono">
                                             <div className="flex items-center gap-1.5">
                                                 <Calendar size={12} className="text-zinc-400" />
                                                 {rfi.dueDate}
                                             </div>
                                         </td>
                                         <td className="px-6 py-4 text-zinc-500 text-xs">{rfi.createdAt}</td>
                                     </tr>
                                 )) : (
                                     <tr>
                                         <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic bg-zinc-50/50">
                                             No RFIs found matching your criteria.
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>
             </div>
         )}

         {activeTab === 'QUALITY' && (
             <GenericListView 
                title="Punch List & Quality" 
                data={projectPunchList} 
                onAdd={() => setActiveModal('PUNCH')}
                renderItem={(item: PunchItem) => (
                    <div className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${item.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <CheckSquare size={18} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-900">{item.title}</div>
                                <div className="text-xs text-zinc-500">{item.location}</div>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.status}</span>
                    </div>
                )}
             />
         )}

         {activeTab === 'SITE_LOGS' && (
             <GenericListView 
                title="Daily Site Logs" 
                data={projectLogs} 
                onAdd={() => setActiveModal('LOG')}
                renderItem={(log: DailyLog) => (
                    <div className="p-4 bg-white border border-zinc-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-zinc-900">{log.date}</div>
                            <div className="text-xs text-zinc-500">{log.weather}</div>
                        </div>
                        <p className="text-sm text-zinc-600 mb-2">{log.workPerformed}</p>
                        <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 border-t border-zinc-50">
                            <span>Crew: {log.crewCount}</span>
                            <span>Authored by {log.author}</span>
                        </div>
                    </div>
                )}
             />
         )}

         {activeTab === 'VARIATIONS' && (
             <GenericListView 
                title="Dayworks & Variations" 
                data={projectDayworks} 
                onAdd={() => setActiveModal('DAYWORK')}
                renderItem={(dw: any) => (
                    <div className="p-5 bg-white border border-zinc-200 rounded-xl hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="font-bold text-zinc-900 text-base">{dw.date}</div>
                                <div className="text-xs text-zinc-500 font-mono tracking-wide">{dw.id.toUpperCase()}</div>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
                                dw.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                dw.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {dw.status}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-700 mb-4 font-medium leading-relaxed">{dw.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Labor</div>
                                <div className="text-sm font-bold text-zinc-800">
                                    {dw.labor ? dw.labor.reduce((acc: number, l: any) => acc + l.hours, 0) : 0} Hrs
                                    <span className="text-zinc-400 font-normal ml-1">({dw.labor?.length || 0} staff)</span>
                                </div>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Total Cost</div>
                                <div className="text-sm font-bold text-[#0f5c82]">£{dw.grandTotal?.toFixed(2) || '0.00'}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-zinc-400 pt-3 border-t border-zinc-50">
                            {dw.attachments && dw.attachments.length > 0 ? (
                                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar max-w-[70%]">
                                    {dw.attachments.map((att: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-md shrink-0">
                                            {att.type.startsWith('image/') ? <ImageIcon size={12} className="text-blue-500" /> : <FileText size={12} className="text-zinc-500" />}
                                            <span className="truncate max-w-[100px]">{att.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-zinc-400 italic">No Attachments</span>
                            )}
                            <button className="text-zinc-400 hover:text-[#0f5c82] flex items-center gap-1 group-hover:underline shrink-0 ml-auto">
                                View Sheet <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
             />
         )}
      </div>
    </div>
  );
};

// Helper for lists (Same as original)
const GenericListView = ({ title, data, onAdd, renderItem }: any) => {
    const [search, setSearch] = useState('');
    const filtered = data ? data.filter((item: any) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())) : [];

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
                    <p className="text-zinc-500 text-sm">{data ? data.length : 0} records found</p>
                </div>
                <button onClick={onAdd} className="bg-[#0f5c82] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-[#0c4a6e] transition-colors flex items-center gap-2">
                    <Plus size={16} /> Create New
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-zinc-200 mb-6 shadow-sm">
                <div className="flex items-center gap-3 bg-zinc-50 rounded-lg px-4 py-3 border border-zinc-200 transition-colors focus-within:ring-2 focus-within:ring-[#0f5c82]/50">
                    <Search size={18} className="text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="flex-1 bg-transparent outline-none text-sm text-zinc-900 placeholder-zinc-400"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pb-10">
                {filtered.length > 0 ? filtered.map((item: any) => (
                    <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
                )) : (
                    <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardMetric = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
            <Icon size={24} strokeWidth={1.5} />
        </div>
        <div>
            <div className={`text-2xl font-bold ${label.includes('Risk') ? color : 'text-zinc-900'}`}>{value}</div>
            <div className="text-sm font-medium text-zinc-500">{label}</div>
        </div>
    </div>
);

const QuickActionButton = ({ icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 bg-white border border-zinc-200 p-4 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm group">
        <Icon size={20} className="text-zinc-500 group-hover:text-[#0f5c82] transition-colors" />
        <span className="text-xs font-medium text-zinc-700 group-hover:text-[#0f5c82] transition-colors">{label}</span>
    </button>
);

const ProjectBudget = ({ project, openModal }: { project: Project, openModal: (m: any) => void }) => (
    <div className="max-w-7xl mx-auto bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-zinc-900">Financial Overview</h2>
            <button onClick={() => openModal('DAYWORK')} className="text-sm text-[#0f5c82] font-medium hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Daywork
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Total Budget</div>
                <div className="text-3xl font-bold text-zinc-900 tracking-tight">£{project.budget.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Amount Spent</div>
                <div className="text-3xl font-bold text-orange-600 tracking-tight">£{project.spent.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Remaining</div>
                <div className="text-3xl font-bold text-green-600 tracking-tight">£{(project.budget - project.spent).toLocaleString()}</div>
            </div>
        </div>
        
        <div className="mb-2 flex justify-between text-xs font-medium text-zinc-600">
            <span>Budget Utilized</span>
            <span>{Math.round((project.spent / project.budget) * 100) || 0}%</span>
        </div>
        <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden mb-2">
             <div className="bg-gradient-to-r from-[#0f5c82] to-[#1e3a8a] h-full transition-all duration-1000 rounded-full" style={{width: `${(project.spent / project.budget) * 100}%`}}></div>
        </div>
    </div>
);

export default ProjectDetailsView;
