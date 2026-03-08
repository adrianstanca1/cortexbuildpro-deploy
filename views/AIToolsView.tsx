
import React, { useState, useRef } from 'react';
import { 
  FileSearch, FileText, Box, AlertTriangle, FileDigit, Search, 
  MessageSquare, Calculator, Calendar, ShieldAlert, FileBarChart, Activity, 
  Lightbulb, Upload, BrainCircuit, X, Sparkles, Loader2, Send, CheckCircle2,
  Download, Globe, Target, Zap, ArrowRight, ShieldCheck, History, Info,
  TrendingUp, PoundSterling, Building2, MapPin, ChevronRight, Cpu, ChevronDown,
  Receipt, Gavel, Scale, FilePenLine, Save, FileSignature, Briefcase
} from 'lucide-react';
import { Page, ProjectDocument } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';

interface AIToolsViewProps {
  setPage: (page: Page) => void;
}

type ToolId = 'ARCHITECT' | 'CONTRACT' | 'INVOICE' | 'BLUEPRINT' | 'RISK' | 'BID' | 'GRANT' | 'CHAT' | 'COST' | 'SCHEDULE' | 'COMPLIANCE' | 'SCOPE_GEN';

interface ToolDef {
    id: ToolId;
    icon: any;
    title: string;
    desc: string;
    action?: () => void;
    requiresProject?: boolean;
    requiresUpload?: boolean;
    promptTemplate: string;
    model?: string;
    grounding?: boolean;
    customInput?: boolean;
}

