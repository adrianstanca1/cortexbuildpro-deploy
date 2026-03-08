
import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Activity, ShieldCheck, Zap, Cpu, Database, 
  RefreshCw, Sliders, AlertTriangle, CheckCircle2, 
  Server, Globe, Info, Clock, Save, ToggleLeft, ToggleRight,
  ShieldHalf, HardHat, Rocket, Binary, Network, Command,
  X, ChevronRight, Play, Signal, Link, DatabaseZap, Box
} from 'lucide-react';
import { useControlPlane } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';

const SystemConsoleView: React.FC = () => {
    const { systemConfig, updateSystemConfig, toggleGlobalFlag, auditLogs } = useControlPlane();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    
    // Terminal State
    const [terminalLines, setTerminalLines] = useState<string[]>(['Cortex BuildPro Shard Prime v4.5.2 [ESTABLISHED]', 'Type "help" for sovereign commands.', '']);
    const [input, setInput] = useState('');
    const termEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalLines]);

    const executeCommand = (cmd: string) => {
        const input = cmd.toLowerCase().trim();
        const args = input.split(' ');
        let output = '';

        switch (args[0]) {
            case 'help':
                output = 'Sovereign Commands:\n  - cluster-status: Diagnostics on global gateway.\n  - flush-cache: Purge global edge logic.\n  - maintenance-on: Enable global logic freeze.\n  - maintenance-off: Restore platform telemetry.\n  - force-mfa: Enforce global identity shard verification.\n  - whoami: Prime identity trace.';
                break;
            case 'cluster-status':
                output = 'STATUS: OPTIMAL\nNODES: 128 verified\nLATENCY: 1.2ms (P99)\nIDENTITIES: Synchronized across EMEA, NA, APAC shards.';
                break;
            case 'maintenance-on':
                updateSystemConfig({ maintenanceMode: true });
                output = 'GENESIS LOCK: Maintenance mode ACTIVATED.';
                break;
            case 'maintenance-off':
                updateSystemConfig({ maintenanceMode: false });
                output = 'GENESIS UNLOCK: Maintenance mode DEACTIVATED.';
                break;
            case 'whoami':
                output = `Prime Actor: ${user?.name}\nRole: Platform Sovereign\nShard: Prime-Core-01`;
                break;
            case 'flush-cache':
                output = 'CLEARED: 8,492 logic shards purged from edge nodes.';
                break;
            case 'clear':
                setTerminalLines([]);
                return;
            default:
                output = `UNKNOWN COMMAND: "${args[0]}". Source "help" for instruction matrix.`;
        }

        setTerminalLines(prev => [...prev, `prime@cortex:~$ ${cmd}`, output, '']);
    };

    const handleTermSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        executeCommand(input);
        setInput('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
    };

    if (!systemConfig) return null;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none flex items-center gap-4">
                        <Terminal size={36} className="text-emerald-500" /> Shard Prime Terminal
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Sovereign Orchestration Logic Hub v{systemConfig.version}</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Commit Global Logic Shards
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Global Command Terminal */}
                <div className="lg:col-span-8 bg-zinc-950 rounded-[3rem] p-1 flex flex-col shadow-2xl border border-white/5 relative overflow-hidden group h-[500px]">
                    <div className="flex items-center justify-between px-8 py-4 bg-white/5 border-b border-white/5 rounded-t-[2.8rem] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">prime@buildpro-prime: /etc/sovereign</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Activity size={16} className="text-emerald-500 animate-pulse" />
                            <div className="w-px h-4 bg-white/10" />
                            <Command size={14} className="text-zinc-500" />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-1.5 custom-scrollbar bg-black/40">
                        {terminalLines.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap break-all ${line.startsWith('prime@') ? 'text-emerald-400 font-black' : 'text-zinc-300'}`}>
                                {line}
                            </div>
                        ))}
                        <div ref={termEndRef} />
                    </div>

                    <form onSubmit={handleTermSubmit} className="p-8 border-t border-white/5 bg-white/5 flex items-center gap-4 shrink-0">
                        <ChevronRight size={20} className="text-emerald-500 shrink-0" />
                        <input 
                            autoFocus
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Execute Prime Instruction..."
                            className="flex-1 bg-transparent border-none outline-none text-emerald-400 font-mono text-sm placeholder:text-zinc-700"
                            autoComplete="off"
                        />
                        <button type="submit" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-emerald-500 transition-all active:scale-90">
                            <Play size={18} fill="currentColor" />
                        </button>
                    </form>
                </div>

                {/* API Shard Monitor */}
                <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-10 flex flex-col h-[500px] overflow-hidden">
                    <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.4em] mb-3 flex items-center gap-3">
                            <Network size={18} className="text-primary" /> API Cluster Monitor
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Real-time telemetry for active logic endpoints and cross-cluster webhooks.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {[
                            { id: 'EP-01', name: 'CORE_ORCHESTRATOR', status: 'Healthy', load: '12%', ping: '4ms' },
                            { id: 'EP-02', name: 'VISION_AGENT_MESH', status: 'Healthy', load: '45%', ping: '12ms' },
                            { id: 'EP-03', name: 'LEDGER_SYNC_GATEWAY', status: 'Warning', load: '88%', ping: '42ms' },
                            { id: 'EP-04', name: 'GEOSPATIAL_SHARD', status: 'Healthy', load: '2%', ping: '2ms' },
                            { id: 'EP-05', name: 'AUTHENTICATION_HUB', status: 'Healthy', load: '14%', ping: '3ms' }
                        ].map(ep => (
                            <div key={ep.id} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-primary transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${ep.status === 'Healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-orange-500 animate-pulse'}`} />
                                    <div>
                                        <div className="text-[10px] font-black text-zinc-900 uppercase truncate">{ep.name}</div>
                                        <div className="text-[8px] font-mono text-zinc-400">ID: {ep.id} • Ping: {ep.ping}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-zinc-500">Load</div>
                                    <div className="text-xs font-black text-primary">{ep.load}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RefreshCw size={14} className="text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Auto-Scale Shard Sync</span>
                        </div>
                        <span className="text-[10px] font-black text-white px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">Active</span>
                    </div>
                </div>
            </div>

            {/* Global Telemetry Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} /> Mesh CPU Load</div>
                    <div className="text-5xl font-black tracking-tighter">14.2%</div>
                    <div className="mt-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[14%]" />
                    </div>
                </div>
                <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Database size={100} /></div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Server size={14} /> Storage Shard</div>
                    <div className="text-5xl font-black tracking-tighter">842 TB</div>
                    <div className="mt-6 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tier 1 Cloud Sync Active</span>
                    </div>
                </div>
                <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu size={14} /> AI Inference Flow</div>
                    <div className="text-5xl font-black tracking-tighter">1.2ms</div>
                    <div className="mt-6 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global P99 Latency</span>
                    </div>
                </div>
                <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Network size={100} /></div>
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Signal size={14} /> Identity Hub</div>
                    <div className="text-5xl font-black tracking-tighter">100%</div>
                    <div className="mt-6 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sovereign Link Verified</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConsoleView;
