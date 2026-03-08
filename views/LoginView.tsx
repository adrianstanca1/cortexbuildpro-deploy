
import React, { useState } from 'react';
import { 
  Shield, User, ArrowRight, BrainCircuit, ShieldCheck, 
  Lock, Crown, Mail, Key, Info, Fingerprint, RefreshCcw,
  Zap, Globe, Activity, Rocket, Cpu, Binary, Search, CheckCircle2,
  ChevronRight, ArrowUpRight, MessageSquare, Wand2, Boxes,
  Building2, Landmark, Phone, X
} from 'lucide-react';
import { Page, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  setPage: (page: Page) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ setPage }) => {
  const { signIn, isLoading, signUp } = useAuth();
  const [mode, setMode] = useState<'LANDING' | 'SIGNIN' | 'SIGNUP'>('LANDING');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: UserRole.OPERATIVE
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        await signIn(formData.email, formData.password);
        setPage(Page.DASHBOARD);
    } catch (err: any) {
        setError(err.message || "Logic link failure.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      try {
          await signUp(formData);
          setPage(Page.DASHBOARD);
      } catch (err: any) {
          setError(err.message || "Identity registration failure.");
      }
  };

  if (mode === 'LANDING') {
      return (
          <div className="min-h-screen bg-midnight text-white overflow-y-auto custom-scrollbar flex flex-col selection:bg-primary selection:text-white">
              {/* Animated Background */}
              <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/simple-dashed.png')]" />
                  <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary rounded-full blur-[160px] animate-pulse" />
                  <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-[#1e3a8a] rounded-full blur-[160px] animate-pulse-slow" />
              </div>

              {/* Navigation */}
              <nav className="relative z-10 px-10 h-24 flex items-center justify-between border-b border-white/5 bg-midnight/50 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/40">
                          <BrainCircuit size={28} />
                      </div>
                      <div>
                          <span className="font-black text-2xl tracking-tighter uppercase leading-none block">Cortex</span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1 block">BuildPro OS</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-8">
                      <div className="hidden md:flex items-center gap-6">
                          <a href="#vision" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Vision</a>
                          <a href="#architecture" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Architecture</a>
                          <a href="#mesh" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">The Mesh</a>
                      </div>
                      <button 
                        onClick={() => setMode('SIGNIN')}
                        className="bg-white text-midnight px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-95"
                      >
                          Establish Link
                      </button>
                  </div>
              </nav>

              {/* Hero Section */}
              <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 text-center py-40">
                  <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-in fade-in slide-in-from-bottom-6">
                      <Zap size={14} className="animate-pulse" /> Multimodal Construction Intelligence Active
                  </div>
                  <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      Forge <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary animate-move-bg bg-[length:200%_auto]">Precision</span><br />
                      At Site Scale.
                  </h1>
                  <p className="max-w-2xl text-zinc-400 text-lg md:text-xl font-medium leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      Synchronize your global construction clusters with real-time neural telemetry, multimodal spatial reasoning, and automated forensic auditing.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                      <button 
                        onClick={() => setMode('SIGNUP')}
                        className="bg-primary text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 hover:bg-[#0c4a6e] transition-all flex items-center justify-center gap-4 group active:scale-95"
                      >
                          Initialize Identity Node <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setMode('SIGNIN')}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                      >
                          Access Command Deck
                      </button>
                  </div>
              </main>

              {/* Feature Matrix */}
              <section id="architecture" className="relative z-10 px-10 py-40 border-t border-white/5 bg-midnight/30">
                  <div className="max-w-7xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                          <div className="p-10 bg-white/5 border border-white/10 rounded-[3.5rem] group hover:bg-primary/5 transition-all">
                              <div className="p-5 bg-primary/10 rounded-3xl text-primary w-fit mb-8 group-hover:scale-110 transition-transform">
                                  <Rocket size={32} />
                              </div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Neural Launchpad</h3>
                              <p className="text-zinc-500 font-medium leading-relaxed">
                                  Transform raw project briefs into structured technical architectures using deep reasoning Gemini models.
                              </p>
                          </div>
                          <div className="p-10 bg-white/5 border border-white/10 rounded-[3.5rem] group hover:bg-primary/5 transition-all">
                              <div className="p-5 bg-emerald-500/10 rounded-3xl text-emerald-500 w-fit mb-8 group-hover:scale-110 transition-transform">
                                  <Zap size={32} />
                              </div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Spatial Telemetry</h3>
                              <p className="text-zinc-500 font-medium leading-relaxed">
                                  Real-time site engineering guidance via multimodal camera ingestion and automated hazard identification.
                              </p>
                          </div>
                          <div className="p-10 bg-white/5 border border-white/10 rounded-[3.5rem] group hover:bg-primary/5 transition-all">
                              <div className="p-5 bg-purple-500/10 rounded-3xl text-purple-500 w-fit mb-8 group-hover:scale-110 transition-transform">
                                  <Boxes size={32} />
                              </div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Cluster Forge</h3>
                              <p className="text-zinc-500 font-medium leading-relaxed">
                                  Manage complex multi-tenant environments with isolated shards and centralized governance nodes.
                              </p>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Footer */}
              <footer className="relative z-10 px-10 py-20 border-t border-white/5 text-center">
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">
                      Sovereign Intelligence Node v4.5.2 • Cluster: BP-GLOBAL-MESH
                  </div>
              </footer>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans relative overflow-hidden selection:bg-primary selection:text-white">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3.5rem] p-12 shadow-2xl border border-white relative overflow-hidden animate-in zoom-in-95 duration-500">
          
            <>
              <div className="mb-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-midnight tracking-tight uppercase leading-none mb-2">
                        {mode === 'SIGNIN' ? 'Establish Link' : 'Register Node'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                        {mode === 'SIGNIN' ? 'Global Cluster Auth' : 'Initialize Identity'}
                    </p>
                  </div>
                  <button onClick={() => setMode('LANDING')} className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"><X size={24} /></button>
              </div>

              {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                      <Info size={16} className="text-red-500" />
                      <p className="text-[11px] font-bold text-red-600 uppercase">{error}</p>
                  </div>
              )}

              <form onSubmit={mode === 'SIGNIN' ? handleAuth : handleRegister} className="space-y-6">
                {mode === 'SIGNUP' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Entity Name</label>
                        <input 
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all uppercase tracking-tight" 
                            placeholder="John Anderson" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                )}
                
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Node Identifier (Email)</label>
                    <input 
                        type="email" required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                        placeholder="admin@cortex.pro" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Logic Pattern (Password)</label>
                    <input 
                        type="password" required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                        placeholder="••••••••••••" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <button 
                    type="submit" disabled={isLoading}
                    className="w-full py-5 bg-zinc-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                    {/* Fixed: Changed RefreshCw to RefreshCcw as per imported icons from lucide-react */}
                    {isLoading ? <RefreshCcw className="animate-spin" size={18} /> : (mode === 'SIGNIN' ? 'Establish Auth Link' : 'Commit Registry Entry')}
                </button>

                <div className="text-center mt-6">
                    <button 
                        type="button"
                        onClick={() => setMode(mode === 'SIGNIN' ? 'SIGNUP' : 'SIGNIN')}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                    >
                        {mode === 'SIGNIN' ? 'No identity node? Register here' : 'Already registered? Sync node'}
                    </button>
                </div>
              </form>
            </>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
