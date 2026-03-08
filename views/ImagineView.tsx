
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, Download, Share2, Loader2, RefreshCw, 
  ScanEye, ShieldAlert, HardHat, Search, AlertTriangle, 
  CheckCircle2, FileText, Upload, X, ImageIcon, Layers,
  Map, ClipboardCheck, Check, Calculator, Activity,
  Info, AlertOctagon, HelpCircle, Briefcase, Save, CheckSquare,
  Video, Play, Ratio, ScanLine, Target, Zap, ArrowRight, StopCircle, MessageSquare, Send, Eye, Camera, Maximize2, BrainCircuit,
  // Added missing Radio icon to imports
  Mic, MicOff, FileSearch, TrendingUp, ShieldCheck, PenTool, Pencil, Sparkles, Layout, Radio
} from 'lucide-react';
import { generateImage, runRawPrompt, parseAIJSON } from '../services/geminiService';
import { GeneratedImage } from '../types';
import { useProjects } from '../contexts/ProjectContext';

type Mode = 'CREATE_IMAGE' | 'INSPECT' | 'REFINE' | 'LIVE_FEED';
type AnalysisMode = 'SAFETY' | 'QUALITY' | 'PROGRESS';

interface AnalysisItem {
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low' | 'Info' | 'CRITICAL' | 'WARNING' | 'PASS';
    mitigation?: string;
}

