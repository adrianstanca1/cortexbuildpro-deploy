
import React, { useMemo, useState } from 'react';
import { 
  ArrowRight, AlertCircle, Sparkles, MapPin, Clock, 
  TrendingUp, CheckCircle2, Calendar, Activity, 
  MoreHorizontal, Shield, DollarSign, Users, Briefcase, HardHat, CheckSquare, Map as MapIcon,
  FileText, PlusSquare, UserCheck, GitPullRequest, MessageSquare, FileBarChart, Settings, RotateCcw,
  Clipboard, Camera, Pin, Search, List, BookOpen, Plus, Video, Aperture, Link,
  Server, Database, Globe, Lock, Unlock, Megaphone, Power, RefreshCw, Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { UserRole, Task, Page, Company } from '../types';

interface DashboardViewProps {
  setPage: (page: Page) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setPage }) => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      return <SuperAdminDashboard setPage={setPage} />;
    case UserRole.COMPANY_ADMIN:
      return <CompanyAdminDashboard setPage={setPage} />;
    case UserRole.SUPERVISOR:
      return <SupervisorDashboard setPage={setPage} />;
    case UserRole.OPERATIVE:
      return <OperativeDashboard setPage={setPage} />;
    default:
      return <OperativeDashboard setPage={setPage} />;
  }
};

// --- Quick Actions Components ---

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  onClick: () => void;
  color?: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ icon: Icon, title, desc, onClick, color = "text-[#0f5c82]" }) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-[#0f5c82] transition-all cursor-pointer flex flex-col items-center text-center group w-full h-full"
  >
    <div className={`p-3 rounded-lg bg-zinc-50 group-hover:bg-blue-50 transition-colors mb-3 ${color}`}>
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <h3 className="font-bold text-zinc-900 text-sm mb-1 group-hover:text-[#0f5c82] transition-colors">{title}</h3>
    <p className="text-xs text-zinc-500">{desc}</p>
  </button>
);

const QuickActionsGrid: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-zinc-700 font-semibold">
        <Settings size={18} className="text-[#0f5c82]" />
        <span>Quick Actions</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <QuickActionCard 
        icon={FileText} 
        title="Create Invoice" 
        desc="Generate a new invoice" 
        onClick={() => setPage(Page.FINANCIALS)} 
      />
      <QuickActionCard 
        icon={PlusSquare} 
        title="New Quote" 
        desc="Create project quote" 
        onClick={() => setPage(Page.PROJECT_LAUNCHPAD)} 
        color="text-green-600"
      />
      <QuickActionCard 
        icon={Users} 
        title="Team Management" 
        desc="Manage team & resources" 
        onClick={() => setPage(Page.TEAM)} 
        color="text-purple-600"
      />
      <QuickActionCard 
        icon={Calendar} 
        title="Schedule" 
        desc="View project timeline" 
        onClick={() => setPage(Page.SCHEDULE)} 
        color="text-orange-600"
      />
      <QuickActionCard 
        icon={Briefcase} 
        title="CRM" 
        desc="Customer relationship" 
        onClick={() => setPage(Page.CLIENTS)} 
        color="text-blue-600"
      />
      <QuickActionCard 
        icon={RotateCcw} 
        title="Variations" 
        desc="Project variations" 
        onClick={() => setPage(Page.PROJECTS)} 
        color="text-red-500"
      />
      <QuickActionCard 
        icon={MessageSquare} 
        title="AI Advisor" 
        desc="Get AI assistance" 
        onClick={() => setPage(Page.CHAT)} 
        color="text-indigo-600"
      />
      <QuickActionCard 
        icon={FileBarChart} 
        title="Reports" 
        desc="Business analytics" 
        onClick={() => setPage(Page.REPORTS)} 
        color="text-teal-600"
      />
    </div>
  </div>
);

