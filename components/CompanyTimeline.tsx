import React, { useMemo } from 'react';
import { 
  Rocket, Zap, ShieldAlert, ShieldCheck, History, 
  Activity, Clock, User, Briefcase, Lock, Key, 
  Settings, Layers, CircleDashed, CheckCircle2,
  AlertCircle, AlertTriangle, Eye, UserPlus, Fingerprint,
  RefreshCw, Sliders, Calendar
} from 'lucide-react';
import { AuditLog } from '../types';

interface CompanyTimelineProps {
  logs: AuditLog[];
}

const CompanyTimeline: React.FC<CompanyTimelineProps> = ({ logs }) => {
  const sortedLogs = useMemo(() => 
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  [logs]);

  const getEventIcon = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('PROVISION') || a.includes('BOOTSTRAP')) return { icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (a.includes('LIFECYCLE')) return { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (a.includes('ENTITLEMENT') || a.includes('QUOTA')) return { icon: Sliders, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (a.includes('IMPERSONATION')) return { icon: Eye, color: 'text-red-500', bg: 'bg-red-500/10' };
    if (a.includes('SECURITY') || a.includes('SSO') || a.includes('MFA')) return { icon: Lock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    if (a.includes('API_KEY')) return { icon: Key, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
    return { icon: Activity, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
  };

  return (
    <div className="relative space-y-8 py-4 px-2">
      {/* Central Connector Line */}
      <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/40 via-zinc-100 to-transparent" />

      {sortedLogs.length > 0 ? (
        sortedLogs.map((log, idx) => {
          const { icon: Icon, color, bg } = getEventIcon(log.action);
          const date = new Date(log.timestamp);

          return (
            <div key={log.id} className="relative pl-16 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Timeline Dot with Icon */}
              <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl ${bg} ${color} border-4 border-white shadow-xl flex items-center justify-center transition-all group-hover:scale-110 z-10 ring-1 ring-zinc-100`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>

              <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${bg} ${color} border-current opacity-70`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> {date.toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-zinc-900 uppercase tracking-tight leading-tight">
                    {log.reason || "System logic event logged."}
                  </h4>

                  {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-[10px] font-mono text-zinc-500 space-y-1 overflow-hidden">
                       {Object.entries(log.metadata).map(([k, v]) => (
                         <div key={k} className="flex gap-2">
                           <span className="text-primary font-black uppercase tracking-tighter shrink-0">{k}:</span>
                           <span className="truncate italic">"{JSON.stringify(v)}"</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-8 shrink-0">
                  <div className="text-right">
                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Authenticated Actor</div>
                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs font-black text-zinc-800 uppercase tracking-tight">{log.actorName}</span>
                      <div className="w-8 h-8 rounded-xl bg-midnight text-white flex items-center justify-center text-[10px] font-black shadow-lg border border-white/10">
                        {log.actorName.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-zinc-100 rounded-[3rem] bg-zinc-50/50">
          <History size={48} className="mx-auto mb-4 text-zinc-200" />
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Registry Node Uninitialized</p>
          <p className="text-zinc-400 text-[10px] mt-1 uppercase font-bold">No forensic log shards found for this company.</p>
        </div>
      )}
    </div>
  );
};

export default CompanyTimeline;
