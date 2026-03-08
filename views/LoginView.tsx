
import React from 'react';
import { HardHat, Check, ArrowRight, Shield, User, Briefcase } from 'lucide-react';
import { Page, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  setPage: (page: Page) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ setPage }) => {
  const { login } = useAuth();

  const handleDemoLogin = (role: UserRole) => {
    login(role);
    setPage(Page.IMAGINE);
  };

  const demoAccounts = [
    { label: 'Principal Admin', role: UserRole.SUPER_ADMIN, email: 'john@buildcorp.com', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100 hover:border-purple-300' },
    { label: 'Company Admin', role: UserRole.COMPANY_ADMIN, email: 'sarah@buildcorp.com', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100 hover:border-blue-300' },
    { label: 'Supervisor', role: UserRole.SUPERVISOR, email: 'mike@buildcorp.com', icon: User, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100 hover:border-orange-300' },
    { label: 'Operative', role: UserRole.OPERATIVE, email: 'david@buildcorp.com', icon: HardHat, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100 hover:border-green-300' },
  ];

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Left Panel - Light and Airy Theme */}
      <div className="hidden lg:flex w-[45%] bg-zinc-50 border-r border-zinc-100 flex-col p-16 relative overflow-hidden">
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-[#0f5c82] p-2.5 rounded-xl shadow-sm">
                <HardHat size={28} fill="white" className="text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-[#0f5c82]">BuildPro</span>
          </div>

          <h2 className="text-4xl font-semibold leading-tight mb-6 text-zinc-800 tracking-tight">
            The Intelligent Platform for Modern Construction
          </h2>
          
          <p className="text-lg text-zinc-500 mb-12 leading-relaxed max-w-md font-light">
              Manage projects, track safety, and leverage AI insights in one unified workspace.
          </p>

          <div className="space-y-5 mb-12">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Core Capabilities</h3>
            {[
              'Real-time Project Tracking & Maps',
              'AI-Powered Risk Assessment',
              'Integrated Financials & Contracts',
              'Field Team Management',
              'Gemini 3.0 Pro Intelligence'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-zinc-600 group">
                <div className="bg-green-50 p-1 rounded-full text-green-600 border border-green-100">
                    <Check size={12} strokeWidth={3} />
                </div>
                <span className="font-medium text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-auto">
              <div className="flex -space-x-3 mb-4">
                  {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-100 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all" />
                      </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-400">+2k</div>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Trusted by leading construction firms globally.</p>
          </div>
        </div>
        
        {/* Subtle Decorative Elements */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-50 rounded-full opacity-60 blur-3xl" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-50 rounded-full opacity-40 blur-3xl" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-24 overflow-y-auto bg-white relative">
        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome Back</h1>
              <p className="text-zinc-500 text-sm">Securely sign in to your account to continue.</p>
          </div>

          <div className="bg-white p-1 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-100/50 mb-8">
            <div className="bg-zinc-50/30 p-6 rounded-[20px]">
                <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-widest text-center lg:text-left">Select Demo Role</p>
                <div className="space-y-3">
                  {demoAccounts.map((account) => (
                    <button 
                      key={account.email}
                      onClick={() => handleDemoLogin(account.role)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border bg-white transition-all shadow-sm hover:shadow-md group ${account.border} hover:scale-[1.01] active:scale-[0.99]`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-3 ${account.bg} ${account.color}`}>
                            <account.icon size={20} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-zinc-800 text-sm group-hover:text-zinc-900 transition-colors">{account.label}</span>
                            <span className="text-xs text-zinc-400 font-medium">{account.email}</span>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 group-hover:bg-white transition-colors ${account.color}`}>
                          <ArrowRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
            </div>
          </div>
          
          <div className="text-center">
              <p className="text-xs text-zinc-300 mb-3">
                  Protected by enterprise-grade encryption.
              </p>
              <div className="flex justify-center gap-6 text-xs text-zinc-400 font-medium">
                  <a href="#" className="hover:text-[#0f5c82] transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-[#0f5c82] transition-colors">Terms of Service</a>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