// --- 1. SUPER ADMIN DASHBOARD (ENHANCED) ---
const SuperAdminDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  // Mock Data for Super Admin
  const [companies] = useState<Company[]>([
    { id: 'c1', name: 'BuildCorp International', plan: 'Enterprise', status: 'Active', users: 142, projects: 12, mrr: 4500, joinedDate: '2024-01-15' },
    { id: 'c2', name: 'Metro Construct Ltd', plan: 'Business', status: 'Active', users: 45, projects: 4, mrr: 1200, joinedDate: '2024-03-10' },
    { id: 'c3', name: 'Urban Design Studio', plan: 'Starter', status: 'Suspended', users: 5, projects: 1, mrr: 0, joinedDate: '2024-05-22' },
    { id: 'c4', name: 'Highrise Solutions', plan: 'Enterprise', status: 'Active', users: 320, projects: 28, mrr: 8500, joinedDate: '2023-11-05' },
    { id: 'c5', name: 'Green Earth Builders', plan: 'Business', status: 'Trial', users: 12, projects: 2, mrr: 0, joinedDate: '2025-11-01' },
  ]);

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [systemSettings, setSystemSettings] = useState({
      maintenance: false,
      betaFeatures: true,
      registrations: true
  });

  const toggleSetting = (key: keyof typeof systemSettings) => {
      setSystemSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Access Logs Mock
  const accessLogs = [
      { id: 1, user: 'John Anderson', event: 'Login Success', ip: '192.168.1.45', time: 'Just now', status: 'success' },
      { id: 2, user: 'Admin System', event: 'Backup Completed', ip: 'Localhost', time: '5m ago', status: 'success' },
      { id: 3, user: 'Unknown', event: 'Failed Login', ip: '104.23.11.2', time: '12m ago', status: 'fail' },
      { id: 4, user: 'Sarah Mitchell', event: 'API Key Generated', ip: '89.12.44.1', time: '1h ago', status: 'warning' },
  ];

  return (
  <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Top Header & Global Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                <Shield size={24} className="text-[#0f5c82]" /> Global Command Center
            </h1>
            <p className="text-zinc-500">Multi-tenant administration and system health monitoring.</p>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1.5 rounded-full shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-zinc-600">System Operational</span>
                 <span className="text-xs text-zinc-400 border-l border-zinc-200 pl-2">24ms latency</span>
             </div>
             <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-purple-200 tracking-wider">
                 Super Admin
             </span>
         </div>
      </div>

      {/* Infrastructure Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Server size={64} /></div>
              <div className="relative z-10">
                  <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Global Revenue (MRR)</h3>
                  <div className="text-3xl font-bold mb-1">£14,200</div>
                  <div className="text-green-400 text-xs font-medium flex items-center gap-1"><TrendingUp size={12} /> +12% this month</div>
              </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Total</span>
              </div>
              <div className="text-2xl font-bold text-zinc-900">{companies.length}</div>
              <p className="text-xs text-zinc-500">Active Tenants</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Users size={20} /></div>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Total</span>
              </div>
              <div className="text-2xl font-bold text-zinc-900">{companies.reduce((acc, c) => acc + c.users, 0)}</div>
              <p className="text-xs text-zinc-500">Registered Users</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Database size={20} /></div>
                  <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Usage</span>
              </div>
              <div className="text-2xl font-bold text-zinc-900">1.2 TB</div>
              <p className="text-xs text-zinc-500">Cloud Storage</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tenant Management Table */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                      <Globe size={18} className="text-blue-500" /> Tenant Management
                  </h3>
                  <div className="flex gap-2">
                      <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                          <input type="text" placeholder="Search companies..." className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-[#0f5c82] outline-none" />
                      </div>
                      <button className="px-3 py-1.5 bg-[#0f5c82] text-white rounded-lg text-sm font-bold hover:bg-[#0c4a6e] transition-colors shadow-sm">
                          <Plus size={14} /> Add Tenant
                      </button>
                  </div>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium sticky top-0 z-10">
                          <tr>
                              <th className="px-6 py-3">Company Name</th>
                              <th className="px-6 py-3">Plan</th>
                              <th className="px-6 py-3 text-center">Users</th>
                              <th className="px-6 py-3 text-center">Projects</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                          {companies.map(company => (
                              <tr key={company.id} className="hover:bg-zinc-50 transition-colors group">
                                  <td className="px-6 py-4 font-medium text-zinc-900">{company.name}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                                          company.plan === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                          company.plan === 'Business' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                          'bg-zinc-100 text-zinc-600 border-zinc-200'
                                      }`}>{company.plan}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-zinc-600">{company.users}</td>
                                  <td className="px-6 py-4 text-center text-zinc-600">{company.projects}</td>
                                  <td className="px-6 py-4">
                                      <span className={`flex items-center gap-1.5 text-xs font-medium ${
                                          company.status === 'Active' ? 'text-green-600' : 
                                          company.status === 'Suspended' ? 'text-red-600' : 
                                          'text-orange-600'
                                      }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                              company.status === 'Active' ? 'bg-green-500' : 
                                              company.status === 'Suspended' ? 'bg-red-500' : 
                                              'bg-orange-500'
                                          }`}></span>
                                          {company.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="p-1.5 hover:bg-zinc-200 rounded text-zinc-500" title="Manage"><Settings size={14} /></button>
                                          <button className="p-1.5 hover:bg-blue-100 text-blue-600 rounded" title="Login As"><UserCheck size={14} /></button>
                                          {company.status !== 'Suspended' && <button className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Suspend"><Lock size={14} /></button>}
                                          {company.status === 'Suspended' && <button className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="Activate"><Unlock size={14} /></button>}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* System Control & Broadcast */}
          <div className="space-y-6">
              {/* Control Panel */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-zinc-800 mb-4 flex items-center gap-2">
                      <Server size={18} className="text-purple-500" /> System Control
                  </h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${systemSettings.maintenance ? 'bg-red-100 text-red-600' : 'bg-zinc-200 text-zinc-500'}`}>
                                  <Power size={16} />
                              </div>
                              <div className="text-sm font-medium text-zinc-700">Maintenance Mode</div>
                          </div>
                          <button 
                            onClick={() => toggleSetting('maintenance')}
                            className={`w-10 h-5 rounded-full transition-colors relative ${systemSettings.maintenance ? 'bg-red-500' : 'bg-zinc-300'}`}
                          >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${systemSettings.maintenance ? 'left-6' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${systemSettings.betaFeatures ? 'bg-purple-100 text-purple-600' : 'bg-zinc-200 text-zinc-500'}`}>
                                  <Sparkles size={16} />
                              </div>
                              <div className="text-sm font-medium text-zinc-700">Global Beta Access</div>
                          </div>
                          <button 
                            onClick={() => toggleSetting('betaFeatures')}
                            className={`w-10 h-5 rounded-full transition-colors relative ${systemSettings.betaFeatures ? 'bg-green-500' : 'bg-zinc-300'}`}
                          >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${systemSettings.betaFeatures ? 'left-6' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${systemSettings.registrations ? 'bg-blue-100 text-blue-600' : 'bg-zinc-200 text-zinc-500'}`}>
                                  <UserCheck size={16} />
                              </div>
                              <div className="text-sm font-medium text-zinc-700">New Registrations</div>
                          </div>
                          <button 
                            onClick={() => toggleSetting('registrations')}
                            className={`w-10 h-5 rounded-full transition-colors relative ${systemSettings.registrations ? 'bg-green-500' : 'bg-zinc-300'}`}
                          >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${systemSettings.registrations ? 'left-6' : 'left-1'}`}></div>
                          </button>
                      </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                      <button className="flex-1 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <RefreshCw size={14} /> Flush Cache
                      </button>
                      <button className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <RotateCcw size={14} /> Restart
                      </button>
                  </div>
              </div>

              {/* Broadcast Widget */}
              <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl shadow-lg p-6 text-white">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Megaphone size={18} className="text-yellow-400" /> Global Broadcast
                  </h3>
                  <textarea 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/50 outline-none focus:ring-1 focus:ring-white/30 resize-none h-20"
                      placeholder="Type announcement here..."
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-3">
                      <label className="flex items-center gap-2 text-xs text-blue-200 cursor-pointer">
                          <input type="checkbox" className="rounded text-blue-500 focus:ring-0 bg-white/10 border-white/20" />
                          High Priority
                      </label>
                      <button 
                        disabled={!broadcastMsg.trim()}
                        className="bg-white text-[#0f5c82] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Broadcast
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* New Access Logs Section */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                  <Key size={18} className="text-orange-500" /> Security Access Logs
              </h3>
              <button className="text-sm text-[#0f5c82] font-medium hover:underline">View Full Audit Log</button>
          </div>
          <div className="p-0">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-zinc-100 text-zinc-500 uppercase text-xs font-medium">
                      <tr>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Event</th>
                          <th className="px-6 py-3">IP Address</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {accessLogs.map(log => (
                          <tr key={log.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                              <td className="px-6 py-3 font-medium text-zinc-900">{log.user}</td>
                              <td className="px-6 py-3 text-zinc-600">{log.event}</td>
                              <td className="px-6 py-3 font-mono text-xs text-zinc-500">{log.ip}</td>
                              <td className="px-6 py-3 text-zinc-500">{log.time}</td>
                              <td className="px-6 py-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                      log.status === 'success' ? 'text-green-700 bg-green-50' :
                                      log.status === 'warning' ? 'text-orange-700 bg-orange-50' :
                                      'text-red-700 bg-red-50'
                                  }`}>
                                      {log.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  </div>
  );
};

// --- 2. COMPANY ADMIN DASHBOARD ---
const CompanyAdminDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
     <div className="flex justify-between items-end mb-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Company Overview</h1>
            <p className="text-zinc-500">Financial health, project portfolio status, and resource allocation.</p>
         </div>
         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-blue-200">Admin View</span>
      </div>

      {/* Quick Actions - Enhanced */}
      <QuickActionsGrid setPage={setPage} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <h3 className="text-blue-200 font-medium text-sm uppercase tracking-wider mb-1">Total Revenue (YTD)</h3>
                  <div className="text-4xl font-bold mb-4">£24.5 Million</div>
                  <div className="flex gap-4">
                      <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                          <div className="text-xs text-blue-200">Active Projects</div>
                          <div className="font-bold text-xl">12</div>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                          <div className="text-xs text-blue-200">Win Rate</div>
                          <div className="font-bold text-xl">64%</div>
                      </div>
                  </div>
              </div>
              <Sparkles className="absolute top-0 right-0 text-white/10 w-64 h-64 -mr-10 -mt-10" />
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <h3 className="font-bold text-zinc-900 mb-4">Project Health</h3>
              <div className="flex items-center justify-center h-40 relative">
                   <div className="text-center">
                       <div className="text-3xl font-bold text-green-600">85%</div>
                       <div className="text-xs text-zinc-500">On Track</div>
                   </div>
                   <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="8" />
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="8" strokeDasharray="251" strokeDashoffset="40" strokeLinecap="round" />
                   </svg>
              </div>
          </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
             <h3 className="font-bold text-zinc-900">Active Projects</h3>
             <button onClick={() => setPage(Page.PROJECTS)} className="text-sm text-[#0f5c82] font-medium hover:underline">View All</button>
          </div>
          <table className="w-full text-left text-sm">
             <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                 <tr>
                     <th className="px-6 py-3">Project Name</th>
                     <th className="px-6 py-3">Budget</th>
                     <th className="px-6 py-3">Progress</th>
                     <th className="px-6 py-3">Status</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-zinc-100">
                 {[
                     { name: 'City Centre Plaza', budget: '£12M', progress: 74, status: 'Good' },
                     { name: 'Westside Heights', budget: '£8.5M', progress: 45, status: 'At Risk' },
                     { name: 'Infrastructure Upgrade', budget: '£3.2M', progress: 12, status: 'Good' },
                 ].map((p, i) => (
                     <tr key={i} className="hover:bg-zinc-50">
                         <td className="px-6 py-4 font-medium text-zinc-900">{p.name}</td>
                         <td className="px-6 py-4 text-zinc-600">{p.budget}</td>
                         <td className="px-6 py-4">
                             <div className="w-24 bg-zinc-200 h-1.5 rounded-full">
                                 <div className={`h-full rounded-full ${p.status === 'Good' ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${p.progress}%`}}></div>
                             </div>
                         </td>
                         <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span>
                         </td>
                     </tr>
                 ))}
             </tbody>
          </table>
      </div>
  </div>
);

