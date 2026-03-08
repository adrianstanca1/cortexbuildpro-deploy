import React, { useRef, useState } from 'react';
import { 
  Building2, User, Users, Target, Database, Zap, 
  PlayCircle, PauseCircle, Archive, CheckCircle2, 
  ShieldAlert, Ban, MoreHorizontal, Fingerprint,
  Globe, Camera, Layout, Key, Box, PoundSterling,
  ShieldCheck, BrainCircuit, Wand2, Shield, Info,
  ShieldQuestion, Settings2, RotateCcw, Eye, BarChart3,
  Loader2, RefreshCw, UploadCloud, Play, Trash2
} from 'lucide-react';
import { Company, CompanyStatus, FeatureEntitlements } from '../types';
import { useControlPlane } from '../contexts/SuperAdminContext';

interface CompanyCardProps {
  company: Company;
  onImpersonate: (id: string, name: string) => void;
  onManage: (id: string) => void;
  onStatusTransition: (id: string, status: CompanyStatus, reason: string) => Promise<void>;
  onLogoUpload?: (id: string, file: File) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, onImpersonate, onManage, onStatusTransition, onLogoUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getValidStatusTransitions, getTransitionProtocol, updateCompanyLogo } = useControlPlane();
  const [isUploading, setIsUploading] = useState(false);

  const seatUsage = Math.round((company.usersCount / company.limits.userSeats) * 100);
  const projectUsage = Math.round((company.projectsCount / company.limits.projects) * 100);
  
  const getStatusColor = (status: CompanyStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'SUSPENDED': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ARCHIVED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'DRAFT': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const handleAction = async (targetStatus: CompanyStatus) => {
    const protocol = getTransitionProtocol(company.status, targetStatus);
    const actionLabel = protocol ? protocol.name : `Transition to ${targetStatus}`;
    
    const confirmed = window.confirm(`SECURE PROTOCOL [${actionLabel}]:\n\nTarget Shard: ${company.name}\nOperation: ${protocol?.intent || 'Update status'}\n\nProceed with authorization? This event is immutable.`);
    
    if (confirmed) {
        const reason = window.prompt(`Provide forensic justification for ${targetStatus.toLowerCase()} transition:`, protocol?.intent || '');
        if (reason) {
            await onStatusTransition(company.id, targetStatus, reason);
        }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLogoUpload) {
      setIsUploading(true);
      try {
          await onLogoUpload(company.id, file);
      } finally {
          setIsUploading(false);
      }
    }
  };

  const handleClearBranding = async () => {
    if (window.confirm("Purge Identity Branding: Revert entity visualization to default logic node icon?")) {
        await updateCompanyLogo(company.id, null);
    }
  };

  const validTransitions = getValidStatusTransitions(company.status);

  const featureList = [
    { id: 'aiAssistant', icon: BrainCircuit, label: 'AI' },
    { id: 'imagineStudio', icon: Wand2, label: 'Forge' },
    { id: 'financials', icon: PoundSterling, label: 'Ledger' },
    { id: 'advancedRBAC', icon: ShieldCheck, label: 'RBAC' },
    { id: 'liveVision', icon: Eye, label: 'Vision' },
    { id: 'bimAnalytics', icon: BarChart3, label: 'BIM' },
  ];

  return (
    <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden ring-1 ring-transparent hover:ring-primary/10 animate-in fade-in zoom-in-95 duration-500 h-full">
      
      <div className="absolute top-0 right-0 z-10">
        <div className={`px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-[0.2em] border-b border-l flex items-center gap-2 transition-all ${getStatusColor(company.status)}`}>
          {company.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />}
          {company.status}
        </div>
      </div>

      <div className="flex items-start gap-6 mb-8 mt-2">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-20 h-20 bg-zinc-50 rounded-[1.75rem] flex items-center justify-center border transition-all shadow-inner overflow-hidden relative shrink-0 cursor-pointer group/logo ${
              isUploading ? 'border-primary ring-4 ring-primary/10 animate-pulse' : 'border-zinc-100 group-hover:border-primary'
          }`}
        >
          {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-1">
                  <Loader2 size={24} className="text-primary animate-spin" />
                  <span className="text-[8px] font-black uppercase text-primary">Syncing</span>
              </div>
          ) : company.logoUrl ? (
              <img src={company.logoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Logo" />
          ) : (
              <Building2 size={36} className="text-zinc-200 group-hover:text-primary transition-colors" />
          )}
          
          {!isUploading && (
              <div className="absolute inset-0 bg-midnight/40 flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera size={20} className="text-white mb-1" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Identity Pulse</span>
              </div>
          )}
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-midnight text-white rounded-lg text-[8px] font-black uppercase tracking-widest">{company.plan} SHARD</span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Globe size={10} /> {company.region}
              </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 truncate uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">
              {company.name}
          </h3>
          <div className="flex items-center gap-3 mt-4">
              <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-zinc-200 uppercase">
                  {company.ownerName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Primary Custodian</p>
                  <p className="text-xs font-bold text-zinc-700 truncate uppercase tracking-tight">{company.ownerName}</p>
              </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <span className="flex items-center gap-1.5"><Users size={12} /> Seats</span>
                      <span className="text-zinc-900">{company.usersCount} / {company.limits.userSeats}</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${seatUsage > 90 ? 'bg-red-50 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(14,165,233,0.4)]'}`} 
                        style={{ width: `${seatUsage}%` }} 
                      />
                  </div>
              </div>
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <span className="flex items-center gap-1.5"><Target size={12} /> Clusters</span>
                      <span className="text-zinc-900">{company.projectsCount} / {company.limits.projects}</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${projectUsage > 80 ? 'bg-orange-50 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} 
                        style={{ width: `${projectUsage}%` }} 
                      />
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-8 px-2">
          {featureList.map((f) => {
              const isEnabled = company.features[f.id as keyof FeatureEntitlements];
              return (
                  <div key={f.id} className="group/feat relative">
                      <div className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${
                          isEnabled ? 'bg-primary/10 border-primary/20 text-primary shadow-inner' : 'bg-zinc-50 border-zinc-100 text-zinc-300 opacity-40'
                      }`}>
                          <f.icon size={16} />
                      </div>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-[8px] font-black rounded opacity-0 group-hover/feat:opacity-100 transition-opacity whitespace-nowrap z-20 uppercase tracking-tighter">
                          {f.label}: {isEnabled ? 'Active' : 'Offline'}
                      </div>
                  </div>
              );
          })}
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-50 flex gap-3">
          <button 
            onClick={() => onImpersonate(company.id, company.name)}
            className="flex-1 py-3.5 bg-zinc-950 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2 group/imp"
          >
              <Fingerprint size={14} className="group-hover/imp:rotate-12 transition-transform" /> Impersonate
          </button>
          
          <div className="relative group/more">
              <button className="h-full px-4 bg-zinc-100 text-zinc-500 rounded-[1.25rem] hover:bg-zinc-200 transition-all active:scale-90 border border-zinc-200">
                  <MoreHorizontal size={20} />
              </button>
              
              <div className="absolute bottom-full right-0 mb-3 w-64 bg-white border border-zinc-200 rounded-3xl shadow-2xl py-3 z-[100] opacity-0 translate-y-2 pointer-events-none group-hover/more:opacity-100 group-hover/more:translate-y-0 group-hover/more:pointer-events-auto transition-all">
                  <div className="px-4 pb-2 mb-2 border-b border-zinc-50">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Protocol Handlers</span>
                  </div>
                  
                  <button onClick={() => onManage(company.id)} className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase text-zinc-600 hover:bg-zinc-50 hover:text-primary transition-all flex items-center gap-3">
                      <Settings2 size={14} /> Orchestration
                  </button>

                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase text-zinc-600 hover:bg-zinc-50 hover:text-primary transition-all flex items-center gap-3">
                      <UploadCloud size={14} /> Update Identity
                  </button>

                  {company.logoUrl && (
                      <button onClick={handleClearBranding} className="w-full text-left px-5 py-2.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-all flex items-center gap-3">
                        <Trash2 size={14} /> Clear Branding
                      </button>
                  )}
                  
                  <div className="h-px bg-zinc-50 my-1" />
                  
                  {validTransitions.map(targetStatus => {
                      const protocol = getTransitionProtocol(company.status, targetStatus);
                      return (
                          <button 
                            key={targetStatus}
                            onClick={() => handleAction(targetStatus)}
                            className={`w-full text-left px-5 py-2.5 text-[10px] font-black uppercase transition-all flex items-center gap-3 ${
                                targetStatus === 'SUSPENDED' ? 'text-amber-600 hover:bg-amber-50' :
                                targetStatus === 'ARCHIVED' ? 'text-red-600 hover:bg-red-50' :
                                'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                              {targetStatus === 'SUSPENDED' ? <PauseCircle size={14} /> : 
                               targetStatus === 'ARCHIVED' ? <Archive size={14} /> : 
                               <Play size={14} />}
                              {protocol?.name || `Set ${targetStatus}`}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default CompanyCard;
