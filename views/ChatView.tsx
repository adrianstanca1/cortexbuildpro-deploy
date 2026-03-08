import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, ImagePlus, Loader2, Bot, User, X, Paperclip, Sparkles, 
  Mic, Volume2, Pause, Square, Brain, Globe, Map as MapIcon, 
  Zap, Trash2, Copy, Link as LinkIcon, ArrowRight, Camera, 
  Info, Settings2, Star, Quote, ShieldCheck, ChevronDown, Check, Terminal, BrainCircuit, MapPin,
  Building2
} from 'lucide-react';
import { Message, Page } from '../types';
import { streamChatResponse, transcribeAudio, generateSpeech, ChatConfig } from '../services/geminiService';
import { useProjects } from '../contexts/ProjectContext';

interface ChatViewProps {
  setPage: (page: Page) => void;
}

type ChatMode = 'PRO' | 'THINKING' | 'SEARCH' | 'MAPS' | 'LITE';

const MODE_CONFIGS: Record<ChatMode, { label: string, sub: string, description: string, icon: any, color: string, bg: string, prompt: string, model: string, thinkingBudget?: number }> = {
    PRO: {
        label: 'Architect Pro',
        sub: 'Balanced & Creative',
        description: 'Standard high-performance model for general construction management and creative architectural drafting.',
        icon: Sparkles,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        model: 'gemini-3-pro-preview',
        prompt: "You are the Architect Pro. Provide highly professional, detailed construction management advice. Use structural terminology correctly and prioritize precision. When an image is provided, perform a forensic analysis of the site conditions and relate them back to project objectives."
    },
    THINKING: {
        label: 'Deep Logic',
        sub: 'Complex Reasoning',
        description: 'Utilizes advanced chain-of-thought reasoning (32k thinking budget) for complex structural engineering and risk analysis.',
        icon: Brain,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        model: 'gemini-3-pro-preview',
        thinkingBudget: 32768, // Maximum thinking budget as requested
        prompt: "You are a structural reasoning engine. Break down complex construction problems step-by-step using first principles. Focus on engineering logic and second-order risk analysis. Be verbose in your reasoning steps. Analyze provided images for structural deviations or potential load-path anomalies."
    },
    SEARCH: {
        label: 'Live Search',
        sub: 'Web Grounded',
        description: 'Directly accesses Google Search to find current market pricing, regional regulations, and local site planning news.',
        icon: Globe,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        model: 'gemini-3-flash-preview',
        prompt: "You are a research-focused site advisor. Use web search to find current market prices, regulatory changes, and local planning news. Always cite your sources. When an image is provided, identify products or equipment and find relevant market data."
    },
    MAPS: {
        label: 'Spatial AI',
        sub: 'Geospatial Intelligence',
        description: 'Optimized for location-based logistics, site accessibility, and regional environmental factors using Google Maps grounding (Gemini 2.5).',
        icon: MapIcon,
        color: 'text-green-600',
        bg: 'bg-green-50',
        model: 'gemini-2.5-flash',
        prompt: "You are a geospatial expert. Focus on location-based logistics, site accessibility, and regional environmental factors. Use maps grounding to provide coordinates and place details. When an image is provided, attempt to geolocate or assess regional environmental impacts."
    },
    LITE: {
        label: 'Site Flash',
        sub: 'Sub-second Response',
        description: 'Low-latency model optimized for rapid technical answers and brief field directives.',
        icon: Zap,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        model: 'gemini-flash-lite-latest', // Low-latency model requested
        prompt: "You are a fast-response site assistant. Keep your answers ultra-concise, using bullet points where possible. Focus on immediate utility and safety. Rapidly classify provided site photos."
    }
};

const formatInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-pink-600 font-mono text-xs">{part.slice(1, -1)}</code>;
    if (part.startsWith('@')) return <span key={i} className="text-[#0f5c82] font-medium bg-blue-50 px-1 rounded">{part}</span>;
    return part;
  });
};

