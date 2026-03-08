
import React, { useState } from 'react';
import { Key, Link, Terminal, Code, Shield, Copy, Check, Plus, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';

const IntegrationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPS' | 'DEV'>('APPS');
  const [webhooks, setWebhooks] = useState([
      { id: 'wh_1', url: 'https://api.procore-sync.com/hooks/v1', events: ['task.completed'], active: true },
      { id: 'wh_2', url: 'https://slack-bot.internal/buildpro', events: ['safety.incident'], active: true }
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [token] = useState('pk_live_8f920dka9201jj2901kals92019');

  const addWebhook = () => {
      if (newWebhookUrl) {
          setWebhooks(prev => [...prev, { id: `wh_${Date.now()}`, url: newWebhookUrl, events: ['all'], active: true }]);
          setNewWebhookUrl('');
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
       <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Integrations & API</h1>
            <p className="text-zinc-500">Connect third-party tools and manage developer access.</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('APPS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'APPS' ? 'bg-white text-[#0f5c82] shadow-sm' : 'text-zinc-500'}`}
            >
                Connected Apps
            </button>
            <button 
                onClick={() => setActiveTab('DEV')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'DEV' ? 'bg-white text-[#0f5c82] shadow-sm' : 'text-zinc-500'}`}
            >
                Developer Tools
            </button>
        </div>
      </div>

      {activeTab === 'APPS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in">
              {/* Procore */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-zinc-800 text-lg">Procore</h3>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">Connected</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">Last Sync: 2025-11-09 18:30</p>
                  <button className="w-full bg-zinc-100 text-zinc-600 py-2 rounded text-sm font-medium hover:bg-zinc-200">Disconnect</button>
              </div>

               {/* QuickBooks */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-zinc-800 text-lg">QuickBooks</h3>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">Connected</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">Last Sync: 2025-11-10 00:00</p>
                  <button className="w-full bg-zinc-100 text-zinc-600 py-2 rounded text-sm font-medium hover:bg-zinc-200">Disconnect</button>
              </div>

               {/* AutoCAD */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-zinc-800 text-lg">AutoCAD</h3>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-medium">Disconnected</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">Last Sync: Never</p>
                  <button className="w-full bg-[#1f7d98] text-white py-2 rounded text-sm font-medium hover:bg-[#166ba1]">Connect</button>
              </div>

               {/* Slack */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-zinc-800 text-lg">Slack</h3>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">Connected</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">Last Sync: 2025-11-10 08:15</p>
                  <button className="w-full bg-zinc-100 text-zinc-600 py-2 rounded text-sm font-medium hover:bg-zinc-200">Disconnect</button>
              </div>
          </div>
      )}

      {activeTab === 'DEV' && (
          <div className="space-y-8 animate-in fade-in">
              {/* API Key Section */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2"><Key size={20} className="text-amber-500" /> API Keys</h3>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                      <div>
                          <div className="text-sm font-bold text-zinc-700">Production Key</div>
                          <div className="flex items-center gap-2 mt-1">
                              <div className="text-xs font-mono text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
                                  {showToken ? token : 'pk_live_••••••••••••••••••••'}
                              </div>
                              <button onClick={() => setShowToken(!showToken)} className="text-zinc-400 hover:text-zinc-600">
                                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button className="p-2 hover:bg-zinc-200 rounded text-zinc-500" title="Copy Key"><Copy size={16} /></button>
                          <button className="p-2 hover:bg-zinc-200 rounded text-zinc-500" title="Roll Key"><RefreshCw size={16} /></button>
                          <button className="p-2 hover:bg-red-100 hover:text-red-600 rounded text-zinc-500" title="Delete Key"><Trash2 size={16} /></button>
                      </div>
                  </div>
                  <button className="mt-4 text-[#0f5c82] text-sm font-bold hover:underline flex items-center gap-1">
                      <Plus size={14} /> Generate New Key
                  </button>
              </div>

              {/* Webhooks Section */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2"><Link size={20} className="text-blue-500" /> Webhooks</h3>
                  <div className="space-y-3 mb-6">
                      {webhooks.map(wh => (
                          <div key={wh.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors">
                              <div>
                                  <div className="text-sm font-mono text-zinc-800">{wh.url}</div>
                                  <div className="flex gap-2 mt-1">
                                      {wh.events.map(ev => <span key={ev} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{ev}</span>)}
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-zinc-300'}`}></span>
                                  <button onClick={() => setWebhooks(prev => prev.filter(x => x.id !== wh.id))} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  <div className="flex gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                      <input 
                        type="text" 
                        placeholder="https://your-server.com/webhook" 
                        className="flex-1 p-2 bg-white border-none rounded-md text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none"
                        value={newWebhookUrl}
                        onChange={e => setNewWebhookUrl(e.target.value)}
                      />
                      <button onClick={addWebhook} className="bg-[#0f5c82] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0c4a6e] transition-colors shadow-sm">Add Endpoint</button>
                  </div>
              </div>

              {/* SDK Documentation */}
              <div className="bg-zinc-900 rounded-xl p-6 text-zinc-300 shadow-lg">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Code size={20} /> SDK Quickstart</h3>
                  <div className="font-mono text-sm bg-black/50 p-4 rounded-lg border border-zinc-700 overflow-x-auto">
                      <p className="text-zinc-500"># Install the BuildPro SDK</p>
                      <p className="text-green-400 mb-4">npm install @buildpro/sdk</p>
                      
                      <p className="text-zinc-500"># Initialize Client</p>
                      <div className="text-zinc-300">
                          <span className="text-purple-400">import</span> {'{ BuildPro }'} <span className="text-purple-400">from</span> <span className="text-orange-300">'@buildpro/sdk'</span>;
                      </div>
                      <div className="text-zinc-300 mt-1">
                          <span className="text-blue-400">const</span> client = <span className="text-yellow-400">new</span> BuildPro({`{ key: process.env.BUILDPRO_KEY }`});
                      </div>
                      <br/>
                      <p className="text-zinc-500"># Fetch Projects</p>
                      <div className="text-zinc-300">
                          <span className="text-blue-400">const</span> projects = <span className="text-yellow-400">await</span> client.projects.list();
                      </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                      <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View Full Documentation <Link size={10} /></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default IntegrationsView;
