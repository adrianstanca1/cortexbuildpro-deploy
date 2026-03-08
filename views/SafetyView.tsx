
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, Eye, Shield, Flame, Wind, 
  CheckCircle2, AlertOctagon, Thermometer, 
  MoreVertical, FileText, Siren, Upload, Camera, 
  ScanLine, X, ArrowRight, Loader2, Plus, BookOpen, FileBarChart,
  Video, StopCircle, Focus
} from 'lucide-react';
import { runRawPrompt, parseAIJSON } from '../services/geminiService';
import { SafetyIncident, SafetyHazard } from '../types';
import { useProjects } from '../contexts/ProjectContext';

interface SafetyViewProps {
  projectId?: string;
}

const SafetyView: React.FC<SafetyViewProps> = ({ projectId }) => {
  const { safetyIncidents, addSafetyIncident, updateSafetyIncident } = useProjects();
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SCANNER'>('DASHBOARD');
  
  // Scanner State
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedHazards, setDetectedHazards] = useState<SafetyHazard[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisInterval = useRef<number | null>(null);

  const filteredIncidents = useMemo(() => {
      if (!projectId) return safetyIncidents;
      return safetyIncidents.filter(i => i.projectId === projectId);
  }, [safetyIncidents, projectId]);

  // Cleanup on unmount
  useEffect(() => {
      return () => stopCamera();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera(); // Ensure camera is off if uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result as string);
        setDetectedHazards([]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Live Camera Logic ---

  const startCamera = async () => {
      try {
          setScanImage(null); // Clear static image
          setIsCameraActive(true);
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              // Start analysis loop once video plays
              videoRef.current.onloadedmetadata = () => {
                  videoRef.current?.play();
                  startLiveAnalysisLoop();
              };
          }
      } catch (e) {
          console.error("Camera access failed", e);
          alert("Could not access camera. Please check permissions.");
          setIsCameraActive(false);
      }
  };

  const stopCamera = () => {
      if (analysisInterval.current) clearInterval(analysisInterval.current);
      analysisInterval.current = null;
      
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsAnalyzing(false);
  };

  const startLiveAnalysisLoop = () => {
      // Run initial immediately
      analyzeLiveFrame();
      // Then interval
      analysisInterval.current = window.setInterval(analyzeLiveFrame, 3000); // Every 3 seconds
  };

  const analyzeLiveFrame = async () => {
      if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Capture frame
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1];

      setIsAnalyzing(true);
      try {
          const prompt = `
            Analyze this construction site video frame for safety hazards.
            Return a JSON array of objects. Each object must have:
            - "type": Short title (e.g. "No Helmet").
            - "severity": "High", "Medium", or "Low".
            - "riskScore": Number 1-10.
            - "description": Brief explanation.
            - "recommendation": Short fix.
            - "regulation": Relevant code (e.g. OSHA).
            - "box_2d": [ymin, xmin, ymax, xmax] coordinates for the bounding box on a 0-1000 scale.
            
            Only return hazards if you are confident. Limit to 5 items.
          `;

          const result = await runRawPrompt(prompt, {
              model: 'gemini-2.5-flash', // Flash for speed in live mode
              temperature: 0.3,
              responseMimeType: 'application/json'
          }, base64Data);

          const hazards = parseAIJSON(result);
          if (Array.isArray(hazards)) {
              setDetectedHazards(hazards);
          }
      } catch (e) {
          console.error("Live analysis error", e);
      } finally {
          setIsAnalyzing(false);
      }
  };

  // --- Static Image Logic ---

  const runStaticScan = async () => {
    if (!scanImage || isAnalyzing) return;
    setIsAnalyzing(true);
    setDetectedHazards([]);

    try {
      const base64 = scanImage.split(',')[1];
      const prompt = `
        Analyze this construction site image for potential safety hazards, risks, and OSHA violations.
        Act as a Senior Safety Officer.
        
        Return a JSON array of objects. Each object must have:
        - "type": Short title of the hazard.
        - "severity": "High", "Medium", or "Low".
        - "riskScore": A number from 1 (Low Risk) to 10 (Critical/Life Threatening).
        - "description": Brief explanation of why this is a hazard.
        - "recommendation": Immediate corrective action required.
        - "regulation": Cite the relevant OSHA or safety code (e.g., "OSHA 1926.501").
        - "box_2d": [ymin, xmin, ymax, xmax] coordinates for the bounding box on a 0-1000 scale.
      `;

      const result = await runRawPrompt(prompt, {
        model: 'gemini-3-pro-preview', // Using Pro for high-quality static analysis
        temperature: 0.2,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 2048 }
      }, base64);

      const hazards = parseAIJSON(result);
      setDetectedHazards(Array.isArray(hazards) ? hazards : []);
    } catch (e) {
      console.error("Scan failed", e);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const logHazard = async (hazard: SafetyHazard) => {
    const newIncident: SafetyIncident = {
      id: `si-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: hazard.type,
      project: projectId ? 'Current Project' : 'Site Assessment',
      projectId: projectId,
      severity: hazard.severity,
      status: 'Open',
      date: new Date().toLocaleDateString(),
      type: 'AI Detected'
    };
    await addSafetyIncident(newIncident);
    alert("Incident Logged.");
  };

  const handleResolveIncident = async (id: string) => {
      await updateSafetyIncident(id, { status: 'Resolved' });
  };

  const getRiskColor = (score: number | undefined) => {
      if (!score) return 'bg-blue-500 text-white';
      if (score >= 8) return 'bg-red-600 text-white';
      if (score >= 5) return 'bg-orange-500 text-white';
      return 'bg-blue-500 text-white';
  };

  const getSeverityBorder = (severity: string) => {
      switch(severity) {
          case 'High': return 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
          case 'Medium': return 'border-orange-500 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
          default: return 'border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      
      <div className="flex justify-between items-end flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1 flex items-center gap-3">
               Safety Command Center {viewMode === 'SCANNER' && <span className="text-lg text-zinc-400 font-normal">/ Risk Assessment</span>}
            </h1>
            <p className="text-zinc-500">Real-time risk monitoring and compliance tracking{projectId ? ' for this project' : ''}.</p>
          </div>
          <div className="flex gap-3">
              {viewMode === 'SCANNER' ? (
                  <button onClick={() => { setViewMode('DASHBOARD'); stopCamera(); }} className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors">
                      Close Assessment
                  </button>
              ) : (
                  <button 
                    onClick={() => setViewMode('SCANNER')}
                    className="bg-[#0f5c82] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0c4a6e] transition-all flex items-center gap-2"
                  >
                      <ScanLine size={20} /> AI Risk Assessment
                  </button>
              )}
              {viewMode === 'DASHBOARD' && (
                  <button className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2">
                      <Siren size={20} /> Report Incident
                  </button>
              )}
          </div>
      </div>

      {viewMode === 'SCANNER' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              {/* Image/Video Area */}
              <div className="bg-black rounded-2xl relative overflow-hidden flex items-center justify-center group border border-zinc-800 shadow-2xl min-h-[400px]">
                  
                  {/* Render Content */}
                  {isCameraActive ? (
                      <div className="relative w-full h-full">
                          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Live Bounding Boxes */}
                          {detectedHazards.map((h, i) => {
                              if (!h.box_2d) return null;
                              const [ymin, xmin, ymax, xmax] = h.box_2d;
                              return (
                                  <div 
                                    key={i}
                                    className={`absolute border-2 z-20 group/box transition-all duration-300 hover:z-50 hover:bg-white/5 ease-out ${getSeverityBorder(h.severity)}`}
                                    style={{
                                        top: `${ymin / 10}%`,
                                        left: `${xmin / 10}%`,
                                        height: `${(ymax - ymin) / 10}%`,
                                        width: `${(xmax - xmin) / 10}%`
                                    }}
                                  >
                                      <div className="absolute -top-6 left-0 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm flex items-center gap-1 shadow-lg">
                                          <AlertTriangle size={10} className={h.severity === 'High' ? 'text-red-400' : 'text-yellow-400'} />
                                          {h.type}
                                      </div>

                                      {/* Detailed Hover Card */}
                                      <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white shadow-2xl opacity-0 group-hover/box:opacity-100 transition-all duration-200 pointer-events-none scale-95 group-hover/box:scale-100 origin-top-left z-50">
                                          <div className="flex justify-between items-start mb-2">
                                              <span className="font-bold text-sm text-white">{h.type}</span>
                                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${h.severity === 'High' ? 'bg-red-500 text-white' : h.severity === 'Medium' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                  {h.severity}
                                              </span>
                                          </div>
                                          <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{h.description}</p>
                                          <div className="bg-white/10 rounded-lg p-2 border border-white/5">
                                              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1 flex items-center gap-1"><CheckCircle2 size={10} /> Recommendation</span>
                                              <p className="text-xs font-medium text-green-400 leading-snug">{h.recommendation}</p>
                                          </div>
                                          {h.regulation && <div className="mt-2 text-[10px] text-zinc-500 font-mono">Ref: {h.regulation}</div>}
                                      </div>
                                  </div>
                              );
                          })}

                          {/* HUD Overlay */}
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white flex items-center gap-2 z-30">
                              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></div>
                              {isAnalyzing ? 'SCANNING...' : 'LIVE FEED ACTIVE'}
                          </div>

                          <button onClick={stopCamera} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg z-30">
                              <StopCircle size={18} /> Stop Camera
                          </button>
                      </div>
                  ) : scanImage ? (
                      <>
                          <div className="relative w-full h-full">
                              <img src={scanImage} alt="Scan Target" className="w-full h-full object-contain" />
                              {/* Static Bounding Boxes */}
                              {detectedHazards.map((h, i) => {
                                  if (!h.box_2d) return null;
                                  const [ymin, xmin, ymax, xmax] = h.box_2d;
                                  return (
                                      <div 
                                        key={i}
                                        className={`absolute border-2 z-20 group/box transition-all duration-300 hover:z-50 hover:bg-white/5 ${getSeverityBorder(h.severity)}`}
                                        style={{
                                            top: `${ymin / 10}%`,
                                            left: `${xmin / 10}%`,
                                            height: `${(ymax - ymin) / 10}%`,
                                            width: `${(xmax - xmin) / 10}%`
                                        }}
                                      >
                                          <div className="absolute -top-6 left-0 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm flex items-center gap-1 shadow-lg">
                                              <AlertTriangle size={10} className={h.severity === 'High' ? 'text-red-400' : 'text-yellow-400'} />
                                              {h.type}
                                          </div>

                                          {/* Detailed Hover Card */}
                                          <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white shadow-2xl opacity-0 group-hover/box:opacity-100 transition-all duration-200 pointer-events-none scale-95 group-hover/box:scale-100 origin-top-left z-50">
                                              <div className="flex justify-between items-start mb-2">
                                                  <span className="font-bold text-sm text-white">{h.type}</span>
                                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${h.severity === 'High' ? 'bg-red-500 text-white' : h.severity === 'Medium' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                      {h.severity}
                                                  </span>
                                              </div>
                                              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{h.description}</p>
                                              <div className="bg-white/10 rounded-lg p-2 border border-white/5">
                                                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1 flex items-center gap-1"><CheckCircle2 size={10} /> Recommendation</span>
                                                  <p className="text-xs font-medium text-green-400 leading-snug">{h.recommendation}</p>
                                              </div>
                                              {h.regulation && <div className="mt-2 text-[10px] text-zinc-500 font-mono">Ref: {h.regulation}</div>}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          {isAnalyzing && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                                  <div className="relative">
                                      <div className="w-24 h-24 border-4 border-white/20 border-t-[#0f5c82] rounded-full animate-spin"></div>
                                      <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
                                  </div>
                                  <p className="text-white mt-6 font-bold text-lg animate-pulse">Gemini 3 Pro Risk Analysis...</p>
                              </div>
                          )}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-30">
                              <button onClick={() => { setScanImage(null); setDetectedHazards([]); }} className="bg-black/50 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/10 font-medium">
                                  Change Image
                              </button>
                              {!isAnalyzing && detectedHazards.length === 0 && (
                                  <button onClick={runStaticScan} className="bg-[#0f5c82] text-white px-6 py-2 rounded-lg hover:bg-[#0c4a6e] shadow-lg font-bold flex items-center gap-2 border border-blue-400/30">
                                      <ScanLine size={18} /> Run Assessment
                                  </button>
                              )}
                          </div>
                      </>
                  ) : (
                      <div className="text-center p-12">
                          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-inner">
                              <Focus size={40} className="text-zinc-600" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Start Safety Scan</h3>
                          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Connect a live camera feed or upload a photo to detect hazards using Gemini Vision.</p>
                          
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                              <button onClick={startCamera} className="bg-[#0f5c82] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0c4a6e] transition-all shadow-lg flex items-center gap-2 justify-center">
                                  <Video size={20} /> Live Camera
                              </button>
                              <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 justify-center border border-zinc-700">
                                  <Upload size={20} /> Upload Photo
                              </button>
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </div>
                  )}
              </div>

              {/* Results Area */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col shadow-sm h-full overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                          <Shield size={20} className="text-[#0f5c82]" /> Assessment Results
                      </h2>
                      {detectedHazards.length > 0 && (
                          <button className="text-xs font-bold text-[#0f5c82] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                              <FileBarChart size={14} /> Generate Report
                          </button>
                      )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {detectedHazards.length > 0 ? (
                          detectedHazards.map((hazard, i) => (
                              <div key={i} className="border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-all group bg-white hover:border-blue-300">
                                  <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm ${getRiskColor(hazard.riskScore)}`}>
                                              {hazard.riskScore}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-zinc-900 leading-tight">{hazard.type}</h4>
                                              <div className="flex items-center gap-2 mt-1">
                                                  <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                                                      <BookOpen size={10} /> {hazard.regulation || 'Safety Code'}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                          hazard.severity === 'High' ? 'bg-red-100 text-red-700' : 
                                          hazard.severity === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {hazard.severity}
                                      </span>
                                  </div>
                                  
                                  <p className="text-sm text-zinc-600 mb-3 leading-relaxed">{hazard.description}</p>
                                  
                                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
                                      <div className="text-xs font-bold text-green-800 uppercase mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Corrective Action</div>
                                      <p className="text-xs text-green-700 font-medium">{hazard.recommendation}</p>
                                  </div>
                                  
                                  <button 
                                    onClick={() => logHazard(hazard)}
                                    className="w-full py-2 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-800 hover:text-white hover:border-zinc-800 transition-colors flex items-center justify-center gap-2"
                                  >
                                      <Plus size={14} /> Log as Incident
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                              {isAnalyzing ? (
                                  <div className="space-y-3">
                                      <Loader2 size={32} className="animate-spin text-[#0f5c82] mx-auto" />
                                      <p className="font-medium text-zinc-500">Analyzing site conditions...</p>
                                      <p className="text-xs">Detecting hazards & bounds</p>
                                  </div>
                              ) : (
                                  <>
                                      <ScanLine size={48} className="opacity-20 mb-4" />
                                      <p>No hazards detected yet.<br/>Start camera or upload image.</p>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
          <>
            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Shield size={24} /></div>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+2.4%</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-zinc-900">98.2%</div>
                        <div className="text-sm text-zinc-500 font-medium">Safety Compliance Score</div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-zinc-50 text-zinc-600 rounded-xl"><FileText size={24} /></div>
                        <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{filteredIncidents.filter(i => i.status === 'Open').length} Open</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-zinc-900">1,240</div>
                        <div className="text-sm text-zinc-500 font-medium">Days Injury Free</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={24} /></div>
                        <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Action Req</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-zinc-900">{filteredIncidents.filter(i => i.status !== 'Resolved').length}</div>
                        <div className="text-sm text-zinc-500 font-medium">Active Hazards</div>
                    </div>
                </div>

                {/* AI Prediction Card */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between h-40 text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-3 bg-white/10 rounded-xl"><AlertOctagon size={24} className="text-red-400" /></div>
                        <span className="text-xs font-bold bg-red-500/20 border border-red-500/50 text-red-300 px-2 py-1 rounded-full">AI Forecast</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-2xl font-bold text-white mb-1">High Risk</div>
                        <div className="text-xs text-zinc-400 leading-tight">
                            Predicted for <span className="text-white font-bold">East Wing</span> due to high winds & crane ops today.
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Incident Log */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                        <h3 className="font-bold text-zinc-800 text-lg">Recent Incidents & Observations</h3>
                        <button className="text-sm text-[#0f5c82] font-medium hover:underline">View All Log</button>
                    </div>
                    <div className="flex-1 overflow-y-auto h-[400px] custom-scrollbar">
                        {filteredIncidents.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3">Incident</th>
                                        <th className="px-6 py-3">Project</th>
                                        <th className="px-6 py-3">Severity</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredIncidents.map((inc, i) => (
                                        <tr key={inc.id || i} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-zinc-900">{inc.title}</div>
                                                <div className="text-xs text-zinc-500">{inc.date} • {inc.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600">{inc.project}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                    inc.severity === 'High' ? 'bg-red-100 text-red-700' : 
                                                    inc.severity === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {inc.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${inc.status === 'Open' ? 'bg-red-500' : inc.status === 'Investigating' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                                    <span className="text-zinc-700 font-medium">{inc.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {inc.status !== 'Resolved' ? (
                                                    <button 
                                                        onClick={() => inc.id && handleResolveIncident(inc.id)}
                                                        className="text-xs font-bold text-green-600 hover:underline"
                                                    >
                                                        Resolve
                                                    </button>
                                                ) : (
                                                    <button className="text-zinc-400 hover:text-[#0f5c82]"><Eye size={18} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-zinc-400">
                                No incidents reported for this scope.
                            </div>
                        )}
                    </div>
                </div>

                {/* Risk Heatmap & Conditions */}
                <div className="flex flex-col gap-6">
                    {/* Site Conditions */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-800 mb-4">Live Site Conditions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <Thermometer size={20} className="mx-auto text-blue-500 mb-2" />
                                <div className="text-2xl font-bold text-zinc-900">72°F</div>
                                <div className="text-xs text-zinc-500">Temperature</div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                <Wind size={20} className="mx-auto text-orange-500 mb-2" />
                                <div className="text-2xl font-bold text-zinc-900">18mph</div>
                                <div className="text-xs text-zinc-500">Wind Speed</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center col-span-2">
                                <Flame size={20} className="mx-auto text-red-500 mb-2" />
                                <div className="text-lg font-bold text-zinc-900">Moderate</div>
                                <div className="text-xs text-zinc-500">Fire Danger Level</div>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Widget */}
                    <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-700 p-4 shadow-lg relative overflow-hidden min-h-[250px] flex flex-col">
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                                <AlertOctagon size={16} className="text-orange-500" /> Risk Heatmap
                            </h3>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">Live Feed</span>
                        </div>
                        
                        <div className="flex-1 relative rounded-xl overflow-hidden border border-zinc-800">
                            {/* Simplified Map Background */}
                            <div className="absolute inset-0 bg-[#1e293b]" />
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                            
                            {/* Heat Blobs */}
                            <div className="absolute top-[30%] left-[40%] w-24 h-24 bg-red-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                            <div className="absolute top-[60%] left-[70%] w-16 h-16 bg-orange-500 rounded-full blur-xl opacity-30"></div>
                            
                            {/* Markers */}
                            <div className="absolute top-[30%] left-[40%] w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100">Crane Ops</div>
                            </div>

                            <div className="absolute bottom-2 left-2 right-2 bg-zinc-900/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-700/50">
                                <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold mb-1">
                                    <span>Low Risk</span>
                                    <span>High Risk</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default SafetyView;