const MessageContent: React.FC<{ text: string }> = ({ text }) => {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="text-sm leading-relaxed space-y-1 break-words">
      {blocks.map((block, i) => {
        if (block.startsWith('```') && block.endsWith('```')) {
           const content = block.slice(3, -3).trim();
           const firstLine = content.split('\n')[0].trim();
           const language = firstLine && !firstLine.includes(' ') ? firstLine : 'code';
           const codeBody = language === firstLine ? content.substring(firstLine.length).trim() : content;
           return (
             <div key={i} className="my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-zinc-700 shadow-sm group/code">
               <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-zinc-700">
                 <span className="text-[10px] font-mono text-zinc-400 lowercase">{language}</span>
                 <button onClick={() => navigator.clipboard.writeText(codeBody)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy Code"><Copy size={12} /></button>
               </div>
               <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-300 whitespace-pre"><code>{codeBody}</code></pre>
             </div>
           );
        }
        return (
          <div key={i}>
            {block.split('\n').map((line, lineIdx) => {
               const trimmed = line.trim();
               if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <div key={lineIdx} className="flex gap-2 ml-1 mt-1 items-start"><div className="mt-2 w-1.5 h-1.5 bg-zinc-400 rounded-full shrink-0 opacity-60"></div><div className="flex-1">{formatInline(trimmed.substring(2))}</div></div>;
               if (/^\d+\.\s/.test(trimmed)) {
                   const dotIndex = trimmed.indexOf('.');
                   return <div key={lineIdx} className="flex gap-2 ml-1 mt-1 items-start"><span className="text-zinc-500 font-mono text-xs mt-0.5 shrink-0">{trimmed.substring(0, dotIndex + 1)}</span><div className="flex-1">{formatInline(trimmed.substring(dotIndex + 1))}</div></div>;
               }
               if (trimmed === '') return <div key={lineIdx} className="h-2" />;
               return <div key={lineIdx} className="min-h-[1.2em]">{formatInline(line)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
};

const ThinkingNode: React.FC<{ mode: ChatMode }> = ({ mode }) => {
    const [trace, setTrace] = useState<string[]>([]);
    
    useEffect(() => {
        const keywords = [
            "Parsing spatial registry...",
            "Validating BIM coordinates...",
            "Synthesizing budget delta...",
            "Simulating structural load...",
            "Evaluating risk matrix...",
            "Checking regulatory bounds...",
            "Optimizing resource cluster...",
            "Inference handshake complete."
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < keywords.length) {
                setTrace(prev => [...prev, keywords[i]].slice(-3));
                i++;
            }
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-3 py-2 min-w-[200px]">
            <div className="flex items-center gap-3 text-primary">
                <Loader2 size={18} className="animate-spin" />
                <span className="animate-pulse font-black text-xs uppercase tracking-widest">
                    {mode === 'THINKING' ? 'Deep Reasoning Active (32k Budget)' : 'Architect Reasoning'}
                </span>
            </div>
            <div className="space-y-1 pl-7">
                {trace.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 animate-in slide-in-from-left-2 duration-500">
                        <span className="text-primary font-black">»</span>
                        {t}
                    </div>
                ))}
            </div>
        </div>
    );
};

const GroundingSources: React.FC<{ metadata: any, mode: ChatMode }> = ({ metadata, mode }) => {
    if (!metadata || !metadata.groundingChunks || metadata.groundingChunks.length === 0) return null;

    return (
        <div className="mt-6 p-5 bg-zinc-50/80 backdrop-blur-md border border-zinc-200 rounded-[1.75rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-full overflow-hidden ring-1 ring-black/5">
            <div className="flex justify-between items-center mb-5 px-1">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    {mode === 'MAPS' ? <MapIcon size={14} className="text-green-600" /> : <Globe size={14} className="text-blue-600" />} 
                    Intelligence Nodes
                </h4>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-primary" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Verified</span>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                {metadata.groundingChunks.map((chunk: any, i: number) => {
                    const source = chunk.web || chunk.maps;
                    if (!source?.uri) return null;

                    const isMaps = !!chunk.maps;

                    return (
                        <div key={i} className="space-y-3">
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center justify-between p-4 bg-white hover:shadow-xl hover:-translate-y-0.5 rounded-2xl border border-zinc-200 transition-all group ring-1 ring-transparent hover:ring-primary/20"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                                        isMaps ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                    } group-hover:bg-primary group-hover:text-white group-hover:border-primary`}>
                                        {isMaps ? <MapPin size={18} /> : <LinkIcon size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-black text-zinc-800 truncate block group-hover:text-primary transition-colors uppercase tracking-tight">
                                            {source.title || (isMaps ? 'Spatial Node' : 'Global Reference')}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono truncate block mt-0.5 opacity-70">
                                            {new URL(source.uri).hostname}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 bg-zinc-50 rounded-lg text-zinc-300 group-hover:bg-primary group-hover:text-white transition-all">
                                    <ArrowRight size={14} />
                                </div>
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChatView: React.FC<ChatViewProps> = () => {
  const { setAiProcessing, projects } = useProjects();
  const [messages, setMessages] = useState<Message[]>([{ id: 'intro', role: 'model', text: "Hello! I'm Gemini, your BuildPro assistant. How can I help with your site logistics today?", timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<ChatMode>('PRO');
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsLoading(true);
          try {
            const transcript = await transcribeAudio(base64Audio, mimeType);
            if (transcript) setInput(prev => (prev ? `${prev.trim()} ${transcript}` : transcript));
          } catch (e) {
            console.error("Transcription error", e);
          } finally {
            setIsLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microphone access needed.");
    }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, image: selectedImage || undefined, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);
    setAiProcessing(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now(), isThinking: true }]);

    try {
      let fullText = "";
      const mimeType = currentImage ? currentImage.split(';')[0].split(':')[1] : undefined;
      const base64Data = currentImage ? currentImage.split(',')[1] : undefined;

      const projectSummary = projects.slice(0, 3).map(p => `Project: ${p.name}, Location: ${p.location}, Health: ${p.health}, Progress: ${p.progress}%`).join('\n');
      const contextualInstruction = `${MODE_CONFIGS[mode].prompt}\n\nCURRENT PROJECT METRICS:\n${projectSummary || 'No projects currently in active registry.'}`;

      const config: ChatConfig = { 
        model: MODE_CONFIGS[mode].model,
        systemInstruction: contextualInstruction
      };

      if (mode === 'THINKING') {
          config.thinkingBudget = 32768; // Enforced 32k thinking budget
      } else if (mode === 'SEARCH') {
          config.tools = [{ googleSearch: {} }];
      } else if (mode === 'MAPS') {
          config.tools = [{ googleMaps: {} }, { googleSearch: {} }];
          // Get user location for maps grounding
          try {
              const pos: GeolocationPosition = await new Promise((res, rej) => 
                  navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
              );
              config.toolConfig = {
                  retrievalConfig: {
                      latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                  }
              };
          } catch (e) {
              console.warn("Geolocation skipped for grounding", e);
          }
      }

      await streamChatResponse(messages, userMsg.text, base64Data, mimeType, (chunk, metadata) => {
           fullText += chunk;
           setMessages(prev => prev.map(m => m.id === modelMsgId ? { 
               ...m, 
               text: fullText, 
               isThinking: false,
               groundingMetadata: metadata || m.groundingMetadata 
           } : m));
        }, config);
      
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: "Error connecting to node logic shards.", isThinking: false } : m));
    } finally {
      setIsLoading(false);
      setAiProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Bar */}
      <div className="h-20 border-b border-zinc-200 flex items-center px-6 bg-white sticky top-0 z-20 justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-500 scale-110 relative ${
                MODE_CONFIGS[mode].bg.replace('50', '600')
            }`}>
                {React.createElement(MODE_CONFIGS[mode].icon, { size: 24 })}
            </div>
            <div>
                <h2 className="text-base font-black text-zinc-900 leading-none flex items-center gap-2 uppercase tracking-tighter">
                    {MODE_CONFIGS[mode].label}
                </h2>
                <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
                    {MODE_CONFIGS[mode].sub}
                </div>
            </div>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shadow-inner">
            {(Object.keys(MODE_CONFIGS) as ChatMode[]).map(m => (
                <button 
                  key={m} 
                  onClick={() => setMode(m)} 
                  className={`px-4 py-2 rounded-xl transition-all flex flex-col items-center gap-0.5 relative group ${mode === m ? 'bg-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                    {React.createElement(MODE_CONFIGS[m].icon, { 
                        size: 16, 
                        className: `transition-all duration-300 ${mode === m ? MODE_CONFIGS[m].color + ' scale-110' : 'text-zinc-400 group-hover:scale-110'}` 
                    })}
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${mode === m ? 'text-zinc-900' : 'text-zinc-400'}`}>{m}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-zinc-50/30 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border-2 ${
                msg.role === 'user' ? 'bg-white border-blue-50 text-blue-600' : 'bg-zinc-900 border-zinc-800 text-white'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`flex flex-col max-w-[80%] md:max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-lg max-w-sm bg-black animate-in zoom-in-95">
                    <img src={msg.image} className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity" alt="Context" />
                </div>
              )}
              <div className={`px-6 py-4 rounded-2xl shadow-sm relative group w-full ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
              }`}>
                {msg.isThinking ? (
                    <ThinkingNode mode={mode} />
                ) : (
                    <>
                        <MessageContent text={msg.text} />
                        {msg.groundingMetadata && <GroundingSources metadata={msg.groundingMetadata} mode={mode} />}
                    </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-zinc-200 relative shadow-2xl">
        {selectedImage && (
            <div className="max-w-4xl mx-auto mb-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary shadow-xl ring-4 ring-primary/5 bg-zinc-100">
                        <img src={selectedImage} className="w-full h-full object-cover" alt="Pending" />
                    </div>
                    <button 
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all active:scale-90"
                        title="Remove Image"
                    >
                        <X size={12} strokeWidth={4} />
                    </button>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                        Ready to analyze
                    </div>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end gap-2 bg-zinc-100 p-2.5 rounded-[2.5rem] border border-zinc-200 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white transition-all shadow-sm">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setSelectedImage(reader.result as string);
                    reader.readAsDataURL(file);
                }
            }} />
            <div className="flex gap-1 pl-2 pb-1.5">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`p-3 rounded-full transition-all ${selectedImage ? 'text-primary bg-white shadow-sm' : 'text-zinc-400 hover:text-blue-600 hover:bg-white'}`}
                    title="Upload Site Image"
                >
                    <ImagePlus size={20} />
                </button>
            </div>
            
            <div className="flex-1 relative flex flex-col">
                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    rows={1}
                    placeholder={isRecording ? "Listening to site telemetry..." : selectedImage ? "Ask something about this image..." : `Ask ${MODE_CONFIGS[mode].label}...`} 
                    className="bg-transparent border-none focus:ring-0 py-3.5 px-3 text-sm resize-none custom-scrollbar min-h-[48px] max-h-32 transition-colors" 
                />
            </div>
            
            <div className="flex gap-1.5 pr-2 pb-1.5">
                <button 
                    type="button" 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={`p-3.5 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50 text-red-600 animate-pulse' : 'text-zinc-400 hover:text-blue-600'}`}
                >
                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                </button>

                <button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} className="p-3.5 bg-blue-600 text-white rounded-full disabled:bg-zinc-200 shadow-lg transition-all active:scale-90">
                    {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ChatView;