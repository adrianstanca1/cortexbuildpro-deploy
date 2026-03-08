
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Eye, AlertTriangle, CheckCircle2, Shield, 
  AlertOctagon, Play, Pause, Zap, ScanLine, 
  Target, Activity, MessageSquare, Send, StopCircle, 
  Upload, Image as ImageIcon, Maximize2, X, CheckSquare, ArrowRight
} from 'lucide-react';
import { runRawPrompt } from '../services/geminiService';

type AnalysisMode = 'SAFETY' | 'QUALITY' | 'PROGRESS';

interface Observation {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'PASS';
  title: string;
  description: string;
  recommendation: string;
  coordinates?: { x: number, y: number, w: number, h: number }; // For bounding boxes
}

const IntelligenceHubView: React.FC = () => {
  // State
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('SAFETY');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Interactive Agent State
  const [agentQuery, setAgentQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staticImage, setStaticImage] = useState<string | null>(null);

  // --- Camera Handling ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraError(null);
        setIsActive(true);
      }
    } catch (e) {
      console.error("Camera error:", e);
      setCameraError("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    stopAnalysisLoop();
  };

  const captureFrame = (): string | null => {
    if (staticImage) return staticImage.split(',')[1]; // Use uploaded image if available
    
    if (!videoRef.current || !canvasRef.current) return null;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return null;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  // --- AI Analysis Logic ---
  const analyzeFrame = async () => {
    if (isProcessing) return;
    
    const base64Image = captureFrame();
    if (!base64Image) return;

    setIsProcessing(true);

    try {
      let prompt = "";
      if (mode === 'SAFETY') {
        prompt = `Analyze this construction site image for SAFETY hazards (PPE, fall risks, electrical, debris). 
                  Return a JSON array of issues found. Each object: { "severity": "CRITICAL"|"WARNING"|"PASS", "title": "Short Title", "description": "Brief description", "recommendation": "Actionable step" }. 
                  If safe, return one PASS object.`;
      } else if (mode === 'QUALITY') {
        prompt = `Analyze this construction image for QUALITY defects (cracks, alignment, finish, materials). 
                  Return a JSON array. Each object: { "severity": "CRITICAL"|"WARNING"|"INFO", "title": "Defect Name", "description": "Details", "recommendation": "Fix" }.`;
      } else {
        prompt = `Analyze this construction image for PROGRESS tracking. Identify completed works vs incomplete. 
                  Return a JSON array. Each object: { "severity": "INFO", "title": "Work Item", "description": "Status description", "recommendation": "Next step" }.`;
      }

      const result = await runRawPrompt(prompt, {
        model: 'gemini-2.5-flash', // Use Flash for speed
        temperature: 0.4,
        responseMimeType: 'application/json'
      }, base64Image);

      const data = JSON.parse(result);
      
      // Add timestamps and IDs
      const newObs = (Array.isArray(data) ? data : [data]).map((obs: any) => ({
        ...obs,
        id: Date.now().toString() + Math.random().toString(),
        timestamp: new Date().toLocaleTimeString()
      }));

      setObservations(prev => [...newObs, ...prev].slice(0, 20)); // Keep last 20

    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const startAnalysisLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Initial analysis
    analyzeFrame();
    // Loop every 5 seconds to avoid rate limits but feel "live"
    intervalRef.current = window.setInterval(analyzeFrame, 5000);
  };

  const stopAnalysisLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsProcessing(false);
  };

  // --- Effect Hooks ---
  useEffect(() => {
    if (isActive && !staticImage) {
      startAnalysisLoop();
    } else {
      stopAnalysisLoop();
    }
    return () => stopAnalysisLoop();
  }, [isActive, mode, staticImage]);

  // --- Interaction Agent ---
  const handleAgentQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentQuery.trim()) return;

    const base64Image = captureFrame();
    if (!base64Image) {
        setAgentResponse("Please start the camera or upload an image first.");
        return;
    }

    setIsAgentThinking(true);
    setAgentResponse('');

    try {
        const prompt = `You are an expert construction site assistant. User asks: "${agentQuery}". 
                        Answer concisely based on the visual evidence in the image. 
                        If you see a safety issue, prioritize that in your answer.`;
        
        const response = await runRawPrompt(prompt, {
            model: 'gemini-3-pro-preview', // Use Pro for better reasoning on Q&A
            temperature: 0.5
        }, base64Image);

        setAgentResponse(response);
    } catch (e) {
        setAgentResponse("Sorry, I couldn't process that request.");
    } finally {
        setIsAgentThinking(false);
        setAgentQuery('');
    }
  };

  // --- File Upload ---
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setStaticImage(reader.result as string);
              setIsActive(true); // Activate "live" mode but with static image
              stopCamera(); // Ensure webcam is off
          };
          reader.readAsDataURL(file);
      }
  };

  const clearStaticImage = () => {
      setStaticImage(null);
      setIsActive(false);
      setObservations([]);
  };

  return (
    <div className="flex h-full bg-zinc-950 text-white overflow-hidden font-sans">
      
      {/* LEFT: Visual Feed */}
      <div className="flex-1 flex flex-col relative border-r border-zinc-800">
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <ScanLine className="text-[#0f5c82]" /> Intelligence Hub
                </h1>
                <p className="text-zinc-400 text-sm">Real-time Adaptive Vision Agent</p>
            </div>
            <div className="flex gap-2 pointer-events-auto">
                <div className="bg-black/50 backdrop-blur-md border border-zinc-700 rounded-lg p-1 flex">
                    {(['SAFETY', 'QUALITY', 'PROGRESS'] as AnalysisMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setObservations([]); }}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                mode === m 
                                ? 'bg-[#0f5c82] text-white shadow-lg' 
                                : 'text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden group">
            {/* Video / Image */}
            {staticImage ? (
                <img src={staticImage} alt="Analysis Target" className="w-full h-full object-contain opacity-80" />
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover opacity-90" 
                />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning UI Overlay */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-2 border-white/20 rounded-3xl">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0f5c82]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0f5c82]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0f5c82]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0f5c82]" />
                    </div>
                    
                    {/* Scanning Line */}
                    {isProcessing && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#0f5c82]/50 shadow-[0_0_20px_#0f5c82] animate-[scan_2s_linear_infinite]" />
                    )}

                    {/* Status Badge */}
                    <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-md border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-xs font-mono tracking-wider uppercase text-zinc-300">
                            {isProcessing ? 'ANALYZING...' : 'MONITORING'}
                        </span>
                    </div>
                </div>
            )}

            {/* Placeholder / Start UI */}
            {!isActive && !staticImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-900/80 backdrop-blur-sm">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-6 shadow-2xl border border-zinc-700">
                        <Eye size={48} className="text-zinc-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Visual Intelligence Inactive</h2>
                    <p className="text-zinc-400 mb-8 text-sm">Connect camera or upload media to begin analysis.</p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={startCamera}
                            className="bg-[#0f5c82] hover:bg-[#0c4a6e] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
                        >
                            <Play size={20} /> Start Live Feed
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-700"
                        >
                            <Upload size={20} /> Upload Media
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    {cameraError && <p className="mt-4 text-red-400 text-sm">{cameraError}</p>}
                </div>
            )}

            {/* Close Static Image */}
            {staticImage && (
                <button 
                    onClick={clearStaticImage} 
                    className="absolute top-24 right-8 bg-black/50 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors z-30"
                >
                    <X size={20} />
                </button>
            )}
        </div>

        {/* Bottom Agent Bar */}
        <div className="h-20 bg-zinc-900 border-t border-zinc-800 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                <Target size={20} className="text-white" />
            </div>
            <form onSubmit={handleAgentQuery} className="flex-1 relative">
                <input 
                    type="text" 
                    value={agentQuery}
                    onChange={(e) => setAgentQuery(e.target.value)}
                    placeholder={isActive ? "Ask the agent about what it sees..." : "Start vision to interact..."}
                    disabled={!isActive}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none text-white placeholder-zinc-500 transition-all"
                />
                <button 
                    type="submit" 
                    disabled={!agentQuery.trim() || isAgentThinking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                    {isAgentThinking ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </form>
            {isActive && (
                <button onClick={stopCamera} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
                    <StopCircle size={20} />
                </button>
            )}
        </div>
      </div>

      {/* RIGHT: Analysis Feed */}
      <div className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  <Activity size={18} className="text-[#0f5c82]" /> Live Observations
              </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Agent Response Bubble */}
              {agentResponse && (
                  <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 p-4 rounded-2xl rounded-tl-none mb-6 animate-in fade-in slide-in-from-left-4">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-300 uppercase tracking-wide">
                          <MessageSquare size={12} /> Agent Insight
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{agentResponse}</p>
                  </div>
              )}

              {observations.length === 0 && !agentResponse && (
                  <div className="text-center text-zinc-500 mt-20 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                          <Zap size={24} className="opacity-20" />
                      </div>
                      <p className="text-sm">Waiting for visual data...</p>
                  </div>
              )}

              {observations.map((obs) => (
                  <div 
                    key={obs.id} 
                    className={`p-4 rounded-xl border relative group animate-in slide-in-from-right-4 fade-in duration-500 ${
                        obs.severity === 'CRITICAL' ? 'bg-red-950/30 border-red-500/50' :
                        obs.severity === 'WARNING' ? 'bg-orange-950/30 border-orange-500/50' :
                        obs.severity === 'PASS' ? 'bg-green-950/30 border-green-500/50' :
                        'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              obs.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                              obs.severity === 'WARNING' ? 'bg-orange-500 text-white' :
                              obs.severity === 'PASS' ? 'bg-green-500 text-white' :
                              'bg-blue-500 text-white'
                          }`}>
                              {obs.severity}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">{obs.timestamp}</span>
                      </div>
                      
                      <h4 className="font-bold text-zinc-200 text-sm mb-1">{obs.title}</h4>
                      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{obs.description}</p>
                      
                      {obs.recommendation && (
                          <div className="flex items-start gap-2 text-xs text-zinc-300 bg-black/20 p-2 rounded-lg">
                              <CheckSquare size={14} className="mt-0.5 text-[#0f5c82]" />
                              <span>{obs.recommendation}</span>
                          </div>
                      )}

                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                              <ArrowRight size={14} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default IntelligenceHubView;
