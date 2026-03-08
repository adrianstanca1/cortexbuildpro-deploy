
import React, { useState, useEffect } from 'react';
import { Search, Bell, WifiOff, AlertOctagon, X, Siren, Send, Wifi } from 'lucide-react';
import { Page } from '../types';
import { offlineQueue } from '../services/offlineQueue';

interface TopBarProps {
  setPage: (page: Page) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setPage }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); offlineQueue.processQueue(); };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEmergency = (e: React.FormEvent) => {
      e.preventDefault();
      setSosSent(true);
      // In a real app, this would send to an endpoint immediately or queue it with high priority
      setTimeout(() => {
          setSosSent(false);
          setShowSOS(false);
          setSosMessage('');
          alert("EMERGENCY ALERT BROADCASTED: Site Safety Team and Emergency Services Notified.");
      }, 2000);
  };

  return (
    <>
    <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input 
          type="text" 
          placeholder="Search projects, tasks, team..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {!isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold animate-pulse border border-orange-200">
                <WifiOff size={14} /> OFFLINE MODE
            </div>
        ) : (
             <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Wifi size={14} className="text-green-500" /> Connected
             </div>
        )}

        <button 
            onClick={() => setShowSOS(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm transition-colors animate-pulse"
        >
            <AlertOctagon size={16} /> SOS
        </button>

        <div className="h-6 w-px bg-zinc-200 mx-2" />

        <button className="relative text-zinc-500 hover:text-zinc-700">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </button>

        <button 
          onClick={() => setPage(Page.PROFILE)}
          className="flex items-center gap-3 pl-2 border-l border-transparent hover:bg-zinc-50 py-1 pr-2 rounded transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-[#0e5a8a] text-white flex items-center justify-center text-sm font-semibold">
            JA
          </div>
          <div className="text-left hidden md:block">
            <div className="text-sm font-semibold text-zinc-900">John Anderson</div>
            <div className="text-xs text-zinc-500">Principal Admin</div>
          </div>
        </button>
      </div>
    </header>

    {/* Emergency Modal */}
    {showSOS && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500 animate-in zoom-in-95">
                <div className="bg-red-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3"><Siren size={32} className="animate-bounce" /> EMERGENCY ALERT</h2>
                        <p className="text-red-100 mt-1 text-sm">This will trigger high-priority notifications to all staff and emergency services.</p>
                    </div>
                    <button onClick={() => setShowSOS(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-8">
                    {sosSent ? (
                        <div className="text-center py-8">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={48} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Alert Broadcasted</h3>
                            <p className="text-zinc-500 mt-2">Emergency protocols initiated. Stay calm and follow safety procedures.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleEmergency} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase">Nature of Emergency</label>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {['Medical Emergency', 'Fire / Explosion', 'Structural Collapse', 'Hazardous Spill'].map(type => (
                                        <button 
                                            type="button"
                                            key={type}
                                            onClick={() => setSosMessage(type)}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${sosMessage === type ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-200' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full p-4 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                    placeholder="Additional details (Location, number of people involved...)"
                                    rows={3}
                                    value={sosMessage}
                                    onChange={e => setSosMessage(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Siren size={24} /> BROADCAST ALERT
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default TopBar;