// --- 3. SUPERVISOR DASHBOARD (FIELD VIEW) ---
const SupervisorDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const { user } = useAuth();

  const FieldCard = ({ title, icon: Icon, onClick, addAction }: any) => (
      <div onClick={onClick} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
              <div className="p-2.5 bg-zinc-50 rounded-xl group-hover:bg-blue-50 group-hover:text-[#0f5c82] transition-colors text-zinc-600">
                  <Icon size={24} />
              </div>
              {addAction && (
                  <button onClick={(e) => { e.stopPropagation(); addAction(); }} className="p-1.5 bg-zinc-100 hover:bg-[#0f5c82] hover:text-white rounded-lg text-zinc-400 transition-colors">
                      <Plus size={16} />
                  </button>
              )}
          </div>
          <div>
              <h3 className="font-bold text-zinc-900 text-sm mb-1">{title}</h3>
              <p className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide group-hover:text-[#0f5c82] transition-colors">View All</p>
          </div>
      </div>
  );

  return (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0f5c82] to-[#1f7d98] flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
                 {user?.avatarInitials}
             </div>
             <div>
                 <div className="text-xs text-zinc-500 font-medium uppercase">Marksman Roofing and Cladding Ltd.</div>
                 <div className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                     St Georges Hospital <RotateCcw size={14} className="text-zinc-400" />
                 </div>
             </div>
         </div>
         <button className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600">
             <Search size={20} />
         </button>
      </div>

      {/* HERO: LIVE FIELD MODE */}
      <div 
        onClick={() => setPage(Page.LIVE)}
        className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer group shadow-xl transition-transform hover:scale-[1.01]"
      >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#0f5c82] rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity" />
          
          <div className="relative z-10 flex items-center justify-between">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold tracking-widest uppercase text-red-400">Live Mode</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Launch Field Assistant</h2>
                  <p className="text-zinc-400 text-sm max-w-md">
                      Multimodal video session with snapshot analysis. Point your camera at site issues for instant AI inspection.
                  </p>
              </div>
              <div className="flex gap-3">
                  <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all backdrop-blur-sm">
                      <Video size={28} />
                  </div>
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10">
                      <Aperture size={24} />
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <FieldCard title="Inspections" icon={Clipboard} onClick={() => setPage(Page.SAFETY)} addAction={() => {}} />
          <FieldCard title="Locations" icon={MapPin} onClick={() => setPage(Page.LIVE_PROJECT_MAP)} />
          <FieldCard title="Observations" icon={BookOpen} onClick={() => setPage(Page.SAFETY)} addAction={() => {}} />
          <FieldCard title="Photos" icon={Camera} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => {}} />
          <FieldCard title="Snag List" icon={Pin} onClick={() => setPage(Page.TASKS)} addAction={() => {}} />
          <FieldCard title="RFIs" icon={AlertCircle} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => {}} />
          <FieldCard title="Programme" icon={Calendar} onClick={() => setPage(Page.SCHEDULE)} />
          <FieldCard title="Specifications" icon={FileText} onClick={() => setPage(Page.DOCUMENTS)} />
          <FieldCard title="Tasks" icon={CheckSquare} onClick={() => setPage(Page.TASKS)} addAction={() => {}} />
      </div>
      
      {/* Floating Action Button for easy mobile access */}
      <div className="fixed bottom-8 right-8">
          <button 
            onClick={() => setPage(Page.TASKS)}
            className="w-14 h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
              <Plus size={28} />
          </button>
      </div>
  </div>
  );
};

