import React, { useState, useRef, useEffect } from 'react';
import { 
  Rocket, Sparkles, ArrowRight, Building, PoundSterling, 
  Calendar, MapPin, Loader2, CheckCircle2, Edit2, Wand2, ChevronRight, Building2, Briefcase, Home, Factory, Stethoscope, X, Upload, FileText, ImageIcon, Trash2, ScanLine, BrainCircuit, Layers, Info, Zap, Activity, Check, Play, Cpu, Send, User, Bot, Paperclip, MessageSquare, Clock, ShieldAlert, AlertTriangle, Aperture, Hash, ShieldCheck, BarChart3, TrendingUp,
  RefreshCw, ClipboardCheck, Scale, FileCheck, Target
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { generateImage, runRawPrompt, parseAIJSON } from '../services/geminiService';
import { Project, Task, ProjectPhase } from '../types';

interface ProjectLaunchpadProps {
  onClose: () => void;
  onViewProject?: (projectId: string) => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    isThinking?: boolean;
}

interface TimelinePhase {
    phaseName: string;
    durationWeeks: number;
    keyMilestone: string;
    riskLevel: 'Low' | 'Medium' | 'High';
}

interface RiskProfile {
    title: string;
    description: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    mitigation: string;
}

const ProjectLaunchpadView: React.FC<ProjectLaunchpadProps> = ({ onClose, onViewProject }) => {
  const { user } = useAuth();
  const { projects, addProject, addTask } = useProjects();
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'SUCCESS'>('INPUT');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      code: '',
      location: '',
      type: 'Commercial',
      features: '',
      description: '',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
  });

  const [isCodeManual, setIsCodeManual] = useState(false);

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [generatedTimeline, setGeneratedTimeline] = useState<TimelinePhase[]>([]);
  const [schedulingRisks, setSchedulingRisks] = useState<string[]>([]);
  const [timelineOptimizations, setTimelineOptimizations] = useState<string[]>([]);
  
  // Risk Assessment State
  const [isSimulatingRisks, setIsSimulatingRisks] = useState(false);
  const [detailedRisks, setDetailedRisks] = useState<RiskProfile[]>([]);
  const [riskSummary, setRiskSummary] = useState('');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'welcome', role: 'ai', text: "Hello! I'm BuildPro's AI Architect. Give me a project name and sector, or upload a site photo/brief, and I will draft a full professional scope, budget, and timeline for you." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatic Code Generation Logic
  useEffect(() => {
    if (isCodeManual || !formData.name) return;

    const generateUniqueCode = () => {
        const namePart = formData.name.trim().split(' ')[0].substring(0, 3).toUpperCase();
        const typeMap: Record<string, string> = {
            'Commercial': 'COM',
            'Residential': 'RES',
            'Industrial': 'IND',
            'Infrastructure': 'INF',
            'Healthcare': 'MED'
        };
        const typePart = typeMap[formData.type] || 'PRJ';
        const yearPart = new Date(formData.startDate).getFullYear().toString().slice(-2);
        
        let baseCode = `${namePart}-${typePart}-${yearPart}`;
        let finalCode = baseCode;
        let counter = 1;
        while (projects.some(p => p.code === finalCode)) {
            finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
            counter++;
        }
        return finalCode;
    };
    setFormData(prev => ({ ...prev, code: generateUniqueCode() }));
  }, [formData.name, formData.type, formData.startDate, projects, isCodeManual]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'code') setIsCodeManual(true);
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        const isImg = file.type.startsWith('image/');
        handleAIChat(
            isImg 
            ? "I've uploaded a site image. Analyze site conditions and suggest a project description, estimated budget, and 12-month timeline." 
            : "I've uploaded a project brief. Extract key specs, estimated budget, and phase-based timeline.",
            reader.result as string,
            file.type
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullAIAutoComplete = async () => {
    if (!formData.name) {
      alert("Please enter a project name first.");
      return;
    }
    setIsAutoFilling(true);
    try {
      const prompt = `
        Act as a professional Construction Estimator and Project Architect.
        I have basic details for a new project:
        Name: "${formData.name}"
        Type: "${formData.type}"
        Location: "${formData.location || 'Not Specified'}"
        
        TASK: Suggest a comprehensive technical description, a realistic budget estimate (in GBP), and a suggested end date (ISO format YYYY-MM-DD) assuming a roughly 12-18 month timeline from ${formData.startDate}.
        
        Return ONLY valid JSON in this format:
        {
          "description": "...",
          "budget": 5000000,
          "suggestedEndDate": "2026-12-01",
          "keyFeatures": "..."
        }
      `;
      
      const result = await runRawPrompt(prompt, { 
        model: 'gemini-3-pro-preview', 
        responseMimeType: 'application/json',
        temperature: 0.5 
      });
      
      const data = parseAIJSON(result);
      setFormData(prev => ({
        ...prev,
        description: data.description || prev.description,
        budget: data.budget || prev.budget,
        endDate: data.suggestedEndDate || prev.endDate,
        features: data.keyFeatures || prev.features
      }));
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        text: `I've synthesized a complete project shard for "${formData.name}". Description, budget, and timeline have been updated based on current industry benchmarks.` 
      }]);
    } catch (e) {
      console.error("AI Auto-fill failed", e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const generateSmartDescription = async () => {
    if (!formData.name || isGeneratingDescription) return;
    setIsGeneratingDescription(true);
    try {
      const prompt = `
        Act as a professional construction project manager and architectural strategist.
        Generate a comprehensive, technically detailed project description for:
        Project Name: "${formData.name}"
        Sector: "${formData.type}"
        Location: "${formData.location || 'TBD'}"
        Key Features/Requirements: "${formData.features || 'Standard project specifications'}"

        The description should be professional and structured with:
        - Executive Vision: A compelling summary of the project's purpose and impact.
        - Technical Scope: Detailed architectural and structural highlights.
        - Sustainable/Innovation Nodes: Highlighting smart building or green features.
        
        Use professional terminology (e.g., 'substructure orchestration', 'cladding systems', 'BIM-integrated workflows'). 
        Return 3-4 professional paragraphs formatted for a formal project charter.
      `;
      const result = await runRawPrompt(prompt, { 
        model: 'gemini-3-pro-preview',
        temperature: 0.7 
      });
      setFormData(prev => ({ ...prev, description: result.trim() }));
    } catch (e) {
      console.error("AI Description gen failed", e);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAIChat = async (userText: string, fileData?: string, mimeType?: string) => {
      if (!userText.trim() && !fileData) return;
      const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
      setMessages(prev => [...prev, newUserMsg]);
      setChatInput('');
      setIsChatProcessing(true);
      const thinkingMsgId = 'thinking-' + Date.now();
      setMessages(prev => [...prev, { id: thinkingMsgId, role: 'ai', text: 'Architect is reasoning...', isThinking: true }]);

      try {
          const prompt = `
            You are the "BuildPro AI Architect" (Gemini 3 Pro).
            Current Project Name: "${formData.name}"
            User Request: "${userText}"
            OUTPUT FORMAT (JSON):
            {
                "reply": "Conversational reply.",
                "updates": { "description": "string", "budget": number, "estimatedEndDate": "YYYY-MM-DD", "code": "string", "features": "string" },
                "timeline": [ { "phaseName": "string", "durationWeeks": number, "keyMilestone": "string", "riskLevel": "Low"|"Medium"|"High" } ],
                "risks": ["string"],
                "optimizations": ["string"]
            }
          `;
          const mediaPayload = fileData ? fileData.split(',')[1] : undefined;
          const mediaMime = mimeType || (uploadedFile ? uploadedFile.type : undefined);
          const resultString = await runRawPrompt(prompt, {
              model: 'gemini-3-pro-preview',
              responseMimeType: 'application/json',
              temperature: 0.4,
              thinkingConfig: { thinkingBudget: 4096 }
          }, mediaPayload, mediaMime);
          const data = parseAIJSON(resultString);

          if (data.updates) {
              setFormData(prev => ({ 
                  ...prev, 
                  description: data.updates.description || prev.description,
                  budget: data.updates.budget || prev.budget,
                  endDate: data.updates.estimatedEndDate || prev.endDate,
                  code: data.updates.code || prev.code,
                  features: data.updates.features || prev.features
              }));
              if (data.updates.code) setIsCodeManual(true); 
          }
          if (data.timeline) setGeneratedTimeline(data.timeline);
          if (data.risks) setSchedulingRisks(data.risks);
          if (data.optimizations) setTimelineOptimizations(data.optimizations);
          setMessages(prev => prev.map(m => m.id === thinkingMsgId ? { id: thinkingMsgId, role: 'ai', text: data.reply || "Logic synthesized." } : m));
      } catch (e) {
          console.error("AI Gen error", e);
          setMessages(prev => prev.map(m => m.id === thinkingMsgId ? { id: thinkingMsgId, role: 'ai', text: "Error in synthesis." } : m));
      } finally {
          setIsChatProcessing(false);
      }
  };

  const handleGenerateFull = async () => {
      if (!formData.name) {
          alert("Please enter a project name first.");
          return;
      }
      setIsGenerating(true);
      setStep('REVIEW');
      await handleAIChat(`Initialize full project architecture for "${formData.name}" in ${formData.location || 'Unknown Location'}. Sector: ${formData.type}. Key Features: ${formData.features || 'Standard specs'}.`);
      setIsGenerating(false);
      runDeepRiskSimulation();
  };

  const runDeepRiskSimulation = async () => {
    setIsSimulatingRisks(true);
    try {
        const prompt = `
          Act as a Senior Forensic Risk Auditor for BuildPro.
          Perform a deep-dive AI risk assessment for the following new project:
          Project Name: "${formData.name}"
          Sector: "${formData.type}"
          Location: "${formData.location}"
          Initial Scope: "${formData.description}"
          Estimated Budget: £${formData.budget}
          OUTPUT FORMAT (JSON):
          {
              "forensicSummary": "string",
              "riskMatrix": [
                  { "title": "string", "description": "string", "likelihood": "Low"|"Medium"|"High", "impact": "Low"|"Medium"|"High", "mitigation": "string" }
              ]
          }
        `;
        const result = await runRawPrompt(prompt, {
            model: 'gemini-3-pro-preview',
            responseMimeType: 'application/json',
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 8192 }
        });
        const data = parseAIJSON(result);
        setDetailedRisks(data.riskMatrix || []);
        setRiskSummary(data.forensicSummary || '');
    } catch (e) {
        console.error("Risk simulation failed", e);
    } finally {
        setIsSimulatingRisks(false);
    }
};

  const handleLaunch = async () => {
      if (!isConfirmed) {
          alert("Technical confirmation required before genesis.");
          return;
      }
      const newId = `p-${Date.now()}`;
      const finalImage = filePreview || 'https://images.unsplash.com/photo-1503387762-592dee58c160?auto=format&fit=crop&w=1000&q=80';
      const finalCode = formData.code || `PRJ-${Math.floor(Math.random() * 9000) + 1000}`;

      // Create phase shards from AI timeline
      const projectPhases: ProjectPhase[] = generatedTimeline.map((p, idx) => {
          const startDate = new Date(formData.startDate);
          // Simple offset for mock timeline
          startDate.setDate(startDate.getDate() + (idx * 14)); 
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + (p.durationWeeks * 7));

          return {
              id: `ph-${newId}-${idx}`,
              name: p.phaseName,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              status: idx === 0 ? 'In Progress' : 'Upcoming',
              progress: idx === 0 ? 12 : 0
          };
      });

      const newProject: Project = {
        id: newId,
        companyId: user?.companyId || 'c1',
        name: formData.name || 'Untitled Project',
        code: finalCode,
        description: formData.description,
        location: formData.location || 'Site Location TBD',
        type: formData.type as any,
        status: 'Active',
        health: 'Good',
        progress: 0,
        budget: Number(formData.budget),
        spent: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        manager: user?.name || 'Current User',
        image: finalImage,
        teamSize: 12,
        tasks: { total: generatedTimeline.length, completed: 0, overdue: 0 },
        aiAnalysis: riskSummary || schedulingRisks.join(' '),
        timelineOptimizations: timelineOptimizations,
        phases: projectPhases
      };

      await addProject(newProject);
      
      // Also seed initial tasks
      for (const [index, phase] of generatedTimeline.entries()) {
          await addTask({
              id: `t-${newId}-${index}`,
              projectId: newId,
              companyId: user?.companyId || 'c1',
              title: phase.phaseName,
              description: `Milestone: ${phase.keyMilestone}. Duration: ${phase.durationWeeks} weeks.`,
              status: 'To Do',
              priority: phase.riskLevel === 'High' ? 'Critical' : 'Medium',
              assigneeType: 'role',
              assigneeName: 'Project Manager',
              dueDate: formData.endDate
          });
      }
      setCreatedProjectId(newId);
      setStep('SUCCESS');
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
        
        <div className="px-8 py-5 border-b border-zinc-100 flex justify-between items-center bg-white z-20 shrink-0">
          <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-[#1e3a8a] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
                 <Rocket size={24} />
              </div>
              <div>
                  <h1 className="text-xl font-black text-zinc-900 tracking-tight">AI Project Launchpad</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5"><Sparkles size={10} /> Architecture Generation Engine Active</p>
              </div>
          </div>
          <button onClick={onClose} className="bg-zinc-100 hover:bg-red-50 hover:text-red-500 text-zinc-400 p-2.5 rounded-full transition-all"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {step === 'INPUT' ? (
                <>
                    <div className="flex-1 p-10 overflow-y-auto bg-zinc-50/50 space-y-10 custom-scrollbar border-r border-zinc-200">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em]">Project Genesis Node</h3>
                                <button 
                                  onClick={handleFullAIAutoComplete}
                                  disabled={isAutoFilling || !formData.name}
                                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 disabled:opacity-30 active:scale-95"
                                >
                                  {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                  {isAutoFilling ? 'Synthesizing Shard...' : 'AI Auto-Fill Shard'}
                                </button>
                            </div>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`rounded-3xl border-2 border-dashed p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${uploadedFile ? 'bg-blue-50 border-primary/40 shadow-inner' : 'bg-white border-zinc-200 hover:border-primary shadow-sm'}`}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                {uploadedFile ? (
                                    <div className="flex items-center gap-6 text-left w-full">
                                        <div className="p-5 bg-white rounded-2xl shadow-lg border border-blue-100 relative group">
                                            {filePreview && uploadedFile.type.startsWith('image/') ? <img src={filePreview} className="w-16 h-16 object-cover rounded-xl" alt="Preview" /> : <FileText size={32} className="text-primary" />}
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-md"><Check size={12} /></div>
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="font-bold text-zinc-900 text-lg truncate leading-none mb-1">{uploadedFile.name}</p>
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="animate-pulse" /> AI Extraction in progress...</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setFilePreview(null); }} className="p-3 text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><Trash2 size={20} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-zinc-100 rounded-[1.5rem] flex items-center justify-center mb-4 text-zinc-400 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300"><Upload size={28} /></div>
                                        <p className="font-bold text-zinc-900 text-lg tracking-tight">Drop Primary Project Image</p>
                                        <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto font-medium">Upload a site photo or brief to initialize parameters automatically.</p>
                                    </>
                                )}
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Project Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="e.g. Skyline Heights Phase II" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Project Code</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                            <input name="code" value={formData.code} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono" placeholder="AUTO-GENERATED" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Site Location</label>
                                      <div className="relative">
                                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                          <input name="location" value={formData.location} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="City, Postcode" />
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Sector</label>
                                      <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all">
                                          <option>Commercial</option>
                                          <option>Residential</option>
                                          <option>Industrial</option>
                                          <option>Infrastructure</option>
                                          <option>Healthcare</option>
                                      </select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Key Features & Specs</label>
                                    <input name="features" value={formData.features} onChange={handleInputChange} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="e.g. 20 floors, LEED Platinum, Smart HVAC, BIM-LOD 400..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Genesis Date</label>
                                      <div className="relative">
                                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Target Settlement</label>
                                      <div className="relative">
                                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Aggregate Budget</label>
                                      <div className="relative">
                                          <PoundSterling className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                          <input type="number" name="budget" value={formData.budget || ''} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="5,000,000" />
                                      </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Technical Narrative</label>
                                        <button type="button" onClick={generateSmartDescription} disabled={isGeneratingDescription || !formData.name} className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline decoration-blue-200 disabled:opacity-50 transition-all">
                                            {isGeneratingDescription ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Suggest Detailed Scope
                                        </button>
                                    </div>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-4 h-48 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all italic leading-relaxed" placeholder="Detailed architectural and functional description..." />
                                </div>
                            </div>
                            <button onClick={handleGenerateFull} disabled={!formData.name || isGenerating} className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-4 group active:scale-95">
                                {isGenerating ? <Loader2 size={24} className="animate-spin text-primary" /> : <Sparkles size={24} className="text-yellow-400" />} Initialize Smart Architecture <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="w-[450px] flex flex-col bg-white overflow-hidden shrink-0">
                        <div className="p-8 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/30">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-zinc-900 uppercase text-sm tracking-tight">Architect AI Chat</h3>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Real-time configuration refinement</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/10">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-500`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
                                        msg.role === 'user' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-midnight border-zinc-800 text-white'
                                    }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium shadow-sm border ${
                                        msg.role === 'user' ? 'bg-zinc-100 border-zinc-200 text-zinc-700 rounded-tr-none' : 'bg-white border-zinc-100 text-zinc-800 rounded-tl-none'
                                    }`}>
                                        {msg.isThinking ? (
                                            <div className="flex items-center gap-2 text-primary animate-pulse">
                                                <Loader2 size={12} className="animate-spin" /> {msg.text}
                                            </div>
                                        ) : msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-6 bg-white border-t border-zinc-100">
                            <form onSubmit={(e) => { e.preventDefault(); handleAIChat(chatInput); }} className="relative">
                                <input 
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Refine parameters... (e.g. increase budget)"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-4 pr-12 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                                <button type="submit" disabled={isChatProcessing || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-midnight text-white rounded-xl shadow-lg hover:bg-primary transition-all disabled:opacity-20 active:scale-90">
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            ) : step === 'REVIEW' ? (
                <div className="flex-1 p-10 overflow-y-auto bg-zinc-50/50 space-y-10 animate-in fade-in slide-in-from-right-10 duration-500 custom-scrollbar">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
                        <div className="lg:col-span-8 space-y-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={120} /></div>
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Target size={14} className="text-primary" /> Registry Configuration Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Identity Node</div>
                                        <div className="font-bold text-xs uppercase truncate text-zinc-800">{formData.name}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Registry Code</div>
                                        <div className="font-mono text-xs font-bold text-primary">{formData.code}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Spatial Node</div>
                                        <div className="font-bold text-xs uppercase truncate text-zinc-800">{formData.location || 'UNSET'}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Sector Class</div>
                                        <div className="font-bold text-xs uppercase text-zinc-800">{formData.type}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Genesis Date</div>
                                        <div className="font-bold text-xs text-zinc-800">{formData.startDate}</div>
                                    </div>
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Node"><Edit2 size={12}/></button>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase mb-1">Aggregate Budget</div>
                                        <div className="font-black text-xs text-primary">£{Number(formData.budget).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-zinc-950 rounded-[2.5rem] text-white relative group">
                                        <button onClick={() => setStep('INPUT')} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Refine Abstract"><Edit2 size={14}/></button>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">AI Technical Abstract</div>
                                        <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">"{formData.description}"</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Proposed Roadmap nodes</h4>
                                        <div className="space-y-3">
                                            {generatedTimeline.map((phase, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-sm">
                                                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-900/10">{i+1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-zinc-800 text-xs uppercase tracking-tight truncate">{phase.phaseName}</div>
                                                        <div className="text-[9px] text-zinc-400 font-bold uppercase truncate">{phase.keyMilestone}</div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-zinc-500 whitespace-nowrap">{phase.durationWeeks} Wks</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                                <Zap className="absolute top-0 right-0 p-6 opacity-10" size={120} />
                                <h3 className="font-black mb-6 text-xs uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2"><Aperture size={16} /> Forensic Audit</h3>
                                <div className="space-y-4">
                                    {schedulingRisks.map((risk, i) => (
                                        <div key={i} className="flex gap-3 text-xs leading-relaxed text-zinc-300 items-start group">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 shrink-0 group-hover:scale-150 transition-transform" />
                                            <p className="font-medium">{risk}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-200 shadow-xl space-y-8">
                                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tighter flex items-center gap-2"><ClipboardCheck size={20} className="text-primary" /> Genesis Confirmation</h3>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-600 font-medium leading-relaxed italic">
                                    Final verify the synthesized parameters to initialize the project shard and dispatch activation briefings.
                                </div>
                                
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div 
                                        onClick={() => setIsConfirmed(!isConfirmed)}
                                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${isConfirmed ? 'bg-green-50 border-green-500 text-white shadow-xl shadow-green-900/20' : 'bg-zinc-100 border-zinc-200 text-zinc-200 group-hover:border-primary'}`}
                                    >
                                        {isConfirmed && <Check size={24} strokeWidth={4} />}
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight group-hover:text-zinc-600 transition-colors">I verify technical parameters and authorize project genesis.</span>
                                </label>

                                <div className="space-y-3 pt-4 border-t border-zinc-50">
                                    <button 
                                        onClick={handleLaunch} 
                                        disabled={!isConfirmed || isGenerating}
                                        className="w-full py-5 bg-zinc-900 text-white rounded-[1.75rem] font-black text-lg rounded-[1.75rem] shadow-2xl shadow-zinc-900/30 hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:grayscale"
                                    >
                                        <FileCheck size={24} /> Commit Genesis
                                    </button>
                                    <button 
                                        onClick={() => { setStep('INPUT'); setIsConfirmed(false); }} 
                                        className="w-full py-4 bg-white border border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-widest rounded-[1.75rem] hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={16} /> Refine Setup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 animate-in zoom-in-95 duration-700 bg-zinc-50/30">
                    <div className="relative mb-10">
                        <div className="w-32 h-32 bg-green-50 rounded-[2.5rem] flex items-center justify-center border-4 border-green-100 animate-bounce shadow-xl">
                            <Check size={64} className="text-green-600" strokeWidth={3} />
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary border animate-pulse">
                            <Rocket size={20} />
                        </div>
                    </div>
                    <h2 className="text-5xl font-black text-zinc-900 mb-4 tracking-tighter">Project Online</h2>
                    <button 
                        onClick={() => createdProjectId && onViewProject && onViewProject(createdProjectId)} 
                        className="px-12 py-5 bg-zinc-900 text-white font-black text-xl rounded-3xl shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-4 group"
                    >
                        Enter Workspace <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProjectLaunchpadView;