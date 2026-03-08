
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, Paperclip, Hash, Lock, Users, Sparkles, 
  MoreVertical, Phone, Video, Search, Smile, 
  Mic, Check, CheckCheck, Loader2, Activity, 
  Globe, ShieldCheck, User as UserIcon, X, 
  Settings, Bell, MoreHorizontal, MessageSquare,
  Zap, Info, ListChecks, ArrowRight, ScanLine
} from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  role: string;
  avatar: string;
  color: string;
  read?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private';
  unread: number;
}

const TeamChatView: React.FC = () => {
  const { user } = useAuth();
  const { teamMembers } = useProjects();
  const [activeChannel, setActiveChannel] = useState('c1');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const channels: Channel[] = [
    { id: 'c1', name: 'global-site-mesh', type: 'public', unread: 0 },
    { id: 'c2', name: 'forensic-audits', type: 'public', unread: 3 },
    { id: 'c3', name: 'safety-alerts', type: 'public', unread: 0 },
    { id: 'c4', name: 'logistics-shards', type: 'public', unread: 0 },
    { id: 'c5', name: 'command-deck', type: 'private', unread: 0 },
  ];

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'c1': [
      { id: '1', sender: 'Mike Thompson', role: 'Foreman', text: 'Structural integrity on Sector 4 verified. Proceeding with pour.', time: '09:30 AM', isMe: false, avatar: 'MT', color: 'bg-blue-600', read: true },
      { id: '2', sender: 'David Chen', role: 'Architect', text: 'Acknowledged. Coordinates aligned with BIM revision 3.2.', time: '09:45 AM', isMe: false, avatar: 'DC', color: 'bg-indigo-600', read: true },
    ]
  });

  useEffect(() => {
    setOnlineMembers(teamMembers.slice(0, 8).map(m => m.name));
    
    const interval = setInterval(() => {
        if (Math.random() > 0.9 && typingUsers.length === 0) {
            const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
            if (randomMember.name === user?.name) return;

            setTypingUsers([randomMember.name]);
            
            setTimeout(() => {
                const newMsg: Message = {
                    id: `sim-${Date.now()}`,
                    sender: randomMember.name,
                    role: randomMember.role.replace('_', ' '),
                    text: simulateTechnicalResponse(randomMember.role),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: false,
                    avatar: randomMember.initials,
                    color: randomMember.color || 'bg-zinc-600',
                    read: true
                };
                setMessages(prev => ({
                    ...prev,
                    [activeChannel]: [...(prev[activeChannel] || []), newMsg]
                }));
                setTypingUsers([]);
            }, 3000 + Math.random() * 2000);
        }
    }, 12000);

    return () => clearInterval(interval);
  }, [teamMembers, activeChannel, typingUsers, user]);

  const simulateTechnicalResponse = (role: string) => {
      const responses = [
          "Confirming the coordinates for the Level 4 pour. All logic nodes clear.",
          "Weather report indicates precipitation in 2 hours. Suggesting we pivot to internal fitting.",
          "Safety perimeter on Sector B has been verified by the Vision Agent.",
          "Acknowledged. I'll update the site ledger accordingly.",
          "Do we have the final logic shards for the facade anchors?",
          "Loading the material requests now for EOD delivery."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, activeChannel, typingUsers]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: user?.name || 'Identity Node',
      role: user?.role.replace('_', ' ') || 'Admin',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: user?.avatarInitials || 'U',
      color: 'bg-zinc-900',
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg]
    }));
    setInputText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => event.data.size > 0 && audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setTypingUsers(['BuildPro AI Transcriber']);
            try {
                const transcript = await transcribeAudio(base64Audio, 'audio/webm');
                if (transcript) setInputText(prev => (prev ? prev + " " + transcript : transcript));
            } catch (e) {
                console.error(e);
            } finally {
                setTypingUsers([]);
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col animate-in fade-in duration-500 pb-20">
      <div className="flex-1 bg-white border border-zinc-200 rounded-[3rem] overflow-hidden flex shadow-2xl relative">
          
          <div className="w-80 bg-zinc-50 border-r border-zinc-200 flex flex-col hidden lg:flex">
              <div className="p-8 border-b border-zinc-200 bg-white">
                  <h2 className="font-black text-zinc-900 flex items-center gap-4 uppercase tracking-tighter text-xl">
                      <Users size={28} className="text-primary" /> Mesh Comms
                  </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                  <div>
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-4 mb-4">Functional Shards</h3>
                      <div className="space-y-1.5">
                          {channels.filter(c => c.type === 'public').map(c => (
                              <button
                                  key={c.id}
                                  onClick={() => setActiveChannel(c.id)}
                                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] transition-all uppercase tracking-widest ${
                                      activeChannel === c.id 
                                      ? 'bg-midnight text-white shadow-2xl font-black' 
                                      : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800'
                                  }`}
                              >
                                  <div className="flex items-center gap-4 truncate">
                                      <Hash size={16} className={activeChannel === c.id ? 'text-primary' : 'text-zinc-300'} />
                                      <span className="truncate">{c.name}</span>
                                  </div>
                                  {c.unread > 0 && (
                                      <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20">{c.unread}</span>
                                  )}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-4 mb-4">Command Thread</h3>
                      <div className="space-y-1.5">
                          {channels.filter(c => c.type === 'private').map(c => (
                              <button
                                  key={c.id}
                                  onClick={() => setActiveChannel(c.id)}
                                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] transition-all uppercase tracking-widest ${
                                      activeChannel === c.id 
                                      ? 'bg-midnight text-white shadow-2xl font-black' 
                                      : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-800'
                                  }`}
                              >
                                  <div className="flex items-center gap-4 truncate">
                                      <Lock size={16} className={activeChannel === c.id ? 'text-primary' : 'text-zinc-300'} />
                                      <span className="truncate">{c.name}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-1 flex flex-col bg-white relative">
              <div className="h-20 border-b border-zinc-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md sticky top-0 z-20">
                  <div className="flex items-center gap-6">
                      <div className="p-3.5 bg-zinc-900 text-white rounded-2xl shadow-xl shadow-zinc-900/10">
                        {currentChannel?.type === 'private' ? <Lock size={20} /> : <Hash size={20} />}
                      </div>
                      <div>
                          <div className="font-black text-zinc-900 uppercase tracking-tighter text-xl leading-none">#{currentChannel?.name}</div>
                          <div className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.3em] mt-2 flex items-center gap-2">
                             <Activity size={12} className="text-emerald-500 animate-pulse" /> Site Shard Hub • {onlineMembers.length} Active Nodes
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                      <button className="hover:text-primary p-3 hover:bg-zinc-50 rounded-xl transition-all"><Search size={22} /></button>
                      <button className="hover:text-primary p-3 hover:bg-zinc-50 rounded-xl transition-all"><Phone size={22} /></button>
                      <div className="w-px h-10 bg-zinc-100 mx-2"></div>
                      <button className="hover:text-zinc-900 p-3"><MoreVertical size={22} /></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-zinc-50/20 custom-scrollbar">
                  {(messages[activeChannel] || []).map((msg, i) => (
                      <div key={msg.id} className={`flex gap-6 ${msg.isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                          <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white font-black text-base shrink-0 shadow-2xl border-4 border-white ring-1 ring-zinc-100 transition-transform hover:scale-110 ${msg.color}`}>
                              {msg.avatar}
                          </div>
                          <div className={`flex flex-col max-w-[75%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-3 mb-3 px-1">
                                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{msg.sender}</span>
                                  <span className="px-2 py-0.5 bg-zinc-100 rounded-lg text-[8px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200">{msg.role}</span>
                                  <span className="text-[9px] text-zinc-300 font-bold">{msg.time}</span>
                              </div>
                              <div className={`px-8 py-5 rounded-[2.5rem] text-[15px] leading-relaxed shadow-xl relative group transition-all hover:shadow-2xl ${
                                  msg.isMe 
                                  ? 'bg-midnight text-white rounded-tr-none' 
                                  : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                              }`}>
                                  {msg.text}
                                  
                                  {msg.isMe && (
                                    <div className="absolute -bottom-7 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Shard Synced</span>
                                        <CheckCheck size={14} className="text-primary" />
                                    </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}

                  {typingUsers.length > 0 && (
                      <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-14 h-14 bg-white border border-zinc-100 rounded-[1.5rem] flex items-center justify-center text-zinc-300 font-bold text-lg shrink-0 shadow-sm italic">...</div>
                          <div className="bg-white border border-zinc-200 px-8 py-5 rounded-[2.5rem] rounded-tl-none shadow-sm flex items-center gap-4">
                              <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                              </div>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                {typingUsers[0]} is drafting technical context
                              </span>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              <div className="p-10 bg-white border-t border-zinc-100 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
                  <form onSubmit={handleSendMessage} className="relative flex items-end gap-4 bg-zinc-50 p-3 rounded-[3rem] border border-zinc-200 focus-within:ring-8 focus-within:ring-primary/5 focus-within:bg-white transition-all shadow-inner">
                      <button type="button" className="p-5 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-2xl transition-all" title="Attach Shard Asset">
                          <Paperclip size={28} />
                      </button>
                      
                      <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                              }
                          }}
                          placeholder={isRecording ? "Transcribing Multimodal Input..." : `Communicate in #${currentChannel?.name}...`}
                          className="flex-1 bg-transparent border-none focus:ring-0 py-5 px-3 text-zinc-900 placeholder-zinc-300 min-h-[32px] max-h-48 resize-none text-base font-medium"
                          rows={1}
                      />
                      
                      <button 
                          type="button" 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          className={`p-5 rounded-[2rem] transition-all duration-300 relative overflow-hidden ${isRecording ? 'bg-red-50 text-red-600 animate-pulse shadow-2xl' : 'text-zinc-400 hover:text-primary hover:bg-zinc-100'}`}
                      >
                          {isRecording ? <Loader2 size={28} className="animate-spin" /> : <Mic size={28} />}
                      </button>

                      <button 
                          type="submit"
                          disabled={!inputText.trim()}
                          className={`p-5 rounded-[2rem] transition-all duration-300 shadow-2xl ${
                              !inputText.trim()
                              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' 
                              : 'bg-primary text-white hover:bg-midnight active:scale-95'
                          }`}
                      >
                          <Send size={28} />
                      </button>
                  </form>
              </div>
          </div>

          <div className="w-96 bg-zinc-50 border-l border-zinc-200 flex flex-col hidden xl:flex">
              <div className="p-10 border-b border-zinc-200 bg-white">
                  <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em] mb-6">Site Presence Shard</h3>
                  <div className="flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] shadow-inner">
                      <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-900/20">
                          <Globe size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-black text-zinc-900 uppercase tracking-tight">Active Mesh</div>
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Real-time Sync Node</div>
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  <div>
                      <div className="flex justify-between items-center mb-8 px-2">
                          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Identity Cluster</h4>
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{onlineMembers.length} ONLINE</span>
                      </div>
                      <div className="space-y-6">
                          {teamMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:border-zinc-200 border border-transparent">
                                  <div className="flex items-center gap-5">
                                      <div className="relative">
                                          <div className={`w-12 h-12 rounded-[1.25rem] ${member.color || 'bg-zinc-400'} flex items-center justify-center text-white text-xs font-black shadow-lg ring-4 ring-white`}>
                                              {member.initials}
                                          </div>
                                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white ${onlineMembers.includes(member.name) ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} />
                                      </div>
                                      <div className="min-w-0">
                                          <div className="text-sm font-black text-zinc-900 truncate uppercase tracking-tight group-hover:text-primary transition-colors">{member.name}</div>
                                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1 truncate">{member.role.replace('_', ' ')}</div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="pt-8 border-t border-zinc-200">
                      <div className="p-8 bg-midnight rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group/viz">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/viz:scale-150 transition-transform duration-1000"><Activity size={80} /></div>
                          <div className="relative z-10">
                              <div className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-3">Collab Velocity</div>
                              <div className="text-3xl font-black tracking-tighter">8.2 <span className="text-[11px] text-zinc-500 uppercase font-black tracking-widest">msg/h</span></div>
                              <div className="mt-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-2/3 shadow-[0_0_8px_#0ea5e9]" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default TeamChatView;
