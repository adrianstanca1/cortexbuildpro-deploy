import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, X, Zap, Loader2, Play, Activity, Radio, ScanLine, Volume2 } from 'lucide-react';
import { getLiveClient } from '../services/geminiService';
import { base64ToUint8Array, uint8ArrayToBase64, decodeAudioData, createPcmBlob } from '../utils/audio';
import { LiveServerMessage, Modality } from '@google/genai';
import { Page } from '../types';

interface LiveViewProps {
  setPage: (page: Page) => void;
}

const LiveView: React.FC<LiveViewProps> = ({ setPage }) => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentModelText, setCurrentModelText] = useState("");

  // Refs for low-latency processing
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const startSession = async () => {
    try {
      setSessionStarted(true);
      setIsConnecting(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const liveClient = getLiveClient();
      
      /* Updated to use the correct model name for real-time conversation per GenAI guidelines */
      const sessionPromise = liveClient.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are an expert site engineer. Use the user's camera feed and audio to provide real-time guidance, identify tools, or check for safety hazards. Be brief and highly professional.",
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);

            const source = inputCtx.createMediaStreamSource(audioStream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              setVolume(Math.min(100, (sum / inputData.length) * 500)); 

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              const audioBytes = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              const currentTime = outputCtx.currentTime;
              const startTime = Math.max(nextStartTimeRef.current, currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => cleanup(),
          onerror: (e) => { console.error("Live Error", e); cleanup(); }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Live start error", err);
      setIsConnecting(false);
      setSessionStarted(false);
      cleanup();
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraOn(true);
        // Stream image frames (2 per second for context)
        frameIntervalRef.current = window.setInterval(sendFrame, 500);
      } catch (e) {
        alert("Camera access required for vision agent.");
      }
    }
  };

  const sendFrame = () => {
      if (!canvasRef.current || !videoRef.current || !sessionPromiseRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
      sessionPromiseRef.current.then((session) => {
          session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } });
      });
  };

  const cleanup = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    inputContextRef.current?.close();
    audioContextRef.current?.close();
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    setIsActive(false);
    setIsConnecting(false);
  };

  useEffect(() => () => cleanup(), []);

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
          {isCameraOn ? (
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-[#0c4a6e] to-black flex items-center justify-center">
                  <div className="w-96 h-96 bg-[#0f5c82] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
              </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col p-8 pointer-events-none">
          <div className="flex justify-between items-start w-full">
              <div className="flex flex-col gap-3 pointer-events-auto">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-md border ${isActive ? 'bg-green-900/40 border-green-500/30 text-green-400' : 'bg-zinc-900/60 border-zinc-700 text-zinc-500'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                      <span className="text-[10px] font-black tracking-widest uppercase">{isConnecting ? "LINKING..." : isActive ? "LIVE VOICE" : "VOICE STANDBY"}</span>
                      {isActive && (
                          <div className="flex gap-0.5 items-center h-2.5 ml-1">
                              {[...Array(5)].map((_, i) => (
                                  <div 
                                      key={i} 
                                      className={`w-0.5 rounded-full transition-all duration-75 ${volume > (i * 20) ? 'bg-green-400' : 'bg-green-900/40'}`} 
                                      style={{ height: `${30 + (volume > (i * 20) ? (volume - i*20) : 0) / 1.5}%` }}
                                  />
                              ))}
                          </div>
                      )}
                  </div>
                  {isCameraOn && (
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-md border bg-blue-900/40 border-blue-500/30 text-blue-400 animate-in slide-in-from-left">
                          <ScanLine size={14} className="animate-pulse" />
                          <span className="text-[10px] font-black tracking-widest uppercase">Visual Stream Active</span>
                      </div>
                  )}
              </div>
              <button onClick={() => { cleanup(); setPage(Page.DASHBOARD); }} className="pointer-events-auto w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center backdrop-blur-md hover:bg-red-600 hover:text-white transition-all">
                  <X size={24} />
              </button>
          </div>

          {!sessionStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
                  <div className="bg-zinc-900/90 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl text-center max-w-sm">
                      <div className="w-24 h-24 bg-[#0f5c82] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(15,92,130,0.5)]">
                          <Radio size={48} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Field Intelligence</h2>
                      <p className="text-zinc-500 text-sm mb-10 leading-relaxed font-medium">Connect to BuildPro's multimodal live agent for eyes-on site support.</p>
                      <button onClick={startSession} className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                          <Play size={20} fill="currentColor" /> Initialize Link
                      </button>
                  </div>
              </div>
          ) : (
              <>
                {!isCameraOn && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative">
                            <div className="w-72 h-72 rounded-full border border-white/10 flex items-center justify-center relative">
                                {isConnecting ? (
                                    <Loader2 size={48} className="animate-spin text-[#0f5c82]" />
                                ) : (
                                    <div className="w-40 h-40 bg-[#0f5c82] rounded-full transition-all duration-75 shadow-[0_0_80px_rgba(15,92,130,0.6)]" style={{ transform: `scale(${1 + (volume / 180)})` }} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-auto flex justify-center pb-12 pointer-events-auto">
                    <div className="flex items-center gap-5 bg-black/40 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/10 shadow-2xl ring-1 ring-white/5">
                        <button onClick={() => setIsActive(!isActive)} className={`p-4 rounded-full transition-all relative overflow-hidden ${!isActive ? 'bg-red-50 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            {isActive && (
                                <div 
                                    className="absolute inset-0 bg-white/20 transition-all duration-75" 
                                    style={{ transform: `scale(${1 + (volume / 100)})`, opacity: volume / 200 }} 
                                />
                            )}
                            {isActive ? <Mic size={28} className="relative z-10" /> : <MicOff size={28} className="relative z-10" />}
                        </button>
                        <button onClick={toggleCamera} className={`p-4 rounded-full transition-all ${isCameraOn ? 'bg-[#0f5c82] text-white shadow-[0_0_20px_rgba(15,92,130,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            {isCameraOn ? <Video size={28} /> : <VideoOff size={28} />}
                        </button>
                        <div className="w-px h-10 bg-white/10 mx-2" />
                        <button onClick={() => { cleanup(); setPage(Page.DASHBOARD); }} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/40">
                            <PhoneOff size={28} />
                        </button>
                    </div>
                </div>
              </>
          )}
      </div>
    </div>
  );
};

export default LiveView;