const AIToolsView: React.FC<AIToolsViewProps> = ({ setPage }) => {
  const { user } = useAuth();
  const { projects, tasks, addDocument, setAiProcessing } = useProjects();
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{name: string, type: string} | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: ToolDef[] = [
    { 
        id: 'BID', 
        icon: FileSignature, 
        title: 'Bid Architecture', 
        desc: 'Synthesize professional, multi-section bid packages by reconciling site metrics with strategic parameters.',
        requiresProject: true,
        customInput: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: `
            Act as a Senior Bid Strategist and Technical Writer for a Tier-1 construction firm.
            
            TASK: Generate a professional, high-fidelity Bid Package for the project described in the context.
            
            USER STRATEGIC INPUT: {INPUT}
            
            THE PACKAGE MUST INCLUDE:
            1. EXECUTIVE VISION: A compelling technical overview of the project and our unique value proposition.
            2. PROJECT ARCHITECTURE: Detailed breakdown of the technical approach, site orchestration, and structural methodologies.
            3. MILESTONE LATTICE: Clear delivery phases derived from the project task chain.
            4. FORENSIC RISK MITIGATION: Analysis of potential site-specific risks and our proactive remediation protocols.
            5. FINANCIAL SYNOPSIS: Summary of budget alignment and cost-efficiency strategies.
            
            TONE: Authoritative, technical, and professional. 
            FORMAT: Use rich Markdown with bold headers and bullet points. 
            Avoid generic filler; focus on technical precision and site-specific details provided in the context.
        `
    },
    { 
        id: 'SCOPE_GEN', 
        icon: FilePenLine, 
        title: 'Scope Architect', 
        desc: 'Generate professional multi-section project scope documents from raw parameters.',
        customInput: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Act as a Senior Project Manager. Generate a comprehensive Project Scope Document based on the following parameters: {INPUT}. Sections MUST include: 1. Executive Objectives, 2. Key Deliverables, 3. Project Constraints, 4. High-Level Milestone Timeline. Use professional technical construction terminology. Return as beautifully formatted Markdown.'
    },
    { 
        id: 'ARCHITECT', 
        icon: BrainCircuit, 
        title: 'AI Architect', 
        desc: 'Generative project planning, budgeting, and risk analysis.', 
        action: () => setPage(Page.PROJECT_LAUNCHPAD),
        promptTemplate: ''
    },
    { 
        id: 'INVOICE', 
        icon: Receipt, 
        title: 'Invoice Parser', 
        desc: 'Automatically extract vendor details, granular amounts, payment terms, and itemized lists.',
        requiresUpload: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Perform a forensic extraction of this invoice. You MUST extract: 1. Vendor Details (Name, Address, Tax ID if available), 2. Total Amounts (Net, Tax, and Gross Total), 3. Payment Terms (e.g., Net 30, discount terms), 4. Due Date, 5. Itemized Line Items (Description, Quantity, Unit Price, Total). Return the data in a clean, structured JSON format with keys: "vendorDetails", "totalAmounts", "paymentTerms", "dueDate", and "lineItems".'
    },
    { 
        id: 'CONTRACT', 
        icon: FileSearch, 
        title: 'Contract Analyzer', 
        desc: 'Extract key dates, terms, and liabilities from uploaded contracts.',
        requiresUpload: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Perform a forensic analysis of this construction contract. Identify: 1. Key Deadlines and Milestones, 2. Financial Liabilities, 3. Dispute Resolution Terms, 4. Critical Risk Clauses. Return structured JSON with "deadlines", "liabilities", "terms", and "risks" arrays.'
    },
    { 
        id: 'COMPLIANCE', 
        icon: Scale, 
        title: 'Regulatory Auditor', 
        desc: 'Cross-reference project data with real-time building codes and planning law.',
        requiresProject: true,
        grounding: true,
        model: 'gemini-3-flash-preview',
        promptTemplate: 'Using current UK/Local planning laws and building regulations for 2025, audit this project for potential compliance bottlenecks or safety regulation updates. Use web search grounding to find the latest standards.'
    },
    { 
        id: 'BLUEPRINT', 
        icon: Box, 
        title: 'Blueprint Analyzer', 
        desc: 'Extract dimensions, material quantities, and detect risk areas.',
        requiresUpload: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Analyze this architectural/technical drawing. Identify: 1. Key Dimensions, 2. Estimated Material Quantities (e.g., concrete, steel, bricks), 3. Structural Risks or Discrepancies, 4. Compliance suggestions. Return JSON.'
    },
    { 
        id: 'RISK', 
        icon: AlertTriangle, 
        title: 'Risk Assessment Engine', 
        desc: 'Analyze project risks with confidence scoring and mitigation plans.',
        requiresProject: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Perform a deep reasoning risk audit for this project context. Evaluate financial trajectory, site safety conditions, and regulatory compliance. Provide 5 critical risks with "severity", "impact", and a specific "mitigationPlan". Return JSON.'
    },
    { 
        id: 'GRANT', 
        icon: Briefcase, 
        title: 'Grant Specialist', 
        desc: 'Analyze sustainability metrics to generate compelling grant and subsidy applications.',
        requiresProject: true,
        customInput: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Act as a Sustainability Consultant. Analyze the project data and user input: {INPUT}. Draft a compelling application for a green construction grant. Focus on energy efficiency, carbon reduction, and social impact. Return Markdown.'
    },
    { 
        id: 'COST', 
        icon: Calculator, 
        title: 'Cost Estimator', 
        desc: 'Predict project costs and variation impacts using reasoning models.',
        requiresProject: true,
        model: 'gemini-3-pro-preview',
        promptTemplate: 'Perform a forensic cost estimation for the remaining scope of this project. Account for potential inflation (use real-time trends if possible), site-specific risks, and historical variance in this sector. Break down by Labor, Materials, and Risk Contingency. Return JSON.'
    }
  ];

  const handleToolClick = (tool: ToolDef) => {
    if (tool.action) {
        tool.action();
        return;
    }
    setActiveToolId(tool.id);
    setResult(null);
    setUploadedFile(null);
    setFileMeta(null);
    setCustomPrompt('');
    setSelectedProjectId(projects[0]?.id || '');
    
    // Auto-fill example if it's the Scope Gen or Bid tool
    if (tool.id === 'SCOPE_GEN' || tool.id === 'BID') {
      setCustomPrompt(`Additional Parameters:
- Target Client: Global Tech Infrastructure Group
- Key Competitive Advantage: Use of proprietary zero-carbon concrete shards.
- Logistics Focus: 24/7 site orchestration to meet aggressive Q3 deadline.`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedFile(reader.result as string);
            setFileMeta({ name: file.name, type: file.type });
        };
        reader.readAsDataURL(file);
    }
  };

  const executeTool = async () => {
    const tool = tools.find(t => t.id === activeToolId);
    if (!tool) return;

    setIsProcessing(true);
    setAiProcessing(true);
    setResult(null);

    try {
        let context = "";
        if (tool.requiresProject) {
            const p = projects.find(proj => proj.id === selectedProjectId);
            const pt = tasks.filter(t => t.projectId === selectedProjectId);
            context = `PROJECT TELEMETRY CONTEXT:
Name: ${p?.name}
Code: ${p?.code}
Sector: ${p?.type}
Location: ${p?.location}
Description: ${p?.description}
Progress: ${p?.progress}%
Budget: £${p?.budget}
Active Task Shards: ${JSON.stringify(pt.slice(0,15))}`;
        }

        const finalPrompt = tool.promptTemplate.replace('{INPUT}', customPrompt) + `\n\n${context}`;
        const config: any = { 
            model: tool.model || 'gemini-3-flash-preview',
            temperature: 0.4
        };

        if (tool.grounding) {
            config.tools = [{ googleSearch: {} }];
        }

        if (tool.model === 'gemini-3-pro-preview') {
            config.thinkingConfig = { thinkingBudget: 32768 }; // Use maximum thinking budget for Pro tools
        }

        const mediaData = uploadedFile ? uploadedFile.split(',')[1] : undefined;
        const mediaMime = fileMeta?.type;

        const responseText = await runRawPrompt(finalPrompt, config, mediaData, mediaMime);
        
        try {
            // Only try to parse JSON if the tool isn't a long-form text generator like BID or SCOPE_GEN
            if (!['BID', 'SCOPE_GEN', 'GRANT'].includes(tool.id) && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
                setResult(parseAIJSON(responseText));
            } else {
                setResult(responseText);
            }
        } catch (e) {
            setResult(responseText);
        }
    } catch (error) {
        console.error("AI Node Error:", error);
        setResult("Analysis failed. The intelligence node timed out or encountered a reasoning error.");
    } finally {
        setIsProcessing(false);
        setAiProcessing(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!selectedProjectId || !result) return;
    const project = projects.find(p => p.id === selectedProjectId);
    
    const newDoc: ProjectDocument = {
        id: `doc-ai-${Date.now()}`,
        name: `AI Generated - ${activeToolId} - ${new Date().toLocaleDateString()}`,
        type: 'Document',
        projectId: selectedProjectId,
        companyId: user?.companyId || 'c1',
        projectName: project?.name || 'Unknown Project',
        size: 'AI Synthetic Shard',
        date: new Date().toLocaleDateString(),
        status: 'Draft',
        url: `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(typeof result === 'string' ? result : JSON.stringify(result, null, 2))))}`
    };
    
    await addDocument(newDoc);
    alert("Synthetic document node committed to project registry.");
  };

  const activeTool = tools.find(t => t.id === activeToolId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter uppercase flex items-center gap-3 leading-none">
           <BrainCircuit className="text-primary" /> Intelligence Suite
        </h1>
        <p className="text-zinc-500 font-medium uppercase text-[10px] tracking-[0.3em]">Advanced Generative Construction Analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {tools.map((tool, index) => (
          <div 
            key={index} 
            onClick={() => handleToolClick(tool)}
            className={`bg-white border border-zinc-200 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col ring-1 ring-transparent hover:ring-primary/20 ${activeToolId === tool.id ? 'ring-primary border-primary bg-blue-50/20' : ''}`}
          >
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-zinc-100">
              <tool.icon size={32} className="text-zinc-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">{tool.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-8 flex-1">{tool.desc}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Deployment Ready</span>
                </div>
                <div className="p-2.5 bg-zinc-100 text-zinc-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                </div>
            </div>
          </div>
        ))}
      </div>

      {activeToolId && activeTool && (
          <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95">
                  
                  {/* Workspace Header */}
                  <div className="p-10 border-b bg-zinc-50/50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-5 bg-primary text-white rounded-1.75rem shadow-2xl shadow-blue-900/30">
                              <activeTool.icon size={40} />
                          </div>
                          <div>
                              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{activeTool.title}</h2>
                              <div className="flex items-center gap-4 mt-3">
                                  <span className="px-3 py-1 bg-zinc-200 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                      <Cpu size={12} /> {activeTool.model || 'Gemini 3 Flash'}
                                  </span>
                                  {activeTool.grounding && (
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-200">
                                          <Globe size={12} /> Web Grounding
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setActiveToolId(null)} className="p-4 bg-zinc-100 hover:bg-red-50 hover:text-red-500 text-zinc-400 rounded-full transition-all shadow-sm border border-zinc-100"><X size={28} /></button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                      <div className="w-full lg:w-[450px] border-r border-zinc-100 p-10 space-y-10 bg-zinc-50/30 overflow-y-auto custom-scrollbar shrink-0">
                          
                          {(activeTool.requiresProject || activeTool.id === 'SCOPE_GEN' || activeTool.id === 'BID') && (
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Project Registry Target</label>
                                  <div className="relative group">
                                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={20} />
                                      <select 
                                        className="w-full pl-12 pr-6 py-5 bg-white border border-zinc-200 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-sm appearance-none"
                                        value={selectedProjectId}
                                        onChange={e => setSelectedProjectId(e.target.value)}
                                      >
                                          <option value="">Select Project Context...</option>
                                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                                  </div>
                              </div>
                          )}

                          {(activeTool.customInput || activeTool.id === 'BID') && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Parameters & Details</label>
                                <textarea 
                                    className="w-full p-6 bg-white border border-zinc-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none h-48 resize-none transition-all shadow-inner placeholder:text-zinc-300"
                                    placeholder="Enter project details, strategic competitive advantages, or specific constraints..."
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                />
                            </div>
                          )}

                          {activeTool.requiresUpload && (
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Asset Payload</label>
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`rounded-[2.5rem] border-2 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${uploadedFile ? 'bg-blue-50 border-primary/40 shadow-inner' : 'bg-white border-zinc-200 hover:border-primary shadow-sm'}`}
                                  >
                                      <input type="file" hide-scrollbar ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                      {uploadedFile ? (
                                          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
                                              <div className="p-5 bg-white rounded-2xl shadow-xl border border-blue-100 relative group">
                                                  {fileMeta?.type.startsWith('image/') ? <img src={uploadedFile} className="w-24 h-24 object-cover rounded-xl" /> : <FileText size={48} className="text-primary" />}
                                                  <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-lg"><CheckCircle2 size={16} /></div>
                                              </div>
                                              <div>
                                                <p className="text-sm font-black text-zinc-900 truncate max-w-[250px]">{fileMeta?.name}</p>
                                                <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setFileMeta(null); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 hover:underline">Flush Payload</button>
                                              </div>
                                          </div>
                                      ) : (
                                          <>
                                              <div className="p-5 bg-zinc-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-white text-zinc-400 shadow-inner">
                                                <Upload size={32} />
                                              </div>
                                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Drop Analysis Target</p>
                                          </>
                                      )}
                                  </div>
                              </div>
                          )}

                          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group/intel shadow-2xl">
                              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/intel:scale-110 transition-transform duration-700"><Zap size={100} className="text-yellow-400" /></div>
                              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Inference Node Status</h4>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-10 font-medium italic">Executing logic chain on Gemini Reasoning Core. Results are cross-referenced with regional construction standards.</p>
                              
                              <button 
                                onClick={executeTool}
                                disabled={isProcessing || (activeTool.requiresProject && !selectedProjectId) || (activeTool.requiresUpload && !uploadedFile)}
                                className="w-full py-5 bg-white text-zinc-900 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                              >
                                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} className="text-yellow-500" />}
                                  {isProcessing ? 'Synthesizing...' : 'Initialize Reasoning'}
                              </button>
                          </div>
                      </div>

                      <div className="flex-1 bg-zinc-50 p-10 overflow-y-auto custom-scrollbar flex flex-col relative">
                          <div className="flex-1">
                              {isProcessing ? (
                                  <div className="h-full flex flex-col items-center justify-center space-y-10 animate-in fade-in">
                                      <div className="relative">
                                          <div className="w-48 h-48 border-4 border-zinc-200 border-t-primary rounded-full animate-spin"></div>
                                          <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse shadow-2xl" size={72} />
                                      </div>
                                      <div className="text-center space-y-3">
                                          <p className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Architectural Reasoning</p>
                                          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Evaluating structural constraints & trajectories...</p>
                                      </div>
                                  </div>
                              ) : result ? (
                                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                                      <div className="flex items-center justify-between px-4">
                                          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                              <ShieldCheck size={20} className="text-green-500" /> Technical Synthesis Report
                                          </h3>
                                          <div className="flex gap-2">
                                            <button 
                                                onClick={handleSaveToProject}
                                                disabled={!selectedProjectId}
                                                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all disabled:opacity-30"
                                            >
                                                <Save size={14} className="text-green-400" /> Log to Project Registry
                                            </button>
                                            <button className="p-3 bg-white rounded-xl border border-zinc-200 text-zinc-400 hover:text-primary transition-all shadow-sm"><Download size={18} /></button>
                                          </div>
                                      </div>
                                      
                                      <div className="bg-white p-12 rounded-[3rem] border border-zinc-200 shadow-xl relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-5 transition-opacity"><Activity size={180} /></div>
                                          
                                          {typeof result === 'object' && !Array.isArray(result) ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                  {Object.entries(result).map(([key, val]: any, idx) => (
                                                      <div key={idx} className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100 group/item hover:bg-white hover:border-primary transition-all">
                                                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 border-b border-zinc-100 pb-3 group-hover/item:text-primary transition-colors">{key.replace(/([A-Z])/g, ' $1')}</div>
                                                          <div className="text-sm text-zinc-700 font-medium leading-relaxed">
                                                              {typeof val === 'object' ? (
                                                                  <pre className="text-xs font-mono bg-zinc-900 text-green-400 p-4 rounded-2xl mt-4 overflow-auto shadow-inner">{JSON.stringify(val, null, 2)}</pre>
                                                              ) : (
                                                                  <div className="flex items-start gap-3">
                                                                      <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                                                      {val}
                                                                  </div>
                                                              )}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : Array.isArray(result) ? (
                                              <div className="space-y-6 relative z-10">
                                                  {result.map((item: any, i: number) => (
                                                      <div key={i} className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 flex items-start gap-8 hover:bg-white hover:shadow-2xl transition-all border-l-8 border-l-primary group/card">
                                                          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-lg shadow-xl group-hover/card:scale-110 transition-transform">{i+1}</div>
                                                          <div className="flex-1 min-w-0">
                                                              {typeof item === 'object' ? (
                                                                  <>
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="font-black text-zinc-900 uppercase tracking-tight text-xl truncate">{item.title || item.name || item.phaseName || item.course || item.vendor}</div>
                                                                        {item.severity && (
                                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                                item.severity === 'High' || item.severity === 'CRITICAL' 
                                                                                ? 'bg-red-50 text-red-600 border-red-100' 
                                                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                                                            }`}>
                                                                                {item.severity}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-4">{item.description || item.desc || item.reason || item.keyMilestone || item.provider || item.terms}</p>
                                                                    {item.mitigationPlan && (
                                                                        <div className="p-5 bg-green-50 rounded-2xl border border-green-100 text-xs font-bold text-green-700 flex items-center gap-3 shadow-inner">
                                                                            <ShieldCheck size={18} /> Protocol: {item.mitigationPlan}
                                                                        </div>
                                                                    )}
                                                                  </>
                                                              ) : <p className="text-base text-zinc-700 leading-relaxed font-medium">{item}</p>}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : (
                                              <div className="p-4 relative z-10">
                                                  <div className="prose prose-sm max-w-none text-zinc-700 leading-[1.8] whitespace-pre-wrap font-medium">
                                                      {result}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
                                      <div className="w-28 h-28 bg-white rounded-[3rem] border border-zinc-100 flex items-center justify-center text-zinc-200 shadow-xl ring-[12px] ring-zinc-50 transform hover:rotate-12 transition-transform cursor-help">
                                          <Target size={56} />
                                      </div>
                                      <div className="max-w-md space-y-4">
                                          <h3 className="text-zinc-900 font-black uppercase tracking-[0.2em] text-sm">Waiting for Parameters</h3>
                                          <p className="text-zinc-400 text-xs font-bold leading-relaxed uppercase tracking-widest">
                                              Input the project context and execute the reasoning node to generate professional technical synthesis.
                                          </p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AIToolsView;