// --- 4. OPERATIVE DASHBOARD ---
const OperativeDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const { tasks } = useProjects();
  const { user } = useAuth();

  const myTasks = useMemo(() => {
      if (!user) return [];
      return tasks.filter(t => {
          if (t.status === 'Done') return false;
          
          // Role check
          if (t.assigneeType === 'role') {
             if (user.role === UserRole.OPERATIVE && t.assigneeName === 'Operative') return true;
          }
          // User check
          if (t.assigneeType === 'user' && t.assigneeName === user.name) return true;
          return false;
      });
  }, [tasks, user]);

  return (
  <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
         <h1 className="text-xl font-bold text-zinc-900">My Work Portal</h1>
         <p className="text-zinc-500">Welcome back, {user?.name.split(' ')[0]}.</p>
      </div>

      {/* Time Clock Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Current Status</div>
          <div className="text-3xl font-bold text-green-600 mb-1">Clocked In</div>
          <div className="text-zinc-500 mb-6">Since 07:30 AM</div>
          
          <div className="flex gap-4 w-full max-w-xs">
              <button className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100">
                 Clock Out
              </button>
              <button className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                 Take Break
              </button>
          </div>
      </div>

      {/* Assigned Tasks */}
      <div>
          <h3 className="font-bold text-zinc-900 mb-4">My Tasks for Today ({myTasks.length})</h3>
          <div className="space-y-3">
              {myTasks.length > 0 ? myTasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-start gap-3 group hover:border-[#0f5c82] transition-colors">
                      <button className="mt-1 w-5 h-5 rounded border-2 border-zinc-300 hover:border-[#0f5c82] flex items-center justify-center text-transparent hover:text-[#0f5c82] transition-all">
                          <CheckCircle2 size={12} />
                      </button>
                      <div className="flex-1">
                          <div className="font-medium text-zinc-900 flex justify-between">
                              <span>{task.title}</span>
                              {task.assigneeType === 'role' && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                      {task.assigneeName}
                                  </span>
                              )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1"><Clock size={12} /> Due {task.dueDate}</span>
                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 bg-zinc-50 px-1.5 rounded border border-zinc-100">
                                       <Link size={10} /> {task.dependencies.length}
                                    </span>
                                  )}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  task.status === 'Blocked' ? 'bg-red-100 text-red-600' : 
                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 
                                  task.status === 'Done' ? 'bg-green-100 text-green-600' : 
                                  'bg-zinc-100 text-zinc-500'
                              }`}>
                                  {task.status}
                              </span>
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="text-center py-8 text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                      <CheckSquare size={32} className="mx-auto mb-2 opacity-20" />
                      <p>No tasks assigned to you or your role.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setPage(Page.SAFETY)} className="p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-left transition-colors">
              <AlertCircle className="text-red-500 mb-2" size={24} />
              <div className="font-bold text-zinc-900">Report Safety Issue</div>
          </button>
          <button onClick={() => setPage(Page.LIVE_PROJECT_MAP)} className="p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-left transition-colors">
              <MapIcon className="text-[#0f5c82] mb-2" size={24} />
              <div className="font-bold text-zinc-900">View Site Map</div>
          </button>
      </div>
  </div>
  );
};

// Helper Component
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon size={20} />
            </div>
        </div>
        <div className="text-2xl font-bold text-zinc-900 mb-1">{value}</div>
        <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">{label}</div>
            <div className={`text-[10px] font-bold bg-${color}-50 text-${color}-700 px-2 py-0.5 rounded`}>{trend}</div>
        </div>
    </div>
);

export default DashboardView;