const ImagineView: React.FC = () => {
  const { setAiProcessing } = useProjects();
  const [mode, setMode] = useState<Mode>('CREATE_IMAGE');

  // --- Imagine State ---
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgAspectRatio, setImgAspectRatio] = useState('16:9');
  const [isImgGenerating, setIsImgGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState(true);
  
  const ratios = ['1:1', '4:3', '3:4', '16:9', '9:16'];

  // --- Refiner State ---
  const [refineSource, setRefineSource] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // --- Live Vision State ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [visionMode, setVisionMode] = useState<AnalysisMode>('QUALITY');
  const [observations, setObservations] = useState<any[]>([]);
  const [isVisionProcessing, setIsVisionProcessing] = useState(false);
  
  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);

  // --- Upload Analysis State ---
  const [analyzeMedia, setAnalyzeMedia] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisItem[] | null>(null);
  const [activeAnalysisType, setActiveAnalysisType] = useState<AnalysisMode | null>(null);

  useEffect(() => {
    const checkKey = async () => {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            setIsApiKeySelected(hasKey);
        }
    };
    checkKey();
    return () => stopCamera();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setIsApiKeySelected(true);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        startAnalysisLoop();
      }
    } catch (e) {
      console.error("Camera error:", e);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setIsVisionProcessing(false);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return null;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const analyzeFrame = async () => {
    if (isVisionProcessing) return;
    const base64Image = captureFrame();
    if (!base64Image) return;

    setIsVisionProcessing(true);
    try {
      let prompt = `Analyze this construction site image for ${visionMode}. IDENTIFY 3 REAL OBSERVATIONS. Return JSON array: [{ "severity": "CRITICAL"|"WARNING"|"PASS", "title": "string", "description": "string" }]`;
      const result = await runRawPrompt(prompt, { model: 'gemini-2.5-flash', responseMimeType: 'application/json' }, base64Image);
      const data = parseAIJSON(result);
      setObservations(Array.isArray(data) ? data : [data]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVisionProcessing(false);
    }
  };

  const startAnalysisLoop = () => {
    analyzeFrame();
    intervalRef.current = window.setInterval(analyzeFrame, 8000);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPrompt.trim()) return;
    setIsImgGenerating(true);
    setAiProcessing(true);
    try {
        const url = await generateImage(imgPrompt, imgAspectRatio);
        setCurrentImage({ url, prompt: imgPrompt });
    } catch (error: any) {
        console.error(error);
        if (error.message?.includes("Requested entity was not found.")) {
            setIsApiKeySelected(false);
        } else {
            alert("Sovereign Forge failed to synthesize the request. Ensure proper API key clearance.");
        }
    } finally {
        setIsImgGenerating(false);
        setAiProcessing(false);
    }
  };

  const runUploadAnalysis = async (mode: AnalysisMode) => {
    if (!analyzeMedia || isAnalyzing) return;
    setIsAnalyzing(true);
    setActiveAnalysisType(mode);
    setAiProcessing(true);
    try {
      const base64Data = analyzeMedia.split(',')[1];
      const jsonPrompt = `Act as a forensic construction auditor. Perform a technical deep dive into this site image for ${mode} criteria. Identify risks and deviations. Return JSON array: [{"title": "string", "description": "string", "severity": "High"|"Medium"|"Low", "mitigation": "string"}]`;
      const response = await runRawPrompt(jsonPrompt, { model: 'gemini-3-pro-preview', responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 4096 } }, base64Data);
      setAnalysisResult(parseAIJSON(response));
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
      setAiProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 text-zinc-900 overflow-hidden relative">
      <div className="px-10 py-8 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm shrink-0">
        <div>
            <h1 className="text-4xl font-black text-zinc-900 flex items-center gap-5 uppercase tracking-tighter leading-none">
                <Wand2 className="text-primary" size={36} /> Intelligence Studio
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                <Activity size={14} className="text-primary animate-pulse" /> Sovereign Generative Matrix Node
            </p>
        </div>
        
        <div className="bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-inner">
            {(['CREATE_IMAGE', 'INSPECT', 'REFINE', 'LIVE_FEED'] as Mode[]).map(m => (
                <button 
                  key={m} 
                  onClick={() => { setMode(m); stopCamera(); setObservations([]); setAnalysisResult(null); }} 
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-midnight text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                    {m.replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      {!isApiKeySelected && mode === 'CREATE_IMAGE' && (
          <div className="absolute inset-0 z-[100] bg-zinc-950/90 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in">
              <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl text-center max-w-xl border border-white/20">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <Zap size={48} className="fill-current" />
                  </div>
                  <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter mb-4">Sovereign Key Required</h2>
                  <p className="text-zinc-500 text-lg font-medium leading-relaxed mb-12 italic">
                      "Image synthesis requires a paid project shard. Link your billing-enabled API key to access the Architect Pro engine."
                  </p>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleSelectKey} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-4 active:scale-95 group">
                        Link Shard Access <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:underline">Billing Documentation</a>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-hidden">
        {mode === 'CREATE_IMAGE' && (
            <div className="flex h-full animate-in fade-in duration-700">
                <div className="w-[450px] bg-white border-r border-zinc-200 p-10 flex flex-col shadow-2xl z-10 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-5 mb-10 shrink-0">
                        <div className="p-4.5 bg-primary/10 text-primary rounded-3xl shadow-inner"><Sparkles size={36} /></div>
                        <div>
                            <h3 className="font-black text-zinc-900 text-2xl tracking-tight uppercase leading-none">Architect Forge</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> Shard 3.0 Pro Active</p>
                        </div>
                    </div>
                    
                    <div className="space-y-12 flex-1">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-2">Design Intent Abstract</label>
                            <textarea 
                                value={imgPrompt}
                                onChange={e => setImgPrompt(e.target.value)}
                                className="w-full p-8 h-48 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] text-sm font-medium focus:ring-8 focus:ring-primary/5 outline-none resize-none transition-all placeholder:text-zinc-300 italic shadow-inner"
                                placeholder="Describe the structural genesis... (e.g. Ultra-realistic site overview, modern curtain wall assembly, morning fog, 8k)"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-2 flex items-center gap-2"><Layout size={16} className="text-primary" /> Geometric Aspect Shard</label>
                            <div className="grid grid-cols-5 gap-2">
                                {ratios.map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setImgAspectRatio(r)}
                                        className={`py-3.5 rounded-xl text-[10px] font-black border transition-all ${imgAspectRatio === r ? 'bg-midnight text-white border-midnight shadow-2xl' : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-300 hover:bg-zinc-100'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10">
                        <button 
                            onClick={handleGenerateImage}
                            disabled={isImgGenerating || !imgPrompt.trim()}
                            className="w-full py-6 bg-zinc-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 group"
                        >
                            {isImgGenerating ? <Loader2 size={24} className="animate-spin text-primary" /> : <Zap size={24} className="text-yellow-400 fill-current group-hover:scale-110 transition-transform" />}
                            Execute Genesis Protocol
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 bg-zinc-950 flex items-center justify-center relative p-12 overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12"><Target size={400} /></div>
                    
                    {currentImage ? (
                        <div className="relative group animate-in zoom-in-95 duration-1000 max-w-full max-h-full">
                            <img src={currentImage.url} className="max-w-full max-h-full object-contain shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] rounded-[3.5rem] border border-white/5 ring-1 ring-white/10" alt="Generated artifact" />
                            <div className="absolute top-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                <button className="p-5 bg-midnight/80 backdrop-blur-xl rounded-[1.5rem] text-white hover:bg-primary transition-all border border-white/10 shadow-2xl"><Download size={28} /></button>
                                <button className="p-5 bg-midnight/80 backdrop-blur-xl rounded-[1.5rem] text-white hover:bg-primary transition-all border border-white/10 shadow-2xl"><Share2 size={28} /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-8 relative z-10 animate-pulse">
                            <div className="w-32 h-32 bg-white/5 rounded-[3.5rem] border border-white/5 flex items-center justify-center mx-auto shadow-2xl ring-1 ring-white/10">
                                <ImageIcon size={64} className="text-zinc-800" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-zinc-700 font-black uppercase tracking-[0.5em] text-sm">Visual Hub Standby</p>
                                <p className="text-zinc-800 text-xs font-bold uppercase tracking-[0.3em]">Initialize parameters to forger artifact</p>
                            </div>
                        </div>
                    )}
                    
                    {isImgGenerating && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="w-48 h-48 border-[6px] border-white/5 border-t-primary rounded-full animate-spin" />
                                <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse shadow-[0_0_50px_rgba(14,165,233,0.3)]" size={72} />
                                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse-slow" />
                            </div>
                            <div className="text-center space-y-4">
                                <h4 className="text-5xl font-black text-white uppercase tracking-tighter">Forging Logic Node</h4>
                                <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.5em] animate-pulse">Synthesizing high-fidelity construct...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {mode === 'INSPECT' && (
           <div className="flex h-full animate-in fade-in duration-700">
               <div className="flex-1 bg-zinc-100 p-12 flex flex-col justify-center items-center relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                   {analyzeMedia ? (
                        <div className="relative w-full h-full max-w-5xl max-h-[85%] rounded-[4rem] overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.2)] border-8 border-white animate-in zoom-in-95 duration-500 bg-white">
                            <img src={analyzeMedia} className="w-full h-full object-contain" />
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-midnight/40 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-in fade-in">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-primary rounded-full animate-spin shadow-2xl" />
                                    <span className="text-white text-2xl font-black uppercase tracking-tighter text-shadow-xl">Forensic Extraction Active</span>
                                </div>
                            )}
                            <button onClick={() => { setAnalyzeMedia(null); setAnalysisResult(null); setActiveAnalysisType(null); }} className="absolute top-10 right-10 p-5 bg-white rounded-full shadow-2xl text-zinc-400 hover:text-red-500 transition-all border border-zinc-100 active:scale-90"><X size={32} /></button>
                        </div>
                   ) : (
                       <div className="max-w-xl w-full text-center space-y-10 animate-in slide-in-from-bottom-6">
                           <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-40 h-40 bg-white rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl border-2 border-zinc-100 cursor-pointer hover:scale-110 hover:border-primary transition-all group relative ring-1 ring-zinc-50"
                           >
                               <div className="absolute inset-0 bg-primary/5 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                               <Upload size={64} className="text-zinc-200 group-hover:text-primary transition-colors relative z-10" />
                           </div>
                           <div>
                               <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter mb-3">Initialize Forensic Scan</h2>
                               <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest max-w-sm mx-auto">Upload site artifacts for deep reasoning analysis against safety and quality lattices.</p>
                           </div>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setAnalyzeMedia(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                           }} />
                       </div>
                   )}
               </div>
               <div className="w-[500px] bg-white border-l border-zinc-200 p-10 flex flex-col shadow-2xl z-10 overflow-y-auto custom-scrollbar">
                   <div className="space-y-4 mb-12">
                       <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] px-2 mb-6">Instruction Matrix</h3>
                       {(['QUALITY', 'SAFETY', 'PROGRESS'] as AnalysisMode[]).map(m => (
                           <button 
                                key={m}
                                onClick={() => runUploadAnalysis(m)}
                                disabled={!analyzeMedia || isAnalyzing}
                                className={`w-full p-8 border-2 rounded-[2.5rem] text-left transition-all relative overflow-hidden group ${activeAnalysisType === m ? 'bg-primary/5 border-primary shadow-2xl scale-[1.03] ring-8 ring-primary/5' : 'bg-zinc-50 border-transparent hover:border-zinc-200 hover:bg-white'}`}
                           >
                               <div className="flex justify-between items-center relative z-10">
                                   <div className="font-black text-zinc-900 uppercase tracking-widest text-lg">{m} SHARD</div>
                                   <ArrowRight size={20} className={`transition-all ${activeAnalysisType === m ? 'text-primary translate-x-1' : 'text-zinc-300 opacity-0 group-hover:opacity-100'}`} />
                               </div>
                               <p className="text-xs text-zinc-400 mt-2 font-medium relative z-10 uppercase tracking-widest">Execute inference node for {m.toLowerCase()} verification.</p>
                           </button>
                       ))}
                   </div>
                   
                   <div className="space-y-6 flex-1">
                       <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-8 px-2">
                           <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em] flex items-center gap-3"><ScanLine size={16} className="text-primary" /> Technical Ledger</h4>
                           <span className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">{analysisResult?.length || 0} DEEP NODES</span>
                       </div>
                       
                       <div className="space-y-6">
                           {analysisResult?.map((item, i) => (
                               <div key={i} className="bg-zinc-50/50 border border-zinc-100 rounded-[2rem] p-8 shadow-sm animate-in slide-in-from-right-4 group hover:bg-white hover:border-primary transition-all relative overflow-hidden">
                                   <div className={`absolute top-0 left-0 w-1.5 h-full ${item.severity === 'High' || item.severity === 'CRITICAL' ? 'bg-red-500' : item.severity === 'Medium' || item.severity === 'WARNING' ? 'bg-orange-500' : 'bg-primary'}`} />
                                   <div className="flex justify-between items-start mb-4">
                                       <h5 className="font-black text-zinc-900 text-base uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{item.title}</h5>
                                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border-2 ${
                                           item.severity === 'High' || item.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-500/20' : 
                                           item.severity === 'Medium' || item.severity === 'WARNING' ? 'bg-orange-50 text-orange-600 border-orange-500/20' : 
                                           'bg-blue-50 text-blue-600 border-blue-500/20'
                                       }`}>{item.severity}</span>
                                   </div>
                                   <p className="text-sm text-zinc-500 leading-relaxed font-medium italic mb-6">"{item.description}"</p>
                                   {item.mitigation && (
                                       <div className="p-5 bg-white border border-zinc-200 rounded-2xl flex items-start gap-4 shadow-inner">
                                           <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                           <div className="space-y-1">
                                               <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Remediation Protocol</div>
                                               <p className="text-xs font-bold text-zinc-700 leading-normal">{item.mitigation}</p>
                                           </div>
                                       </div>
                                   )}
                               </div>
                           ))}
                           {!analysisResult && (
                               <div className="py-24 text-center border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50/50">
                                   <Activity size={48} className="mx-auto mb-4 text-zinc-200" />
                                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Awaiting Analysis Payload</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           </div>
        )}
        
        {mode === 'LIVE_FEED' && (
            <div className="h-full bg-midnight relative flex items-center justify-center animate-in fade-in duration-500">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                {!isCameraActive ? (
                    <div className="text-center space-y-10 animate-in slide-in-from-bottom-8">
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-2xl border border-primary/20 ring-1 ring-primary/30 animate-pulse">
                            <Radio size={56} className="text-primary" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Vision Agent Standby</h2>
                            <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.4em]">Real-time site telemetry sharding</p>
                        </div>
                        <button onClick={startCamera} className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(14,165,233,0.4)] hover:bg-[#0c4a6e] transition-all active:scale-95 flex items-center gap-4 mx-auto">
                            <Play size={20} fill="currentColor" /> Initialize Link
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full h-full group">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] border-2 border-white/20 rounded-[4rem] flex flex-col items-center justify-center">
                                <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-primary rounded-tl-[4rem] transition-all duration-700" />
                                <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-primary rounded-tr-[4rem]" />
                                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-primary rounded-bl-[4rem]" />
                                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-primary rounded-br-[4rem]" />
                                {isVisionProcessing && <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/50 shadow-[0_0_20px_#0ea5e9] animate-[scan_2s_linear_infinite]" />}
                            </div>
                        </div>

                        <div className="absolute top-10 left-10 flex flex-col gap-6">
                            <div className="bg-midnight/60 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/10 text-xs font-black uppercase text-white flex items-center gap-4 shadow-2xl">
                                <div className={`w-3 h-3 rounded-full ${isVisionProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="tracking-[0.3em] font-mono">{isVisionProcessing ? 'Analyzing Node Payload' : 'Monitoring Sector 01-PRO'}</span>
                            </div>
                            
                            <div className="space-y-3">
                                {observations.map((obs, i) => (
                                    <div key={i} className="bg-midnight/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 w-80 animate-in slide-in-from-left-4 duration-500 shadow-2xl relative overflow-hidden group/obs">
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${obs.severity === 'CRITICAL' ? 'bg-red-500' : obs.severity === 'WARNING' ? 'bg-orange-500' : 'bg-primary'}`} />
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${obs.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>{obs.severity} DETECT</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-ping" />
                                        </div>
                                        <div className="text-white text-sm font-black truncate uppercase tracking-tight mb-1">{obs.title}</div>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium italic line-clamp-2">"{obs.description}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-midnight/40 backdrop-blur-3xl px-12 py-6 rounded-[3.5rem] border border-white/10 shadow-2xl scale-110 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                                {(['QUALITY', 'SAFETY', 'PROGRESS'] as AnalysisMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setVisionMode(m); setObservations([]); }}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            visionMode === m 
                                            ? 'bg-primary text-white shadow-xl' 
                                            : 'text-zinc-500 hover:text-white'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <button onClick={stopCamera} className="p-5 bg-red-600 text-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(239,68,68,0.4)] hover:bg-red-700 transition-all active:scale-90 flex items-center justify-center"><StopCircle size={32} /></button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ImagineView;
