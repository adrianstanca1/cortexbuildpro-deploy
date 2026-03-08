
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, WifiOff, AlertOctagon, X, Siren, Send, Wifi, Command, Rocket, Box, CheckSquare, Target, ChevronRight, XCircle, ShieldCheck, Activity, Building2, Cpu, Zap, Brain, Globe, Loader2, ArrowUpRight, Sparkles } from 'lucide-react';
import { Page } from '../types';
import { offlineQueue } from '../services/offlineQueue';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { researchGroundingSearch } from '../services/geminiService';

interface TopBarProps {
  setPage: (page: Page) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setPage }) => {
  const { user } = useAuth();
  const { projects, tasks, drawings, isAiProcessing, setAiProcessing } = useProjects();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSOS, setShowSOS] = useState(false);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [researchMode, setResearchMode] = useState(false);
  const [researchResult, setResearchResult] = useState<{text: string, links: any[]} | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); offlineQueue.processQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowSearch(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
      if (!searchQuery.trim() || researchMode) return { projects: [], tasks: [], drawings: [] };
      const q = searchQuery.toLowerCase();
      return {
          projects: projects.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)).slice(0, 3),
          tasks: tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5),
          drawings: drawings.filter(d => d.name.toLowerCase().includes(q)).slice(0, 3)
      };
  }, [searchQuery, projects, tasks, drawings, researchMode]);

  const handleDeepResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isResearching) return;
    
    setIsResearching(true);
    setAiProcessing(true);
    try {
        const res = await researchGroundingSearch(searchQuery);
        setResearchResult(res);
    } catch (e) {
        console.error(e);
    } finally {
        setIsResearching(false);
        setAiProcessing(false);
    }
  };

  return (
    <>
    <header className="h-20 bg-white border-b border-zinc-200 px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-10 flex-1">
          <div className="relative w-[450px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              readOnly
              onClick={() => setShowSearch(true)}
              placeholder="GLOBAL NEURAL SEARCH (CTRL+K)"
              className="w-full pl-14 pr-6 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-[12px] text-zinc-700 cursor-pointer hover:bg-zinc-100 hover:border-zinc-200 transition-all outline-none placeholder:text-zinc-400 font-black tracking-widest uppercase"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-30 bg-white px-2 py-1 rounded-lg border border-zinc-200 shadow-sm select-none">
                <Command size={10} strokeWidth={3} />
                <span className="text-[10px] font-black">K</span>
            </div>
          </div>

          <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border transition-all duration-700 overflow-hidden ${
              isAiProcessing 
              ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
              : 'bg-zinc-50/50 border-zinc-100 opacity-60'
          }`}>
              <div className="relative flex items-center justify-center">
                  <Cpu size={20} className={`${isAiProcessing ? 'text-primary animate-spin' : 'text-zinc-300'}`} style={{ animationDuration: '4s' }} />
                  {isAiProcessing && <Zap size={10} className="absolute text-yellow-400 animate-pulse" />}
              </div>
              <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1 ${isAiProcessing ? 'text-primary' : 'text-zinc-400'}`}>
                      {isAiProcessing ? 'Neural Sync' : 'Logic Core'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase leading-none ${isAiProcessing ? 'text-blue-600' : 'text-zinc-500'}`}>
                      {isAiProcessing ? 'Reasoning active...' : 'Standby'}
                  </span>
              </div>
          </div>
      </div>

      <div className="flex items-center gap-8">
        <button onClick={() => setShowSOS(true)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-red-900/20 transition-all animate-pulse active:scale-95 flex items-center gap-2.5">
            <Siren size={18} strokeWidth={3} /> SOS
        </button>

        <button className="relative text-zinc-400 hover:text-midnight p-3.5 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-100 shadow-sm active:scale-90">
          <Bell size={22} />
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary rounded-full text-[8px] text-white flex items-center justify-center font-black border-2 border-white shadow-lg">3</span>
        </button>

        <button onClick={() => setPage(Page.PROFILE)} className="flex items-center gap-4 pl-8 border-l border-zinc-100 group">
          <div className="text-right hidden sm:block">
            <div className="text-[12px] font-black text-midnight tracking-tight leading-none uppercase truncate">{user?.name}</div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.25em] mt-1.5">{user?.role.replace('_', ' ')}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-midnight text-white flex items-center justify-center text-[11px] font-black shadow-2xl group-hover:scale-105 transition-all border border-white/10 ring-4 ring-white">
            {user?.avatarInitials}
          </div>
        </button>
      </div>
    </header>

    {showSearch && (
        <div className="fixed inset-0 bg-midnight/90 backdrop-blur-3xl z-[100] flex items-start justify-center pt-[10vh] p-8 animate-in fade-in duration-300" onClick={() => { setShowSearch(false); setResearchResult(null); }}>
            <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white/20 animate-in slide-in-from-top-12 duration-500" onClick={e => e.stopPropagation()}>
                <div className="p-10 border-b border-zinc-100 bg-zinc-50 flex items-center gap-8">
                    <div className="relative">
                        <Search size={40} className={researchMode ? "text-purple-500" : "text-primary"} />
                        {researchMode && <Zap size={14} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />}
                    </div>
                    <form onSubmit={handleDeepResearch} className="flex-1 flex items-center gap-6">
                        <input 
                            autoFocus
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={researchMode ? "Ask global web research..." : "Scan projects, tasks, or personnel..."}
                            className="flex-1 bg-transparent border-none text-3xl font-black text-zinc-900 placeholder:text-zinc-200 outline-none focus:ring-0 uppercase tracking-tighter"
                        />
                        {researchMode && (
                            <button type="submit" disabled={isResearching} className="p-4 bg-purple-600 text-white rounded-2xl shadow-xl hover:bg-purple-700 transition-all active:scale-90">
                                {isResearching ? <Loader2 className="animate-spin" size={24} /> : <ArrowUpRight size={24} />}
                            </button>
                        )}
                    </form>
                    <div className="flex items-center gap-4 bg-zinc-100 p-1 rounded-xl">
                        <button onClick={() => setResearchMode(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!researchMode ? 'bg-white text-primary shadow-sm' : 'text-zinc-400'}`}>Local</button>
                        <button onClick={() => setResearchMode(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${researchMode ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400'}`}>Research</button>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-10 custom-scrollbar bg-white">
                    {isResearching ? (
                        <div className="py-24 text-center space-y-8 animate-pulse">
                            <Brain size={64} className="text-purple-500 mx-auto animate-bounce" />
                            <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">Deep Logic Research Active</h3>
                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-[0.4em]">Querying Global Web Grounding Nodes...</p>
                        </div>
                    ) : researchResult ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><Globe size={100} /></div>
                                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Sparkles size={14} /> Web-Grounded Briefing</h4>
                                <div className="text-lg text-zinc-800 leading-relaxed font-medium italic">"{researchResult.text}"</div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><ArrowUpRight size={14} /> Intelligence Sources</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {researchResult.links.map((link: any, i: number) => (
                                        <a key={i} href={link.web?.uri} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all group">
                                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Globe size={18} /></div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-black text-zinc-900 truncate uppercase tracking-tight">{link.web?.title || 'External Intelligence Node'}</div>
                                                <div className="text-[9px] text-zinc-400 font-mono truncate">{new URL(link.web?.uri || 'https://mesh.io').hostname}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : searchQuery.trim() === '' ? (
                        <div className="py-24 text-center space-y-8">
                            <Activity size={64} className="text-zinc-100 mx-auto" />
                            <p className="text-lg font-black text-zinc-300 uppercase tracking-[0.4em]">Search Engine Standby</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {searchResults.projects.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-4 mb-6 flex items-center gap-3"><Building2 size={14} className="text-primary" /> Project Clusters</h4>
                                    <div className="space-y-3">
                                        {searchResults.projects.map(p => (
                                            <button key={p.id} onClick={() => { setPage(Page.PROJECT_DETAILS); setShowSearch(false); }} className="w-full flex items-center gap-6 p-6 hover:bg-primary rounded-[2.5rem] transition-all group text-left border border-transparent hover:shadow-2xl">
                                                <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-2xl group-hover:bg-white/20 group-hover:border-white/30 text-primary group-hover:text-white transition-all"><Rocket size={24} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xl font-black uppercase tracking-tight text-midnight group-hover:text-white truncate">{p.name}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white/70 mt-1.5">{p.code} • {p.location}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {searchResults.tasks.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-4 mb-6 flex items-center gap-3"><CheckSquare size={14} className="text-primary" /> Field Objectives</h4>
                                    <div className="space-y-3">
                                        {searchResults.tasks.map(t => (
                                            <button key={t.id} onClick={() => { setPage(Page.TASKS); setShowSearch(false); }} className="w-full flex items-center gap-6 p-6 hover:bg-midnight rounded-[2.5rem] transition-all group text-left border border-transparent hover:shadow-2xl">
                                                <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-2xl group-hover:bg-white/10 group-hover:border-white/10 text-zinc-500 group-hover:text-white transition-all"><Activity size={24} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xl font-black uppercase tracking-tight text-midnight group-hover:text-white truncate">{t.title}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white/60 mt-1.5">{t.status} • Shard: {t.id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-10 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">
                    <div className="flex items-center gap-10">
                        <span className="flex items-center gap-3"><ChevronRight size={16} className="text-primary" /> Navigate Shard</span>
                        {researchMode && <span className="flex items-center gap-3 text-purple-600 animate-pulse"><Zap size={14} /> Web Grounding Active</span>}
                    </div>
                    <div className="text-zinc-300 font-mono">NODE v4.5.2-STABLE</div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default TopBar;
