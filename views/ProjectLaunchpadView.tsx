
import React, { useState, useRef, useEffect } from 'react';
import { 
  Rocket, Sparkles, ArrowRight, Building, PoundSterling, 
  Calendar, MapPin, Loader2, CheckCircle2, AlertCircle, Edit2, Wand2, ChevronRight, Building2, Briefcase, Home, Factory, Stethoscope, X, Upload, FileText, Image as ImageIcon, Trash2, ScanLine, BrainCircuit, Layers, Info, Zap, Activity, Check, Play, Cpu, Send, User, Bot, Paperclip, MessageSquare, Clock, ShieldAlert
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';
import { Project, ProjectDocument, Task } from '../types';

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

const ProjectLaunchpadView: React.FC<ProjectLaunchpadProps> = ({ onClose, onViewProject }) => {
  const { addProject, addDocument, addTask } = useProjects();
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'SUCCESS'>('INPUT');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null); // Base64
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      location: '',
      type: 'Commercial',
      description: '',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]
  });

  // AI State
  const [teamSize, setTeamSize] = useState(10);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [aiRiskAnalysis, setAiRiskAnalysis] = useState('');
  const [generatedTimeline, setGeneratedTimeline] = useState<TimelinePhase[]>([]);
  const [schedulingRisks, setSchedulingRisks] = useState<string[]>([]);
  const [timelineOptimizations, setTimelineOptimizations] = useState<string[]>([]);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'welcome', role: 'ai', text: "Hello! I'm your AI Architect using Gemini 3 Pro. I can help you define the project scope, estimate budgets from site plans, and generate detailed timelines. Upload a document or describe your project to begin." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derived Image State
  const isImage = uploadedFile?.type.startsWith('image/');
  const defaultImage = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80';
  const effectiveImage = (isImage && filePreview) ? filePreview : defaultImage;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type: string) => {
      setFormData(prev => ({ ...prev, type }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
          alert("File too large. Max 10MB.");
          return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        // Trigger AI analysis automatically on upload
        const isImg = file.type.startsWith('image/');
        const msg = isImg 
            ? `I've uploaded an image (${file.name}). Please analyze the site conditions, estimate the scale, and suggest a preliminary budget and timeline.`
            : `I've uploaded ${file.name}. Analyze this document to extract project specifications, requirements, and key milestones.`;
        handleAIChat(msg, reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
      setUploadedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Core AI Logic ---
  const handleAIChat = async (userText: string, fileData?: string, mimeType?: string) => {
      if (!userText.trim() && !fileData) return;

      const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
      setMessages(prev => [...prev, newUserMsg]);
      setChatInput('');
      setIsChatProcessing(true);

      // Add thinking placeholder
      const thinkingMsgId = 'thinking-' + Date.now();
      setMessages(prev => [...prev, { id: thinkingMsgId, role: 'ai', text: 'Architect is reasoning...', isThinking: true }]);

      try {
          // Prepare Context
          const currentContext = {
              currentForm: formData,
              uploadedFileName: uploadedFile?.name,
              currentDate: new Date().toISOString().split('T')[0],
              hasVisualInput: !!(fileData || filePreview)
          };

          let prompt = `
            You are an expert Construction AI Architect powered by Gemini 3 Pro.
            You are assisting a Project Manager in defining a new construction project.
            
            CURRENT PROJECT STATE:
            ${JSON.stringify(currentContext)}
            
            USER INPUT: "${userText}"
            
            ${currentContext.hasVisualInput ? "VISUAL ANALYSIS REQUIRED: An image or document is provided. Deeply analyze it to extract project type, scale, site conditions (terrain, access), and potential risks. Use these visual cues to inform your budget and timeline estimates." : ""}

            YOUR ROLE:
            1. Act as a proactive, intelligent consultant. Speak naturally and professionally.
            2. If the user's description is vague, ask clarifying questions in your 'reply'.
            3. If "Estimate Budget" is requested or implied, provide a calculated estimate based on the project type (${formData.type}) and location (${formData.location}), assuming standard industry rates (e.g. Commercial ~£2000/m2). Update the 'budget' field.
            4. If "Generate Timeline" is requested, create a realistic schedule with phases (Design, Permitting, Procurement, Construction, Closeout) and update 'startDate'/'endDate' if needed.
            5. If "Analyze Risks", identify specific risks based on the location/type (e.g., weather in London, logistics in Downtown).
            
            RESPONSE FORMAT (JSON ONLY):
            {
                "reply": "Detailed conversational response. Use markdown. Explain your reasoning for any changes.",
                "updatedFields": { 
                    "name": "string (optional)", 
                    "location": "string (optional)", 
                    "type": "Commercial" | "Residential" | "Infrastructure" | "Industrial" | "Healthcare" (optional), 
                    "description": "string (optional)", 
                    "budget": number (optional), 
                    "startDate": "YYYY-MM-DD" (optional), 
                    "endDate": "YYYY-MM-DD" (optional) 
                },
                "teamSize": number (optional update),
                "riskAnalysis": "markdown string (concise)",
                "timeline": [ { "phaseName": "string", "durationWeeks": number, "keyMilestone": "string", "riskLevel": "Low"|"Medium"|"High" } ],
                "schedulingRisks": ["string"],
                "timelineOptimizations": ["string"]
            }
          `;

          const mediaPayload = fileData ? fileData.split(',')[1] : (filePreview ? filePreview.split(',')[1] : undefined);
          const mediaMime = mimeType || (uploadedFile ? uploadedFile.type : undefined);

          const result = await runRawPrompt(prompt, {
              model: 'gemini-3-pro-preview',
              responseMimeType: 'application/json',
              temperature: 0.4,
              thinkingConfig: { thinkingBudget: 4096 }
          }, mediaPayload, mediaMime);

          const data = parseAIJSON(result);

          // Update Form State
          if (data.updatedFields) {
              setFormData(prev => ({ ...prev, ...data.updatedFields }));
          }
          if (data.teamSize) setTeamSize(data.teamSize);
          if (data.riskAnalysis) setAiRiskAnalysis(data.riskAnalysis);
          
          // Set Timeline & Risks
          if (data.timeline && Array.isArray(data.timeline) && data.timeline.length > 0) {
              setGeneratedTimeline(data.timeline);
          }
          if (data.schedulingRisks && Array.isArray(data.schedulingRisks)) {
              setSchedulingRisks(data.schedulingRisks);
          }
          if (data.timelineOptimizations && Array.isArray(data.timelineOptimizations)) {
              setTimelineOptimizations(data.timelineOptimizations);
          }

          // Update Chat
          setMessages(prev => prev.map(m => 
              m.id === thinkingMsgId 
              ? { id: thinkingMsgId, role: 'ai', text: data.reply || "Project details updated." } 
              : m
          ));

      } catch (e) {
          console.error("AI Chat Error", e);
          setMessages(prev => prev.map(m => 
              m.id === thinkingMsgId 
              ? { id: thinkingMsgId, role: 'ai', text: "I encountered an issue processing that request. Please try again." } 
              : m
          ));
      } finally {
          setIsChatProcessing(false);
      }
  };

  const handleSubmitChat = (e: React.FormEvent) => {
      e.preventDefault();
      handleAIChat(chatInput);
  };

  const handleManualReview = () => setStep('REVIEW');

  const handleConfirm = () => {
      const newId = `p-${Date.now()}`;
      
      const newProject: Project = {
        id: newId,
        companyId: 'c1',
        name: formData.name || 'Untitled Project',
        code: `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        description: formData.description,
        location: formData.location || 'Unknown',
        type: formData.type as any,
        status: 'Active',
        health: 'Good',
        progress: 0,
        budget: Number(formData.budget),
        spent: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        manager: 'John Anderson',
        image: effectiveImage, // Use derived effective image
        teamSize: teamSize,
        tasks: { total: generatedTimeline.length, completed: 0, overdue: 0 },
        weatherLocation: weatherData,
        aiAnalysis: aiRiskAnalysis,
        timelineOptimizations: timelineOptimizations
      };

      addProject(newProject);

      // Add File
      if (uploadedFile && filePreview) {
          const newDoc: ProjectDocument = {
              id: `doc-${Date.now()}`,
              name: uploadedFile.name,
              type: isImage ? 'Image' : 'Document',
              projectId: newId,
              projectName: newProject.name,
              size: (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB',
              date: new Date().toLocaleDateString(),
              status: 'Approved',
              url: filePreview
          };
          addDocument(newDoc);
      }

      // Auto-create Tasks from Generated Timeline with chained dependencies
      if (generatedTimeline.length > 0) {
          let currentOffset = 0;
          let previousTaskId: string | null = null; // Track previous task for chaining

          generatedTimeline.forEach((phase, index) => {
              // Calculate due date based on offset
              const dueDate = new Date(formData.startDate);
              dueDate.setDate(dueDate.getDate() + (currentOffset + phase.durationWeeks) * 7);
              
              const taskId = `t-${Date.now()}-${index}`;
              const newTask: Task = {
                  id: taskId,
                  projectId: newId,
                  title: phase.phaseName,
                  description: `Milestone: ${phase.keyMilestone}. Duration: ${phase.durationWeeks} weeks.`,
                  status: 'To Do',
                  priority: phase.riskLevel === 'High' ? 'High' : 'Medium',
                  assigneeType: 'role',
                  assigneeName: 'Project Manager', // Default
                  dueDate: dueDate.toISOString().split('T')[0],
                  dependencies: previousTaskId ? [previousTaskId] : [] // Chain dependency to previous phase
              };
              addTask(newTask);
              
              previousTaskId = taskId; // Update previous task pointer
              currentOffset += phase.durationWeeks;
          });
      }

      setCreatedProjectId(newId);
      setStep('SUCCESS');
  };

  const projectTypes = [
      { id: 'Commercial', icon: Building2 },
      { id: 'Residential', icon: Home },
      { id: 'Infrastructure', icon: Briefcase },
      { id: 'Industrial', icon: Factory },
      { id: 'Healthcare', icon: Stethoscope },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col relative border border-zinc-200 ring-1 ring-black/5">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/10">
                 <Rocket size={20} className="text-white" />
              </div>
              <div>
                  <h1 className="text-lg font-bold text-zinc-900 leading-none mb-1">Project Launchpad</h1>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      <span>AI Architect</span>
                      <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                      <span className="text-purple-600 font-bold flex items-center gap-1"><Sparkles size={10} /> Gemini 3.0 Pro</span>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
                  {['Details', 'Review', 'Launch'].map((s, i) => {
                      const stepMap: Record<string, string> = { 'Details': 'INPUT', 'Review': 'REVIEW', 'Launch': 'SUCCESS' };
                      const isActive = step === stepMap[s];
                      const isPast = i < ['INPUT', 'REVIEW', 'SUCCESS'].indexOf(step);
                      
                      return (
                          <div key={s} className={`flex items-center ${i > 0 ? 'border-l border-zinc-200 pl-1' : ''}`}>
                              <div className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-white text-[#0f5c82] shadow-sm' : isPast ? 'text-green-600' : 'text-zinc-400'}`}>
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${isActive ? 'bg-[#0f5c82] text-white' : isPast ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-500'}`}>{i + 1}</span> {s}
                              </div>
                          </div>
                      );
                  })}
              </div>
              <button onClick={onClose} className="bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 p-2 rounded-full transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
          
          {step === 'INPUT' && (
            <div className="flex flex-col lg:flex-row h-full animate-in fade-in slide-in-from-right-4 overflow-hidden">
                {/* Left: Main Form Area */}
                <div className="flex-1 p-8 overflow-y-auto scrollbar-hide bg-zinc-50/30 relative z-10 border-r border-zinc-100">
                    <div className="max-w-2xl mx-auto space-y-8 pb-20">
                        
                        {/* File Upload Dropzone */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden min-h-[120px] flex items-center justify-center ${uploadedFile ? 'border-[#0f5c82]/30 bg-blue-50/30' : 'border-zinc-200 hover:border-[#0f5c82]/50 hover:bg-zinc-50'}`}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                            
                            {uploadedFile ? (
                                <div className="flex items-center gap-4 p-6 w-full">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-zinc-200 bg-white flex items-center justify-center shrink-0">
                                        {filePreview && isImage ? <img src={filePreview} className="w-full h-full object-cover" alt="preview" /> : <FileText size={32} className="text-red-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-base font-bold text-zinc-900 truncate">{uploadedFile.name}</p>
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> {isImage ? 'Set as Project Cover' : 'Ready for Analysis'}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="p-2 hover:bg-white rounded-full text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 group-hover:text-[#0f5c82] transition-colors text-zinc-400">
                                        <Upload size={20} />
                                    </div>
                                    <div className="text-sm font-bold text-zinc-700">Upload Project Image or Brief</div>
                                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                                        Upload an image to set as the <strong>Project Cover</strong>, or a PDF/Doc for <strong>AI Analysis</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Project Name</label>
                                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] focus:bg-white outline-none transition-all font-medium" placeholder="e.g. Skyline Tower" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                        <input name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-3 pl-11 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] focus:bg-white outline-none transition-all font-medium" placeholder="City, Address" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sector</label>
                                <div className="flex flex-wrap gap-2">
                                    {projectTypes.map((t) => (
                                        <button key={t.id} onClick={() => handleTypeSelect(t.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${formData.type === t.id ? 'border-[#0f5c82] bg-[#0f5c82] text-white shadow-md' : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'}`}>
                                            <t.icon size={14} /> {t.id}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-4 h-32 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f5c82] focus:bg-white outline-none resize-none transition-all" placeholder="Describe scope..." />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAIChat(`Analyze this description for risks and timeline optimizations: "${formData.description}"`)}
                                        disabled={!formData.description || isChatProcessing}
                                        className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Sparkles size={12} /> Analyze & Optimize with AI
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Budget (£)</label>
                                    <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full p-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Fixed Continue Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-zinc-100">
                        <button onClick={handleManualReview} className="w-full max-w-2xl mx-auto bg-[#0f5c82] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-2">
                            Review & Launch <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Right: Interactive AI Chat Panel */}
                <div className="w-full lg:w-[450px] bg-white flex flex-col relative z-20 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
                    <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg"><BrainCircuit size={18} className="text-purple-600" /></div>
                            <div>
                                <div className="text-sm font-bold text-zinc-800">AI Architect</div>
                                <div className="text-[10px] text-zinc-400">Gemini 3.0 Pro • Reasoning Active</div>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-zinc-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'ai' ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-zinc-600 border-zinc-200 shadow-sm'}`}>
                                    {msg.role === 'ai' ? <Sparkles size={14} /> : <User size={14} />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${msg.role === 'ai' ? 'bg-white border border-zinc-200 rounded-tl-none text-zinc-700' : 'bg-[#0f5c82] text-white rounded-tr-none'}`}>
                                    {msg.isThinking ? (
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Loader2 size={14} className="animate-spin" /> 
                                            <span className="animate-pulse">Architect is thinking...</span>
                                        </div>
                                    ) : (
                                        <div className="markdown-body">{msg.text}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Smart Suggestions Chips */}
                    <div className="px-4 py-3 bg-white border-t border-zinc-100">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2 pl-1">Smart Suggestions</div>
                        <div className="flex flex-wrap gap-2">
                            {['Generate Timeline', 'Analyze Risks', 'Estimate Budget', 'Suggest Team Size', 'Optimize Schedule'].map(suggestion => (
                                <button 
                                    key={suggestion}
                                    onClick={() => handleAIChat(suggestion)}
                                    disabled={isChatProcessing}
                                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                    <Sparkles size={10} className="text-purple-400" /> {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-zinc-100">
                        <form onSubmit={handleSubmitChat} className="relative flex items-end gap-2 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all shadow-inner">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask Architect to refine the plan..." 
                                disabled={isChatProcessing}
                                className="w-full pl-3 py-2.5 bg-transparent border-none text-sm focus:ring-0 text-zinc-800 placeholder-zinc-400"
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim() || isChatProcessing}
                                className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-sm flex-shrink-0"
                            >
                                {isChatProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 overflow-hidden bg-zinc-50/50">
               <div className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center flex-shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 shadow-md bg-zinc-100">
                          <img src={effectiveImage} alt="Project Cover" className="w-full h-full object-cover" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-zinc-900">{formData.name || 'Untitled Project'}</h2>
                          <p className="text-sm text-zinc-500 font-medium">{formData.location || 'Location Pending'} • {formData.type}</p>
                      </div>
                  </div>
                  <div className="flex gap-6">
                      <div className="text-right">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Budget</div>
                          <div className="text-xl font-bold text-zinc-900 font-mono">£{Number(formData.budget).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration</div>
                          <div className="text-xl font-bold text-zinc-900 font-mono">
                              {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} Mo
                          </div>
                      </div>
                  </div>
               </div>
               
               <div className="flex-1 p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <div className="bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm">
                          <div className="bg-zinc-50/50 border-b border-zinc-100 p-4 rounded-t-xl flex justify-between items-center">
                              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                  <FileText size={14} /> Executive Summary
                              </h3>
                          </div>
                          <div className="p-6">
                              <p className="text-zinc-700 leading-loose text-sm whitespace-pre-wrap font-medium font-serif">{formData.description || 'No description provided.'}</p>
                          </div>
                      </div>
                      
                      {/* Scheduling Risks */}
                      {schedulingRisks.length > 0 && (
                          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                              <h3 className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                                  <ShieldAlert size={14} /> Identified Risks
                              </h3>
                              <div className="space-y-2">
                                  {schedulingRisks.map((risk, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm text-orange-900/80">
                                          <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0"></span>
                                          {risk}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* Timeline Optimizations */}
                      {timelineOptimizations.length > 0 && (
                          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
                              <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                                  <Zap size={14} /> Timeline Optimizations
                              </h3>
                              <div className="space-y-2">
                                  {timelineOptimizations.map((opt, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm text-green-900/80">
                                          <span className="mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full shrink-0"></span>
                                          {opt}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {aiRiskAnalysis && (
                          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 relative overflow-hidden">
                              <h3 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2 relative z-10">
                                  <AlertCircle size={14} /> Risk Assessment
                              </h3>
                              <p className="text-red-900/80 text-sm leading-relaxed relative z-10">
                                  {aiRiskAnalysis}
                              </p>
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                          <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2 mb-6 uppercase tracking-wider">
                              <Activity size={14} /> Parameters
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                  <div className="text-xs text-zinc-500 mb-1">Team Size</div>
                                  <div className="font-bold text-lg">{teamSize} members</div>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                  <div className="text-xs text-zinc-500 mb-1">Documents</div>
                                  <div className="font-bold text-lg">{uploadedFile ? '1 File' : 'None'}</div>
                              </div>
                          </div>
                      </div>

                      {/* Preliminary Timeline Visualization */}
                      {generatedTimeline.length > 0 && (
                          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                              <div className="bg-purple-50/50 border-b border-purple-100 p-4 flex justify-between items-center">
                                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                                      <Clock size={14} /> Preliminary Timeline
                                  </h3>
                                  <span className="text-[10px] bg-white border border-purple-100 text-purple-600 px-2 py-1 rounded-full shadow-sm font-bold">AI Generated</span>
                              </div>
                              <div className="p-2">
                                  {generatedTimeline.map((phase, index) => (
                                      <div key={index} className="flex items-center gap-4 p-3 hover:bg-zinc-50 rounded-xl transition-colors">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${phase.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                                              {index + 1}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <div className="flex justify-between">
                                                  <h4 className="font-bold text-zinc-800 text-sm">{phase.phaseName}</h4>
                                                  <span className="text-xs text-zinc-500 font-medium">{phase.durationWeeks} Wks</span>
                                              </div>
                                              <p className="text-xs text-zinc-500 truncate mt-0.5">{phase.keyMilestone}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
               </div>

               <div className="p-6 border-t border-zinc-200 flex justify-between bg-white items-center flex-shrink-0 z-20">
                  <button onClick={() => setStep('INPUT')} className="px-6 py-3 text-zinc-500 font-bold hover:bg-zinc-100 rounded-xl transition-colors text-sm">Back to Edit</button>
                  <button onClick={handleConfirm} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-900/10 flex items-center gap-2 transition-all hover:scale-[1.02] text-sm">
                    <CheckCircle2 size={18} /> Confirm & Launch
                  </button>
               </div>
            </div>
          )}

          {step === 'SUCCESS' && (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 animate-in zoom-in-95 duration-500 bg-white">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 shadow-sm border-4 border-green-100 animate-bounce">
                     <CheckCircle2 size={48} className="text-green-600" strokeWidth={2} />
                 </div>
                 <h2 className="text-4xl font-bold text-zinc-900 mb-4 tracking-tight">Project Launched</h2>
                 <p className="text-zinc-500 max-w-md mb-12 text-base leading-relaxed">
                   <strong>{formData.name}</strong> is now active. The workspace has been initialized with {generatedTimeline.length > 0 ? 'AI-generated tasks,' : ''} budgets, timelines, and risk assessments.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                     <button onClick={() => createdProjectId && onViewProject ? onViewProject(createdProjectId) : onClose()} className="flex-1 px-6 py-4 bg-[#0f5c82] text-white rounded-xl font-bold hover:bg-[#0c4a6e] shadow-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        Open Dashboard <ArrowRight size={16} />
                     </button>
                     <button onClick={() => { setStep('INPUT'); setFormData({ name: '', location: '', type: 'Commercial', description: '', budget: 0, startDate: new Date().toISOString().split('T')[0], endDate: '' }); setAiRiskAnalysis(''); setCreatedProjectId(null); clearFile(); setGeneratedTimeline([]); setSchedulingRisks([]); setTimelineOptimizations([]); setMessages([{ id: 'welcome', role: 'ai', text: "Hello! I'm your AI Architect. I can help you define the project scope, estimate budgets, and identify risks. Start by uploading a site plan or describing what you want to build." }]); }} className="flex-1 px-6 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors text-sm">
                        Create Another
                     </button>
                 </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProjectLaunchpadView;
